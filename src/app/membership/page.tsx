import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, UserPlus, ArrowRight, Gift, Users, Music2 } from "lucide-react";

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
                    <CardTitle className="text-base">会員後援演奏会の後援依頼</CardTitle>
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
