import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicantTable } from "./ApplicantTable";

export default async function AdminCompetitionsPage() {
  let applicants: Awaited<ReturnType<typeof fetchApplicants>> = [];

  try {
    applicants = await fetchApplicants();
  } catch {
    // テーブル未作成時など
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
        <CardHeader>
          <CardTitle>申込者一覧</CardTitle>
          <p className="text-sm text-muted-foreground">
            ジュニアA・B部門の動画URLをワンクリックで視聴・コピーできます
          </p>
        </CardHeader>
        <CardContent>
          {applicants.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              申込データがありません
            </p>
          ) : (
            <ApplicantTable applicants={applicants} />
          )}
        </CardContent>
      </Card>
    </div>
  );
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

  const { data: applications, error } = await admin
    .from("applications")
    .select(
      "id, name, furigana, category, selected_piece_preliminary, selected_piece_final, video_url, payment_status, created_at"
    )
    .eq("competition_id", competition.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return applications ?? [];
}
