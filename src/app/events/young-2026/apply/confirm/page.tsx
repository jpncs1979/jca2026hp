"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { YOUNG_2026 } from "@/lib/young-2026";
import { joinAddressLine } from "@/lib/japanese-address";
import {
  clearYoung2026ApplyConfirmPayload,
  loadYoung2026ApplyConfirmPayload,
  type Young2026ApplyConfirmPayload,
  young2026ApplyFeeYen,
  young2026CategoryLabel,
} from "@/lib/young-2026-apply-confirm";
import {
  young2026PieceFinalLabel,
  young2026PiecePreliminaryLabel,
} from "@/lib/young-2026-piece-field-labels";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadYoung2026ApplyConfirmPayload();
    if (!loaded) {
      router.replace("/events/young-2026/apply");
      return;
    }
    if (!loaded.portrait_data_url?.startsWith("data:image/") || !loaded.phone?.trim() || !loaded.affiliation?.trim()) {
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
  const addressLine = joinAddressLine({
    prefecture: data.address_prefecture,
    city: data.address_city,
    street: data.address_street,
    building: data.address_building,
  });

  const buildSubmitPayload = (p: Young2026ApplyConfirmPayload) => ({
    competition_id: p.competitionId,
    name: p.name,
    furigana: p.furigana,
    email: p.email,
    birth_date: p.birth_date,
    affiliation: p.affiliation,
    zip_code: p.zip_code,
    address_prefecture: p.address_prefecture,
    address_city: p.address_city,
    address_street: p.address_street,
    address_building: p.address_building ?? "",
    phone: p.phone,
    portrait_data_url: p.portrait_data_url,
    member_type: p.member_type,
    category: p.category,
    selected_piece_preliminary: p.selected_piece_preliminary,
    selected_piece_final: p.selected_piece_final,
    video_url: p.video_url,
    accompanist_info: p.accompanist_info,
  });

  const handlePayCard = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/events/young-2026/checkout", {
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
      clearYoung2026ApplyConfirmPayload();
      window.location.href = json.url as string;
    }
  };

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-navy md:text-3xl">
            {YOUNG_2026.name} お申し込み内容の確認
          </h1>
          <p className="mt-2 text-muted-foreground">
            内容にお間違いがなければ、<strong className="text-foreground">クレジットカード</strong>
            でお支払いください。決済完了時点でお申し込み受付が完了します。
            {data.member_type === "会員" ? (
              <span className="mt-2 block text-sm">
                会員価格でのお申し込みは、申し込み時点で協会に入会している必要があります。
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
              <dt className="text-muted-foreground">お名前</dt>
              <dd className="font-medium">{data.name}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">ふりがな</dt>
              <dd>{data.furigana}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">所属（出身校等）</dt>
              <dd className="text-pretty">{data.affiliation}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">メール</dt>
              <dd className="break-all">{data.email}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">携帯電話</dt>
              <dd>{data.phone}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">生年月日</dt>
              <dd>{formatBirthDisplay(data.birth_date)}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">郵便番号</dt>
              <dd>{data.zip_code}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">住所</dt>
              <dd className="text-pretty">{addressLine}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">顔写真</dt>
              <dd>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.portrait_data_url}
                  alt="提出する顔写真"
                  className="h-40 w-40 rounded-md border border-border object-cover"
                />
              </dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">会員種別</dt>
              <dd>{data.member_type}</dd>
            </div>
            {data.member_type === "会員" ? (
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">会員について</dt>
                <dd className="text-sm text-muted-foreground">
                  申し込み時点で入会している必要があります。{" "}
                  <a
                    href="https://jp-clarinet.org/join/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-navy underline underline-offset-2 hover:text-gold"
                  >
                    入会はこちらから
                  </a>
                </dd>
              </div>
            ) : null}
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">部門</dt>
              <dd>{young2026CategoryLabel(data.category)}</dd>
            </div>
            {data.selected_piece_preliminary ? (
              <div className="grid gap-1 sm:grid-cols-[minmax(10rem,11rem)_1fr] sm:gap-3">
                <dt className="text-muted-foreground text-pretty">
                  {young2026PiecePreliminaryLabel(data.category)}
                </dt>
                <dd className="text-pretty">{data.selected_piece_preliminary}</dd>
              </div>
            ) : null}
            {data.selected_piece_final ? (
              <div className="grid gap-1 sm:grid-cols-[minmax(10rem,11rem)_1fr] sm:gap-3">
                <dt className="text-muted-foreground text-pretty">
                  {young2026PieceFinalLabel(data.category)}
                </dt>
                <dd className="text-pretty">{data.selected_piece_final}</dd>
              </div>
            ) : null}
            {data.video_url?.trim() ? (
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">予選動画URL</dt>
                <dd className="break-all">{data.video_url.trim()}</dd>
              </div>
            ) : null}
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
              <dt className="text-muted-foreground">伴奏者氏名</dt>
              <dd className="text-pretty">{data.accompanist_info?.trim() || "—"}</dd>
            </div>
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
