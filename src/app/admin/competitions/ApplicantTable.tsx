"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Copy, Check, Trash2 } from "lucide-react";
import {
  young2026PieceFinalColumnHeader,
  young2026PiecePreliminaryColumnHeader,
} from "@/lib/young-2026-piece-field-labels";
import { young2026CategoryLabel } from "@/lib/young-2026-apply-confirm";

export interface Applicant {
  id: string;
  name: string;
  furigana: string;
  category: string;
  selected_piece_preliminary: string | null;
  selected_piece_final: string | null;
  video_url: string | null;
  payment_status: string;
  payment_route?: string | null;
  transfer_receipt_path?: string | null;
  created_at: string;
}

type Props = {
  applicants: Applicant[];
  /** 削除API・整合性確認用（例: young-2026） */
  competitionSlug: string;
};

export function ApplicantTable({ applicants, competitionSlug }: Props) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [deleteBusy, setDeleteBusy] = useState(false);

  const applicantIds = useMemo(() => applicants.map((a) => a.id), [applicants]);
  const allSelected =
    applicantIds.length > 0 && applicantIds.every((id) => selectedIds.has(id));
  const selectionCount = selectedIds.size;

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const setBankPaymentStatus = async (applicationId: string, paid: boolean) => {
    setError(null);
    setBusyId(applicationId);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/payment-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: paid ? "paid" : "pending" }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "更新に失敗しました。");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(() => {
        if (!checked) return new Set();
        return new Set(applicantIds);
      });
    },
    [applicantIds]
  );

  const toggleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const deleteSelected = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    const names = applicants
      .filter((a) => selectedIds.has(a.id))
      .map((a) => a.name)
      .slice(0, 8);
    const namePreview = names.join("、");
    const more = ids.length > names.length ? ` 他${ids.length - names.length}件` : "";

    if (
      !window.confirm(
        `次の申込を ${ids.length} 件削除します。この操作は取り消せません。\n\n${namePreview}${more}\n\nよろしいですか？`
      )
    ) {
      return;
    }

    setError(null);
    setDeleteBusy(true);
    try {
      const res = await fetch(
        `/api/admin/competitions/${encodeURIComponent(competitionSlug)}/applications-delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ application_ids: ids }),
        }
      );
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "削除に失敗しました。");
        return;
      }
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-3 overflow-x-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {selectionCount > 0 ? (
            <span className="text-foreground">{selectionCount} 件選択中</span>
          ) : (
            "行左のチェックで選択"
          )}
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="gap-2"
          disabled={selectedIds.size === 0 || deleteBusy}
          onClick={() => void deleteSelected()}
        >
          {deleteBusy ? (
            <span className="text-xs">削除中…</span>
          ) : (
            <>
              <Trash2 className="size-4" />
              選択を削除
            </>
          )}
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 pr-0">
              <span className="sr-only">選択</span>
              <Checkbox
                aria-label="すべて選択"
                checked={allSelected}
                disabled={applicantIds.length === 0}
                onChange={(e) => toggleSelectAll(e.target.checked)}
              />
            </TableHead>
            <TableHead>氏名</TableHead>
            <TableHead>ふりがな</TableHead>
            <TableHead>部門</TableHead>
            <TableHead className="max-w-[9rem] whitespace-normal text-xs leading-tight">
              {young2026PiecePreliminaryColumnHeader()}
            </TableHead>
            <TableHead className="max-w-[9rem] whitespace-normal text-xs leading-tight">
              {young2026PieceFinalColumnHeader()}
            </TableHead>
            <TableHead>動画URL</TableHead>
            <TableHead>決済</TableHead>
            <TableHead>支払い経路</TableHead>
            <TableHead>振込証明</TableHead>
            <TableHead>申込日</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applicants.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="w-10 pr-0 align-middle">
                <Checkbox
                  aria-label={`${a.name} を選択`}
                  checked={selectedIds.has(a.id)}
                  disabled={deleteBusy}
                  onChange={(e) => toggleSelectOne(a.id, e.target.checked)}
                />
              </TableCell>
              <TableCell className="font-medium">{a.name}</TableCell>
              <TableCell>{a.furigana}</TableCell>
              <TableCell>{young2026CategoryLabel(a.category)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-sm">
                {a.selected_piece_preliminary ?? "-"}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm">
                {a.selected_piece_final ?? "-"}
              </TableCell>
              <TableCell>
                {a.video_url ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={a.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-gold hover:underline"
                    >
                      <ExternalLink className="size-4" />
                      視聴
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => copyUrl(a.video_url!, a.id)}
                    >
                      {copiedId === a.id ? (
                        <Check className="size-4 text-green-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  <span
                    className={`w-fit rounded px-2 py-0.5 text-xs ${
                      a.payment_status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {a.payment_status === "paid" ? "入金済" : "未入金"}
                  </span>
                  {a.payment_route === "bank_transfer" && a.transfer_receipt_path ? (
                    <label className="flex max-w-[11rem] cursor-pointer items-start gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        className="mt-0.5"
                        checked={a.payment_status === "paid"}
                        disabled={busyId === a.id}
                        onCheckedChange={(checked) => {
                          void setBankPaymentStatus(a.id, checked === true);
                        }}
                      />
                      <span>振込証明を確認し、入金済みにする</span>
                    </label>
                  ) : a.payment_route === "bank_transfer" && !a.transfer_receipt_path ? (
                    <span className="text-xs text-muted-foreground">証明未送信</span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {a.payment_route === "bank_transfer"
                  ? "振込"
                  : a.payment_route === "stripe_card"
                    ? "カード"
                    : "—"}
              </TableCell>
              <TableCell className="text-sm">
                {a.payment_route === "bank_transfer" ? (
                  a.transfer_receipt_path ? (
                    <a
                      href={`/api/admin/applications/${a.id}/receipt`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline"
                    >
                      表示
                    </a>
                  ) : (
                    <span className="text-muted-foreground">未送信</span>
                  )
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(a.created_at).toLocaleDateString("ja-JP")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
