"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

type Props = {
  competitionSlug: string;
  disabled?: boolean;
};

export function CompetitionApplicantsCsvButton({ competitionSlug, disabled }: Props) {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/competitions/${encodeURIComponent(competitionSlug)}/applications-csv`,
        { credentials: "same-origin" }
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        alert(j.error ?? "CSV の取得に失敗しました。");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      let filename = `${competitionSlug}_applications.csv`;
      const m = cd?.match(/filename="([^"]+)"/);
      if (m?.[1]) filename = m[1];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 gap-2"
      disabled={disabled || loading}
      onClick={() => void download()}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      申込一覧CSV
    </Button>
  );
}
