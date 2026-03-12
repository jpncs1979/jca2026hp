import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { SetPasswordForm } from "./SetPasswordForm";

export const metadata = {
  title: "入会申し込み完了 | 日本クラリネット協会",
  description: "入会手続きが完了しました。",
};

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function MembershipJoinCompletePage({ searchParams }: Props) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (sessionId) {
    return <SetPasswordForm sessionId={sessionId} />;
  }

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            入会申し込みを受け付けました
          </h1>
          <p className="mt-2 text-muted-foreground">
            お支払いが完了次第、会員登録が有効になります。
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-gold/20 text-gold">
                  <Check className="size-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">ご入会ありがとうございます</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    決済が完了すると、ご登録のメールアドレスへ「入会完了」のご案内をお送りします。
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                決済完了後、このページに再度アクセスいただくか、メールの案内に従ってマイページ用のパスワードを設定してください。パスワード設定後、ログインして会員証の確認や各種サービスをご利用いただけます。
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/membership">
                  <Button variant="outline">入会案内に戻る</Button>
                </Link>
                <Link href="/mypage">
                  <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                    マイページ（ログイン）
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
