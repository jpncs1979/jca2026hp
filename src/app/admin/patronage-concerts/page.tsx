"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { Loader2, Check, X, EyeOff, RotateCcw, Trash2, FileUp, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  flyerFileError,
  patronageFlyerHref,
  type PatronageConcertRow,
} from "@/lib/patronage-concerts";

const STATUS_LABEL: Record<PatronageConcertRow["status"], string> = {
  pending: "未承認",
  approved: "掲載中",
  rejected: "却下",
  unpublished: "非掲載",
};

const STATUS_CLASS: Record<PatronageConcertRow["status"], string> = {
  pending: "bg-gold/20 text-navy",
  approved: "bg-green-100 text-green-900",
  rejected: "bg-destructive/10 text-destructive",
  unpublished: "bg-muted text-muted-foreground",
};

function formatDate(iso: string | null) {
  if (!iso) return "－";
  return iso.slice(0, 10);
}

type ContentDraft = {
  applicant_name: string;
  applicant_email: string;
  member_number: string;
  concert_title: string;
  event_date: string;
  doors_open: string;
  curtain_time: string;
  venue: string;
  admission: string;
  performers: string;
  program: string;
  organizer: string;
  contact: string;
  notes: string;
};

function draftFromRow(row: PatronageConcertRow): ContentDraft {
  return {
    applicant_name: row.applicant_name,
    applicant_email: row.applicant_email,
    member_number: row.member_number ?? "",
    concert_title: row.concert_title,
    event_date: row.event_date.slice(0, 10),
    doors_open: row.doors_open,
    curtain_time: row.curtain_time,
    venue: row.venue,
    admission: row.admission,
    performers: row.performers,
    program: row.program,
    organizer: row.organizer,
    contact: row.contact,
    notes: row.notes ?? "",
  };
}

