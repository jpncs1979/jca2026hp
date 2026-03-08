"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyRound } from "lucide-react";

export function ResetPasswordButton({
  profileId,
  userId,
  memberName,
}: {
  profileId: string;
  userId: string | null;
  memberName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendEmail = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/members/reset-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      const data = await res.json();
      if (res.ok) {
        setOpen(false);
        alert("パスワード再設定メールを送信しました。会員がメールのリンクから本人で新しいパスワードを設定します。");
      } else {
        setError(data.error ?? "送信に失敗しました");
      }
    } catch {
      setError("送信に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <p className="text-sm text-muted-foreground">
        この会員はログイン用アカウント未紐付のため、パスワード再設定メールは送信できません。
      </p>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-amber-700 border-amber-300 hover:bg-amber-50"
        onClick={() => setOpen(true)}
      >
        <KeyRound className="size-4" />
        パスワード再設定メールを送信
      </Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>パスワード再設定メールを送信</DialogTitle>
          <DialogDescription>
            {memberName} 様の登録メールアドレスに、パスワード再設定用のリンクを送信します。会員本人がメールのリンクを開き、新しいパスワードを設定します。事務局がパスワードを決めることはありません。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {error && (
            <p className="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            キャンセル
          </Button>
          <Button onClick={handleSendEmail} disabled={loading} className="bg-gold text-gold-foreground hover:bg-gold-muted">
            {loading ? "送信中..." : "送信する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
