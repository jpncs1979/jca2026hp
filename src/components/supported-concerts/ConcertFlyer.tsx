"use client";

import { FileImage, FileText } from "lucide-react";

/**
 * 後援演奏会チラシ。申請時に添付された画像 / PDF を表示する。
 */
export function ConcertFlyer({
  flyerUrl,
  flyerIsPdf,
  alt,
}: {
  flyerUrl: string | null;
  flyerIsPdf?: boolean;
  alt: string;
}) {
  if (!flyerUrl) {
    return (
      <div
        className="flex aspect-[3/4] w-full items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/50"
        aria-label={`${alt}のチラシ（準備中）`}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <FileImage className="size-12" />
          <span className="text-sm font-medium">チラシ準備中</span>
        </div>
      </div>
    );
  }

  if (flyerIsPdf) {
    return (
      <a
        href={flyerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/40 text-navy shadow-lg transition-colors hover:bg-muted"
        aria-label={`${alt}のチラシ（PDF）`}
      >
        <FileText className="size-12 text-gold" />
        <span className="text-sm font-medium">チラシ（PDF）を開く</span>
      </a>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flyerUrl}
      alt={alt}
      className="size-full rounded-xl object-cover object-top shadow-lg"
    />
  );
}
