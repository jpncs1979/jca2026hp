import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Trophy,
  Banknote,
  Music,
  Award,
  Users,
  Info,
  MessageCircle,
  FileText,
  ExternalLink,
  Video,
} from "lucide-react";
import { LANCELOT_2027 } from "@/lib/lancelot-2027";

export const metadata = {
  title: "ジャック・ランスロ国際クラリネットコンクール | 日本クラリネット協会",
  description:
    "2027年8月29日〜9月5日、国立音楽大学・立川RISULUホールにて開催。ジャック・ランスロ氏の音楽精神を継承する国際コンクール。応募期間2027年2月1日〜3月1日必着。",
};

export default function LancelotDetailPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            {LANCELOT_2027.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            【主　催】{LANCELOT_2027.organisers.join("／")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            応募要項　{LANCELOT_2027.guidelineDate}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href={LANCELOT_2027.officialEntryUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold-muted">
                公式サイトで申込む
                <ExternalLink className="ml-2 size-4" />
              </Button>
            </a>
            <a href={LANCELOT_2027.officialSiteUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline">
                コンクール公式サイト
                <ExternalLink className="ml-2 size-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-12">
          {/* コンクールの理念 */}
          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">コンクールの理念</h2>
            <p className="leading-relaxed text-muted-foreground">{LANCELOT_2027.philosophy}</p>
          </section>

          {/* 開催概要 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <MapPin className="size-5" />
              会場・オーケストラ
            </h2>
            <Card>
              <CardContent className="space-y-2 pt-6">
                <p className="font-medium">{LANCELOT_2027.venue.facility}</p>
                <p className="text-sm text-muted-foreground">{LANCELOT_2027.venue.university}</p>
                <p className="text-sm text-muted-foreground">{LANCELOT_2027.venue.hall}</p>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">オーケストラ</p>
                  <p className="font-medium">
                    {LANCELOT_2027.orchestra.name}（指揮：{LANCELOT_2027.orchestra.conductor}）
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 賞 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Trophy className="size-5" />
              賞
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">第1位</p>
                  <p className="text-xl font-bold text-navy">
                    {LANCELOT_2027.prizes.first.toLocaleString()}円
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">第2位</p>
                  <p className="text-xl font-bold text-navy">
                    {LANCELOT_2027.prizes.second.toLocaleString()}円
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">第3位</p>
                  <p className="text-xl font-bold text-navy">
                    {LANCELOT_2027.prizes.third.toLocaleString()}円
                  </p>
                </CardContent>
              </Card>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {LANCELOT_2027.prizes.specialPrizes.map((p) => (
                <li key={p.name}>
                  <span className="font-medium text-foreground">{p.name}</span>
                  <span className="text-muted-foreground">　{p.note}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">{LANCELOT_2027.prizes.note}</p>
          </section>

          {/* 応募期間 */}
          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">応募期間（動画提出期限）</h2>
            <p className="text-foreground">{LANCELOT_2027.applicationPeriod}</p>
          </section>

          {/* スケジュール */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Calendar className="size-5" />
              スケジュール
            </h2>
            <Card>
              <CardContent className="pt-6">
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">動画審査</dt>
                    <dd className="font-medium">{LANCELOT_2027.schedule.videoScreening}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">一次予選</dt>
                    <dd className="font-medium">{LANCELOT_2027.schedule.firstRound}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">二次予選</dt>
                    <dd className="font-medium">{LANCELOT_2027.schedule.secondRound}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">セミファイナル</dt>
                    <dd className="font-medium">{LANCELOT_2027.schedule.semifinal}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">本選</dt>
                    <dd className="font-medium">{LANCELOT_2027.schedule.final}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {LANCELOT_2027.scheduleNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </section>

          {/* 審査員 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Users className="size-5" />
              審査員
            </h2>
            <ul className="space-y-2">
              {LANCELOT_2027.judges.map((j) => (
                <li key={j.name}>
                  {j.name}（{j.affiliation}）
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">〈オブザーバー〉</p>
              <p>{LANCELOT_2027.observers.join("、")}</p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{LANCELOT_2027.judgeNote}</p>
          </section>

          {/* 課題曲 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Music className="size-5" />
              課題曲
            </h2>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">予備予選</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="list-inside list-disc space-y-1">
                  {LANCELOT_2027.repertoire.preScreening.map((piece, i) => (
                    <li key={i}>{piece}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">一次予選</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="list-inside list-disc space-y-1">
                  {LANCELOT_2027.repertoire.firstRound.map((piece, i) => (
                    <li key={i}>{piece}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">二次予選</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p>① {LANCELOT_2027.repertoire.secondRound.required}</p>
                <div>
                  <p className="text-sm text-muted-foreground">② 下記より選択</p>
                  <ul className="list-inside list-disc space-y-1">
                    {LANCELOT_2027.repertoire.secondRound.choice.map((piece, i) => (
                      <li key={i}>{piece}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">セミファイナル</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="list-inside list-disc space-y-1">
                  {LANCELOT_2027.repertoire.semifinal.map((piece, i) => (
                    <li key={i}>{piece}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">本選</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="list-inside list-disc space-y-1">
                  {LANCELOT_2027.repertoire.final.map((piece, i) => (
                    <li key={i}>{piece}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* 参加資格 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Users className="size-5" />
              参加資格
            </h2>
            <p className="text-foreground">{LANCELOT_2027.eligibility.birthDate}</p>
            <p className="text-muted-foreground">{LANCELOT_2027.eligibility.nationality}</p>
          </section>

          {/* 参加料 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Banknote className="size-5" />
              参加料
            </h2>
            <p className="text-xl font-bold text-navy">{LANCELOT_2027.fee.toLocaleString()}円</p>
          </section>

          {/* 申込方法 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <FileText className="size-5" />
              申込方法
            </h2>
            <ul className="space-y-2">
              {LANCELOT_2027.applicationMethod.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <a
              href={LANCELOT_2027.officialEntryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline"
            >
              jlicc.jp/entry/ を開く
              <ExternalLink className="size-4" />
            </a>
          </section>

          {/* 審査用動画について */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Video className="size-5" />
              審査用動画について
            </h2>
            <p className="text-muted-foreground">・{LANCELOT_2027.videoRequirement}</p>
          </section>

          {/* 入賞者披露コンサート・リハーサル */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Award className="size-5" />
              入賞者披露コンサート・リハーサル
            </h2>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">
                  入賞者披露コンサート（{LANCELOT_2027.winnerConcert.venue}）
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
                {LANCELOT_2027.winnerConcert.notes.map((note, i) => (
                  <p key={i}>{note}</p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">リハーサル・公式ピアニスト</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm">
                {LANCELOT_2027.rehearsal.notes.map((note, i) => (
                  <p key={i} className="text-muted-foreground">{note}</p>
                ))}
                <p className="font-medium text-foreground">
                  公式ピアニスト：{LANCELOT_2027.rehearsal.officialPianists.join("／")}
                </p>
                {LANCELOT_2027.rehearsal.pianistNotes.map((note, i) => (
                  <p key={i} className="text-muted-foreground">{note}</p>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* その他 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Info className="size-5" />
              その他
            </h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {LANCELOT_2027.otherNotes.map((note, i) => (
                <li key={i}>・{note}</li>
              ))}
            </ul>
          </section>

          {/* 協賛・共催・後援・助成 */}
          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">協賛・共催・後援・助成</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-foreground">特別協賛</p>
                <p className="text-muted-foreground">{LANCELOT_2027.specialSponsors.join("／")}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">企業協賛</p>
                <p className="text-muted-foreground">{LANCELOT_2027.corporateSponsors.join("／")}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">共催</p>
                <p className="text-muted-foreground">{LANCELOT_2027.coOrganiser}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">協力</p>
                <p className="text-muted-foreground">{LANCELOT_2027.cooperation.join("・")}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">後援</p>
                <p className="text-muted-foreground">{LANCELOT_2027.support.join("／")}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">助成</p>
                <p className="text-muted-foreground">{LANCELOT_2027.grant.join("／")}</p>
              </div>
            </div>
          </section>

          {/* 実行委員会 */}
          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">実行委員会</h2>
            <div className="space-y-2 text-sm">
              <p>特別顧問：{LANCELOT_2027.specialAdvisor}</p>
              <p>顧問：{LANCELOT_2027.advisors.join("／")}</p>
              <p>名誉実行委員長：{LANCELOT_2027.honoraryChair}</p>
              <p>実行委員長：{LANCELOT_2027.committee.chair}</p>
              <p>芸術監督：{LANCELOT_2027.committee.artisticDirector}</p>
              <p>実行委員：{LANCELOT_2027.committee.members.join("／")}</p>
              <p>専門委員：{LANCELOT_2027.committee.specialists.join("、")}</p>
              <p>事務局長：{LANCELOT_2027.committee.secretaryGeneral}</p>
            </div>
          </section>

          {/* お問い合わせ先 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <MessageCircle className="size-5" />
              お問い合わせ先
            </h2>
            <Card>
              <CardContent className="space-y-2 pt-6 text-sm">
                <p className="font-medium text-foreground">{LANCELOT_2027.contact.organisation}</p>
                <p className="text-muted-foreground">{LANCELOT_2027.contact.address}</p>
                <p className="text-muted-foreground">Tel. {LANCELOT_2027.contact.tel}</p>
                <p className="text-muted-foreground">{LANCELOT_2027.contact.email}</p>
                <a
                  href={LANCELOT_2027.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-gold hover:underline"
                >
                  {LANCELOT_2027.contact.website}
                  <ExternalLink className="size-4" />
                </a>
                <p className="text-muted-foreground">{LANCELOT_2027.contact.note}</p>
              </CardContent>
            </Card>
          </section>

          {/* 申込ボタン */}
          <section className="border-t border-border pt-12">
            <a href={LANCELOT_2027.officialEntryUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="w-full bg-gold text-gold-foreground hover:bg-gold-muted sm:w-auto"
              >
                公式サイトで申込む
                <ExternalLink className="ml-2 size-4" />
              </Button>
            </a>
          </section>

          <div className="border-t border-border pt-8">
            <Link href="/events" className="text-sm font-medium text-gold hover:underline">
              ← コンクール・イベント一覧へ戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
