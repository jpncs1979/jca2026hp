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
import { Loader2, BadgeCheck } from "lucide-react";

type Props = {
  profileId: string;
  memberName: string;
};

export function MemberApproveButton({ profileId, memberName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function handleApprove() {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/members/${profileId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        expiry_date?: string;
        fiscal_year_label?: string;
      };
      if (!res.ok) {
        alert(data.error ?? "承認に失敗しました");
        return;
      }
      alert(
        `${memberName} さんを有効会員にしました。` +
          (data.expiry_date
            ? `\n会員資格の末日: ${data.expiry_date}` +
              (data.fiscal_year_label ? `（${data.fiscal_year_label}）` : "")
            : "")
      );
      setOpen(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("承認に失敗しました");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        className="bg-gold text-gold-foreground hover:bg-gold-muted"
        onClick={() => setOpen(true)}
      >
        <BadgeCheck className="size-4" />
        承認
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>会員を承認</DialogTitle>
            <DialogDescription className="text-left text-sm">
              <strong>{memberName}</strong> さんを有効会員（active）にします。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={processing}>
              キャンセル
            </Button>
            <Button
              className="bg-gold text-gold-foreground hover:bg-gold-muted"
              onClick={() => void handleApprove()}
              disabled={processing}
            >
              {processing ? <Loader2 className="size-4 animate-spin" /> : null}
              承認する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
