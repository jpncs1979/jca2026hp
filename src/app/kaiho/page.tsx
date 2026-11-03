import Image from "next/image";
import Link from "next/link";
import { KAIHO_ISSUES } from "@/data/kaiho";
import { KAIHO_BLUE } from "@/components/kaiho/KaihoParts";

export const metadata = { title: "会報 | 日本クラリネット協会" };

export default function KaihoListPage() {
  return (
    <div className="font-soft container mx-auto max-w-5xl px-4 py-12 md:py-16">
      <h1 className="text-3xl font-bold text-navy">会報</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
        日本クラリネット協会の会報は年4回（3・6・9・12月）発行しています。
        どなたでも各記事の冒頭をお読みいただけます。全文は会員の方のみご覧いただけます。
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {KAIHO_ISSUES.map((issue) => {
          const main = issue.cover.images[0];
          return (
            <Link
              key={issue.number}
              href={`/kaiho/${issue.number}`}
              className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm hover:shadow-md"
            >
              {main && (
                <div className="relative aspect-[4/3]">
                  <Image src={main.src} alt="" fill sizes="(max-width:640px) 100vw, 340px" className="object-cover" />
                  <span
                    className="absolute top-3 right-3 rounded-full px-3 py-1 text-sm font-bold text-white"
                    style={{ backgroundColor: KAIHO_BLUE }}
                  >
                    No.{issue.number}
                  </span>
                </div>
              )}
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{issue.issueDateJa}</p>
                <p className="mt-1 font-bold text-navy">{issue.cover.feature}</p>
                {issue.cover.band && <p className="mt-1 text-sm text-muted-foreground">{issue.cover.band}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
