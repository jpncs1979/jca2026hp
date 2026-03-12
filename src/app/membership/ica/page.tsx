import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Globe,
  ArrowLeft,
  Check,
  Music,
  BookOpen,
  Headphones,
  Shield,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "ICA（国際クラリネット協会）入会プログラム | 日本クラリネット協会",
  description:
    "JCA会員の皆さまは追加費用なしで国際クラリネット協会（ICA）の会員になれます。世界最大のクラリネット組織の特典をご紹介します。",
};

export default function ICAMembershipPage() {
  return (
    <div className="font-soft">
      {/* ヒーロー：魅力的なキャッチ */}
      <div className="border-b border-gold/30 bg-gradient-to-b from-gold/10 to-transparent py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-gold/20 px-4 py-1.5 text-sm font-medium text-gold">
              <Globe className="mr-2 size-4" />
              JCA会員限定特典
            </div>
            <h1 className="text-3xl font-bold text-navy md:text-4xl">
              ICA会員になることは、
              <br className="sm:hidden" />
              <span className="text-gold">とっても魅力的なこと。</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              日本クラリネット協会（JCA）の会員なら、世界最大のクラリネット組織「国際クラリネット協会（ICA）」にも、
              <strong className="text-foreground">追加費用なし</strong>で会員になれます。
            </p>
            <p className="mt-2 text-muted-foreground">
              世界の祭典、学びのリソース、演奏サポートまで。あなたのクラリネットライフが、一歩で世界とつながります。
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-12">
          {/* 追加負担なし */}
          <section>
            <Card className="border-gold/30 bg-gold/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-navy">
                  <Sparkles className="size-5 text-gold" />
                  ICA入会の追加負担はありません
                </CardTitle>
                <CardDescription>
                  JCAとICAの提携により、会員の皆さまに追加のご負担は一切発生しません。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  "ICA会費はJCAが負担します",
                  "JCA会員の皆さまに追加の費用は一切発生しません",
                  "ICAへの入会・更新手続きはJCAとICAの間で一括して行われます",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-gold" />
                    <span>{item}</span>
                  </li>
                ))}
                <p className="mt-4 text-sm text-muted-foreground">
                  ※本制度は2029年までを目処として実施予定です。以降の継続については、成果等を踏まえて検討します。
                </p>
              </CardContent>
            </Card>
          </section>

          {/* 会員資格について */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-medium text-navy">
              <Shield className="size-5 text-gold" />
              ICA会員資格について
            </h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span>ICA会員資格は毎年5月に1年間自動更新されます</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span>ICAからの退会はいつでも可能です</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span>JCAを退会された場合、ICA会員資格も失効します</span>
                  </li>
                </ul>
                <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                  <p className="font-medium text-foreground">本プログラムの運用にあたり、以下の情報をICAに提供します</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                    <li>氏名</li>
                    <li>メールアドレス</li>
                    <li>居住都道府県・市町村</li>
                    <li>18歳以上かどうか</li>
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    ※これらの情報は、ICAとの契約に基づき厳重に管理され、本プログラム以外の目的には使用されません。
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ICA会員の主な特典 */}
          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">
              ICA会員の主な特典（概要）
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              特典の詳細は
              <a
                href="https://clarinet.org/about/membership/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 inline-flex items-center gap-1 text-gold hover:underline"
              >
                ICA公式サイト
                <ExternalLink className="size-3" />
              </a>
              をご覧ください。
            </p>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-navy">
                    <Music className="size-5 text-gold" />
                    世界最大のクラリネットの祭典へ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span>
                      <strong className="text-foreground">ICA年次フェスティバル ClarinetFest®</strong> への参加資格
                      （出演には別途選考があります。入場はチケット購入が必要ですが、会員は非会員より安価に購入できます）
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span>ClarinetFest®およびICA主催イベントで行われる各種コンクールへの参加資格</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-navy">
                    <BookOpen className="size-5 text-gold" />
                    学びと研究のための充実したリソース
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span><strong className="text-foreground">ICA機関誌 The Clarinet</strong>（年4回）オンライン購読 — 1973年創刊号からの全バックナンバー閲覧可</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span><strong className="text-foreground">James Gillespie Library</strong> — クラリネット研究資料の宝庫</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span><strong className="text-foreground">ClarinetFest® Program Library</strong>（1973–2024）— 2005年東京開催のプログラムも収録</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span><strong className="text-foreground">Historic Recording Project</strong> — 往年の名手による貴重なライブ録音</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-navy">
                    <Headphones className="size-5 text-gold" />
                    実践的な演奏サポート
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span><strong className="text-foreground">Naxos Music Library</strong>（無料利用）— 通常は高額な定額制サービス</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span>
                      <strong className="text-foreground">Forza Clarinet Excerpts</strong> — オーケストラ・スタディのマイナスワン音源（バスクラ・エスクラ版あり、テンポ・ピッチ調整可）
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-navy">
                    <Shield className="size-5 text-gold" />
                    その他の特典
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span>米国メリーランド大学 ICA Resource Library へのアクセス</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span>楽器保険（Anderson Musical Instrument Insurance Solutions）への加入資格</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              ※本プログラムによるICA会員には、ICA役員選挙への立候補権および投票権はありません。
            </p>
          </section>

          {/* 目的と今後 */}
          <section>
            <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-navy">このプログラムの目的と、これから</CardTitle>
                <CardDescription>
                  JCA会員であることの魅力をさらに高め、世界とつながるクラリネット環境を日本の皆さまに届けるために構築されました。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0 text-muted-foreground">
                <p>
                  ICAの最新情報や多彩なリソースを活用していただくことで、会員の皆さまのクラリネットライフがより豊かになることを期待しています。
                </p>
                <p>
                  2026年7月にはお隣の韓国・仁川で <strong className="text-foreground">ClarinetFest® 2026</strong> が開催され、日本からも多くのクラリネット・アーティストが登場します。ICA会員となることで、このフェスティバルにも手軽に参加できるようになりました。
                </p>
                <p>
                  JCAでは、2005年に続く2回目の日本開催となる ClarinetFest® を <strong className="text-foreground">2029年</strong> に実現することを目標に準備を進めています。その未来へ向けて、ICA会員として世界とつながる第一歩を、ぜひJCAから踏み出してください。
                </p>
                <p className="text-right text-sm text-muted-foreground">（2026年1月現在）</p>
              </CardContent>
            </Card>
          </section>

          <div className="flex flex-wrap gap-4">
            <Link href="/membership">
              <Button variant="outline">
                <ArrowLeft className="mr-2 size-4" />
                入会案内に戻る
              </Button>
            </Link>
            <Link href="/membership/join">
              <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                JCAに入会してICA特典を得る
                <ExternalLink className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
