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
  Loader2,
  Upload,
  Mail,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { formatFiscalYearLabel, recentFiscalYears } from "@/lib/membership-fiscal-year";
import {
  unifiedPaymentMethodLabel,
  feePaymentCategoryKey,
} from "@/lib/admin-members-csv";
import {
  FEE_PAYMENT_FILTER_KEYS,
  FEE_PAYMENT_FILTER_LABELS,
  type FeePaymentFilterKey,
} from "@/lib/excel-fee-payment";
import { formatMemberNumber } from "@/lib/member-number";

const MEMBERSHIP_LABELS: Record<string, string> = {
  regular: "正会員",
  student: "学生会員",
  supporting: "賛助会員",
  friend: "会友",
};

const FILTER_LABELS: Record<string, string> = {
  all: "全会員",
  student: "学生会員",
};

/** API の status クエリ（withdrawn = 期限切れ or 強制退会） */
const STATUS_FILTER_LABELS: Record<string, string> = {
  pending: "承認待ち",
  active: "有効",
  expired: "期限切れ",
  expelled: "強制退会",
  withdrawn: "退会者（期限切れ・強制退会）",
};

const SIGNATURE_STORAGE_KEY = "admin_email_signatures";
type StoredSignature = { id: string; name: string; content: string };

type MembershipRow = { join_date?: string; expiry_date?: string; payment_method?: string };
type ProfileWithMembership = {
  id: string;
  member_number: number | null;
  name: string;
  name_kana: string;
  email: string;
  zip_code?: string | null;
  address?: string | null;
  address_prefecture?: string | null;
  address_city?: string | null;
  address_street?: string | null;
  address_building?: string | null;
  phone?: string | null;
  affiliation?: string | null;
  status: string;
  category: string;
  membership_type: string;
  is_ica_member?: boolean;
  officer_title?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  notes?: string | null;
  is_css_user?: boolean | null;
  stripe_customer_id?: string | null;
  source?: string | null;
  import_payment_kind?: string | null;
  memberships: MembershipRow[] | null;
};

function buildFetchUrl(
  filter: string,
  ica: boolean,
  type: string,
  status: string,
  unpaid: boolean,
  unpaidFeeMode: string,
  payKind: string
): string {
  const params = new URLSearchParams();
  if (ica) params.set("ica", "1");
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  if (unpaid) {
    params.set("unpaid", "1");
    if (unpaidFeeMode && unpaidFeeMode !== "expiry") {
      params.set("fee_fy", unpaidFeeMode);
    }
  }
  if (filter === "student" && !type) params.set("type", "student");
  if (payKind && (FEE_PAYMENT_FILTER_KEYS as readonly string[]).includes(payKind)) {
    params.set("pay_kind", payKind);
  }
  return `/api/admin/members?${params.toString()}`;
}

