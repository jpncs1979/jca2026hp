import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Music2, ArrowLeft } from "lucide-react";
import { supportedConcerts } from "@/data/supported-concerts";
import { SupportedConcertPanel } from "@/components/supported-concerts/SupportedConcertPanel";

export function generateStaticParams() {
  return supportedConcerts.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const concert = supportedConcerts.find((c) => c.slug === slug);
  if (!concert) {
    return { title: "会員後援演奏会 | 日本クラリネット協会" };
  }
  return {
    title: `${concert.dateLabel} ${concert.venue} | 会員後援演奏会`,
    description: `${concert.dateLabel}、${concert.venue}。協会後援の会員主催演奏会のご案内です。`,
  };
}

export default async function SupportedConcertDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const concert = supportedConcerts.find((c) => c.slug === slug);
  if (!concert) notFound();

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-navy md:text-3xl">
            <Music2 className="size-7 shrink-0 text-gold md:size-8" />
            会員後援演奏会
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {concert.dateLabel}　{concert.venue}
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
        <SupportedConcertPanel concert={concert} />

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/members/supported-concerts">
            <Button variant="outline">
              <ArrowLeft className="mr-2 size-4" />
              一覧へ戻る
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
