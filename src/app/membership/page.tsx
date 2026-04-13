import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, UserPlus, ArrowRight, Gift, Users, Music2, Globe } from "lucide-react";

export const metadata = {
  title: "入会案内 | 日本クラリネット協会",
  description:
    "一般社団法人日本クラリネット協会への入会方法、会員特典をご案内します。",
};

export default function MembershipPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            入会案内
          </h1>
          <p className="mt-2 text-muted-foreground">
            日本クラリネット協会の会員になりませんか
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-12">
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <UserPlus className="size-5" />
              会員特典
            </h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {[
                    "コンクール・イベントの会員価格でのご参加",
                    "協会主催演奏会への優先案内",
                    "会員向け情報・ニュースレターの配信",
                    "会員同士の交流の場への参加",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-5 shrink-0 text-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* ICA 国際クラリネット協会 — 目立つ特典 */}
            <Card className="overflow-hidden border-2 border-gold/40 bg-gradient-to-br from-gold/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/20">
                      <Globe className="size-6 text-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-navy">
                        JCA会員なら、<span className="text-gold">国際クラリネット協会（ICA）</span>にも会員になれます
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        追加費用なし。世界最大のクラリネット組織の会員特典を、そのままお届けします。
                      </p>
                    </div>
                  </div>
                  <Link href="/membership/ica" className="shrink-0">
                    <Button className="w-full bg-gold text-gold-foreground hover:bg-gold-muted sm:w-auto">
                      詳細はこちら
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Gift className="size-5" />
              入会金・年会費
            </h2>
            <Card>
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed">
                <p>正会員：入会金2,000円 / 会費（年額）8,000円</p>
                <p>学生会員：入会金2,000円 / 会費（年額）6,000円</p>
                <p>賛助会員：入会金5,000円 / 会費（年額）1口15,000円（1口以上）</p>
                <p>※現在入会いただきますと、国際クラリネット協会（ICA）への費用負担なしで同時入会が可能です。</p>
                <p>※ICA会員への入会は選択いただけます。</p>
                <p>※学生会員は卒業して社会人になった時点で正会員に移行していただきます。</p>
                <p className="text-muted-foreground">
                  協会の事業年度（会費の計上）は毎年2月1日から翌年1月31日までです。入会時のお支払いは原則「入会金＋当該事業年度の会費」ですが、11月・12月・1月にご入会の場合は「入会金＋翌事業年度の会費」となります。
                  会員資格としての期間は、各年4月1日から翌年3月31日までです。1月までに翌事業年度分の会費がお支払い済みの場合、会員資格はその次の4月1日から始まる年度に及びます。
                  会費のお支払いはクレジットカード（毎年1月22日頃に翌事業年度分の自動引き落とし）または銀行振込（CSS。事務局が手動で入金済みを登録）のいずれかです。
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Users className="size-5 text-gold" />
              学生会員について
            </h2>
            <Card>
              <CardContent className="space-y-3 pt-6 text-sm leading-relaxed">
                <p>
                  未成年者のお申し込みにあたっては保護者様のご同意が必要です。必ず保護者様のご同意を得てからお申し込みください。
                  またご入金は保護者名でのお振込をお願いいたします。
                </p>
                <p>クラリネット協会は電話等にて保護者様にご同意の確認をすることがあります。</p>
                <p>
                  学生会員は小学生、中学生、高校生、専門学校生、大学生、大学院生を対象とします。
                </p>
                <p>
                  学生会員の年齢上限は25歳です。26歳になりましたら学生の場合でも正会員に移行します。
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Gift className="size-5" />
              入会方法
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">お申し込み</CardTitle>
                <CardDescription>
                  ウェブから入会申し込みができます。クレジットカードでお支払いいただくと即時入会となります。
                  口座振替をご希望の方は、事務局までお問い合わせください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/membership/join">
                  <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                    ウェブで入会申し込み
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>

          {/* 会員の皆様へ */}
          <section id="members">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Users className="size-5 text-gold" />
              会員の皆様へ
            </h2>
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Music2 className="mt-0.5 size-6 shrink-0 text-gold" />
                  <div>
                    <CardTitle className="text-base">後援演奏会の後援依頼</CardTitle>
                    <CardDescription>
                      協会会員の皆様が主催する演奏会について、協会の後援をご希望の場合は申し込みフォームからお申し込みください。
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/membership/patronage-request">
                  <Button variant="outline">
                    後援を申し込む
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
