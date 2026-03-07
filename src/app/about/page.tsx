import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Target, Users, MapPin, Phone, Mail } from "lucide-react";

export const metadata = {
  title: "協会案内 | 日本クラリネット協会",
  description:
    "一般社団法人日本クラリネット協会の概要、目的、役員、所在地・連絡先をご案内します。",
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
        <div className="mx-auto max-w-3xl space-y-12">
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Target className="size-5" />
              協会の目的
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              一般社団法人日本クラリネット協会は、クラリネットの普及・発展を目的として活動しています。
              中高生からプロ奏者、愛好家まで、幅広い層の皆様にクラリネットの魅力をお届けし、
              次代を担う音楽家の育成に貢献することを目指しています。
            </p>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Users className="size-5" />
              主な活動
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>・ヤング・クラリネッティストコンクールの開催</li>
              <li>・演奏会・フェスティバルの主催・共催</li>
              <li>・会員向け情報提供・交流の場の提供</li>
              <li>・クラリネットの普及啓発活動</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <MapPin className="size-5" />
              所在地・お問い合わせ
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">事務局</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="font-medium">一般社団法人 日本クラリネット協会事務局</p>
                <p>〒 164-0013 東京都中野区弥生町 4-6-13 ヤックビル 3 階</p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4" />
                  TEL：03-6382-7871　FAX：03-6382-7872
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-4" />
                  <a href="mailto:jca@jp-clarinet.org" className="text-gold hover:underline">
                    jca@jp-clarinet.org
                  </a>
                </p>
                <p>
                  <a
                    href="http://www.jp-clarinet.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    http://www.jp-clarinet.org
                  </a>
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
