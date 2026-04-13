import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { officers } from "@/data/officers";
import { Target, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "協会案内 | 日本クラリネット協会",
  description:
    "一般社団法人日本クラリネット協会の会長挨拶、設立理念、組織概要をご案内します。",
};

export default function AboutPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            協会案内
          </h1>
          <p className="mt-2 text-muted-foreground">
            一般社団法人 日本クラリネット協会について
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          {/* ページ内ナビゲーション（アンカーリンク） */}
          <nav className="mb-12 flex flex-wrap gap-2 border-b border-border pb-6">
            <a href="#greeting" className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-navy">
              会長挨拶・設立理念
            </a>
            <a href="#organization" className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-navy">
              組織概要
            </a>
            <Link
              href="/contact"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
            >
              問い合わせ
            </Link>
          </nav>

          <div className="space-y-16">
            <section id="greeting" className="scroll-mt-24">
              <section className="prose prose-navy max-w-none">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
                  <Target className="size-5 text-gold" />
                  会長挨拶
                </h2>
                <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
                  <div className="shrink-0 sm:w-56">
                    <Image
                      src="/images/chairman.png"
                      alt="会長 四戸世紀"
                      width={224}
                      height={336}
                      className="rounded-lg object-cover shadow-md"
                      priority
                    />
                  </div>
                  <div className="space-y-4 leading-relaxed text-muted-foreground min-w-0">
                  <p>
                    一般社団法人日本クラリネット協会のウェブサイトへお越しいただき、ありがとうございます。
                  </p>
                  <p>
                    当協会は、クラリネットの普及・発展を目的として、中高生から大人まで、愛好家からプロ奏者まで、
                    幅広い層の皆様にクラリネットの魅力をお届けする活動を続けてまいりました。
                  </p>
                  <p>
                    ヤング・クラリネッティストコンクールをはじめとするコンクールの開催、
                    2029年国際フェスティバルへの歩み、そして会員の皆様との交流を通じて、
                    次代を担う音楽家の育成と、クラリネット音楽の発展に貢献してまいります。
                  </p>
                  <p>
                    どうぞ今後とも、日本クラリネット協会へのご理解とご支援を賜りますよう、
                    心よりお願い申し上げます。
                  </p>
                  </div>
                </div>

                <h2 className="mb-6 mt-12 flex items-center gap-2 text-xl font-medium text-navy">
                  <Target className="size-5 text-gold" />
                  設立理念
                </h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    日本クラリネット協会は、クラリネットを愛好する若い人たちの豊かな音楽性と
                    演奏技術の向上を促進し、次代を担う音楽家を育成することを目的としています。
                  </p>
                  <ul className="list-inside list-disc space-y-2">
                    <li>クラリネットの普及・啓発活動</li>
                    <li>若手奏者の育成とコンクールの開催</li>
                    <li>会員相互の交流と情報提供</li>
                    <li>国際的なクラリネット音楽の発展への貢献</li>
                  </ul>
                </div>
              </section>
            </section>

            <section id="organization" className="scroll-mt-24">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
                  <Users className="size-5 text-gold" />
                  役員名簿
                </h2>
                <div className="space-y-6">
                  {officers.map((group) => (
                    <Card key={group.role}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-gold">{group.role}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
                          {group.members.map((m, i) => (
                            <span key={i} className="inline-flex flex-wrap items-baseline gap-x-1">
                              <span className="font-medium">{m.name}</span>
                              {m.affiliation && (
                                <span className="text-sm text-muted-foreground">（{m.affiliation}）</span>
                              )}
                              {i < group.members.length - 1 && (
                                <span className="text-muted-foreground" aria-hidden="true">、</span>
                              )}
                            </span>
                          ))}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
