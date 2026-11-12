import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { KaihoArticle, KaihoBlock, KaihoImage, KaihoIssue } from "@/data/kaiho";
import { isKaihoPreviewEnv } from "@/lib/kaiho-access";

/** 会報誌面の水色（特集の帯・見出し） */
export const KAIHO_BLUE = "#1a8bd0";

export function KaihoLogo({ issue, size = "lg" }: { issue: KaihoIssue; size?: "lg" | "sm" }) {
  const big = size === "lg";
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-end gap-2">
        <span
          className={`font-serif font-black leading-none tracking-tight text-navy ${big ? "text-6xl md:text-8xl" : "text-3xl"}`}
        >
          JCA
        </span>
        <span
          className={`font-bold leading-none text-navy [writing-mode:vertical-rl] ${big ? "text-2xl md:text-4xl" : "text-sm"}`}
        >
          会報
        </span>
      </div>
      <div
        className={`flex shrink-0 flex-col items-center justify-center rounded-full text-white ${big ? "size-24 md:size-32" : "size-14"}`}
        style={{ backgroundColor: KAIHO_BLUE }}
      >
        <span className={big ? "text-xs md:text-sm" : "text-[9px]"}>会報 No.</span>
        <span className={`font-bold leading-none ${big ? "text-3xl md:text-5xl" : "text-lg"}`}>
          {issue.number}
        </span>
        <span className={big ? "mt-1 text-[10px] md:text-xs" : "text-[7px]"}>{issue.issueMonthEn}</span>
      </div>
    </div>
  );
}

