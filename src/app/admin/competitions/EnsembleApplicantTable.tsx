"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Copy, ExternalLink } from "lucide-react";

export type EnsembleApplicantRow = {
  id: string;
  name: string;
  category: string;
  member_type: string;
  email: string | null;
  video_url: string | null;
  payment_status: string;
  final_fee_status: "paid" | "free" | null;
  final_fee_amount: number | null;
  final_performer_count: number | null;
  /** 本選参加料の支払いリンク（審査料支払い済みの団体だけ） */
  finalFeeUrl: string | null;
  created_at: string;
};

function finalFeeLabel(a: EnsembleApplicantRow): string {
  if (a.final_fee_status === "paid") {
    return `支払済 ${a.final_performer_count ?? "?"}名・${(a.final_fee_amount ?? 0).toLocaleString("ja-JP")}円`;
  }
  if (a.final_fee_status === "free") return `0円で確定 ${a.final_performer_count ?? "?"}名`;
  return "未";
}

export function EnsembleApplicantTable({ applicants }: { applicants: EnsembleApplicantRow[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>団体名</TableHead>
            <TableHead>部門</TableHead>
            <TableHead>会員種別</TableHead>
            <TableHead>動画</TableHead>
            <TableHead>審査料</TableHead>
            <TableHead>本選参加料</TableHead>
            <TableHead>支払いリンク（通過団体へのメールに貼る）</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applicants.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">
                {a.name}
                {a.email ? <div className="text-xs text-muted-foreground">{a.email}</div> : null}
              </TableCell>
              <TableCell>{a.category}</TableCell>
              <TableCell>{a.member_type}</TableCell>
              <TableCell>
                {a.video_url ? (
                  <a
                    href={a.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary underline"
                  >
                    視聴 <ExternalLink className="size-3" />
                  </a>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{a.payment_status === "paid" ? "支払済" : "未"}</TableCell>
              <TableCell className="whitespace-nowrap">{finalFeeLabel(a)}</TableCell>
              <TableCell>
                {a.finalFeeUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copy(a.finalFeeUrl!, a.id)}
                    className="gap-1"
                  >
                    {copied === a.id ? (
                      <>
                        <Check className="size-4 text-green-600" /> コピーしました
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" /> リンクをコピー
                      </>
                    )}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">審査料の支払い後に表示</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
