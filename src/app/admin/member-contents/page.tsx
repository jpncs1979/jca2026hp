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

type Item = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  issue_label: string | null;
  issue_date: string | null;
  sort_order: number;
  file_path: string | null;
  external_url: string | null;
  is_published: boolean;
  created_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  bulletin: "会報",
  video: "動画",
  score: "楽譜",
  other: "その他",
};

const EMPTY_FORM = {
  title: "",
  category: "bulletin",
  issue_label: "",
  issue_date: "",
  description: "",
  sort_order: "0",
  is_published: true,
};

export default function AdminMemberContentsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/member-contents");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setItems(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setDialogOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category ?? "bulletin",
      issue_label: item.issue_label ?? "",
      issue_date: item.issue_date ?? "",
      description: item.description ?? "",
      sort_order: String(item.sort_order ?? 0),
      is_published: item.is_published,
    });
    setFile(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert("タイトルは必須です");
      return;
    }
    if (!editingId && !file) {
      alert("PDF ファイルを選択してください");
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("category", form.category);
    fd.append("issue_label", form.issue_label.trim());
    fd.append("issue_date", form.issue_date);
    fd.append("description", form.description.trim());
    fd.append("sort_order", form.sort_order || "0");
    fd.append("is_published", form.is_published ? "true" : "false");
    if (file) fd.append("file", file);

    const res = await fetch(
      editingId ? `/api/admin/member-contents/${editingId}` : "/api/admin/member-contents",
      {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        body: fd,
      }
    );
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setDialogOpen(false);
      fetchItems();
    } else {
      alert((data as { error?: string }).error ?? "保存に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このコンテンツを削除しますか？ファイルも削除されます。")) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/member-contents/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDeletingId(null);
    if (res.ok) fetchItems();
    else {
      const data = await res.json().catch(() => ({}));
      alert((data as { error?: string }).error ?? "削除に失敗しました");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy">会員コンテンツ（会報アーカイブ）</h1>
        <Button
          size="sm"
          className="bg-gold text-gold-foreground hover:bg-gold-muted"
          onClick={openCreate}
        >
          <Plus className="size-4" />
          新規登録
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        ここで登録した会報 PDF は、ログインした有効会員のみが会員専用ページ（/members/bulletins）で閲覧・ダウンロードできます。
        「公開」を外すと会員側に表示されません。
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
                <TableHead className="whitespace-nowrap">号数</TableHead>
                <TableHead>タイトル</TableHead>
                <TableHead className="w-16 text-center">種別</TableHead>
                <TableHead className="whitespace-nowrap">発行年月</TableHead>
                <TableHead className="w-16 text-center">公開</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {item.issue_label ?? "－"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={item.title}>
                    {item.title}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm tabular-nums">
                    {item.issue_date ?? "－"}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.is_published ? (
                      <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-900">
                        公開
                      </span>
                    ) : (
                      <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        非公開
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)} title="編集">
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
          まだ登録がありません。「新規登録」から会報 PDF を追加してください。
        </p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "会員コンテンツを編集" : "会員コンテンツを新規登録"}</DialogTitle>
            <DialogDescription>
              会報の PDF をアップロードします。号数・発行年月は会員側の一覧・並び順に使われます。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mc-title">タイトル</Label>
              <Input
                id="mc-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="例：日本クラリネット協会 会報"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mc-category">種別</Label>
                <select
                  id="mc-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  <option value="bulletin">会報</option>
                  <option value="video">動画</option>
                  <option value="score">楽譜</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mc-issue-label">号数</Label>
                <Input
                  id="mc-issue-label"
                  value={form.issue_label}
                  onChange={(e) => setForm((f) => ({ ...f, issue_label: e.target.value }))}
                  placeholder="例：第120号"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mc-issue-date">発行年月</Label>
                <Input
                  id="mc-issue-date"
                  type="date"
                  value={form.issue_date}
                  onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mc-sort">並び順（小さいほど上）</Label>
                <Input
                  id="mc-sort"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mc-desc">説明（任意）</Label>
              <Textarea
                id="mc-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="特集内容など"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mc-file">
                PDF ファイル{editingId ? "（差し替える場合のみ選択）" : ""}
              </Label>
              <Input
                id="mc-file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="mc-published"
                checked={form.is_published}
                onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
              />
              <Label htmlFor="mc-published" className="cursor-pointer">
                会員側に公開する
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
              {editingId ? "更新する" : "登録する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
