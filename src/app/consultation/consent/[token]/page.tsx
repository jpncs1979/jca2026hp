import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { findConsentRow } from "@/lib/consultation-consent.server";
import { ConsentChoice, type ConsentInitial } from "./ConsentChoice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "掲載の確認 | クラリネット相談室",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ConsultationConsentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let initial: ConsentInitial = { kind: "error" };
  try {
    const found = await findConsentRow(token);
    initial = found.view;
  } catch (e) {
    console.error("[相談室] 承諾ページの読み込みに失敗:", e instanceof Error ? e.message : e);
  }

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <MessageCircle className="size-8 text-gold" />
            掲載の確認
          </h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <ConsentChoice token={token} initial={initial} />
        </div>
      </div>
    </div>
  );
}
