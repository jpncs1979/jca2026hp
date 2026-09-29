import { BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "みんなでステップアップ | 日本クラリネット協会",
  description:
    "子どもゆめ基金の助成で制作した吹奏楽教本と解説動画。クラリネット、トランペット、ホルンのPDFとYouTubeを公開しています。",
};

const TEXTBOOKS = [
  {
    title: "クラリネット教本",
    credit: "執筆　中村克己",
    pdf: "/StepUp_Clarinet.pdf",
    video: "https://www.youtube.com/watch?v=6nzhnJ6aZUM",
  },
  {
    title: "トランペット教本",
    credit: "執筆　栃本浩規",
    pdf: "/StepUp_Trumpet.pdf",
    video: "https://www.youtube.com/watch?v=LZzO_-wzL70",
  },
  {
    title: "ホルン教本",
    credit: "執筆　日髙剛",
    pdf: "/StepUp_Horn_V4b.pdf",
    video: "https://www.youtube.com/watch?v=jlo2w1FddfA",
  },
] as const;

const WARMUP = {
  title: "準備体操",
  credit: "考案・指導　中村純子",
  video: "https://www.youtube.com/watch?v=Tr7FpywSWv8",
} as const;

export default function LearnPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <p className="mb-2 text-sm font-medium text-gold">教材</p>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <BookOpen className="size-8 shrink-0 text-gold" />
            みんなでステップアップ
          </h1>
          <p className="mt-2 text-muted-foreground">楽器別吹奏楽教本</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="space-y-4 leading-relaxed text-muted-foreground">
            <p>
              日本クラリネット協会は、国立青少年教育振興機構「子どもゆめ基金」の助成を受けて、吹奏楽教本を制作しました。東京藝術大学音楽学部の先生方による執筆・監修のもと、初級から上級まで幅広く使える教本と映像の教材です。
            </p>
            <p>
              身近に指導者がいなくても、映像を見ながら独習できます。クラリネット、トランペット、ホルンの3種類です。
            </p>
          </div>

          <div className="space-y-6">
            {TEXTBOOKS.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle className="text-xl text-navy">{item.title}</CardTitle>
                  <CardDescription>{item.credit}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <a href={item.pdf} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                        教本（PDF）
                        <ExternalLink className="ml-2 size-4" />
                      </Button>
                    </a>
                    <a href={item.video} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">
                        動画（YouTube）
                        <ExternalLink className="ml-2 size-4" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-navy">{WARMUP.title}</CardTitle>
                <CardDescription>{WARMUP.credit}</CardDescription>
              </CardHeader>
              <CardContent>
                <a href={WARMUP.video} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    動画（YouTube）
                    <ExternalLink className="ml-2 size-4" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
