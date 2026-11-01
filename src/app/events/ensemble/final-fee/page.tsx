import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { ENSEMBLE_2027 } from "@/lib/ensemble-2027";
import { loadEnsemble2027FinalFeeApplication } from "@/lib/ensemble-2027-final-fee-server";
import {
  ENSEMBLE_2027_FINAL_MAX_PERFORMERS,
  ENSEMBLE_2027_FINAL_MIN_PERFORMERS,
} from "@/lib/ensemble-2027-final-fee";
import { FinalFeeForm } from "./FinalFeeForm";

export const metadata: Metadata = {
  title: `本選参加料のお支払い | ${ENSEMBLE_2027.name}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * 第19回アンコン 本選参加料のお支払い（予選通過団体のみ）。
 * 事務局が通過通知メールに貼る団体ごとのリンク（?id=申込ID&t=署名）から開く。
 */
export default async function EnsembleFinalFeePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; t?: string; done?: string }>;
}) {
  const { id = "", t = "", done } = await searchParams;
  const loaded = await loadEnsemble2027FinalFeeApplication(createAdminClient(), id, t);

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-navy md:text-3xl">
            {ENSEMBLE_2027.name} 本選参加料のお支払い
          </h1>
          <p className="mt-2 text-muted-foreground">予選を通過した団体のみのお手続きです。</p>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-10">
        {!loaded.ok ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">{loaded.message}</p>
        ) : loaded.app.final_fee_status || done === "1" ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700">
              <CheckCircle2 className="size-9" />
            </div>
            <h2 className="text-xl font-bold text-navy">本選への参加手続きは完了しています</h2>
            <p className="mt-4 text-muted-foreground">
              {loaded.app.name} 様
              {loaded.app.final_performer_count
                ? `（演奏者 ${loaded.app.final_performer_count}名・参加料 ${(loaded.app.final_fee_amount ?? 0).toLocaleString("ja-JP")}円）`
                : ""}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              確認のメールをお送りしています。本選：{ENSEMBLE_2027.schedule.final}　{ENSEMBLE_2027.schedule.finalVenue}
            </p>
          </div>
        ) : (
          <>
            <dl className="space-y-3 rounded-lg border border-border p-5 text-sm">
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">団体名</dt>
                <dd className="font-medium">{loaded.app.name}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">部門</dt>
                <dd>{loaded.app.category}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">会員種別</dt>
                <dd>{loaded.app.member_type}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                <dt className="text-muted-foreground">参加料（1人）</dt>
                <dd>{loaded.unitFee.toLocaleString("ja-JP")}円</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">
              参加料は演奏者1人ごとにかかります。演奏者に1人以上協会会員が含まれる団体は、全員が会員価格です。
              お支払いはクレジットカードのみで、金額は決済手数料込みです。お支払い後の返金はできません。
            </p>
            <FinalFeeForm
              id={id}
              token={t}
              unitFee={loaded.unitFee}
              minPerformers={ENSEMBLE_2027_FINAL_MIN_PERFORMERS}
              maxPerformers={ENSEMBLE_2027_FINAL_MAX_PERFORMERS}
            />
          </>
        )}
      </div>
    </div>
  );
}
