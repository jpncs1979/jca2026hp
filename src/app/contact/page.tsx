import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const metadata = {
  title: "お問い合わせ | 日本クラリネット協会",
  description:
    "一般社団法人日本クラリネット協会へのお問い合わせは、電話・FAX・メールにて承っております。",
};

export default function ContactPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            お問い合わせ
          </h1>
          <p className="mt-2 text-muted-foreground">
            日本クラリネット協会へのお問い合わせは、下記までご連絡ください
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-2xl space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>一般社団法人 日本クラリネット協会事務局</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-gold" />
                <div>
                  <p className="font-medium">所在地</p>
                  <p>〒 164-0013 東京都中野区弥生町 4-6-13 ヤックビル 3 階</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-gold" />
                <div>
                  <p className="font-medium">電話・FAX</p>
                  <p>TEL：03-6382-7871</p>
                  <p>FAX：03-6382-7872</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail className="mt-0.5 size-5 shrink-0 text-gold" />
                <div>
                  <p className="font-medium">メール</p>
                  <p>
                    <a
                      href="mailto:jca@jp-clarinet.org"
                      className="text-gold hover:underline"
                    >
                      jca@jp-clarinet.org
                    </a>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    jca@jp-clarinet.org からの受信設定を必ずご確認ください
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-gold" />
                <div>
                  <p className="font-medium">ホームページ</p>
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
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">
            コンクール・イベント、入会、その他ご質問など、お気軽にお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
