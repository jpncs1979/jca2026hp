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
  Trophy,
  Banknote,
  Music2,
  Award,
  Users,
  Megaphone,
  Info,
  MessageCircle,
  FileText,
} from "lucide-react";
import { ENSEMBLE_2027 } from "@/lib/ensemble-2027";
import { FESTIVAL_39_HIROSHIMA_OFFICIAL_URL } from "@/lib/festival-2027-hiroshima";

export const metadata = {
  title: "クラリネット・アンサンブルコンクール | 日本クラリネット協会",
  description:
    "2027年 第19回 クラリネット・アンサンブルコンクール参加要項。予選動画審査・本選公開審査の詳細をご案内します。",
};

export default function EnsemblePage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            {ENSEMBLE_2027.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            【主 催】{ENSEMBLE_2027.organiser}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            【協 賛】{ENSEMBLE_2027.sponsors.join("／")}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/events/ensemble/apply">
              <Button
                size="lg"
                className="bg-gold text-gold-foreground hover:bg-gold-muted"
              >
                参加申込
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link href="/archive?competition=ensemble">
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
          <section>
            <Card className="border-gold/40 bg-gold/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-navy">
                  <Megaphone className="size-5 text-gold" />
                  {ENSEMBLE_2027.festivalNotice.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-foreground">
                {ENSEMBLE_2027.festivalNotice.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <p>
                  <a
                    href={FESTIVAL_39_HIROSHIMA_OFFICIAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gold hover:underline"
                  >
                    第39回日本クラリネットフェスティバル in 東広島 特設ページ
                  </a>
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {ENSEMBLE_2027.festivalNotice.notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">目的</h2>
            <p className="text-muted-foreground">{ENSEMBLE_2027.purpose}</p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">特色</h2>
            <p className="text-muted-foreground">{ENSEMBLE_2027.feature}</p>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Calendar className="size-5" />
              開催期日・会場
            </h2>
            <Card>
              <CardContent className="pt-6">
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">予選</dt>
                    <dd className="font-medium">{ENSEMBLE_2027.schedule.preliminary}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">本選</dt>
                    <dd className="font-medium">
                      {ENSEMBLE_2027.schedule.final}　{ENSEMBLE_2027.schedule.finalVenue}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Users className="size-5" />
              部門・参加資格
            </h2>
            <ul className="space-y-2">
              {ENSEMBLE_2027.departmentNotes.map((note, i) => {
                const isNumberedDept = /^[①②③④]/.test(note);
                if (!isNumberedDept) {
                  return (
                    <li key={i} className="text-sm text-muted-foreground">
                      {note}
                    </li>
                  );
                }
                const colon = note.indexOf("：");
                const head = colon >= 0 ? note.slice(0, colon) : note;
                const tail = colon >= 0 ? note.slice(colon) : "";
                return (
                  <li key={i}>
                    <span className="font-bold">{head}</span>
                    {tail}
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Music2 className="size-5" />
              演奏曲
            </h2>
            <ul className="space-y-2">
              {ENSEMBLE_2027.categories.map((cat) => (
                <li key={cat.id}>
                  {cat.label} … {cat.pieceLimit}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              ※ 予選と本選が同じ曲でも構いません。
            </p>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Banknote className="size-5" />
              審査料・参加料
            </h2>
            <ul className="mb-8 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {ENSEMBLE_2027.feeOverview.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <h3 className="mb-4 text-lg font-medium text-navy">
              動画審査料（予選・1団体につき）
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              申込時にクレジットカードでお支払いください。
            </p>
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
                  {ENSEMBLE_2027.categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-border">
                      <td className="py-3">{cat.label}</td>
                      <td className="py-3 text-right">
                        {ENSEMBLE_2027.fees[cat.id].会員.toLocaleString()}円
                      </td>
                      <td className="py-3 text-right">
                        {ENSEMBLE_2027.fees[cat.id].非会員.toLocaleString()}円
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mb-4 mt-10 text-lg font-medium text-navy">
              参加料（本選・通過団体のみ・演奏者1人につき）
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              予選通過後、事務局からご案内する期日までにお支払いください。申込時の決済には含まれません。
            </p>
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
                  {ENSEMBLE_2027.categories.map((cat) => {
                    const f = ENSEMBLE_2027.finalParticipationFees[cat.id];
                    const fmt = (n: number) =>
                      n === 0 ? "無料" : `${n.toLocaleString()}円`;
                    return (
                      <tr key={cat.id} className="border-b border-border">
                        <td className="py-3">{cat.label}</td>
                        <td className="py-3 text-right">{fmt(f.会員)}</td>
                        <td className="py-3 text-right">{fmt(f.非会員)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="mt-6 space-y-1 text-sm text-muted-foreground">
              {ENSEMBLE_2027.feeNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">
              動画審査料のお支払い方法（申込時）
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {ENSEMBLE_2027.paymentMethod}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">申し込み受付期間</h2>
            <p className="text-foreground">
              お申し込み（Web申込・審査料の入金確認）：{ENSEMBLE_2027.applicationPeriod}
            </p>
            <p className="mt-2 text-foreground">
              予選動画の提出：{ENSEMBLE_2027.videoSubmissionDeadline}まで（申込とは別日程）
            </p>
          </section>

          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">審査員（五十音順）</h2>
            <ul className="space-y-2">
              {ENSEMBLE_2027.judges.map((j) => (
                <li key={j.name}>
                  {j.name}
                  {"affiliation" in j && j.affiliation ? `（${j.affiliation}）` : ""}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-6 text-xl font-medium text-navy">審査</h2>
            <ul className="space-y-2">
              {ENSEMBLE_2027.review.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Info className="size-5" />
              参加上の注意
            </h2>
            <ul className="space-y-2">
              {ENSEMBLE_2027.participationNotes.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <FileText className="size-5" />
              申し込み方法
            </h2>
            <ul className="space-y-2">
              {ENSEMBLE_2027.applicationMethod.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Megaphone className="size-5" />
              発表
            </h2>
            <ul className="space-y-2">
              {ENSEMBLE_2027.announcement.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Award className="size-5" />
              表彰
            </h2>
            <ul className="space-y-2">
              {ENSEMBLE_2027.awards.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">受賞者演奏会</h2>
            <p className="text-muted-foreground">{ENSEMBLE_2027.winnerRecital}</p>
            <p className="mt-2 text-sm">
              <a
                href={FESTIVAL_39_HIROSHIMA_OFFICIAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                第39回日本クラリネットフェスティバル in 東広島 公式案内サイト
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <MessageCircle className="size-5" />
              お問い合わせ先
            </h2>
            <Card>
              <CardContent className="space-y-2 pt-6 text-sm">
                <p>{ENSEMBLE_2027.contact.address}</p>
                <p className="font-medium">{ENSEMBLE_2027.contact.organisation}</p>
                <p>
                  Tel：{ENSEMBLE_2027.contact.tel}　Fax：{ENSEMBLE_2027.contact.fax}
                </p>
                <p>
                  メール：
                  <a
                    href={`mailto:${ENSEMBLE_2027.contact.email}`}
                    className="text-gold hover:underline"
                  >
                    {ENSEMBLE_2027.contact.email}
                  </a>
                </p>
                <Link href="/contact" className="inline-flex text-gold hover:underline">
                  お問い合わせフォームへ
                </Link>
              </CardContent>
            </Card>
          </section>

          <section className="border-t border-border pt-12">
            <Link href="/events/ensemble/apply">
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
