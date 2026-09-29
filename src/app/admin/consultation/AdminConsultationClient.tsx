"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
};

const STATUS_LABEL: Record<string, string> = {
  pending: "未回答",
  answered: "回答済み",
  published: "公開済み",
};

export function AdminConsultationClient() {
  const [list, setList] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "answered" | "published">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");
  const openedFromLink = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/consultation");
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setList(data);
      } catch {
        if (!cancelled) setList([]);
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
    const target = list.find((item) => item.id === focusId);
    if (!target) return;
    openedFromLink.current = true;
    setEditingId(target.id);
    setAnswerDraft(target.answer ?? "");
    requestAnimationFrame(() => {
      document.getElementById(`consultation-${target.id}`)?.scrollIntoView({ block: "center" });
    });
  }, [focusId, list, loading]);

  const filtered = list.filter((q) => filter === "all" || q.status === filter);

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setAnswerDraft(q.answer ?? "");
  };

  const saveAnswer = async (id: string, publish: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/consultation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answerDraft, publish }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "保存に失敗しました。");
        return;
      }
      setList((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                answer: answerDraft,
                status: publish ? "published" : "answered",
                published_at: publish ? new Date().toISOString() : null,
              }
            : q
        )
      );
      setEditingId(null);
      setAnswerDraft("");
    } catch {
      alert("保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const unpublish = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/consultation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unpublish: true }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "公開の取り消しに失敗しました。");
        return;
      }
      setList((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, status: "answered", published_at: null } : q
        )
      );
    } catch {
      alert("公開の取り消しに失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (id: string) => {
    if (!window.confirm("この質問と回答を削除します。元に戻せません。")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/consultation/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "削除に失敗しました。");
        return;
      }
      setList((prev) => prev.filter((q) => q.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setAnswerDraft("");
      }
    } catch {
      alert("削除に失敗しました。");
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
        {(["all", "pending", "answered", "published"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-gold/20 text-gold"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "all" ? "すべて" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        「HPに公開」で相談室ページに表示します。「公開をやめる」でページから外し、回答は残します。「削除」で質問ごと消します。
      </p>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              該当する質問はありません。
            </CardContent>
          </Card>
        ) : (
          filtered.map((q) => (
            <Card key={q.id} id={`consultation-${q.id}`} className="scroll-mt-24">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {q.category}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {STATUS_LABEL[q.status] ?? q.status}
                    </span>
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {new Date(q.created_at).toLocaleString("ja-JP")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {q.name} / {q.email}
                  {q.nickname && `（${q.nickname}）`}
                  {q.age && ` ・ ${q.age}`}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {q.body && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">質問内容</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{q.body}</p>
                  </div>
                )}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">回答（事務局入力）</p>
                  {editingId === q.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={answerDraft}
                        onChange={(e) => setAnswerDraft(e.target.value)}
                        rows={6}
                        className="w-full"
                        placeholder="回答を入力すると相談室HPに公開できます"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => saveAnswer(q.id, false)}
                        >
                          {saving ? "保存中…" : "回答を保存"}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gold text-gold-foreground hover:bg-gold-muted"
                          disabled={saving}
                          onClick={() => saveAnswer(q.id, true)}
                        >
                          {saving ? "公開中…" : "HPに公開"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={saving}
                          onClick={() => {
                            setEditingId(null);
                            setAnswerDraft("");
                          }}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {q.answer ? (
                        <p className="whitespace-pre-wrap text-sm">{q.answer}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">（未回答）</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => startEdit(q)}
                        >
                          {q.answer ? "回答を編集" : "回答を入力"}
                        </Button>
                        {q.status === "published" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving}
                            onClick={() => unpublish(q.id)}
                          >
                            公開をやめる
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
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
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
