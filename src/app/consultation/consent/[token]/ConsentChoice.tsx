"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OFFICE_FROM_EMAIL } from "@/lib/email";
import { PublicQACard, type PublicQAItem } from "../../PublishedQAList";

type Ready = {
  kind: "ready";
  category: string;
  publicName: string | null;
  age: string | null;
  publicQuestion: string | null;
  answer: string | null;
  expiresAt: string;
};

export type ConsentInitial =
  | { kind: "not_found" }
  | { kind: "expired" }
  | { kind: "used"; consentStatus: "approved" | "declined" | "other" }
  | { kind: "error" }
  | Ready;

function formatJst(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OfficeContact() {
  return (
    <p className="text-sm text-muted-foreground">
      ご不明な点は事務局までご連絡ください。
      <br />
      一般社団法人日本クラリネット協会 事務局
      <br />
      メール:{" "}
      <a className="text-gold hover:underline" href={`mailto:${OFFICE_FROM_EMAIL}`}>
        {OFFICE_FROM_EMAIL}
      </a>
      <br />
      <Link href="/contact" className="text-gold hover:underline">
        お問い合わせフォーム
      </Link>
    </p>
  );
}

export function ConsentChoice({ token, initial }: { token: string; initial: ConsentInitial }) {
  const [view, setView] = useState<ConsentInitial>(initial);
  const [done, setDone] = useState<"approved" | "declined" | null>(null);
  const [submitting, setSubmitting] = useState<"approve" | "decline" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const choose = async (decision: "approve" | "decline") => {
    setSubmitting(decision);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/consultation/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (data.kind === "expired" || data.kind === "not_found" || data.kind === "used") {
          setView(
            data.kind === "used"
              ? { kind: "used", consentStatus: "other" }
              : { kind: data.kind }
          );
        }
        setErrorMessage(data.error ?? "記録に失敗しました。しばらくしてからお試しください。");
        return;
      }
      setDone(data.result === "approved" ? "approved" : "declined");
    } catch {
      setErrorMessage("記録に失敗しました。しばらくしてからお試しください。");
    } finally {
      setSubmitting(null);
    }
  };

  if (done === "approved") {
    return (
      <div className="space-y-4">
        <p className="font-medium text-navy">掲載を承諾しました。クラリネット相談室のページに載せます。</p>
        <p className="text-sm text-muted-foreground">
          <Link href="/consultation" className="text-gold hover:underline">
            相談室のページを見る
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">掲載をやめたい場合は事務局までご連絡ください。</p>
        <OfficeContact />
      </div>
    );
  }

  if (done === "declined") {
    return (
      <div className="space-y-4">
        <p className="font-medium text-navy">承知しました。HPには掲載しません。</p>
        <OfficeContact />
      </div>
    );
  }

  if (view.kind === "not_found") {
    return (
      <div className="space-y-4">
        <p className="font-medium text-navy">
          このリンクは無効です。期限が切れているか、新しいメールのリンクに置き換わっていることがあります。
        </p>
        <OfficeContact />
      </div>
    );
  }

  if (view.kind === "expired") {
    return (
      <div className="space-y-4">
        <p className="font-medium text-navy">このリンクの期限が切れています。お返事がない場合は掲載しません。</p>
        <OfficeContact />
      </div>
    );
  }

  if (view.kind === "error") {
    return (
      <div className="space-y-4">
        <p className="font-medium text-navy">確認画面を開けませんでした。</p>
        <OfficeContact />
      </div>
    );
  }

  if (view.kind === "used") {
    return (
      <div className="space-y-4">
        {view.consentStatus === "approved" ? (
          <>
            <p className="font-medium text-navy">すでに掲載を承諾済みです。</p>
            <p className="text-sm text-muted-foreground">
              <Link href="/consultation" className="text-gold hover:underline">
                相談室のページを見る
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">掲載をやめたい場合は事務局までご連絡ください。</p>
          </>
        ) : view.consentStatus === "declined" ? (
          <p className="font-medium text-navy">すでに「掲載しない」と回答済みです。HPには掲載しません。</p>
        ) : (
          <p className="font-medium text-navy">このリンクはすでに使えません。</p>
        )}
        <OfficeContact />
      </div>
    );
  }

  const preview: PublicQAItem = {
    id: "preview",
    category: view.category,
    public_name: view.publicName,
    age: view.age,
    public_question: view.publicQuestion,
    answer: view.answer,
    published_at: null,
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          次の内容を、クラリネット相談室のページに掲載してよいか選んでください。このページを開いただけでは、掲載は始まりません。
        </p>
        <p className="text-sm text-muted-foreground">
          このリンクは {formatJst(view.expiresAt)} まで有効です。それまでに返事がない場合は掲載しません。
        </p>
        <p className="text-sm text-muted-foreground">小学生・中学生の方は、おうちの方と一緒に確認してください。</p>
      </div>
      <PublicQACard item={preview} />
      <p className="text-xs text-muted-foreground">掲載日は、承諾した日になります。</p>
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="bg-gold text-gold-foreground hover:bg-gold-muted"
          disabled={submitting !== null}
          onClick={() => choose("approve")}
        >
          {submitting === "approve" ? "送信中…" : "掲載してよい"}
        </Button>
        <Button type="button" variant="outline" disabled={submitting !== null} onClick={() => choose("decline")}>
          {submitting === "decline" ? "送信中…" : "掲載しない"}
        </Button>
      </div>
      <OfficeContact />
    </div>
  );
}
