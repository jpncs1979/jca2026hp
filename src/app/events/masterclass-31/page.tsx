import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Calendar,
  GraduationCap,
  MapPin,
  Music2,
  Users,
} from "lucide-react";
import { MASTERCLASS_31 } from "@/lib/masterclass-31";

export const metadata = {
  title: `${MASTERCLASS_31.title} | 日本クラリネット協会`,
  description: MASTERCLASS_31.summary,
};

export default function Masterclass31Page() {
  const mc = MASTERCLASS_31;

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <p className="mb-2 text-sm font-medium text-gold">マスタークラス</p>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <GraduationCap className="size-8 shrink-0 text-gold" />
            {mc.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            講師：{mc.instructor.nameJa}（{mc.instructor.title}）
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#apply">
              <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                申込について
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </a>
            <Link href="/events#masterclass">
              <Button variant="outline">マスタークラス一覧</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-14">
          {/* 講師紹介 */}
          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">講師</h2>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <figure className="mx-auto w-full max-w-[220px] shrink-0 sm:mx-0">
                <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                  <Image
                    src={mc.instructor.photo}
                    alt={`${mc.instructor.nameJa}（${mc.instructor.nameEn}）`}
                    width={420}
                    height={630}
                    className="h-auto w-full object-cover"
                    priority
                  />
                </div>
                <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                  {mc.instructor.photoCredit}
                </figcaption>
              </figure>
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-lg font-medium text-navy">
                  {mc.instructor.nameJa}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mc.instructor.nameEn}
                </p>
                <div className="space-y-3 leading-relaxed text-muted-foreground">
                  <p>
                    フェルディナント・シュタイナーは、ザルツブルク・モーツァルテウム管弦楽団の首席クラリネット奏者として活躍し、国際的な室内楽奏者・ソリストとしても高い評価を得ている。
                  </p>
                  <p>
                    ウィーン国立音楽大学を最優秀で卒業し、在学中からウィーン・フィルやウィーン国立歌劇場管弦楽団などで客演した。ベルリン・フィル、ドイツ交響楽団ベルリン、ミュンヘン放送管弦楽団、カメラータ・ザルツブルクなど著名オーケストラに客演首席として出演し、アバド、ハイティンク、ムーティら名指揮者と共演している。
                  </p>
                  <p>
                    ソリストとして欧州各地で演奏するほか、ザルツブルク音楽祭やモーツァルト・ウィーク、ステレンボッシュ国際室内楽祭、金沢モーツァルト音楽祭など多くの国際フェスティバルにも出演。世界各地でマスタークラスを開催、後進の育成にも力を注いでいる。録音も国際的に高く評価されている。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 開催概要 */}
          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">開催概要</h2>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <p className="flex items-start gap-2">
                  <Calendar className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="font-medium text-navy">日時</span>
                    <br />
                    {mc.dateLabel}　{mc.timeLabel}
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {mc.openTime}
                    </span>
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="font-medium text-navy">会場</span>
                    <br />
                    {mc.venue}
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {mc.venueAddress}
                    </span>
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Music2 className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="font-medium text-navy">主催・協力</span>
                    <br />
                    主催：{mc.organiser}
                    <br />
                    協力：{mc.cooperation}
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Users className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="font-medium text-navy">受講・聴講料</span>
                    <br />
                    受講：会員 {mc.lessonFee.member}／一般 {mc.lessonFee.general}
                    （{mc.lessonCapacityNote}）
                    <br />
                    聴講：会員 {mc.auditFee.member}／一般 {mc.auditFee.general}
                  </span>
                </p>
              </CardContent>
            </Card>
          </section>

          {/* 申込 */}
          <section id="apply" className="scroll-mt-24">
            <h2 className="mb-4 text-xl font-medium text-navy">お申し込み</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">受講</CardTitle>
                    <span className="rounded bg-navy/10 px-2 py-1 text-xs font-medium text-navy">
                      受付終了
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {mc.lessonClosedNote}
                    書類選考のうえ受講者を決定し、ご連絡済みです。
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gold/40">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">聴講</CardTitle>
                    <span className="rounded bg-gold/20 px-2 py-1 text-xs font-medium text-gold">
                      受付中
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    聴講は{mc.auditDeadline}です。
                    会員は無料、一般は{mc.auditFee.general}です。
                    ご希望の方はお問い合わせフォームよりご連絡ください。
                  </p>
                  <Link href={mc.contactHref}>
                    <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                      聴講のお申し込み・お問い合わせ
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="border-t border-border pt-8">
            <Link href="/events#masterclass">
              <Button variant="outline">マスタークラス一覧に戻る</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
