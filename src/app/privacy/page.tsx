export const metadata = {
  title: "プライバシーポリシー | 日本クラリネット協会",
  description: "一般社団法人日本クラリネット協会のプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            プライバシーポリシー
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            一般社団法人 日本クラリネット協会
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-8 text-muted-foreground">
          <p>
            一般社団法人日本クラリネット協会（以下「当協会」）は、本ウェブサイト上で提供するサービスにおける、
            ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。
          </p>

          <section>
            <h2 className="mb-2 text-lg font-medium text-navy">1. 個人情報の定義</h2>
            <p>
              個人情報とは、氏名、生年月日、住所、電話番号、メールアドレスその他、
              特定の個人を識別することができる情報をいいます。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-navy">2. 個人情報の収集</h2>
            <p>
              当協会は、コンクール・イベントの申込、お問い合わせ等に際し、
              必要な範囲で個人情報を収集することがあります。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-navy">3. 個人情報の利用目的</h2>
            <p>
              収集した個人情報は、申込の受付、連絡、事務処理、統計資料の作成等、
              当協会の事業活動に必要な範囲で利用します。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-navy">4. 個人情報の第三者提供</h2>
            <p>
              当協会は、法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-navy">5. お問い合わせ</h2>
            <p>
              本ポリシーに関するお問い合わせは、
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
