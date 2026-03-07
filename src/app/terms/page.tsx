export const metadata = {
  title: "利用規約 | 日本クラリネット協会",
  description: "一般社団法人日本クラリネット協会公式サイトの利用規約",
};

export default function TermsPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            利用規約
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            一般社団法人 日本クラリネット協会 公式サイト
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-8 text-muted-foreground">
          <p>
            一般社団法人日本クラリネット協会（以下「当協会」）が運営する本ウェブサイト（以下「本サイト」）の利用にあたり、
            以下の利用規約に同意のうえご利用ください。
          </p>

          <section>
            <h2 className="mb-2 text-lg font-medium text-navy">第1条（適用）</h2>
            <p>
              本規約は、本サイトの利用に関する条件を定めるものです。
              利用者は本規約に同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-navy">第2条（禁止事項）</h2>
            <p>
              利用者は、本サイトの利用にあたり、法令または公序良俗に反する行為、
              当協会または第三者の権利を侵害する行為、その他当協会が不適切と判断する行為を行ってはなりません。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-navy">第3条（著作権）</h2>
            <p>
              本サイトに掲載するコンテンツの著作権は、当協会または正当な権利を有する者に帰属します。
              無断転載・複製を禁じます。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-navy">第4条（変更）</h2>
            <p>
              当協会は、必要に応じて本規約を変更することがあります。
              変更後の規約は、本サイト上に掲載した時点で効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-navy">お問い合わせ</h2>
            <p>
              本規約に関するお問い合わせは、
              <a href="/contact" className="text-gold hover:underline">
                お問い合わせページ
              </a>
              よりご連絡ください。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
