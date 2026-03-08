"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  RefreshCw,
  CheckCircle,
  Loader2,
  Upload,
  Mail,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const MEMBERSHIP_LABELS: Record<string, string> = {
  regular: "正会員",
  student: "学生会員",
  supporting: "賛助会員",
  friend: "会友",
};

const SIGNATURE_STORAGE_KEY = "admin_email_signatures";
type StoredSignature = { id: string; name: string; content: string };

type ProfileWithMembership = {
  id: string;
  member_number: number | null;
  name: string;
  name_kana: string;
  email: string;
  status: string;
  category: string;
  membership_type: string;
  is_ica_member?: boolean;
  memberships: { expiry_date: string }[] | null;
};

function buildFetchUrl(filter: string, ica: boolean, type: string, unpaid: boolean): string {
  const params = new URLSearchParams();
  if (ica) params.set("ica", "1");
  if (type) params.set("type", type);
  if (unpaid) params.set("unpaid", "1");
  if (filter === "pending") params.set("status", "pending");
  if (filter === "student" && !type) params.set("type", "student");
  return `/api/admin/members?${params.toString()}`;
}

type SortKey = "member_number" | "status" | "expiry" | "";
type SortOrder = "asc" | "desc";

export default function AdminMembersPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [icaOnly, setIcaOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [extending, setExtending] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; skippedList?: string[] } | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailCriteria, setEmailCriteria] = useState({ ica: false, type: "", unpaid: false });
  const [emailToSelected, setEmailToSelected] = useState(false); // 選択した人に送信モード
  const [emailConfirmStep, setEmailConfirmStep] = useState(false); // 下書き確認表示中
  const [emailPreview, setEmailPreview] = useState<{ count: number; subject: string; body_preview: string; recipients_sample: string[] } | null>(null);
  const [signatures, setSignatures] = useState<StoredSignature[]>([]);
  const [newSignatureName, setNewSignatureName] = useState("");
  const [newSignatureContent, setNewSignatureContent] = useState("");
  const [emailAttachments, setEmailAttachments] = useState<File[]>([]);

  const fetchProfiles = async () => {
    setLoading(true);
    const url = buildFetchUrl(filter, icaOnly, typeFilter, unpaidOnly);
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) setProfiles(data.profiles ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, [filter, icaOnly, typeFilter, unpaidOnly]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(SIGNATURE_STORAGE_KEY);
        setSignatures(raw ? JSON.parse(raw) : []);
      } catch {
        setSignatures([]);
      }
    }
  }, [emailOpen]);

  const pendingProfiles = profiles.filter((p) => p.status === "pending");
  const filterBased =
    filter === "pending"
      ? pendingProfiles
      : filter === "student"
        ? profiles.filter((p) => p.membership_type === "student" || p.category === "student")
        : profiles;

  const filteredProfiles = useMemo(() => {
    let list = filterBased;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.name_kana ?? "").toLowerCase().includes(q) ||
          (p.email ?? "").toLowerCase().includes(q)
      );
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "member_number") {
          const na = a.member_number ?? 0;
          const nb = b.member_number ?? 0;
          cmp = na - nb;
        } else if (sortKey === "status") {
          const order = { pending: 0, active: 1, expired: 2 };
          cmp = (order[a.status as keyof typeof order] ?? 0) - (order[b.status as keyof typeof order] ?? 0);
        } else if (sortKey === "expiry") {
          const ea = a.memberships?.[0]?.expiry_date ?? "";
          const eb = b.memberships?.[0]?.expiry_date ?? "";
          cmp = ea.localeCompare(eb);
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [filterBased, searchQuery, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="ml-1 inline size-3.5 opacity-50" />;
    return sortOrder === "asc" ? <ArrowUp className="ml-1 inline size-3.5" /> : <ArrowDown className="ml-1 inline size-3.5" />;
  };

  const today = new Date().toISOString().slice(0, 10);
  const canSelectForExtend = (p: ProfileWithMembership) =>
    p.status !== "pending"; // 承認待ち以外は一括延長・会員資格付与の対象
  const unpaidProfiles = profiles.filter((p) => {
    const exp = p.memberships?.[0]?.expiry_date;
    return !exp || exp < today;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size >= filteredProfiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProfiles.map((p) => p.id)));
    }
  };

  const handleApprove = async (profileId: string) => {
    setApprovingId(profileId);
    const res = await fetch("/api/admin/members/approve", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId }),
    });
    setApprovingId(null);
    if (res.ok) fetchProfiles();
  };

  const handleBulkExtend = async () => {
    const eligibleIds = Array.from(selectedIds).filter((id) => {
      const p = profiles.find((x) => x.id === id);
      return p && canSelectForExtend(p);
    });
    if (eligibleIds.length === 0) return;
    setExtending(true);
    const res = await fetch("/api/admin/members/extend", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_ids: eligibleIds }),
    });
    setExtending(false);
    if (res.ok) {
      setSelectedIds(new Set());
      fetchProfiles();
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", importFile);
    const res = await fetch("/api/admin/members/import", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    setImporting(false);
    const data = await res.json();
    if (res.ok) {
      setImportResult({
        created: data.created ?? 0,
        updated: data.updated ?? 0,
        skipped: data.skipped ?? 0,
        skippedList: data.skippedList ?? [],
      });
      setImportFile(null);
      fetchProfiles();
    } else {
      setImportResult({ created: 0, updated: 0, skipped: 0 });
      alert(data.error ?? "取り込みに失敗しました");
    }
  };

  const getEmailPayload = () => ({
    subject: emailSubject,
    email_body: emailBody,
    profile_ids: emailToSelected ? Array.from(selectedIds) : undefined,
    ica_only: emailToSelected ? undefined : emailCriteria.ica,
    membership_type: emailToSelected ? undefined : (emailCriteria.type || undefined),
    unpaid_only: emailToSelected ? undefined : emailCriteria.unpaid,
  });

  const handlePreviewDraft = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert("件名と本文を入力してください");
      return;
    }
    if (emailToSelected && selectedIds.size === 0) {
      alert("送信対象の会員を選択してください");
      return;
    }
    setEmailSending(true);
    const res = await fetch("/api/admin/members/send-email", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...getEmailPayload(), preview: true }),
    });
    setEmailSending(false);
    const data = await res.json();
    if (res.ok && data.preview) {
      setEmailPreview({
        count: data.count,
        subject: data.subject,
        body_preview: data.body_preview,
        recipients_sample: data.recipients_sample ?? [],
      });
      setEmailConfirmStep(true);
    } else {
      alert(data.error ?? "下書きの確認に失敗しました");
    }
  };

  const handleConfirmSend = async () => {
    setEmailSending(true);
    const payload = getEmailPayload();
    const formData = new FormData();
    formData.append("subject", payload.subject);
    formData.append("email_body", payload.email_body);
    if (payload.profile_ids) formData.append("profile_ids", JSON.stringify(payload.profile_ids));
    if (payload.ica_only) formData.append("ica_only", "true");
    if (payload.membership_type) formData.append("membership_type", payload.membership_type);
    if (payload.unpaid_only) formData.append("unpaid_only", "true");
    emailAttachments.forEach((f) => formData.append("attachments", f));
    const res = await fetch("/api/admin/members/send-email", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    setEmailSending(false);
    const data = await res.json();
    if (res.ok) {
      alert(`${data.sent}件のメールを送信しました`);
      setEmailOpen(false);
      setEmailSubject("");
      setEmailBody("");
      setEmailToSelected(false);
      setSelectedIds(new Set());
      setEmailConfirmStep(false);
      setEmailPreview(null);
      setEmailAttachments([]);
    } else {
      alert(data.error ?? "送信に失敗しました");
    }
  };

  const handleExportCsv = () => {
    const rows = filteredProfiles.map((p) => ({
      会員番号: p.member_number ?? "",
      氏名: p.name,
      ふりがな: p.name_kana,
      メール: p.email,
      ステータス: p.status,
      種別: MEMBERSHIP_LABELS[p.membership_type] ?? p.membership_type,
      ICA会員: p.is_ica_member ? "○" : "",
      有効期限: p.memberships?.[0]?.expiry_date ?? "",
    }));
    const headers = Object.keys(rows[0] ?? {});
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `会員一覧_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openEmailToSelected = () => {
    setEmailToSelected(true);
    setEmailOpen(true);
  };

  const addSignature = () => {
    const name = newSignatureName.trim();
    const content = newSignatureContent.trim();
    if (!name || !content) return;
    const next: StoredSignature[] = [
      ...signatures,
      { id: crypto.randomUUID(), name, content },
    ];
    setSignatures(next);
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify(next));
    setNewSignatureName("");
    setNewSignatureContent("");
  };

  const appendSignature = (content: string) => {
    setEmailBody((prev) => (prev ? prev + "\n\n" + content : content));
  };

  const deleteSignature = (id: string) => {
    const next = signatures.filter((s) => s.id !== id);
    setSignatures(next);
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy">会員管理</h1>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="氏名・メールで検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全会員</SelectItem>
              <SelectItem value="pending">承認待ち</SelectItem>
              <SelectItem value="student">学生会員</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Checkbox
              id="ica-only"
              checked={icaOnly}
              onChange={(e) => setIcaOnly(e.target.checked)}
            />
            <Label htmlFor="ica-only" className="text-sm cursor-pointer">ICA会員のみ</Label>
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="会員種別" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全会員種別</SelectItem>
              <SelectItem value="regular">正会員</SelectItem>
              <SelectItem value="student">学生会員</SelectItem>
              <SelectItem value="supporting">賛助会員</SelectItem>
              <SelectItem value="friend">会友</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Checkbox
              id="unpaid-only"
              checked={unpaidOnly}
              onChange={(e) => setUnpaidOnly(e.target.checked)}
            />
            <Label htmlFor="unpaid-only" className="text-sm cursor-pointer whitespace-nowrap">未納者のみ</Label>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProfiles} {...(loading && { disabled: true })}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="size-4" />
            CSV出力
          </Button>

          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm">
                  <Upload className="size-4" />
                  Excel取り込み
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>会員データ Excel 取り込み</DialogTitle>
                <DialogDescription>
                  「名前」「名前(カナ)」「システム用メールアドレス」「会員種別」「会員有効終了日」「ICA資格」「会費支払い方法」列を含む Excel をアップロードしてください。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                />
                {importResult && (
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      新規: {importResult.created}件 / 更新: {importResult.updated}件 / スキップ: {importResult.skipped}件
                    </p>
                    {importResult.skipped > 0 && importResult.skippedList && importResult.skippedList.length > 0 && (
                      <details className="rounded border border-amber-200 bg-amber-50/50 p-2">
                        <summary className="cursor-pointer text-amber-800">スキップ理由（最大20件）</summary>
                        <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-amber-900">
                          {importResult.skippedList.slice(0, 20).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                          {importResult.skippedList.length > 20 && (
                            <li>...他 {importResult.skippedList.length - 20}件</li>
                          )}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleImport} {...((!importFile || importing) && { disabled: true })}>
                  {importing ? <Loader2 className="size-4 animate-spin" /> : null}
                  取り込み
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={emailOpen} onOpenChange={(open) => { setEmailOpen(open); if (!open) { setEmailToSelected(false); setEmailConfirmStep(false); setEmailPreview(null); setEmailAttachments([]); } }}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm">
                  <Mail className="size-4" />
                  メール送信
                </Button>
              }
            />
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {emailConfirmStep ? "送信内容の確認" : emailToSelected ? "選択した会員にメール送信" : "条件指定でメール送信"}
                </DialogTitle>
                <DialogDescription>
                  {emailConfirmStep
                    ? "内容を確認のうえ、送信してください。"
                    : emailToSelected
                      ? `選択した ${selectedIds.size} 人にメールを送信します。`
                      : "条件に合う会員へ一括でメールを送信できます。未納者への催促などにご利用ください。"}
                </DialogDescription>
              </DialogHeader>
              {emailConfirmStep && emailPreview ? (
                <div className="space-y-4 py-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">件名</p>
                      <p className="font-medium">{emailPreview.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">本文（抜粋）</p>
                      <p className="text-sm whitespace-pre-wrap">{emailPreview.body_preview}</p>
                    </div>
                    {emailAttachments.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">添付ファイル</p>
                        <p className="text-sm">{emailAttachments.length}件</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">送信先</p>
                      <p className="font-medium">{emailPreview.count}件</p>
                      {emailPreview.recipients_sample.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {emailPreview.recipients_sample.join(", ")}
                          {emailPreview.count > 5 && ` …他 ${emailPreview.count - 5}件`}
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setEmailConfirmStep(false); setEmailPreview(null); }} disabled={emailSending}>
                      戻る
                    </Button>
                    <Button onClick={handleConfirmSend} {...(emailSending && { disabled: true })} className="bg-gold text-gold-foreground hover:bg-gold-muted">
                      {emailSending ? <Loader2 className="size-4 animate-spin" /> : null}
                      送信する
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <>
                  <div className="space-y-4 py-4">
                    {!emailToSelected && (
                    <div className="space-y-2">
                      <Label>送信対象</Label>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2">
                          <Checkbox checked={emailCriteria.ica} onChange={(e) => setEmailCriteria((prev) => ({ ...prev, ica: e.target.checked }))} />
                          ICA会員のみ
                        </label>
                        <label className="flex items-center gap-2">
                          <Checkbox checked={emailCriteria.unpaid} onChange={(e) => setEmailCriteria((prev) => ({ ...prev, unpaid: e.target.checked }))} />
                          未納者のみ
                        </label>
                        <Select value={emailCriteria.type} onValueChange={(t) => setEmailCriteria((prev) => ({ ...prev, type: t }))}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="会員種別" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">指定なし</SelectItem>
                            <SelectItem value="regular">正会員</SelectItem>
                            <SelectItem value="student">学生会員</SelectItem>
                            <SelectItem value="supporting">賛助会員</SelectItem>
                            <SelectItem value="friend">会友</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email-subject">件名</Label>
                      <Input id="email-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="メール件名" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-body">本文（HTML対応・{"{{氏名}}"}で宛名を挿入）</Label>
                      <Textarea id="email-body" rows={6} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder={'メール本文を入力... {{氏名}} で氏名が差し替わります'} className="resize-none font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label>添付ファイル</Label>
                      <input
                        type="file"
                        multiple
                        className="block w-full text-sm text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-gold-foreground file:hover:bg-gold-muted"
                        onChange={(e) => setEmailAttachments((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
                      />
                      {emailAttachments.length > 0 && (
                        <ul className="flex flex-wrap gap-2 text-sm">
                          {emailAttachments.map((f, i) => (
                            <li key={i} className="flex items-center gap-1 rounded bg-muted px-2 py-1">
                              <span>{f.name}</span>
                              <button type="button" onClick={() => setEmailAttachments((prev) => prev.filter((_, j) => j !== i))} className="text-destructive hover:underline">×</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                      <Label className="text-xs">署名（選択して追記）</Label>
                      {signatures.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {signatures.map((s) => (
                            <div key={s.id} className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1">
                              <button type="button" onClick={() => appendSignature(s.content)} className="text-xs text-gold hover:underline">
                                {s.name} を追記
                              </button>
                              <button type="button" onClick={() => deleteSignature(s.id)} className="ml-1 text-muted-foreground hover:text-destructive" title="削除">×</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">署名がありません。下で追加できます。</p>
                      )}
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">署名を追加</summary>
                        <div className="mt-2 space-y-2">
                          <Input placeholder="署名名（例: 通常）" value={newSignatureName} onChange={(e) => setNewSignatureName(e.target.value)} className="h-8 text-sm" />
                          <Textarea placeholder="署名の内容（HTML可）" value={newSignatureContent} onChange={(e) => setNewSignatureContent(e.target.value)} rows={2} className="resize-none text-sm" />
                          <Button type="button" size="sm" variant="outline" onClick={addSignature} disabled={!newSignatureName.trim() || !newSignatureContent.trim()}>
                            追加
                          </Button>
                        </div>
                      </details>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handlePreviewDraft} {...(emailSending && { disabled: true })}>
                      {emailSending ? <Loader2 className="size-4 animate-spin" /> : null}
                      下書き確認
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filter === "pending" && pendingProfiles.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            {pendingProfiles.length}件の承認待ちがあります。承認後に「入会承認メール」が送信されます。
          </p>
        </div>
      )}

      {unpaidOnly && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            未納者: {unpaidProfiles.length}件（有効期限切れまたは未登録）
          </p>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
          <span className="text-sm font-medium">{selectedIds.size}件を選択中</span>
          <Button
            size="sm"
            variant="outline"
            onClick={openEmailToSelected}
          >
            <Mail className="size-4" />
            選択した人にメール送信
          </Button>
          <Button
            size="sm"
            onClick={handleBulkExtend}
            {...(extending && { disabled: true })}
            className="bg-gold text-gold-foreground hover:bg-gold-muted"
          >
            {extending ? <Loader2 className="size-4 animate-spin" /> : null}
            有効期限を1年延長（CSS連携・一括会員資格付与）
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  {filteredProfiles.length > 0 && (
                    <Checkbox
                      checked={filteredProfiles.length > 0 && selectedIds.size >= filteredProfiles.length}
                      onChange={toggleSelectAll}
                    />
                  )}
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("member_number")}
                    className="inline-flex items-center font-medium hover:text-gold"
                  >
                    会員番号
                    <SortIcon col="member_number" />
                  </button>
                </TableHead>
                <TableHead>氏名</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>メール</TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("status")}
                    className="inline-flex items-center font-medium hover:text-gold"
                  >
                    ステータス
                    <SortIcon col="status" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("expiry")}
                    className="inline-flex items-center font-medium hover:text-gold"
                  >
                    有効期限
                    <SortIcon col="expiry" />
                  </button>
                </TableHead>
                {filter === "pending" && <TableHead className="w-24">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/members/${p.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </TableCell>
                  <TableCell>{p.member_number ?? "-"}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      {p.name}
                      {p.is_ica_member && (
                        <span className="rounded bg-navy/10 px-1.5 py-0.5 text-xs text-navy">ICA</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{MEMBERSHIP_LABELS[p.membership_type] ?? p.membership_type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        p.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : p.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.status === "pending" ? "承認待ち" : p.status === "active" ? "有効" : "期限切れ"}
                    </span>
                  </TableCell>
                  <TableCell>{p.memberships?.[0]?.expiry_date ?? "-"}</TableCell>
                  {filter === "pending" && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(p.id)}
                        {...(approvingId === p.id && { disabled: true })}
                        className="bg-gold text-gold-foreground hover:bg-gold-muted"
                      >
                        {approvingId === p.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="size-4" />
                            承認
                          </>
                        )}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && filteredProfiles.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">該当する会員がいません。</p>
      )}
    </div>
  );
}