export function KaihoCover({ issue }: { issue: KaihoIssue }) {
  const [main, ...others] = issue.cover.images;
  const rest = others.slice(0, 4);
  // 大1枚＋小4枚なら横に並べる。小が4枚に満たない号は、大の下に縦長で一列に並べる
  const quad = rest.length === 4;
  return (
    <div className="self-start overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="px-5 pt-5 md:px-8 md:pt-8">
        <KaihoLogo issue={issue} />
        <p className="mt-2 text-xs tracking-widest text-muted-foreground">Japan Clarinet Association</p>
      </div>

      <div className="mt-5 px-3 md:px-5" style={{ backgroundColor: KAIHO_BLUE }}>
        <p className="py-3 text-center text-2xl font-bold tracking-wide text-white md:text-4xl">
          {issue.cover.feature}
        </p>
        {quad ? (
          <div className="grid grid-cols-4 gap-1.5 pb-3 md:gap-2">
            {main && (
              <div className="relative col-span-4 aspect-[4/3] overflow-hidden rounded-sm sm:col-span-2 sm:row-span-2">
                <Image src={main.src} alt="" fill sizes="(max-width:768px) 66vw, 450px" className="object-cover" priority />
              </div>
            )}
            {rest.map((im) => (
              <div key={im.src} className="relative aspect-[4/3] overflow-hidden rounded-sm sm:col-span-1">
                <Image src={im.src} alt="" fill sizes="(max-width:768px) 33vw, 220px" className="object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5 pb-3 md:space-y-2">
            {main && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image src={main.src} alt="" fill sizes="(max-width:768px) 100vw, 520px" className="object-cover" priority />
              </div>
            )}
            {rest.length > 0 && (
              <div className="grid gap-1.5 md:gap-2" style={{ gridTemplateColumns: `repeat(${rest.length}, minmax(0, 1fr))` }}>
                {rest.map((im) => (
                  <div key={im.src} className="relative aspect-[3/4] overflow-hidden rounded-sm">
                    <Image src={im.src} alt="" fill sizes="(max-width:768px) 33vw, 180px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {issue.cover.featureSub && (
          <p className="pb-3 text-center text-sm font-medium text-white md:text-base">{issue.cover.featureSub}</p>
        )}
      </div>

      {issue.cover.band && (
        <div className="bg-navy px-5 py-2.5 text-center text-sm font-bold text-white md:text-lg">
          {issue.cover.band}
        </div>
      )}
      {issue.cover.caption && (
        <p className="px-5 pt-3 text-xs leading-relaxed text-muted-foreground md:px-8">表紙の写真：{issue.cover.caption}</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-muted-foreground md:px-8">
        <span>一般社団法人日本クラリネット協会会報</span>
        <span>{issue.issueDateJa}</span>
      </div>
    </div>
  );
}

export function KaihoFigure({ image, priority }: { image: KaihoImage; priority?: boolean }) {
  return (
    <figure className="my-8">
      <Image
        src={image.src}
        alt={image.caption ?? ""}
        width={image.width}
        height={image.height}
        sizes="(max-width: 768px) 100vw, 720px"
        className="h-auto w-full rounded-lg"
        priority={priority}
      />
      {image.caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">{image.caption}</figcaption>
      )}
    </figure>
  );
}

export function KaihoBlocks({ blocks }: { blocks: KaihoBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return (
              <p key={i} className="my-5 indent-[1em] text-[17px] leading-[2.05] text-foreground">
                {b.text}
              </p>
            );
          case "h":
            return (
              <h3
                key={i}
                className="mt-10 mb-3 border-l-4 pl-3 text-lg font-bold text-navy"
                style={{ borderColor: KAIHO_BLUE }}
              >
                {b.text}
              </h3>
            );
          case "image":
            return <KaihoFigure key={i} image={b} />;
          case "program":
            return (
              <aside key={i} className="my-8 overflow-hidden rounded-lg border-2" style={{ borderColor: KAIHO_BLUE }}>
                <p className="px-4 py-1.5 text-sm font-bold tracking-widest text-white" style={{ backgroundColor: KAIHO_BLUE }}>
                  Program
                </p>
                <div className="space-y-4 px-4 py-4">
                  {b.sessions.map((s) => (
                    <div key={s.when}>
                      <p className="text-sm font-bold text-navy">{s.when}</p>
                      <ul className="mt-1 space-y-1 text-sm leading-relaxed text-foreground">
                        {s.lines.map((l) => (
                          <li key={l}>◇ {l}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </aside>
            );
          case "list":
            return (
              <ul key={i} className="my-5 space-y-2 text-[16px] leading-relaxed text-foreground">
                {b.items.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full" style={{ backgroundColor: KAIHO_BLUE }} />
                    <span className="whitespace-pre-line">{t}</span>
                  </li>
                ))}
              </ul>
            );
          case "facts":
            return (
              <aside key={i} className="my-8 rounded-lg bg-muted/50 px-4 py-4 md:px-6">
                {b.title && <p className="mb-3 text-sm font-bold tracking-widest" style={{ color: KAIHO_BLUE }}>{b.title}</p>}
                <dl className="space-y-3 text-sm leading-relaxed">
                  {b.rows.map((r) => (
                    <div key={r.label} className="sm:flex sm:gap-4">
                      <dt className="shrink-0 font-bold text-navy sm:w-24">{r.label}</dt>
                      <dd className="text-foreground">
                        {r.value.map((v) => (
                          <span key={v} className="block">
                            {v}
                          </span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </aside>
            );
          case "winner":
            return <KaihoWinner key={i} w={b} />;
          case "honorees":
            return (
              <section key={i} className="my-8">
                <p className="mb-3 text-sm font-bold text-navy">{b.label}</p>
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {b.people.map((p) => (
                    <li key={p.name} className="text-center">
                      {p.photo ? (
                        <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
                          <Image
                            src={p.photo.src}
                            alt={p.name}
                            fill
                            sizes="(max-width: 640px) 33vw, 140px"
                            className="object-cover object-[center_30%]"
                          />
                        </div>
                      ) : null}
                      <p className="mt-1.5 text-sm font-medium text-navy">{p.name}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
        }
      })}
    </>
  );
}

type WinnerBlock = Extract<KaihoBlock, { type: "winner" }>;

function KaihoWinner({ w }: { w: WinnerBlock }) {
  return (
    <section
      className={`my-8 gap-4 border-t border-border pt-6 sm:gap-6 ${w.photo ? "grid grid-cols-[6.5rem_1fr] sm:grid-cols-[9rem_1fr]" : ""}`}
    >
      {w.photo && (
        <div className="relative aspect-[3/4] self-start overflow-hidden rounded-md bg-muted">
          <Image
            src={w.photo.src}
            alt={w.name}
            fill
            sizes="(max-width: 640px) 104px, 144px"
            className="object-cover object-[center_30%]"
          />
        </div>
      )}
      <div className="min-w-0">
        <p>
          <span
            className="inline-block rounded px-2 py-0.5 text-sm font-bold text-white"
            style={{ backgroundColor: KAIHO_BLUE }}
          >
            {w.rank}
          </span>
        </p>
        <p className="mt-2 text-xl font-bold text-navy">{w.name}</p>
        {w.affiliation && <p className="mt-0.5 text-sm text-muted-foreground">{w.affiliation}</p>}
        {w.heading && <p className="mt-3 font-bold text-navy">{w.heading}</p>}
        {w.text.map((t, j) => (
          <p key={j} className="mt-3 indent-[1em] text-[15.5px] leading-[1.95] text-foreground">
            {t}
          </p>
        ))}
      </div>
    </section>
  );
}

export function KaihoProfile({ profile }: { profile: NonNullable<KaihoArticle["profile"]> }) {
  return (
    <aside className="mt-12 flex gap-4 rounded-lg border border-border p-4 md:p-5">
      {profile.photo && (
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-muted md:size-24">
          <Image src={profile.photo.src} alt={profile.name} fill sizes="96px" className="object-cover" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-widest" style={{ color: KAIHO_BLUE }}>
          PROFILE
        </p>
        <p className="mt-1 font-bold text-navy">{profile.name}</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground/90">{profile.text}</p>
      </div>
    </aside>
  );
}

export function KaihoMemberGate({ redirectTo }: { redirectTo: string }) {
  return (
    <div className="relative mt-2 rounded-xl border border-gold/60 bg-accent/40 p-6 text-center md:p-8">
      <Lock className="mx-auto size-7 text-gold" />
      <p className="mt-3 text-lg font-bold text-navy">この続きは会員の方のみお読みいただけます</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        日本クラリネット協会の会員は、会報の全記事をこのページでお読みいただけます。
        <br className="hidden md:inline" />
        年4回（3・6・9・12月）、コンクールや国際交流、会員の皆さまの活動をお届けしています。
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          href={`/mypage?redirect=${encodeURIComponent(redirectTo)}`}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-navy px-5 text-sm font-medium text-white hover:bg-navy-light"
        >
          会員ログイン
        </Link>
        <Link
          href="/membership"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-gold px-5 text-sm font-medium text-gold-foreground hover:bg-gold-muted"
        >
          入会のご案内
        </Link>
      </div>
    </div>
  );
}

/** 開発サーバーだけに出る「一般／会員」表示の切り替え */
export function KaihoPreviewSwitch({ path, isMember }: { path: string; isMember: boolean }) {
  if (!isKaihoPreviewEnv()) return null;
  const tab = (active: boolean) =>
    `rounded-md px-3 py-1 ${active ? "bg-white font-bold text-navy" : "text-white/80 hover:text-white"}`;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-navy/95 px-3 py-2 text-xs text-white shadow-lg">
      <span className="hidden sm:inline">見本の表示切替：</span>
      <Link href={path} className={tab(!isMember)}>
        一般の方
      </Link>
      <Link href={`${path}?preview=member`} className={tab(isMember)}>
        会員
      </Link>
    </div>
  );
}
