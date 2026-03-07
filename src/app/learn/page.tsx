import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, MessageCircle, Music, ArrowRight } from "lucide-react";

export const metadata = {
  title: "学ぶ・相談する | 日本クラリネット協会",
  description:
    "クラリネットの学習支援、演奏相談、指導者紹介など。日本クラリネット協会がお手伝いします。",
};

export default function LearnPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            学ぶ・相談する
          </h1>
          <p className="mt-2 text-muted-foreground">
            クラリネットの学習や演奏について、協会がサポートします。
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-12">
          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">学習支援</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <BookOpen className="size-8 text-gold" />
                  <CardTitle>教材・楽譜のご案内</CardTitle>
                  <CardDescription>
                    初心者から上級者まで、クラリネット学習に役立つ教材や楽譜の情報をご紹介します。
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Music className="size-8 text-gold" />
                  <CardTitle>コンクール・イベント</CardTitle>
                  <CardDescription>
                    ヤングコンクールをはじめ、技術向上の機会となるコンクールやワークショップの情報です。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/events">
                    <span className="inline-flex items-center gap-1 text-gold hover:underline">
                      イベント一覧を見る
                      <ArrowRight className="size-4" />
                    </span>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">相談窓口</h2>
            <Card>
              <CardHeader>
                <MessageCircle className="size-8 text-gold" />
                <CardTitle>演奏・指導に関するご相談</CardTitle>
                <CardDescription>
                  クラリネットの演奏技術、指導方法、楽器の選び方など、お気軽にご相談ください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  お問い合わせフォームよりご連絡いただくか、事務局までお電話でお問い合わせください。
                </p>
                <Link href="/contact" className="mt-4 inline-block">
                  <span className="inline-flex items-center gap-1 text-gold hover:underline">
                    お問い合わせはこちら
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