function getLatestMembership(p: ProfileWithMembership): MembershipRow | undefined {
  const arr = p.memberships ?? [];
  return [...arr].sort((a, b) => (b.expiry_date ?? "").localeCompare(a.expiry_date ?? ""))[0];
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
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  /** 未納者: expiry=有効期限ベース、それ以外は会費の年度（2/1始まりの事業年度） */
  const [unpaidFeeMode, setUnpaidFeeMode] = useState<string>("expiry");
  const [officerOnly, setOfficerOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [extending, setExtending] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendDate, setExtendDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [extendConfirmOpen, setExtendConfirmOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; skippedList?: string[] } | null>(null);
  const [csvPartialOpen, setCsvPartialOpen] = useState(false);
  const [csvPartialFile, setCsvPartialFile] = useState<File | null>(null);
  const [csvPartialLoading, setCsvPartialLoading] = useState(false);
  const [csvPartialResult, setCsvPartialResult] = useState<{
    updated: number;
    skipped: number;
    messages: string[];
  } | null>(null);
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
  const [csvExporting, setCsvExporting] = useState(false);
  const [feeStatusCsvExporting, setFeeStatusCsvExporting] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    const url = buildFetchUrl(
      filter,
      icaOnly,
      typeFilter,
      statusFilter,
      unpaidOnly,
      unpaidFeeMode,
      paymentFilter
    );
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) setProfiles(data.profiles ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, [filter, icaOnly, typeFilter, statusFilter, unpaidOnly, unpaidFeeMode, paymentFilter]);

  useEffect(() => {
    if (!unpaidOnly && unpaidFeeMode !== "expiry") {
      setUnpaidFeeMode("expiry");
    }
  }, [unpaidOnly, unpaidFeeMode]);

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

  const filterBased =
    filter === "student"
      ? profiles.filter((p) => p.membership_type === "student" || p.category === "student")
      : profiles;

  const filteredProfiles = useMemo(() => {
    let list = filterBased;
    const q = searchQuery.trim();
    if (q === "退会" || q === "退会者") {
      list = list.filter((p) => p.status === "expired" || p.status === "expelled");
    } else if (q === "強制退会") {
      list = list.filter((p) => p.status === "expelled");
    } else if (q && q.toLowerCase() !== "all") {
      const qLower = q.toLowerCase();
      const qDigits = q.trim();
      list = list.filter((p) => {
        const numRaw = p.member_number != null ? String(p.member_number) : "";
        const numPadded =
          p.member_number != null ? formatMemberNumber(p.member_number, "") : "";
        const paySearch = unifiedPaymentMethodLabel(p).toLowerCase();
        return (
          p.name.toLowerCase().includes(qLower) ||
          (p.name_kana ?? "").toLowerCase().includes(qLower) ||
          (p.email ?? "").toLowerCase().includes(qLower) ||
          paySearch.includes(qLower) ||
          (qDigits !== "" &&
            (numRaw.includes(qDigits) || numPadded.includes(qDigits)))
        );
      });
    }
    if (
      paymentFilter &&
      (FEE_PAYMENT_FILTER_KEYS as readonly string[]).includes(paymentFilter)
    ) {
      const pk = paymentFilter as FeePaymentFilterKey;
      list = list.filter((p) => feePaymentCategoryKey(p) === pk);
    }
    if (officerOnly) {
      list = list.filter((p) => (p.officer_title ?? "").trim() !== "");
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "member_number") {
          const na = a.member_number ?? 0;
          const nb = b.member_number ?? 0;
          cmp = na - nb;
        } else if (sortKey === "status") {
          const order: Record<string, number> = {
            pending: 0,
            active: 1,
            expired: 2,
            expelled: 3,
          };
          cmp = (order[a.status] ?? 0) - (order[b.status] ?? 0);
        } else if (sortKey === "expiry") {
          const ea = getLatestMembership(a)?.expiry_date ?? "";
          const eb = getLatestMembership(b)?.expiry_date ?? "";
          cmp = ea.localeCompare(eb);
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [filterBased, searchQuery, paymentFilter, officerOnly, sortKey, sortOrder]);

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

  const canSelectForExtend = (_p: ProfileWithMembership) => true;
  const fiscalYearOptions = useMemo(() => recentFiscalYears(3), []);

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

  const handleBulkExtend = async (expiryDate: string) => {
    const eligibleIds = Array.from(selectedIds).filter((id) => {
      const p = profiles.find((x) => x.id === id);
      return p && canSelectForExtend(p);
    });
    if (eligibleIds.length === 0) return;
    setExtending(true);
    setExtendConfirmOpen(false);
    const res = await fetch("/api/admin/members/extend", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_ids: eligibleIds, expiry_date: expiryDate }),
    });
    setExtending(false);
    if (res.ok) {
      setSelectedIds(new Set());
      setExtendDialogOpen(false);
      fetchProfiles();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "有効期限の更新に失敗しました");
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

  const handleCsvPartialImport = async () => {
    if (!csvPartialFile) return;
    setCsvPartialLoading(true);
    setCsvPartialResult(null);
    const formData = new FormData();
    formData.append("file", csvPartialFile);
    const res = await fetch("/api/admin/members/csv-partial-import", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    setCsvPartialLoading(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCsvPartialResult({
        updated: data.updated ?? 0,
        skipped: data.skipped ?? 0,
        messages: Array.isArray(data.messages) ? data.messages : [],
      });
      setCsvPartialFile(null);
      fetchProfiles();
    } else {
      alert((data as { error?: string }).error ?? "CSV の取り込みに失敗しました");
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

  const handleExportCsv = async () => {
    const ids = filteredProfiles.map((p) => p.id);
    if (ids.length === 0) {
      alert("出力する会員がありません。絞り込み条件をご確認ください。");
      return;
    }
    const unpaidTargetLabel =
      unpaidOnly && unpaidFeeMode !== "expiry"
        ? `${formatFiscalYearLabel(parseInt(unpaidFeeMode, 10))}分の会費が未納`
        : null;
    setCsvExporting(true);
    try {
      const res = await fetch("/api/admin/members/csv-export", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_ids: ids,
          unpaid_target_label: unpaidTargetLabel,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert((data as { error?: string }).error ?? "CSV の取得に失敗しました");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      let filename = `会員一覧_絞り込み${ids.length}件_${new Date().toISOString().slice(0, 10)}.csv`;
      const m = cd?.match(/filename\*=UTF-8''([^;]+)/);
      if (m?.[1]) {
        try {
          filename = decodeURIComponent(m[1].trim());
        } catch {
          /* keep default */
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setCsvExporting(false);
    }
  };

  const handleExportFeeStatusCsv = async () => {
    setFeeStatusCsvExporting(true);
    try {
      const res = await fetch("/api/admin/members/fee-status-csv-export", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert((data as { error?: string }).error ?? "CSV の取得に失敗しました");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      let filename = `会費支払状況_全会員_${new Date().toISOString().slice(0, 10)}.csv`;
      const m = cd?.match(/filename\*=UTF-8''([^;]+)/);
      if (m?.[1]) {
        try {
          filename = decodeURIComponent(m[1].trim());
        } catch {
          /* keep default */
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setFeeStatusCsvExporting(false);
    }
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExportCsv()}
            disabled={csvExporting || loading}
            title="現在の一覧（検索・絞り込み後）と同じ並びで出力します"
          >
            {csvExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            CSV出力（表示中）
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExportFeeStatusCsv()}
            disabled={feeStatusCsvExporting}
            title="会員名簿の全会員について、会費の年度別状況と支払い方法関連の列を出力します（絞り込みは反映されません）"
          >
            {feeStatusCsvExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            会費状況CSV（全会員）
          </Button>
          <Dialog
            open={csvPartialOpen}
            onOpenChange={(open) => {
              setCsvPartialOpen(open);
              if (!open) {
                setCsvPartialFile(null);
                setCsvPartialResult(null);
              }
            }}
          >
            <DialogTrigger
              render={
                <Button variant="outline" size="sm" type="button">
                  <Upload className="size-4" />
                  CSV一括更新
                </Button>
              }
            />
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>CSV で一括更新（差分）</DialogTitle>
                <DialogDescription>
                  「CSV出力（表示中）」でダウンロードしたファイルと同じ列形式の UTF-8 CSV を選んでください。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <ul className="list-inside list-disc space-y-1">
                  <li>値が<strong>空のセル</strong>は、その列はデータベースを変更しません。</li>
                  <li>行を識別するため、<strong>会員ID</strong>列は削除・変更しないでください。</li>
                  <li>
                    <strong>会員番号</strong>列に値を入れた場合のみ更新されます（4 桁の「0001」形式でも可）。
                  </li>
                  <li>
                    「会費支払い方法」列を参照します（旧 CSV の「支払い方法」列は互換のためそのままも可）。CSS
                    ／シクミネット／振込／空欄（ー）／クレジットの表記で取り込めます。
                  </li>
                  <li>会員資格がまだない会員で「支払い方法」だけを変えたい場合は、<strong>有効期限</strong>も入力してください。</li>
                </ul>
              </div>
              <div className="space-y-4 py-2">
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setCsvPartialFile(e.target.files?.[0] ?? null)}
                />
                {csvPartialResult && (
                  <div className="rounded border border-border bg-muted/30 p-3 text-sm">
                    <p>
                      更新: <strong>{csvPartialResult.updated}</strong> 件 / スキップ:{" "}
                      <strong>{csvPartialResult.skipped}</strong> 件
                    </p>
                    {csvPartialResult.messages.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground">メッセージ（最大50件）</summary>
                        <ul className="mt-1 max-h-40 list-inside list-disc overflow-y-auto text-xs">
                          {csvPartialResult.messages.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setCsvPartialOpen(false)}>
                  閉じる
                </Button>
                <Button
                  type="button"
                  className="bg-gold text-gold-foreground hover:bg-gold-muted"
                  onClick={() => void handleCsvPartialImport()}
                  disabled={!csvPartialFile || csvPartialLoading}
                >
                  {csvPartialLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                  アップロードして反映
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm">
                  <Upload className="size-4" />
                  Excel取り込み
                </Button>
              }
            />
            <DialogContent aria-describedby="excel-import-desc">
              <DialogHeader>
                <DialogTitle>会員データ Excel 取り込み</DialogTitle>
              </DialogHeader>
              <div id="excel-import-desc" className="space-y-3 text-sm text-muted-foreground" role="region" aria-label="取り込み対象列の説明">
                <p className="font-medium text-foreground">Excel の列名は以下と一致させてください。</p>
                <div>
                  <p className="font-medium text-foreground">必須列</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    <li>「名前」</li>
                    <li>「システム用メールアドレス」</li>
                    <li>「生年月日」（または「誕生日」「birth_date」など同一意味の列名）</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground">あると取り込む列</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    <li>「名前(カナ)」「会員種別」「会員有効終了日」「ICA資格」「会費支払い方法」「役員」</li>
                    <li>住所：「住所_郵便番号」「住所_都道府県」「住所_市区町村」「住所_番地」「住所_建物名」</li>
                    <li>その他：「電話番号」「備考」</li>
                  </ul>
                </div>
                <p>
                  ICA資格が「会員」の行はICA会員として登録されます。役員列の値（理事・監事など）はそのまま役員職名として保存されます。
                </p>
                <p>
                  <span className="font-medium text-foreground">会費支払い方法</span>
                  列がある場合のみ反映します。
                  <strong>クレジットカード</strong>（「クレジット」「CREDIT」を含む表記）→
                  カード経路、<strong>CSS</strong> → 銀行振込（CSS）経路、
                  <strong>コンビニ</strong>・<strong>口座振替Web</strong>（「口座振替」と「Web」系を含む表記）・
                  <strong>空欄</strong>・上記以外はいずれも一覧上は「その他」として保存します。
                </p>
              </div>
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
                          ICA会員
                        </label>
                        <label className="flex items-center gap-2">
                          <Checkbox checked={emailCriteria.unpaid} onChange={(e) => setEmailCriteria((prev) => ({ ...prev, unpaid: e.target.checked }))} />
                          未納者
                        </label>
                        <Select value={emailCriteria.type} onValueChange={(t) => setEmailCriteria((prev) => ({ ...prev, type: t ?? "" }))}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue>{emailCriteria.type ? (MEMBERSHIP_LABELS[emailCriteria.type] ?? emailCriteria.type) : "会員種別"}</SelectValue>
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

      <p className="text-lg font-semibold text-navy">
        該当 <span className="tabular-nums">{filteredProfiles.length}</span> 人
      </p>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">検索・絞り込み</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full min-w-[200px] sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="氏名・メール・会員番号（「退会者」で退会系に絞込）"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue>{FILTER_LABELS[filter] ?? "全会員"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全会員</SelectItem>
              <SelectItem value="student">学生会員</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue>{typeFilter ? (MEMBERSHIP_LABELS[typeFilter] ?? typeFilter) : "会員種別"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全会員種別</SelectItem>
              <SelectItem value="regular">正会員</SelectItem>
              <SelectItem value="student">学生会員</SelectItem>
              <SelectItem value="supporting">賛助会員</SelectItem>
              <SelectItem value="friend">会友</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "")}>
            <SelectTrigger className="w-[min(100vw-2rem,220px)] sm:w-[220px]">
              <SelectValue>
                {statusFilter ? (STATUS_FILTER_LABELS[statusFilter] ?? statusFilter) : "ステータス"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">すべて</SelectItem>
              <SelectItem value="active">有効</SelectItem>
              <SelectItem value="pending">承認待ち</SelectItem>
              <SelectItem value="expired">期限切れのみ</SelectItem>
              <SelectItem value="expelled">強制退会のみ</SelectItem>
              <SelectItem value="withdrawn">退会者（期限切れ・強制退会）</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v ?? "")}>
            <SelectTrigger className="w-[min(100vw-2rem,280px)] sm:w-[280px]">
              <SelectValue>
                {paymentFilter
                  ? (FEE_PAYMENT_FILTER_LABELS[paymentFilter as FeePaymentFilterKey] ??
                    paymentFilter)
                  : "会費支払い方法"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">指定なし</SelectItem>
              {FEE_PAYMENT_FILTER_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {FEE_PAYMENT_FILTER_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2" title="ICA会員で絞り込み">
            <Checkbox
              id="ica-only"
              checked={icaOnly}
              onChange={(e) => setIcaOnly(e.target.checked)}
            />
            <Label htmlFor="ica-only" className="text-sm cursor-pointer whitespace-nowrap">ICA会員</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="officer-only"
              checked={officerOnly}
              onChange={(e) => setOfficerOnly(e.target.checked)}
            />
            <Label htmlFor="officer-only" className="text-sm cursor-pointer whitespace-nowrap">役員</Label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Checkbox
              id="unpaid-only"
              checked={unpaidOnly}
              onChange={(e) => setUnpaidOnly(e.target.checked)}
            />
            <Label htmlFor="unpaid-only" className="text-sm cursor-pointer whitespace-nowrap">未納者</Label>
            {unpaidOnly && (
              <Select
                value={unpaidFeeMode}
                onValueChange={(v) => setUnpaidFeeMode(v ?? "expiry")}
              >
                <SelectTrigger className="w-[min(100vw-2rem,280px)] sm:w-[280px]">
                  <SelectValue placeholder="未納の基準" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expiry">有効期限切れ・未登録（従来）</SelectItem>
                  {fiscalYearOptions.map((fy) => (
                    <SelectItem key={fy} value={String(fy)}>
                      {formatFiscalYearLabel(fy)}の会費が未納
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchProfiles} {...(loading && { disabled: true })}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            更新
          </Button>
        </div>
      </div>

      {unpaidOnly && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            {unpaidFeeMode === "expiry"
              ? `未納者（有効期限）: ${filteredProfiles.length}件（表示中・検索後／有効期限切れまたは未登録）`
              : `未納者（${formatFiscalYearLabel(parseInt(unpaidFeeMode, 10))}会費）: ${filteredProfiles.length}件（表示中・検索後）`}
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
            onClick={() => setExtendDialogOpen(true)}
            {...(extending && { disabled: true })}
            className="bg-gold text-gold-foreground hover:bg-gold-muted"
          >
            {extending ? <Loader2 className="size-4 animate-spin" /> : null}
            有効期限を指定して一括更新
          </Button>
        </div>
      )}

      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>有効期限を一括設定</DialogTitle>
            <DialogDescription>
              選択した会員の有効期限を、指定した日付に更新します。日付を設定して「確認へ」を押してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="extend-expiry-date">有効期限（いつまで有効にするか）</Label>
              <Input
                id="extend-expiry-date"
                type="date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>キャンセル</Button>
            <Button
              className="bg-gold text-gold-foreground hover:bg-gold-muted"
              onClick={() => {
                if (!extendDate) {
                  alert("有効期限の日付を選択してください");
                  return;
                }
                setExtendDialogOpen(false);
                setExtendConfirmOpen(true);
              }}
            >
              確認へ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={extendConfirmOpen} onOpenChange={setExtendConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>有効期限の変更確認</DialogTitle>
            <DialogDescription>
              選択した{Array.from(selectedIds).filter((id) => profiles.find((x) => x.id === id) && canSelectForExtend(profiles.find((x) => x.id === id)!)).length}件の会員の有効期限を
              <strong className="mx-1">{extendDate ? new Date(extendDate + "T12:00:00").toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }) : ""}</strong>
              に変更します。よろしいですか？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendConfirmOpen(false)}>キャンセル</Button>
            <Button
              className="bg-gold text-gold-foreground hover:bg-gold-muted"
              onClick={() => handleBulkExtend(extendDate)}
              disabled={extending}
            >
              {extending ? <Loader2 className="size-4 animate-spin" /> : null}
              変更する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <TableHead className="w-12 text-center">ICA会員</TableHead>
                <TableHead className="w-12 text-center">役員</TableHead>
                <TableHead>メール</TableHead>
                <TableHead className="min-w-[12rem] whitespace-nowrap">会費支払い方法</TableHead>
                <TableHead className="min-w-[7rem] font-mono text-xs">会員ID</TableHead>
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
                  <TableCell className="font-mono tabular-nums">
                    {formatMemberNumber(p.member_number, "-")}
                  </TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-sm">{MEMBERSHIP_LABELS[p.membership_type] ?? p.membership_type}</TableCell>
                  <TableCell className="text-center">{p.is_ica_member ? "○" : "－"}</TableCell>
                  <TableCell className="text-sm">{p.officer_title?.trim() ?? "－"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                  <TableCell>
                    {(() => {
                      const payLabel = unifiedPaymentMethodLabel(p);
                      const pk = feePaymentCategoryKey(p);
                      const payClass =
                        pk === "fee_css"
                          ? "bg-amber-100 text-amber-900"
                          : pk === "fee_shikuminet"
                            ? "bg-purple-100 text-purple-950"
                          : pk === "fee_furikomi"
                            ? "bg-sky-100 text-sky-900"
                          : pk === "fee_blank"
                            ? "bg-muted text-muted-foreground"
                          : pk === "card_registered"
                            ? "bg-green-100 text-green-900"
                            : "bg-orange-100 text-orange-950";
                      return (
                        <span
                          className={`inline-block max-w-[14rem] rounded px-2 py-0.5 text-xs font-medium leading-snug ${payClass}`}
                        >
                          {payLabel}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell
                    className="max-w-[120px] truncate font-mono text-[11px] text-muted-foreground"
                    title={p.id}
                  >
                    {p.id}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        p.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : p.status === "active"
                            ? "bg-green-100 text-green-800"
                            : p.status === "expelled"
                              ? "bg-red-100 text-red-900"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.status === "pending"
                        ? "承認待ち"
                        : p.status === "active"
                          ? "有効"
                          : p.status === "expelled"
                            ? "強制退会"
                            : "期限切れ"}
                    </span>
                  </TableCell>
                  <TableCell>{getLatestMembership(p)?.expiry_date ?? "-"}</TableCell>
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
