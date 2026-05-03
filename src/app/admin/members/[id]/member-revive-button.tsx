"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, UserRoundCheck } from "lucide-react";

type Props = {
  profileId: string;
  memberName: string;
  /** 復活後の会員資格の末日（初期値） */
  defaultExpiryDate: string;
};

export function MemberReviveButton({ profileId, memberName, defaultExpiryDate }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate);
  const [sendLoginEmail, setSendLoginEmail] = useState(true);
  const [processing, setProcessing] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setExpiryDate(defaultExpiryDate);
  };

  async function handleRevive() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate.trim())) {
      alert("有効期限は YYYY-MM-DD で入力してください。");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/members/${profileId}/revive`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiry_date: expiryDate.trim(),
          send_login_email: sendLoginEmail,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        mail_sent?: boolean;
        mail_warning?: string | null;
      };
      if (!res.ok) {
        alert(data.error ?? "復活に失敗しました");
        return;
      }
      let msg = "会員を有効（active）にし、有効期限を更新しました。";
      if (sendLoginEmail) {
        if (data.mail_sent) msg += "\n\nパスワード設定用のメールを送信しました。";
        else if (data.mail_warning)
          msg += `\n\nメール: ${data.mail_warning}\n（復活自体は完了しています。必要に応じ「パスワード再設定メール」から再送してください。）`;
      }
      alert(msg);
      setOpen(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("復活に失敗しました");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        className="bg-emerald-700 text-white hover:bg-emerald-800"
        onClick={() => setOpen(true)}
      >
        <UserRoundCheck className="size-4" />
        退会者を復活（有効化）
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>退会者・期限切れの復活</DialogTitle>
            <DialogDescription className="space-y-2 text-left text-sm">
              <span>
                <strong>{memberName}</strong> さんを<strong>有効会員（ステータス active）</strong>
                に戻します。強制退会の場合は、強制退会の記録（日時・理由・メール退避記録）をクリアします。
              </span>
              <span className="block text-muted-foreground">
                ログイン用アカウントが無い場合は、同じメールアドレスで Auth
                ユーザーを紐付けます。チェックを入れた場合は、パスワード設定用リンクを会員のメールに送ります。
              </span>
              <span className="block text-muted-foreground">
                メールを送らない場合でも復活できます。そのときは復活後、この会員詳細の「パスワード再設定メール」から本人にパスワード設定を依頼してください。
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="revive-expiry">復活後の会員資格の末日</Label>
              <Input
                id="revive-expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="revive-send-mail"
                checked={sendLoginEmail}
                onChange={(e) => setSendLoginEmail(e.target.checked)}
              />
              <Label htmlFor="revive-send-mail" className="cursor-pointer text-sm font-normal">
                パスワード設定用メールを送る（推奨）
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={processing}>
              キャンセル
            </Button>
            <Button
              className="bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={() => void handleRevive()}
              disabled={processing}
            >
              {processing ? <Loader2 className="size-4 animate-spin" /> : null}
              復活する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
