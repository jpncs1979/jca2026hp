"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PublicQACard } from "@/app/consultation/PublishedQAList";
import { MessageCircle, ArrowLeft, ExternalLink } from "lucide-react";

type Question = {
  id: string;
  name: string;
  email: string;
  nickname: string | null;
  age: string | null;
  category: string;
  body: string | null;
  status: string;
  answer: string | null;
  published_at: string | null;
  created_at: string;
  publish_wanted: boolean;
  public_name: string | null;
  public_question: string | null;
  consent_status: string;
  consent_requested_at: string | null;
  consent_expires_at: string | null;
  consented_at: string | null;
  answer_sent_at: string | null;
};

type Draft = {
  publicName: string;
  publicQuestion: string;
  answer: string;
};

type Filter = "all" | "pending" | "awaiting_consent" | "published" | "declined";
type Action = "save_draft" | "send" | "resend" | "unpublish";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "pending", label: "未回答" },
  { id: "awaiting_consent", label: "承諾待ち" },
  { id: "published", label: "掲載中" },
  { id: "declined", label: "掲載しない" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "未回答",
  answered: "下書き",
  sent: "送付済み（HPなし）",
  awaiting_consent: "承諾待ち",
  published: "掲載中",
  declined: "掲載しない",
  unpublished: "掲載取下げ",
};

const CONSENT_LABEL: Record<string, string> = {
  not_requested: "まだ依頼していない",
  requested: "承諾待ち",
  approved: "承諾済み",
  declined: "辞退",
};

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

function draftFrom(q: Question): Draft {
  return {
    publicName: q.public_name ?? "",
    publicQuestion: q.public_question ?? "",
    answer: q.answer ?? "",
  };
}

