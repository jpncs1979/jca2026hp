import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn, User } from "lucide-react";

export const metadata = {
  title: "会員マイページ | 日本クラリネット協会",
  description: "日本クラリネット協会会員向けマイページ。申込履歴の確認など。",
};

export default function MypagePage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            会員マイページ
          </h1>
          <p className="mt-2 text-muted-foreground">
            会員専用の各種サービスをご利用いただけます
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <LogIn className="size-10 text-gold" />
              <CardTitle>ログイン</CardTitle>
              <CardDescription>
                会員マイページをご利用になるには、ログインが必要です。
                会員番号とパスワードでログインしてください。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                現在、会員認証機能は準備中です。ご利用開始までしばらくお待ちください。
              </p>
              <p className="text-sm text-muted-foreground">
                お問い合わせは
                <Link href="/contact" className="text-gold hover:underline">
                  お問い合わせページ
                </Link>
                よりご連絡ください。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
