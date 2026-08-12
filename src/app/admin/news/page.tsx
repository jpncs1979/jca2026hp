"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

type NewsItem = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  publish_date: string;
  is_important: boolean;
  created_at: string;
};

const EMPTY_FORM = {
  title: "",
  content: "",
  category: "",
  publish_date: new Date().toISOString().slice(0, 10),
  is_important: false,
};

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/news");
    const data = await res.json();
    if (res.ok) setItems(data.news ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void (async () => {
      await fetchNews();
    })();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      category: item.category ?? "",
      publish_date: item.publish_date,
      is_important: item.is_important,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.publish_date) {
      alert("タイトル・本文・公開日は必須です");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category.trim() || null,
      publish_date: form.publish_date,
      is_important: form.is_important,
    };
    const res = await fetch(
      editingId ? `/api/admin/news/${editingId}` : "/api/admin/news",
      {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setDialogOpen(false);
      fetchNews();
    } else {
      alert((data as { error?: string }).error ?? "保存に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このお知らせを削除しますか？")) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/news/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDeletingId(null);
    if (res.ok) {
      fetchNews();
    } else {
      const data = await res.json().catch(() => ({}));
      alert((data as { error?: string }).error ?? "削除に失敗しました");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy">お知らせ管理</h1>
        <Button
          size="sm"
          className="bg-gold text-gold-foreground hover:bg-gold-muted"
          onClick={openCreate}
        >
          <Plus className="size-4" />
          新規投稿
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        公開日を未来の日付にすると、トップページには公開日になるまで表示されません。
      </p>

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">公開日</TableHead>
                <TableHead>タイトル</TableHead>
                <TableHead className="w-16 text-center">重要</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap text-sm tabular-nums">
                    {item.publish_date}
                  </TableCell>
                  <TableCell className="max-w-md truncate" title={item.title}>
                    {item.title}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.is_important ? (
                      <span className="inline-block rounded bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold-foreground">
                        重要
                      </span>
                    ) : (
                      "－"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(item)}
                        title="編集"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        title="削除"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && items.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          お知らせがまだありません。「新規投稿」から追加してください。
        </p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "お知らせを編集" : "お知らせを新規投稿"}</DialogTitle>
            <DialogDescription>
              公開日以前の日付で表示され、トップページに新しい順で並びます。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="news-title">タイトル</Label>
              <Input
                id="news-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="お知らせのタイトル"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-content">本文</Label>
              <Textarea
                id="news-content"
                rows={6}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="お知らせの本文（改行はそのまま表示されます）"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="news-publish-date">公開日</Label>
                <Input
                  id="news-publish-date"
                  type="date"
                  value={form.publish_date}
                  onChange={(e) => setForm((f) => ({ ...f, publish_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="news-category">カテゴリ（任意）</Label>
                <Input
                  id="news-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="例：コンクール"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="news-important"
                checked={form.is_important}
                onChange={(e) => setForm((f) => ({ ...f, is_important: e.target.checked }))}
              />
              <Label htmlFor="news-important" className="cursor-pointer">
                重要なお知らせとして表示する
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              className="bg-gold text-gold-foreground hover:bg-gold-muted"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {editingId ? "更新する" : "投稿する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
