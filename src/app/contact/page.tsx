import { ContactForm } from "./ContactForm";

export const metadata = {
  title: "お問い合わせ | 日本クラリネット協会",
  description:
    "一般社団法人日本クラリネット協会へのお問い合わせは、フォームより承っております。",
};

export default function ContactPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">お問い合わせ</h1>
          <p className="mt-2 text-muted-foreground">
            コンクール・イベント、入会、その他ご質問は、下記フォームよりお送りください。
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-2xl space-y-6">
          <ContactForm />
          <p className="text-sm text-muted-foreground">
            返信メールの受信設定（迷惑メールフォルダの確認など）をあらかじめご確認ください。
          </p>
        </div>
      </div>
    </div>
  );
}
