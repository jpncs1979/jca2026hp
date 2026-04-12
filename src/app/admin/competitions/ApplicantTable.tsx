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
import { ExternalLink, Copy, Check } from "lucide-react";

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

export function ApplicantTable({ applicants }: { applicants: Applicant[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>氏名</TableHead>
            <TableHead>ふりがな</TableHead>
            <TableHead>部門</TableHead>
            <TableHead>予選課題曲</TableHead>
            <TableHead>本選課題曲</TableHead>
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
              <TableCell className="font-medium">{a.name}</TableCell>
              <TableCell>{a.furigana}</TableCell>
              <TableCell>{a.category}</TableCell>
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
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    a.payment_status === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {a.payment_status === "paid" ? "入金済" : "未入金"}
                </span>
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