export default function AdminPatronageConcertsPage() {
  const [items, setItems] = useState<PatronageConcertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PatronageConcertRow | null>(null);
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [contentMessage, setContentMessage] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [savingContent, setSavingContent] = useState(false);
  const [flyerDraft, setFlyerDraft] = useState<File | null>(null);
  const [flyerMessage, setFlyerMessage] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/patronage-concerts", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setItems(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const openDetail = (item: PatronageConcertRow) => {
    setFlyerDraft(null);
    setFlyerMessage(null);
    setContentMessage(null);
    setContentError(null);
    setDraft(draftFromRow(item));
    setDetail(item);
  };

  const setDraftField = (key: keyof ContentDraft, value: string) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setContentMessage(null);
    setContentError(null);
  };

  const saveContent = async () => {
    if (!detail || !draft) return;
    setSavingContent(true);
    setContentMessage(null);
    setContentError(null);
    try {
      const res = await fetch(`/api/admin/patronage-concerts/${detail.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setContentError((data as { error?: string }).error ?? "保存に失敗しました");
        return;
      }
      const row = (data as { item: PatronageConcertRow }).item;
      setDetail(row);
      setDraft(draftFromRow(row));
      setItems((prev) => prev.map((item) => (item.id === row.id ? row : item)));
      setContentMessage(
        row.status === "approved"
          ? "保存しました。案内ページの掲載内容も更新されます。"
          : "保存しました。"
      );
    } catch {
      setContentError("保存に失敗しました");
    } finally {
      setSavingContent(false);
    }
  };

  const uploadFlyer = async () => {
    if (!detail || !flyerDraft) return;
    const err = flyerFileError(flyerDraft);
    if (err) {
      setFlyerMessage(err);
      return;
    }
    setActingId(detail.id);
    setFlyerMessage(null);
    const body = new FormData();
    body.append("flyer", flyerDraft);
    const res = await fetch(`/api/admin/patronage-concerts/${detail.id}/flyer`, {
      method: "POST",
      credentials: "include",
      body,
    });
    setActingId(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFlyerMessage((data as { error?: string }).error ?? "チラシの登録に失敗しました");
      return;
    }
    const row = (data as { item: PatronageConcertRow }).item;
    setDetail(row);
    setItems((prev) => prev.map((item) => (item.id === row.id ? row : item)));
    setFlyerDraft(null);
    setFlyerMessage("チラシを登録しました。掲載中の公演は案内ページに反映されます。");
  };

  const setStatus = async (id: string, status: PatronageConcertRow["status"]) => {
    const target = items.find((item) => item.id === id) ?? (detail?.id === id ? detail : null);
    const confirmMsg =
      status === "approved"
        ? target && !target.flyer_path
          ? "チラシはまだ届いていません。演奏会情報だけを掲載します。よろしいですか？"
          : "この申請を承認し、後援演奏会のご案内ページに掲載します。よろしいですか？"
        : status === "rejected"
          ? "この申請を却下します。よろしいですか？"
          : status === "unpublished"
            ? "案内ページから掲載を取り下げます。よろしいですか？"
            : null;
    if (confirmMsg && !confirm(confirmMsg)) return;

    setActingId(id);
    const res = await fetch(`/api/admin/patronage-concerts/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActingId(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert((data as { error?: string }).error ?? "更新に失敗しました");
      return;
    }
    await fetchItems();
    setDetail((d) => (d && d.id === id ? { ...d, status } : d));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この申請を削除しますか？チラシも削除されます。")) return;
    setActingId(id);
    const res = await fetch(`/api/admin/patronage-concerts/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setActingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert((data as { error?: string }).error ?? "削除に失敗しました");
      return;
    }
    setDetail(null);
    await fetchItems();
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">後援演奏会</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          申請内容を確認し、承認すると
          <Link
            href="/members/supported-concerts"
            className="mx-1 text-gold underline-offset-2 hover:underline"
            target="_blank"
          >
            後援演奏会のご案内
          </Link>
          に掲載されます。掲載の前後を問わず、この画面から内容を修正できます。
        </p>
        {pendingCount > 0 && (
          <p className="mt-2 text-sm font-medium text-navy">
            未承認が {pendingCount} 件あります。
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">申請日</TableHead>
                <TableHead className="whitespace-nowrap">公演日</TableHead>
                <TableHead>表題</TableHead>
                <TableHead>申請者</TableHead>
                <TableHead className="w-20 text-center">チラシ</TableHead>
                <TableHead className="w-20 text-center">状態</TableHead>
                <TableHead className="w-52 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap text-sm tabular-nums">
                    {formatDate(item.created_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm tabular-nums">
                    {item.event_date}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={item.concert_title}>
                    <button
                      type="button"
                      className="text-left hover:text-gold hover:underline"
                      onClick={() => openDetail(item)}
                    >
                      {item.concert_title}
                    </button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {item.applicant_name}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {!item.flyer_path
                      ? "未着"
                      : item.flyer_content_type?.includes("pdf") ||
                          item.flyer_filename?.toLowerCase().endsWith(".pdf")
                        ? "PDF"
                        : "画像"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[item.status]}`}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {item.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-gold text-gold-foreground hover:bg-gold-muted"
                            disabled={actingId === item.id}
                            onClick={() => setStatus(item.id, "approved")}
                          >
                            {actingId === item.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Check className="size-4" />
                            )}
                            承認
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actingId === item.id}
                            onClick={() => setStatus(item.id, "rejected")}
                            title="却下"
                          >
                            <X className="size-4" />
                          </Button>
                        </>
                      )}
                      {item.status === "approved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actingId === item.id}
                          onClick={() => setStatus(item.id, "unpublished")}
                        >
                          <EyeOff className="size-4" />
                          掲載を外す
                        </Button>
                      )}
                      {(item.status === "rejected" || item.status === "unpublished") && (
                        <Button
                          size="sm"
                          className="bg-gold text-gold-foreground hover:bg-gold-muted"
                          disabled={actingId === item.id}
                          onClick={() => setStatus(item.id, "approved")}
                        >
                          <RotateCcw className="size-4" />
                          掲載する
                        </Button>
                      )}
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
          まだ後援申請はありません。
        </p>
      )}

      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) {
            setDetail(null);
            setDraft(null);
            setFlyerDraft(null);
            setFlyerMessage(null);
            setContentMessage(null);
            setContentError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.concert_title}</DialogTitle>
                <DialogDescription>
                  掲載の前後を問わず内容を修正できます。掲載中の公演は、保存すると案内ページに反映されます。チラシが未着でも承認できます。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2 md:grid-cols-[180px_1fr]">
                <div>
                  {detail.flyer_path ? (
                    detail.flyer_content_type?.includes("pdf") ||
                    detail.flyer_filename?.toLowerCase().endsWith(".pdf") ? (
                      <a
                        href={patronageFlyerHref(detail.id, detail.updated_at)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-border bg-muted/40 px-3 py-8 text-center text-sm text-navy hover:bg-muted"
                      >
                        チラシ（PDF）を開く
                      </a>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={detail.updated_at}
                        src={patronageFlyerHref(detail.id, detail.updated_at)}
                        alt="チラシ"
                        className="w-full rounded-lg border border-border object-cover object-top"
                      />
                    )
                  ) : (
                    <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                      チラシ未着
                    </p>
                  )}
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-medium text-navy">
                      {detail.flyer_path ? "チラシを差し替える" : "届いたチラシを登録する"}
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      className="w-full text-xs text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-gold file:px-2 file:py-1 file:text-gold-foreground"
                      onChange={(e) => {
                        setFlyerDraft(e.target.files?.[0] ?? null);
                        setFlyerMessage(null);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="bg-gold text-gold-foreground hover:bg-gold-muted"
                      disabled={!flyerDraft || actingId === detail.id}
                      onClick={() => void uploadFlyer()}
                    >
                      {actingId === detail.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <FileUp className="size-4" />
                      )}
                      登録
                    </Button>
                    {flyerMessage ? (
                      <p className="text-xs text-muted-foreground">{flyerMessage}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        PDF・JPEG・PNG（4MB 以下）。画像は流れるチラシに公演日順で入ります。
                      </p>
                    )}
                  </div>
                </div>
                {draft && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">状態</span>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[detail.status]}`}
                      >
                        {STATUS_LABEL[detail.status]}
                      </span>
                    </div>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-navy">演奏会表題</span>
                      <Input
                        value={draft.concert_title}
                        onChange={(e) => setDraftField("concert_title", e.target.value)}
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-navy">期日</span>
                        <Input
                          type="date"
                          value={draft.event_date}
                          onChange={(e) => setDraftField("event_date", e.target.value)}
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-navy">開場</span>
                        <Input
                          value={draft.doors_open}
                          onChange={(e) => setDraftField("doors_open", e.target.value)}
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-navy">開演</span>
                        <Input
                          value={draft.curtain_time}
                          onChange={(e) => setDraftField("curtain_time", e.target.value)}
                        />
                      </label>
                    </div>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-navy">場所</span>
                      <Input
                        value={draft.venue}
                        onChange={(e) => setDraftField("venue", e.target.value)}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-navy">入場料</span>
                      <Input
                        value={draft.admission}
                        onChange={(e) => setDraftField("admission", e.target.value)}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-navy">出演者</span>
                      <Textarea
                        value={draft.performers}
                        className="min-h-[72px]"
                        onChange={(e) => setDraftField("performers", e.target.value)}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-navy">曲目</span>
                      <Textarea
                        value={draft.program}
                        className="min-h-[72px]"
                        onChange={(e) => setDraftField("program", e.target.value)}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-navy">主催</span>
                      <Input
                        value={draft.organizer}
                        onChange={(e) => setDraftField("organizer", e.target.value)}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-navy">問い合わせ先</span>
                      <span className="block text-xs text-muted-foreground">
                        案内ページに掲載します。
                      </span>
                      <Textarea
                        value={draft.contact}
                        className="min-h-[72px]"
                        onChange={(e) => setDraftField("contact", e.target.value)}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-navy">備考</span>
                      <span className="block text-xs text-muted-foreground">
                        案内ページには掲載しません。
                      </span>
                      <Textarea
                        value={draft.notes}
                        className="min-h-[60px]"
                        onChange={(e) => setDraftField("notes", e.target.value)}
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-navy">申請者名</span>
                        <Input
                          value={draft.applicant_name}
                          onChange={(e) => setDraftField("applicant_name", e.target.value)}
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-navy">会員番号</span>
                        <Input
                          value={draft.member_number}
                          placeholder="例: 0001"
                          onChange={(e) => setDraftField("member_number", e.target.value)}
                        />
                      </label>
                    </div>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-navy">申請者メール</span>
                      <Input
                        type="email"
                        value={draft.applicant_email}
                        onChange={(e) => setDraftField("applicant_email", e.target.value)}
                      />
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        className="bg-gold text-gold-foreground hover:bg-gold-muted"
                        disabled={savingContent || actingId === detail.id}
                        onClick={() => void saveContent()}
                      >
                        {savingContent ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Save className="size-4" />
                        )}
                        内容を保存
                      </Button>
                      {contentError ? (
                        <p className="text-sm text-destructive">{contentError}</p>
                      ) : contentMessage ? (
                        <p className="text-sm text-navy">{contentMessage}</p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                {detail.status === "pending" && (
                  <>
                    <Button
                      className="bg-gold text-gold-foreground hover:bg-gold-muted"
                      disabled={actingId === detail.id || savingContent}
                      onClick={() => setStatus(detail.id, "approved")}
                    >
                      <Check className="size-4" />
                      承認して掲載する
                    </Button>
                    <Button
                      variant="outline"
                      disabled={actingId === detail.id || savingContent}
                      onClick={() => setStatus(detail.id, "rejected")}
                    >
                      却下
                    </Button>
                  </>
                )}
                {detail.status === "approved" && (
                  <Button
                    variant="outline"
                    disabled={actingId === detail.id || savingContent}
                    onClick={() => setStatus(detail.id, "unpublished")}
                  >
                    掲載を外す
                  </Button>
                )}
                {(detail.status === "rejected" || detail.status === "unpublished") && (
                  <Button
                    className="bg-gold text-gold-foreground hover:bg-gold-muted"
                    disabled={actingId === detail.id || savingContent}
                    onClick={() => setStatus(detail.id, "approved")}
                  >
                    掲載する
                  </Button>
                )}
                <Button
                  variant="destructive"
                  disabled={actingId === detail.id || savingContent}
                  onClick={() => handleDelete(detail.id)}
                >
                  <Trash2 className="size-4" />
                  削除
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
