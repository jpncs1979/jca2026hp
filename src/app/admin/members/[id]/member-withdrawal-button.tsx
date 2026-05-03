"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, UserX } from "lucide-react";

type Props = { profileId: string; memberName: string };

/** 会員資格の喪失のみ。プロフィール・会員履歴・入金記録はデータベースに残します。 */
export function MemberWithdrawalButton({ profileId, memberName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function handleWithdraw() {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/members/${profileId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "処理に失敗しました");
        return;
      }
      setOpen(false);
      router.push("/admin/members");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("処理に失敗しました");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <UserX className="size-4" />
        退会（資格喪失）
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>会員資格を喪失させますか？</DialogTitle>
            <DialogDescription className="space-y-2 text-left">
              <span>
                <strong>{memberName}</strong> さんを<strong>有効会員ではなくします</strong>
                （ステータスを「期限切れ」にし、ログイン用アカウントがあれば削除します）。
              </span>
              <span className="block text-muted-foreground">
                氏名・連絡先・会員番号・過去の会員契約・入金記録などのデータは<strong>削除されず残ります</strong>。Stripe
                の顧客IDはクリアし、以降の自動決済の対象外にします。
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={processing}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleWithdraw} disabled={processing}>
              {processing ? <Loader2 className="size-4 animate-spin" /> : null}
              退会処理する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
