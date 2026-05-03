"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ReleaseRejoinEmailButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (
      !window.confirm(
        "ログイン用メールをシステム用の退避アドレスに差し替え、ステータスを「期限切れ」にします。紐づくログインアカウントは削除されます。本人は同じメールでウェブ入会をやり直せます。実行しますか？"
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/members/${profileId}/release-rejoin-email`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "処理に失敗しました");
        return;
      }
      router.refresh();
    } catch {
      setError("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button type="button" variant="secondary" disabled={loading} onClick={run}>
        {loading ? "処理中…" : "再入会のためメールを退避（ウェブ入会を許可）"}
      </Button>
    </div>
  );
}
