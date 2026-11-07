"use client";

import { useState } from "react";
import { FileImage, FileText } from "lucide-react";

/**
 * 後援演奏会チラシ。申請時に添付された画像 / PDF を表示する。
 * PDF は1ページ目を画像にして見せ、クリックで元の PDF を開く。
 */
export function ConcertFlyer({
  flyerUrl,
  flyerImageUrl,
  flyerIsPdf,
  alt,
}: {
  flyerUrl: string | null;
  flyerImageUrl?: string | null;
  flyerIsPdf?: boolean;
  alt: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

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
    const imageUrl = flyerImageUrl ?? null;
    return (
      <a
        href={flyerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block size-full overflow-hidden rounded-xl border border-border bg-muted/40 text-navy shadow-lg"
        aria-label={`${alt}（PDFを開く）`}
      >
        {imageUrl && !imageFailed ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={alt}
              className="size-full object-cover object-top"
              onError={() => setImageFailed(true)}
            />
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-navy/85 px-2 py-1 text-xs font-medium text-white shadow transition-colors group-hover:bg-navy">
              <FileText className="size-3.5" />
              PDFを開く
            </span>
          </>
        ) : (
          <span className="flex aspect-[3/4] size-full flex-col items-center justify-center gap-3 transition-colors hover:bg-muted">
            <FileText className="size-12 text-gold" />
            <span className="text-sm font-medium">チラシ（PDF）を開く</span>
          </span>
        )}
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
