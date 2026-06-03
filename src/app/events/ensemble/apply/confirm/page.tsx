"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ENSEMBLE_2027 } from "@/lib/ensemble-2027";
import {
  clearEnsemble2027ApplyConfirmPayload,
  ensemble2027ApplyFeeYen,
  ensemble2027CategoryLabel,
  loadEnsemble2027ApplyConfirmPayload,
  type Ensemble2027ApplyConfirmPayload,
} from "@/lib/ensemble-2027-apply-confirm";
import { Loader2 } from "lucide-react";

function formatBirthDisplay(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export default function EnsembleApplyConfirmPage() {
  const router = useRouter();
  const [data, setData] = useState<Ensemble2027ApplyConfirmPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadEnsemble2027ApplyConfirmPayload();
    if (!loaded) {
      router.replace("/events/ensemble/apply");
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

  const feeYen = ensemble2027ApplyFeeYen(data.category, data.member_type);

  const buildSubmitPayload = (p: Ensemble2027ApplyConfirmPayload) => ({
    name: p.name,
    furigana: p.furigana,
    email: p.email,
    birth_date: p.birth_date,
    member_type: p.member_type,
    member_number: p.member_number ?? "",
    category: p.category,
    representative_name: p.representative_name,
    phone: p.phone,
    program_title: p.program_title,
    ensemble_details: p.ensemble_details,
    video_url: p.video_url,
  });

  const handlePayCard = async () => {
    setLoading(true);
    setError(null);
    if (data.member_type === "会員") {
      const vRes = await fetch("/api/events/ensemble-2027/verify-member", {
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
        setLoading(false);
        return;
      }
    }
    const res = await fetch("/api/events/ensemble-2027/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSubmitPayload(data)),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError((json as { error?: string }).error ?? "決済の準備に失敗しました。");
      return;
    }
    if (json.url) {
      clearEnsemble2027ApplyConfirmPayload();
      window.location.href = json.url as string;
    }
  };

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-navy md:text-3xl">
            {ENSEMBLE_2027.name} お申し込み内容の確認
          </h1>
          <p className="mt-2 text-muted-foreground">
            内容にお間違いがなければ、<strong className="text-foreground">クレジットカード</strong>
            で動画審査料（予選・1団体）をお支払いください（クレジットカードのみ）。決済完了時点でお申し込み受付が完了します。
            本選の参加料は予選通過後に別途ご案内します。
            {data.member_type === "会員" ? (
              <span className="mt-2 block text-sm">
                会員価格の場合は、会員番号・メール・代表者生年月日を会員データと照合します。
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

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-navy">申し込み内容</h2>
          <dl className="space-y-3 text-sm">
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">団体名</dt>
              <dd className="font-medium">{data.name}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">ふりがな</dt>
              <dd>{data.furigana}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">部門</dt>
              <dd>{ensemble2027CategoryLabel(data.category)}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">演奏曲</dt>
              <dd>{data.program_title}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">団体情報</dt>
              <dd className="whitespace-pre-wrap">{data.ensemble_details}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">代表者氏名</dt>
              <dd>{data.representative_name}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">代表者生年月日</dt>
              <dd>{formatBirthDisplay(data.birth_date)}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">メール</dt>
              <dd className="break-all">{data.email}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">電話</dt>
              <dd>{data.phone}</dd>
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
            {data.video_url?.trim() ? (
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">予選動画URL</dt>
                <dd className="break-all">{data.video_url.trim()}</dd>
              </div>
            ) : (
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">予選動画URL</dt>
                <dd className="text-muted-foreground">
                  （未入力・{ENSEMBLE_2027.videoSubmissionDeadline}までに提出）
                </dd>
              </div>
            )}
            <div className="border-t border-border pt-4">
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">動画審査料</dt>
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
            disabled={loading || feeYen == null}
            className="bg-gold text-gold-foreground hover:bg-gold-muted"
            onClick={() => void handlePayCard()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                処理中...
              </>
            ) : (
              "クレジットカードで支払う"
            )}
          </Button>
          <Link href="/events/ensemble/apply">
            <Button type="button" variant="outline">
              修正する
            </Button>
          </Link>
          <Link href="/events/ensemble">
            <Button type="button" variant="ghost">
              コンクール詳細に戻る
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
