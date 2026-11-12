import Link from "next/link";
import { notFound } from "next/navigation";
import { getKaihoIssue } from "@/data/kaiho";
import { getKaihoReader } from "@/lib/kaiho-access";
import {
  KAIHO_BLUE,
  KaihoBlocks,
  KaihoFigure,
  KaihoLogo,
  KaihoMemberGate,
  KaihoPreviewSwitch,
  KaihoProfile,
} from "@/components/kaiho/KaihoParts";

export const dynamic = "force-dynamic";

/** 一般の方に見せる冒頭の文字数 */
const TEASER_CHARS = 160;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ issue: string; slug: string }>;
}) {
  const { issue, slug } = await params;
  const a = getKaihoIssue(issue)?.articles.find((x) => x.slug === slug);
  return { title: a ? `${a.title}｜会報 No.${issue} | 日本クラリネット協会` : "会報 | 日本クラリネット協会" };
}

export default async function KaihoArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ issue: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { issue: number, slug } = await params;
  const { preview } = await searchParams;
  const issue = getKaihoIssue(number);
  const article = issue?.articles.find((a) => a.slug === slug);
  if (!issue || !article) notFound();

  const reader = await getKaihoReader(preview);
  const q = reader.preview ? "?preview=member" : "";
  const path = `/kaiho/${issue.number}/${article.slug}`;

  const idx = issue.articles.indexOf(article);
  const prev = issue.articles[idx - 1];
  const next = issue.articles[idx + 1];

  const firstP = article.blocks.find((b) => b.type === "p");
  const teaser =
    firstP && firstP.type === "p"
      ? firstP.text.length > TEASER_CHARS
        ? `${firstP.text.slice(0, TEASER_CHARS)}…`
        : firstP.text
      : "";

  return (
    <div className="font-soft bg-white">
      {/* 誌面の柱（特集の帯） */}
      {article.section && (
        <div className="text-white" style={{ backgroundColor: KAIHO_BLUE }}>
          <div className="container mx-auto flex max-w-3xl flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5">
            <span className="font-bold tracking-wide">{article.section}</span>
            <span className="text-sm">{issue.cover.featureSub}</span>
          </div>
        </div>
      )}

      <article className="container mx-auto max-w-3xl px-4 pt-8 pb-16 md:pt-12">
        <div className="flex items-center justify-between gap-4">
          <Link href={`/kaiho/${issue.number}${q}`} className="text-sm text-muted-foreground hover:text-navy">
            ← 会報 No.{issue.number} 目次
          </Link>
          <div className="w-40 opacity-80">
            <KaihoLogo issue={issue} size="sm" />
          </div>
        </div>

        <header className="mt-6">
          {article.kicker && (
            <p
              className="inline-block rounded px-2.5 py-0.5 text-sm font-bold text-white"
              style={{ backgroundColor: KAIHO_BLUE }}
            >
              {article.kicker}
            </p>
          )}
          <h1 className="mt-3 text-2xl font-bold leading-snug text-navy md:text-[2rem]">{article.title}</h1>
          <p className="mt-4 border-b-2 border-gold pb-4 text-navy">
            <span className="text-lg font-bold">{article.author}</span>
            {article.authorRole && <span className="ml-2 text-sm text-muted-foreground">（{article.authorRole}）</span>}
          </p>
        </header>

        {article.hero && <KaihoFigure image={article.hero} priority />}
        {article.lead && <p className="my-6 font-medium leading-loose text-navy">{article.lead}</p>}

        {article.public ? (
          <>
            <KaihoBlocks blocks={article.blocks} />
            <p className="mt-12 text-xs text-muted-foreground">このページはどなたでもご覧いただけます。</p>
          </>
        ) : reader.full ? (
          <>
            {/* 印刷時は本文を出さない（転載・配布の抑止） */}
            <div className="print:hidden">
              <KaihoBlocks blocks={article.blocks} />
              {article.profile && <KaihoProfile profile={article.profile} />}
            </div>
            <p className="hidden print:block">この記事は会員専用のため印刷できません。</p>

            <footer className="mt-12 rounded-lg bg-muted/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              {reader.readerLabel && <p>この記事は {reader.readerLabel} の閲覧用に表示しています。</p>}
              <p>会報の記事・写真の無断転載、引用、転送は禁止いたします。</p>
            </footer>
          </>
        ) : (
          <>
            <div className="relative">
              <p className="my-5 indent-[1em] text-[17px] leading-[2.05] text-foreground">{teaser}</p>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white" />
            </div>
            <KaihoMemberGate redirectTo={path} />
          </>
        )}

        <nav className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
          {prev ? (
            <Link href={`/kaiho/${issue.number}/${prev.slug}${q}`} className="rounded-lg border border-border p-3 hover:bg-muted/50">
              <span className="text-xs text-muted-foreground">← 前の記事</span>
              <span className="mt-1 block text-sm font-medium text-navy">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/kaiho/${issue.number}/${next.slug}${q}`}
              className="rounded-lg border border-border p-3 text-right hover:bg-muted/50"
            >
              <span className="text-xs text-muted-foreground">次の記事 →</span>
              <span className="mt-1 block text-sm font-medium text-navy">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>
      <KaihoPreviewSwitch path={path} isMember={reader.preview} />
    </div>
  );
}
