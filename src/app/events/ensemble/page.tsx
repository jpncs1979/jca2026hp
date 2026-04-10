import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Music2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "クラリネット・アンサンブルコンクール | 日本クラリネット協会",
  description:
    "2027年 第19回 クラリネット・アンサンブルコンクール参加要項。予選動画審査・本選公開審査の詳細をご案内します。",
};

export default function EnsemblePage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <Music2 className="size-8 text-gold" />
            クラリネット・アンサンブルコンクール
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            2027年 第19回 参加要項
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/archive?competition=ensemble">
              <Button variant="outline" size="lg">
                過去の受賞者
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-12">
          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">概要</h2>
            <p className="leading-relaxed text-muted-foreground">
              本コンクールは、クラリネットアンサンブルの楽しさを通じ、豊かな音楽性と音楽の基本および技術の向上を図ることを目的とします。
              クラリネットの専門家が審査を行い、参加団体すべてに講評をお渡しします。全国どこからでもご参加いただけます。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">開催概要</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">開催情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="flex items-center gap-2">
                  <Calendar className="size-4 text-gold" />
                  予選：2027年<span className="text-red-600 italic">2月上旬</span>（動画審査・非公開）
                </p>
                <p className="text-sm">
                  本選：2027年2月27日（土） 東広島芸術文化ホール くららホール（公開）
                </p>
                <p className="text-sm text-muted-foreground">主催：一般社団法人日本クラリネット協会</p>
                <p className="text-sm text-muted-foreground">
                  協賛：株式会社石森管楽器／ザ クラリネット ショップ／野中貿易株式会社／株式会社ビュッフェ・クランポン・ジャパン／株式会社ヤマハミュージックジャパン
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">部門・参加資格</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>1. 小・中学生部門：参加者全員が小・中学生以下であること。</p>
              <p>2. 高校生部門：参加者全員が高校生以下であること。</p>
              <p>3. 専門部門：音楽大学等でクラリネットを専攻中、あるいは専攻した者であること。</p>
              <p>4. 一般部門：参加者の資格および年齢の制限なし（ただし専門部門該当者を除く）。</p>
              <p>※一団体2名以上（上限なし、常識的なクラリネットアンサンブル人数の範囲内）。</p>
              <p>※出演は1人1部門、1団体限り。国籍不問。指揮者なし。</p>
              <p>
                ※使用楽器はクラリネット属のみ（原曲でコントラバスクラリネットのパートを弦楽器コントラバスで演奏することは可）。
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">演奏曲・審査</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>小・中学生部門／高校生部門：5分以内の自由曲</p>
              <p>専門部門／一般部門：7分以内の自由曲</p>
              <p>※予選と本選が同じ曲でも可。</p>
              <p>※部門ごとに審査し、出演順は事務局が決定します。</p>
              <p>※予選は非公開審査、本選は公開審査です。</p>
              <p>※申込全団体に審査員講評を送付します。</p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">審査料・参加料</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>動画審査料（1団体）：小・中・高校生部門 5,000円（会員 3,000円）</p>
              <p>動画審査料（1団体）：専門・一般部門 8,000円（会員 6,000円）</p>
              <p>※演奏者に1人以上協会会員が含まれる団体は会員価格で応募可能。</p>
              <p>本選参加料（本選出場時のみ・演奏者1人につき）：</p>
              <p>小・中・高校生部門 非会員 2,000円／会員 無料</p>
              <p>専門・一般部門 非会員 3,000円／会員 1,000円</p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">申込・動画提出</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>申込受付期間：2026年<span className="text-red-600 italic">〇月〇日</span>（ ）～2026年<span className="text-red-600 italic">〇月〇日</span>（ ）</p>
              <p>予選動画提出期限：2026年<span className="text-red-600 italic">〇月〇日</span> （〇）</p>
              <p>申込方法：協会ホームページからWeb申込。</p>
              <p>予選動画はYouTube「限定公開」でアップロードし、URLを申込フォームへ記載してください。</p>
              <p>申込後の連絡は代表者メール宛に行います。`jca@jp-clarinet.org` を受信できる設定をご確認ください。</p>
              <p>入金確認をもって受付完了となります。申込確認後の取消について審査料は返却されません。</p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">支払い方法</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>郵便振替番号：00120-2-472961</p>
              <p>口座名：一般社団法人日本クラリネット協会</p>
              <p>通信欄に「コンクール参加」と団体名をご記入ください。</p>
              <p>ゆうちょ銀行：〇一九（ゼロイチキュウ）店 当座 0472961 シャ）ニホンクラリネットキョウカイ</p>
              <p>銀行振込時は振込人名を参加団体名とし、団体名の前に「コンクール」を付けてください。</p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">発表・表彰</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>予選結果は<span className="text-red-600 italic">〇月〇日</span>（<span className="text-red-600 italic">〇</span>）までに協会ホームページで発表予定（本選出場団体にはメール通知）。</p>
              <p>本選結果は審査終了後、会場および協会ホームページで発表します。</p>
              <p>部門ごとに順位を決定して表彰（一般部門は金賞・銀賞・銅賞）。</p>
              <p>小・中学生部門、高校生部門、専門部門では特に優秀な団体にグランプリ賞を授与します。</p>
              <p>特別賞（奨励賞・努力賞など）を贈る場合があります。</p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">受賞者演奏会・お問い合わせ</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                各部門最高位入賞団体に、本選翌日2月27日（日）開催「第39回日本クラリネットフェスティバル in 広島」での受賞者演奏会出演をお願いする場合があります（出演任意）。
              </p>
              <p>※受賞者演奏会出演に係る費用（宿泊費等）は自己負担です。</p>
              <p>〒164-0013 東京都中野区弥生町4-6-13 ヤックビル3F 一般社団法人日本クラリネット協会 事務局</p>
              <p>Tel：03-6382-7871／Fax：03-6382-7872／メール：jca@jp-clarinet.org</p>
              <p>公式サイト：http://www.jp-clarinet.org/</p>
            </div>
          </section>

          <div className="border-t border-border pt-12">
            <Link href="/archive?competition=ensemble">
              <Button variant="outline">
                過去の受賞者アーカイブを見る
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
