import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music2, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "会員後援演奏会のお知らせ | 日本クラリネット協会",
  description:
    "協会会員の皆様が主催する演奏会のうち、協会が後援する演奏会のお知らせです。",
};

export default function SupportedConcertsPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <Music2 className="size-8 text-gold" />
            会員後援演奏会のお知らせ
          </h1>
          <p className="mt-2 text-muted-foreground">
            協会会員の皆様が主催する演奏会のうち、協会が後援する演奏会のお知らせです。
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                会員後援演奏会のお知らせは、決まり次第ニュースおよび本ページでお知らせいたします。
                現在、掲載予定の演奏会はありません。
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                後援演奏会の掲載をご希望の会員の皆様は、事務局までお問い合わせください。
              </p>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/membership#members">
              <Button variant="outline">
                <ArrowLeft className="mr-2 size-4" />
                入会案内に戻る
              </Button>
            </Link>
            <Link href="/news">
              <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                ニュースを見る
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
