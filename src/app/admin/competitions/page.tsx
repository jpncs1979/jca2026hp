import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicantTable, type Applicant } from "./ApplicantTable";
import { CompetitionApplicantsCsvButton } from "./CompetitionApplicantsCsvButton";
import { EnsembleApplicantTable, type EnsembleApplicantRow } from "./EnsembleApplicantTable";
import { ENSEMBLE_2027 } from "@/lib/ensemble-2027";
import { ensemble2027FinalFeeUrl } from "@/lib/ensemble-2027-final-fee";

export default async function AdminCompetitionsPage() {
  let applicants: Awaited<ReturnType<typeof fetchApplicants>> = [];

  try {
    applicants = await fetchApplicants();
  } catch {
    // テーブル未作成時など
  }

  let ensembleApplicants: EnsembleApplicantRow[] = [];
  let ensembleError: string | null = null;
  try {
    ensembleApplicants = await fetchEnsembleApplicants();
  } catch (e) {
    ensembleError = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">コンクール申込管理</h1>
        <p className="mt-1 text-muted-foreground">
          第15回ヤングコンクール 申込者一覧
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>申込者一覧</CardTitle>
            <p className="text-sm text-muted-foreground">
              ジュニアA・B部門の動画URLをワンクリックで視聴・コピーできます
            </p>
          </div>
          <CompetitionApplicantsCsvButton competitionSlug="young-2026" />
        </CardHeader>
        <CardContent>
          {applicants.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              申込データがありません
            </p>
          ) : (
            <ApplicantTable applicants={applicants} competitionSlug="young-2026" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{ENSEMBLE_2027.name} 申込者一覧</CardTitle>
            <p className="text-sm text-muted-foreground">
              予選通過団体への通知メールには「リンクをコピー」で取れる本選参加料の支払いリンクを貼ってください（団体ごとに別のリンクです）。
            </p>
          </div>
          <CompetitionApplicantsCsvButton competitionSlug={ENSEMBLE_2027.slug} />
        </CardHeader>
        <CardContent>
          {ensembleError ? (
            <p className="py-8 text-center text-destructive">読み込みに失敗しました：{ensembleError}</p>
          ) : ensembleApplicants.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">申込データがありません</p>
          ) : (
            <EnsembleApplicantTable applicants={ensembleApplicants} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function fetchEnsembleApplicants(): Promise<EnsembleApplicantRow[]> {
  const admin = createAdminClient();
  const { data: competition } = await admin
    .from("competitions")
    .select("id")
    .eq("slug", ENSEMBLE_2027.slug)
    .maybeSingle();
  if (!competition?.id) return [];

  const { data, error } = await admin
    .from("applications")
    .select(
      "id, name, category, member_type, email, video_url, payment_status, final_fee_status, final_fee_amount, final_performer_count, created_at"
    )
    .eq("competition_id", competition.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jp-clarinet.org";
  return (data ?? []).map((row: unknown) => {
    const r = row as Omit<EnsembleApplicantRow, "finalFeeUrl">;
    return {
      ...r,
      finalFeeUrl: r.payment_status === "paid" ? ensemble2027FinalFeeUrl(baseUrl, r.id) : null,
    };
  });
}

async function fetchApplicants() {
  const admin = createAdminClient();
  const { data: competition } = await admin
    .from("competitions")
    .select("id")
    .eq("slug", "young-2026")
    .single();

  if (!competition?.id) {
    return [];
  }

  let { data: applications, error } = await admin
    .from("applications")
    .select(
      "id, name, furigana, category, selected_piece_preliminary, selected_piece_final, video_url, payment_status, payment_route, transfer_receipt_path, portrait_path, created_at"
    )
    .eq("competition_id", competition.id)
    .order("created_at", { ascending: false });

  if (
    error &&
    (error.message?.includes("payment_route") ||
      error.message?.includes("transfer_receipt_path") ||
      error.message?.includes("portrait_path") ||
      error.message?.includes("column"))
  ) {
    const retry = await admin
      .from("applications")
      .select(
        "id, name, furigana, category, selected_piece_preliminary, selected_piece_final, video_url, payment_status, created_at"
      )
      .eq("competition_id", competition.id)
      .order("created_at", { ascending: false });
    applications = (retry.data ?? []).map((row: unknown) => {
      const r = row as Applicant;
      return {
        ...r,
        payment_route: null,
        transfer_receipt_path: null,
        portrait_path: null,
      };
    });
    error = retry.error;
  }

  if (error) {
    throw error;
  }

  return applications ?? [];
}
