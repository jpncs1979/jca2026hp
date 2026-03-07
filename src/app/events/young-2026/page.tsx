import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Calendar,
  MapPin,
  Trophy,
  Banknote,
  Music,
  Award,
  Users,
  Megaphone,
  Info,
  Phone,
  FileText,
} from "lucide-react";
import { YOUNG_2026 } from "@/lib/young-2026";

export const metadata = {
  title: "第15回ヤング・クラリネッティストコンクール | 日本クラリネット協会",
  description:
    "2026年8月25日〜27日、パルテノン多摩小ホールにて開催。ジュニアA（13歳以下）、ジュニアB（17歳以下）、ヤング・アーティスト（20歳以下）。2026年4月1日時点の年齢でご応募ください。",
};

export default function Young2026DetailPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            {YOUNG_2026.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            【主 催】{YOUNG_2026.organiser}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            【協 賛】{YOUNG_2026.sponsors.join("／")}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/events/young-2026/apply">
              <Button
                size="lg"
                className="bg-gold text-gold-foreground hover:bg-gold-muted"
              >
                参加申込
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link href="/archive?competition=young">
              <Button size="lg" variant="outline">
                過去の受賞者
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-12">
          {/* 目的 */}
          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">目的</h2>
            <p className="text-muted-foreground">{YOUNG_2026.purpose}</p>
          </section>

          {/* 開催期日・会場 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Calendar className="size-5" />
              開催期日・会場
            </h2>
            <Card>
              <CardContent className="pt-6">
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">ジュニア A 部門 及び B 部門</dt>
                    <dd className="font-medium">{YOUNG_2026.schedule.ジュニアAおよびB部門}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">ヤング・アーティスト部門 第一次予選</dt>
                    <dd className="font-medium">{YOUNG_2026.schedule.ヤング第一次予選}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">第二次予選</dt>
                    <dd className="font-medium">{YOUNG_2026.schedule.ヤング第二次予選}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">本選（全部門）</dt>
                    <dd className="font-medium">{YOUNG_2026.schedule.本選全部門}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">会場（予選、本選）</dt>
                    <dd className="font-medium">{YOUNG_2026.venue.name}（{YOUNG_2026.venue.address}）</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </section>

          {/* 参加資格 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Users className="size-5" />
              参加資格
            </h2>
            <div className="space-y-2">
              {YOUNG_2026.eligibility.categories.map((cat) => (
                <p key={cat.id} className="text-foreground">
                  {cat.label} ................................ {cat.condition}
                </p>
              ))}
            </div>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {YOUNG_2026.eligibility.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </section>

          {/* 参加料 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Banknote className="size-5" />
              参加料
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 text-left font-medium">部門</th>
                    <th className="py-3 text-right font-medium">会員</th>
                    <th className="py-3 text-right font-medium">非会員</th>
                  </tr>
                </thead>
                <tbody>
                  {YOUNG_2026.eligibility.categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-border">
                      <td className="py-3">{cat.label}</td>
                      <td className="py-3 text-right">
                        {YOUNG_2026.fees[cat.id].会員.toLocaleString()}円
                      </td>
                      <td className="py-3 text-right">
                        {YOUNG_2026.fees[cat.id].非会員.toLocaleString()}円
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {YOUNG_2026.feeNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </section>

          {/* 参加料支払い方法 */}
          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">参加料支払い方法</h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {YOUNG_2026.paymentMethod.postal.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  <p>郵便振替番号：{YOUNG_2026.paymentMethod.postal.郵便振替番号}</p>
                  <p>口座名：{YOUNG_2026.paymentMethod.postal.口座名}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {YOUNG_2026.paymentMethod.postal.note}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {YOUNG_2026.paymentMethod.bank.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  <p>ゆうちょ銀行 {YOUNG_2026.paymentMethod.bank.店名} {YOUNG_2026.paymentMethod.bank.種目}{YOUNG_2026.paymentMethod.bank.口座番号} {YOUNG_2026.paymentMethod.bank.口座名}</p>
                  <p className="mt-2 text-sm font-medium text-gold">
                    {YOUNG_2026.paymentMethod.bank.note}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 申し込み受付期間・申し込み先 */}
          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">申し込み受付期間</h2>
            <p className="text-foreground">{YOUNG_2026.applicationPeriod}</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground">申し込み先</p>
                <p className="font-medium">{YOUNG_2026.organiser}ホームページ</p>
                <a
                  href={YOUNG_2026.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  {YOUNG_2026.applicationUrl}
                </a>
              </div>
            </div>
          </section>

          {/* 審査員 */}
          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">審査員（五十音順）</h2>
            <ul className="space-y-2">
              {YOUNG_2026.judges.map((j) => (
                <li key={j.name}>
                  {j.name}（{j.affiliation}）
                </li>
              ))}
            </ul>
          </section>

          {/* 課題曲 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Music className="size-5" />
              課題曲
            </h2>

            {/* ジュニアA */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>ジュニア A 部門（{YOUNG_2026.eligibility.categories[0].condition}）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">【予選】{YOUNG_2026.pieces.ジュニアA.予選.type}</p>
                  <p>{YOUNG_2026.pieces.ジュニアA.予選.description} {YOUNG_2026.pieces.ジュニアA.予選.note}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">【本選】{YOUNG_2026.pieces.ジュニアA.本選.type}</p>
                  <p>{YOUNG_2026.pieces.ジュニアA.本選.description}</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {YOUNG_2026.pieces.ジュニアA.本選.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* ジュニアB */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>ジュニア B 部門（{YOUNG_2026.eligibility.categories[1].condition}）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">【予選】{YOUNG_2026.pieces.ジュニアB.予選.type}</p>
                  <p>{YOUNG_2026.pieces.ジュニアB.予選.description} {YOUNG_2026.pieces.ジュニアB.予選.note}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">【本選】{YOUNG_2026.pieces.ジュニアB.本選.type}</p>
                  <p>{YOUNG_2026.pieces.ジュニアB.本選.description}</p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>A.Messager / Solo de concours</li>
                    <li>H.Rabaud / Solo de concours</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* ヤング */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>ヤング・アーティスト部門（{YOUNG_2026.eligibility.categories[2].condition}）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">【第一次予選】{YOUNG_2026.pieces.ヤング.第一次予選.type}</p>
                  <p>{YOUNG_2026.pieces.ヤング.第一次予選.description} {YOUNG_2026.pieces.ヤング.第一次予選.note}</p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>E.Yadzinski / à Paganini</li>
                    <li>J.Rivier / Les trois《S》</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">【第二次予選】{YOUNG_2026.pieces.ヤング.第二次予選.type}</p>
                  <p>{YOUNG_2026.pieces.ヤング.第二次予選.description}</p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>J.Rueff / Concertino</li>
                    <li>R.Gallois Montbrun / Concertstück</li>
                    <li>P.Revel / Fantaisie</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">【本選】{YOUNG_2026.pieces.ヤング.本選.type}</p>
                  <p>{YOUNG_2026.pieces.ヤング.本選.description}</p>
                  <p>{YOUNG_2026.pieces.ヤング.本選.piece}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">【注意事項】</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {YOUNG_2026.pieceNotes.map((note, i) => (
                  <p key={i} className="text-sm">{note}</p>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* 表彰 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Award className="size-5" />
              表彰
            </h2>
            <ul className="space-y-2">
              {YOUNG_2026.awards.map((award, i) => (
                <li key={i}>{award}</li>
              ))}
            </ul>
          </section>

          {/* 伴奏者 */}
          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">伴奏者</h2>
            <ul className="space-y-2">
              {YOUNG_2026.accompanist.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 発表 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Megaphone className="size-5" />
              発表
            </h2>
            <ul className="space-y-2">
              {YOUNG_2026.announcement.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 参加上の注意 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Info className="size-5" />
              参加上の注意
            </h2>
            <ul className="space-y-2">
              {YOUNG_2026.participationNotes.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 審査 */}
          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">審査</h2>
            <ul className="space-y-2">
              {YOUNG_2026.review.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 申し込み方法 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <FileText className="size-5" />
              申し込み方法
            </h2>
            <ul className="space-y-2">
              {YOUNG_2026.applicationMethod.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* お問い合わせ先 */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Phone className="size-5" />
              お問い合わせ先
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="font-medium">{YOUNG_2026.contact.organisation}</p>
                <p className="mt-2">{YOUNG_2026.contact.address}</p>
                <p className="mt-2">TEL：{YOUNG_2026.contact.tel} FAX：{YOUNG_2026.contact.fax}</p>
                <p className="mt-2">
                  <a href={`https://${YOUNG_2026.contact.url}`} className="text-gold hover:underline">
                    {YOUNG_2026.contact.url}
                  </a>
                  {" "}メール {YOUNG_2026.contact.email}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* 申込ボタン */}
          <section className="border-t border-border pt-12">
            <Link href="/events/young-2026/apply">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gold text-gold-foreground hover:bg-gold-muted"
              >
                参加申込フォームへ
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
