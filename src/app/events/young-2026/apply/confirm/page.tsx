"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { YOUNG_2026 } from "@/lib/young-2026";
import {
  clearYoung2026ApplyConfirmPayload,
  loadYoung2026ApplyConfirmPayload,
  type Young2026ApplyConfirmPayload,
  young2026ApplyFeeYen,
  young2026CategoryLabel,
} from "@/lib/young-2026-apply-confirm";
import { saveYoung2026BankDraft } from "@/lib/young-2026-bank-draft";
import { Loader2 } from "lucide-react";

function formatBirthDisplay(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export default function Young2026ApplyConfirmPage() {
  const router = useRouter();
  const [data, setData] = useState<Young2026ApplyConfirmPayload | null>(null);
  const [loading, setLoading] = useState<"card" | "bank" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadYoung2026ApplyConfirmPayload();
    if (!loaded) {
      router.replace("/events/young-2026/apply");
      return;
    }
    setData(loaded);
  }, [router]);

  if (!data) {
    return (
      <div className="font-soft">
        <div className="container mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
          <Loader2 className="mx-auto size-8 animate-spin" />
          <p className="mt-4">読み込み中...</p>
        </div>
      </div>
    );
  }

  const feeYen = young2026ApplyFeeYen(data.category, data.member_type);

  const buildSubmitPayload = (p: Young2026ApplyConfirmPayload) => ({
    competition_id: p.competitionId,
    name: p.name,
    furigana: p.furigana,
    email: p.email,
    birth_date: p.birth_date,
    member_type: p.member_type,
    member_number: p.member_number ?? "",
    category: p.category,
    selected_piece_preliminary: p.selected_piece_preliminary,
    selected_piece_final: p.selected_piece_final,
    video_url: p.video_url,
    accompanist_info: p.accompanist_info,
  });

  const verifyMemberIfNeeded = async (): Promise<boolean> => {
    if (data.member_type !== "会員") return true;
    const vRes = await fetch("/api/events/young-2026/verify-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_number: data.member_number ?? "",
        email: data.email,
        birth_date: data.birth_date,
      }),
    });
    const vJson = await vRes.json().catch(() => ({}));
    if (!vRes.ok) {
      setError((vJson as { error?: string }).error ?? "会員情報の確認に失敗しました。");
      return false;
    }
    return true;
  };

  const handlePayCard = async () => {
    setLoading("card");
    setError(null);
    if (!(await verifyMemberIfNeeded())) {
      setLoading(null);
      return;
    }
    const res = await fetch("/api/events/young-2026/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSubmitPayload(data)),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) {
      setError((json as { error?: string }).error ?? "決済の準備に失敗しました。");
      return;
    }
    const url = (json as { url?: string }).url;
    if (url) {
      clearYoung2026ApplyConfirmPayload();
      window.location.href = url;
    }
  };

  const handlePayBank = async () => {
    setLoading("bank");
    setError(null);
    if (!(await verifyMemberIfNeeded())) {
      setLoading(null);
      return;
    }
    const res = await fetch("/api/events/young-2026/bank-transfer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...buildSubmitPayload(data),
        _client_origin: typeof window !== "undefined" ? window.location.origin : undefined,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      application_id?: string;
      amount?: number;
    };
    setLoading(null);
    if (!res.ok) {
      setError(json.error ?? "申込の保存に失敗しました。");
      return;
    }
    if (!json.application_id || typeof json.amount !== "number") {
      setError("申込の応答が不正です。");
      return;
    }
    saveYoung2026BankDraft({
      applicationId: json.application_id,
      email: data.email,
      name: data.name,
      amount: json.amount,
    });
    clearYoung2026ApplyConfirmPayload();
    router.push(
      `/events/young-2026/apply/bank-transfer?application_id=${encodeURIComponent(json.application_id)}`
    );
  };

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-navy md:text-3xl">
            {YOUNG_2026.name} お申し込み内容の確認
          </h1>
          <p className="mt-2 text-muted-foreground">
            以下の内容でお間違いがなければ、<strong className="text-foreground">クレジットカード</strong>
            または<strong className="text-foreground">銀行振込・郵便振替</strong>のいずれかのボタンからお進みください。
            {data.member_type === "会員" ? (
              <span className="mt-2 block text-sm">
                正会員の場合は、会員番号・メール・生年月日を会員データと照合します。
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-10">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {data.member_type === "同時入会" ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
            <p className="font-medium text-amber-900">同時入会をお選びの場合</p>
            <p className="mt-1">
              クレジットカード決済では決済完了時に会員登録まで行われます。
              銀行振込を選ばれた場合は、会員登録は事務局での入金確認後に手続きいたします。
            </p>
          </div>
        ) : null}

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-navy">申し込み内容</h2>
          <dl className="space-y-3 text-sm">
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">お名前</dt>
              <dd className="font-medium">{data.name}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">ふりがな</dt>
              <dd>{data.furigana}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">メール</dt>
              <dd className="break-all">{data.email}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">生年月日</dt>
              <dd>{formatBirthDisplay(data.birth_date)}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">会員種別</dt>
              <dd>{data.member_type}</dd>
            </div>
            {data.member_type === "会員" && data.member_number?.trim() ? (
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">会員番号</dt>
                <dd className="font-mono">{data.member_number.trim()}</dd>
              </div>
            ) : null}
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">部門</dt>
              <dd>{young2026CategoryLabel(data.category)}</dd>
            </div>
            {data.selected_piece_preliminary ? (
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">予選・課題曲など</dt>
                <dd className="text-pretty">{data.selected_piece_preliminary}</dd>
              </div>
            ) : null}
            {data.selected_piece_final ? (
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">本選・課題曲など</dt>
                <dd className="text-pretty">{data.selected_piece_final}</dd>
              </div>
            ) : null}
            {data.video_url?.trim() ? (
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">予選動画URL</dt>
                <dd className="break-all">{data.video_url.trim()}</dd>
              </div>
            ) : null}
            {data.accompanist_info?.trim() ? (
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">伴奏・備考</dt>
                <dd className="whitespace-pre-wrap text-pretty">{data.accompanist_info.trim()}</dd>
              </div>
            ) : null}
            <div className="border-t border-border pt-4">
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">参加費（お支払い予定額）</dt>
                <dd className="text-lg font-semibold text-gold tabular-nums">
                  {feeYen != null ? `${feeYen.toLocaleString()}円` : "—"}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button
            type="button"
            disabled={loading !== null || feeYen == null}
            className="bg-gold text-gold-foreground hover:bg-gold-muted"
            onClick={() => void handlePayCard()}
          >
            {loading === "card" ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                処理中...
              </>
            ) : (
              "クレジットカードで支払う"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading !== null || feeYen == null}
            onClick={() => void handlePayBank()}
          >
            {loading === "bank" ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                処理中...
              </>
            ) : (
              "銀行振込・郵便振替で進む"
            )}
          </Button>
          <Link href="/events/young-2026/apply">
            <Button type="button" variant="outline">
              修正する
            </Button>
          </Link>
          <Link href="/events/young-2026">
            <Button type="button" variant="ghost">
              コンクール詳細に戻る
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
