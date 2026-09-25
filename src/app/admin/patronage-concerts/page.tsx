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
import { Loader2, Check, X, EyeOff, RotateCcw, Trash2, FileUp } from "lucide-react";
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

export default function AdminPatronageConcertsPage() {
  const [items, setItems] = useState<PatronageConcertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PatronageConcertRow | null>(null);
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
    setDetail(item);
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
          にそのまま掲載されます。承諾書の発送は別途行ってください。
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
            setFlyerDraft(null);
            setFlyerMessage(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.concert_title}</DialogTitle>
                <DialogDescription>
                  申請内容の確認です。チラシが未着でも承認できます。届いたファイルはこの画面から登録してください。
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
                <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">状態</dt>
                  <dd>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[detail.status]}`}
                    >
                      {STATUS_LABEL[detail.status]}
                    </span>
                  </dd>
                  <dt className="text-muted-foreground">公演日</dt>
                  <dd>{detail.event_date}</dd>
                  <dt className="text-muted-foreground">開場 / 開演</dt>
                  <dd>
                    {detail.doors_open} / {detail.curtain_time}
                  </dd>
                  <dt className="text-muted-foreground">会場</dt>
                  <dd>{detail.venue}</dd>
                  <dt className="text-muted-foreground">入場料</dt>
                  <dd className="whitespace-pre-wrap">{detail.admission}</dd>
                  <dt className="text-muted-foreground">出演者</dt>
                  <dd className="whitespace-pre-wrap">{detail.performers}</dd>
                  <dt className="text-muted-foreground">曲目</dt>
                  <dd className="whitespace-pre-wrap">{detail.program}</dd>
                  <dt className="text-muted-foreground">主催</dt>
                  <dd>{detail.organizer}</dd>
                  <dt className="text-muted-foreground">問い合わせ（案内ページに掲載）</dt>
                  <dd className="whitespace-pre-wrap">{detail.contact}</dd>
                  <dt className="text-muted-foreground">申請者</dt>
                  <dd>
                    {detail.applicant_name}
                    {detail.member_number ? `（会員番号 ${detail.member_number}）` : ""}
                    <br />
                    {detail.applicant_email}
                  </dd>
                  <dt className="text-muted-foreground">承諾書送先</dt>
                  <dd className="whitespace-pre-wrap">{detail.consent_destination}</dd>
                  {detail.notes ? (
                    <>
                      <dt className="text-muted-foreground">備考（案内ページには掲載しません）</dt>
                      <dd className="whitespace-pre-wrap">{detail.notes}</dd>
                    </>
                  ) : null}
                </dl>
              </div>
              <DialogFooter className="gap-2">
                {detail.status === "pending" && (
                  <>
                    <Button
                      className="bg-gold text-gold-foreground hover:bg-gold-muted"
                      disabled={actingId === detail.id}
                      onClick={() => setStatus(detail.id, "approved")}
                    >
                      <Check className="size-4" />
                      承認して掲載する
                    </Button>
                    <Button
                      variant="outline"
                      disabled={actingId === detail.id}
                      onClick={() => setStatus(detail.id, "rejected")}
                    >
                      却下
                    </Button>
                  </>
                )}
                {detail.status === "approved" && (
                  <Button
                    variant="outline"
                    disabled={actingId === detail.id}
                    onClick={() => setStatus(detail.id, "unpublished")}
                  >
                    掲載を外す
                  </Button>
                )}
                {(detail.status === "rejected" || detail.status === "unpublished") && (
                  <Button
                    className="bg-gold text-gold-foreground hover:bg-gold-muted"
                    disabled={actingId === detail.id}
                    onClick={() => setStatus(detail.id, "approved")}
                  >
                    掲載する
                  </Button>
                )}
                <Button
                  variant="destructive"
                  disabled={actingId === detail.id}
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