function norm(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function fieldsChanged(q: Question, draft: Draft): boolean {
  return (
    norm(q.public_name) !== norm(draft.publicName) ||
    norm(q.public_question) !== norm(draft.publicQuestion) ||
    norm(q.answer) !== norm(draft.answer)
  );
}

function statusClass(status: string): string {
  if (status === "published") return "bg-navy/10 text-navy";
  if (status === "awaiting_consent") return "bg-gold/20 text-gold";
  return "bg-muted text-muted-foreground";
}

export function AdminConsultationClient() {
  const [list, setList] = useState<Question[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [saving, setSaving] = useState(false);
  const [cardError, setCardError] = useState<Record<string, string | null>>({});
  const [pendingConfirm, setPendingConfirm] = useState<{
    id: string;
    action: Action;
    message: string;
  } | null>(null);
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");
  const openedFromLink = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/consultation");
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !Array.isArray(data)) {
          setLoadError(data?.error ?? "読み込めませんでした。");
          setList([]);
          return;
        }
        setList(data);
        setDrafts(Object.fromEntries(data.map((q: Question) => [q.id, draftFrom(q)])));
      } catch {
        if (!cancelled) setLoadError("読み込めませんでした。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (openedFromLink.current || loading || !focusId) return;
    if (!list.some((item) => item.id === focusId)) return;
    openedFromLink.current = true;
    requestAnimationFrame(() => {
      document.getElementById(`consultation-${focusId}`)?.scrollIntoView({ block: "center" });
    });
  }, [focusId, list, loading]);

  const filtered = list.filter((q) => filter === "all" || q.status === filter);

  const updateDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { publicName: "", publicQuestion: "", answer: "" }), ...patch } }));
  };

  const applyQuestion = (next: Question) => {
    setList((prev) => prev.map((q) => (q.id === next.id ? next : q)));
    setDrafts((prev) => ({ ...prev, [next.id]: draftFrom(next) }));
  };

  const runAction = async (q: Question, action: Action) => {
    const draft = drafts[q.id] ?? draftFrom(q);
    setSaving(true);
    setPendingConfirm(null);
    setCardError((prev) => ({ ...prev, [q.id]: null }));
    try {
      const res = await fetch(`/api/admin/consultation/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          publicName: draft.publicName,
          publicQuestion: draft.publicQuestion,
          answer: draft.answer,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCardError((prev) => ({ ...prev, [q.id]: data.error ?? "保存に失敗しました。" }));
        return;
      }
      if (data.question) applyQuestion(data.question as Question);
    } catch {
      setCardError((prev) => ({ ...prev, [q.id]: "保存に失敗しました。" }));
    } finally {
      setSaving(false);
    }
  };

  const ask = (q: Question, action: Action) => {
    const draft = drafts[q.id] ?? draftFrom(q);
    if (action === "save_draft") {
      const changed = fieldsChanged(q, draft);
      if (changed && (q.status === "published" || q.status === "awaiting_consent")) {
        setPendingConfirm({
          id: q.id,
          action,
          message:
            q.status === "published"
              ? "文面を変えると掲載を外し、承諾メールを送り直します。本当に送りますか"
              : "文面を変えたので、いまの承諾リンクを無効にしてメールを送り直します。本当に送りますか",
        });
        return;
      }
      void runAction(q, action);
      return;
    }
    if (action === "send") {
      const republish = q.status === "published" && q.publish_wanted;
      setPendingConfirm({
        id: q.id,
        action,
        message: republish
          ? "本当に送りますか。いったん掲載を外し、掲載確認のメールを送ります。"
          : q.publish_wanted
            ? "本当に送りますか。掲載希望ありのため、回答と掲載確認のリンクを送ります。"
            : "本当に送りますか。掲載希望なしのため、回答だけを送ります。HPには掲載しません。",
      });
      return;
    }
    if (action === "resend") {
      setPendingConfirm({
        id: q.id,
        action,
        message: "承諾メールを送り直します。前のリンクは使えなくなります。本当に送りますか",
      });
    }
  };

  const removeQuestion = async (id: string) => {
    if (!window.confirm("この質問と回答を削除します。元に戻せません。")) return;
    setSaving(true);
    setCardError((prev) => ({ ...prev, [id]: null }));
    try {
      const res = await fetch(`/api/admin/consultation/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCardError((prev) => ({ ...prev, [id]: data.error ?? "削除に失敗しました。" }));
        return;
      }
      setList((prev) => prev.filter((q) => q.id !== id));
    } catch {
      setCardError((prev) => ({ ...prev, [id]: "削除に失敗しました。" }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
          <MessageCircle className="size-6 text-gold" />
          クラリネット相談室 管理
        </h1>
        <Link
          href="/consultation"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-navy"
        >
          相談室ページを開く
          <ExternalLink className="size-4" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === item.id ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        回答を送ると、本人にメールが届きます。掲載希望がある場合は、本人が「掲載してよい」を選んだものだけHPに出ます。承諾後にハンドルネーム・質問文・回答を書き換えると、いったん掲載を外し、もう一度承諾メールを送ります。誤字の修正も同じです。本人が見ていない文面は掲載しません。
      </p>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">該当する質問はありません。</CardContent>
          </Card>
        ) : (
          filtered.map((q) => {
            const draft = drafts[q.id] ?? draftFrom(q);
            const changed = fieldsChanged(q, draft);
            const live = q.status === "published" && !changed;
            const confirm = pendingConfirm?.id === q.id ? pendingConfirm : null;
            return (
              <Card
                key={q.id}
                id={`consultation-${q.id}`}
                className={`scroll-mt-24 ${focusId === q.id ? "ring-2 ring-gold/50" : ""}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                      {q.category}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(q.status)}`}>
                        {STATUS_LABEL[q.status] ?? q.status}
                      </span>
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">{formatJst(q.created_at)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <dl className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>本名: {q.name}</div>
                    <div>メール: {q.email}</div>
                    <div>掲載希望: {q.publish_wanted ? "あり" : "なし"}</div>
                    <div>承諾状況: {CONSENT_LABEL[q.consent_status] ?? q.consent_status}</div>
                    {q.age ? <div>年齢: {q.age}</div> : null}
                    {q.consent_expires_at && q.status === "awaiting_consent" ? (
                      <div>承諾期限: {formatJst(q.consent_expires_at)}</div>
                    ) : null}
                    {q.answer_sent_at ? <div>回答送信: {formatJst(q.answer_sent_at)}</div> : null}
                  </dl>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      質問の原文（本人が書いた内容。書き換えません）
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      受付時のハンドルネーム: {q.nickname || "（なし）"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{q.body || "（質問の詳細はありません）"}</p>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">公開用ハンドルネーム</span>
                    <Input
                      value={draft.publicName}
                      maxLength={80}
                      onChange={(e) => updateDraft(q.id, { publicName: e.target.value })}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">HPに載せる質問文</span>
                    <Textarea
                      value={draft.publicQuestion}
                      rows={4}
                      onChange={(e) => updateDraft(q.id, { publicQuestion: e.target.value })}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">回答</span>
                    <Textarea
                      value={draft.answer}
                      rows={6}
                      onChange={(e) => updateDraft(q.id, { answer: e.target.value })}
                    />
                  </label>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">HPにはこう載ります</p>
                    <PublicQACard
                      item={{
                        id: `${q.id}-preview`,
                        category: q.category,
                        public_name: draft.publicName || null,
                        age: q.age,
                        public_question: draft.publicQuestion || null,
                        answer: draft.answer || null,
                        published_at: live ? q.published_at : null,
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {live
                        ? "いまHPに出ている内容です。"
                        : q.publish_wanted
                          ? "承諾後、この内容がHPに載ります。"
                          : "掲載希望がないため、HPには載りません。"}
                    </p>
                  </div>

                  {cardError[q.id] ? <p className="text-sm text-destructive">{cardError[q.id]}</p> : null}

                  {confirm ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
                      <span>{confirm.message}</span>
                      <Button size="sm" disabled={saving} onClick={() => runAction(q, confirm.action)}>
                        {saving ? "送信中…" : "送る"}
                      </Button>
                      <Button size="sm" variant="ghost" disabled={saving} onClick={() => setPendingConfirm(null)}>
                        やめる
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" disabled={saving} onClick={() => ask(q, "save_draft")}>
                        下書き保存
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gold text-gold-foreground hover:bg-gold-muted"
                        disabled={saving}
                        onClick={() => ask(q, "send")}
                      >
                        回答を送る
                      </Button>
                      {q.status === "awaiting_consent" ? (
                        <Button size="sm" variant="outline" disabled={saving} onClick={() => ask(q, "resend")}>
                          承諾メールを再送
                        </Button>
                      ) : null}
                      {q.status === "published" ? (
                        <Button size="sm" variant="outline" disabled={saving} onClick={() => runAction(q, "unpublish")}>
                          掲載を取り下げる
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={saving}
                        onClick={() => removeQuestion(q.id)}
                      >
                        削除
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-navy">
          <ArrowLeft className="size-4" />
          ダッシュボードへ
        </Link>
      </div>
    </div>
  );
}
