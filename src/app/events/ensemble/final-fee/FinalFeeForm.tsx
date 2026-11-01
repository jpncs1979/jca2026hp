"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FinalFeeForm({
  id,
  token,
  unitFee,
  minPerformers,
  maxPerformers,
}: {
  id: string;
  token: string;
  unitFee: number;
  minPerformers: number;
  maxPerformers: number;
}) {
  const [count, setCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const n = Number(count);
  const valid =
    Number.isInteger(n) && n >= minPerformers && n <= maxPerformers;
  const total = valid ? unitFee * n : null;

  async function submit() {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/events/ensemble-2027/final-fee/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, t: token, performer_count: n }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "手続きを始められませんでした。");
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("通信に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium">本選の演奏者数 *</span>
        <Input
          type="number"
          inputMode="numeric"
          min={minPerformers}
          max={maxPerformers}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          placeholder="例: 8"
          className="max-w-[10rem]"
        />
      </label>
      <p className="text-base">
        お支払い額：
        {total == null ? (
          <span className="text-muted-foreground">演奏者数を入力してください</span>
        ) : (
          <strong>
            {unitFee.toLocaleString("ja-JP")}円 × {n}名 ＝ {total.toLocaleString("ja-JP")}円
          </strong>
        )}
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button onClick={submit} disabled={!valid || submitting} className="w-full sm:w-auto">
        {submitting ? "処理中…" : total === 0 ? "参加を確定する（お支払いなし）" : "クレジットカードで支払う"}
      </Button>
    </div>
  );
}
