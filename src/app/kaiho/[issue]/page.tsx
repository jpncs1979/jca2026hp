import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { getKaihoIssue, type KaihoBlock } from "@/data/kaiho";
import { getKaihoReader } from "@/lib/kaiho-access";
import {
  KAIHO_BLUE,
  KaihoCover,
  KaihoPreviewSwitch,
} from "@/components/kaiho/KaihoParts";

export const dynamic = "force-dynamic";

function firstText(blocks: KaihoBlock[]): string {
  for (const b of blocks) if (b.type === "p") return b.text;
  return "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ issue: string }>;
}) {
  const { issue } = await params;
  const data = getKaihoIssue(issue);
  return {
    title: data
      ? `会報 No.${data.number} | 日本クラリネット協会`
      : "会報 | 日本クラリネット協会",
  };
}

export default async function KaihoIssuePage({
  params,
  searchParams,
}: {
  params: Promise<{ issue: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { issue: number } = await params;
  const { preview } = await searchParams;
  const issue = getKaihoIssue(number);
  if (!issue) notFound();

  const reader = await getKaihoReader(preview);
  const q = reader.preview ? "?preview=member" : "";
  const base = `/kaiho/${issue.number}`;

  return (
    <div className="font-soft bg-muted/30">
      <div className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        <Link
          href="/kaiho"
          className="text-sm text-muted-foreground hover:text-navy"
        >
          ← 会報 一覧
        </Link>

        <div className="mt-4 grid gap-8 md:grid-cols-[1.1fr_1fr]">
          <KaihoCover issue={issue} />

          {/* 目次 */}
          <section className="rounded-xl border border-border bg-white p-5 shadow-sm md:p-7">
            <h2 className="text-2xl font-black tracking-wider text-navy">
              CONTENTS
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              会報No.{issue.number}
            </p>
            <ol className="mt-5 divide-y divide-border">
              {issue.contents.map((c, i) => {
                const inner = (
                  <>
                    <span
                      className="w-7 shrink-0 text-right font-bold"
                      style={{ color: KAIHO_BLUE }}
                    >
                      {c.page}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-navy">{c.title}</span>
                      {c.note && (
                        <span className="block text-sm font-medium">
                          {c.note}
                        </span>
                      )}
                    </span>
                  </>
                );
                return (
                  <li key={i}>
                    {c.slug ? (
                      <Link
                        href={`${base}/${c.slug}${q}`}
                        className="flex items-start gap-3 py-2.5 hover:bg-muted/50"
                      >
                        {inner}
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-gold" />
                      </Link>
                    ) : (
                      <div
                        className="flex items-start gap-3 py-2.5 opacity-50"
                        title="見本では未作成"
                      >
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              {issue.credits}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              ※本誌の無断転載、引用は禁止いたします。
            </p>
          </section>
        </div>

        {/* 特集 */}
        {issue.intro && (
          <section className="mt-12">
            <p
              className="text-sm font-bold tracking-widest"
              style={{ color: KAIHO_BLUE }}
            >
              特集
            </p>
            <h2 className="mt-1 text-2xl font-bold text-navy md:text-3xl">
              {issue.cover.feature}
            </h2>
            <p className="mt-3 max-w-3xl leading-loose text-foreground">
              {issue.intro}
            </p>
          </section>
        )}

        {!issue.intro && (
          <h2 className="mt-12 text-xl font-bold text-navy">この号の記事</h2>
        )}
        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {issue.articles.map((a) => {
            const pic = a.hero ?? a.card;
            return (
              <Link
                key={a.slug}
                href={`${base}/${a.slug}${q}`}
                className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition hover:shadow-md"
              >
                {pic ? (
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={pic.src}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 340px"
                      className="object-cover transition group-hover:scale-[1.02]"
                    />
                  </div>
                ) : (
                  <div
                    className="flex aspect-[4/3] flex-col items-center justify-center gap-1 px-4 text-center text-white"
                    style={{ backgroundColor: KAIHO_BLUE }}
                  >
                    <span className="text-sm opacity-90">p.{a.page}</span>
                    <span className="text-xl font-bold leading-snug">
                      {a.section ?? a.kicker}
                    </span>
                  </div>
                )}
                <div className="p-4">
                  <p
                    className="text-xs font-bold"
                    style={{ color: KAIHO_BLUE }}
                  >
                    {a.kicker}
                  </p>
                  <h3 className="mt-1 font-bold leading-snug text-navy">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {a.author}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/80">
                    {firstText(a.blocks)}
                  </p>
                  {!reader.full && !a.public && (
                    <p className="mt-3 flex items-center gap-1 text-xs text-gold-foreground">
                      <Lock className="size-3.5 text-gold" /> 続きは会員の方のみ
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </section>
      </div>
      <KaihoPreviewSwitch path={base} isMember={reader.preview} />
    </div>
  );
}
