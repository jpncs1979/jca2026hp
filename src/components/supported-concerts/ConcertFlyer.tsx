"use client";

import Image from "next/image";
import { useState } from "react";
import { FileImage } from "lucide-react";

/**
 * 後援演奏会チラシ画像。存在しない場合はプレースホルダーを表示。
 * 画像は public/images/supported-concerts/{slug}.jpg または .png に配置
 */
export function ConcertFlyer({ slug, alt }: { slug: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const [triedPng, setTriedPng] = useState(false);

  const src = triedPng
    ? `/images/supported-concerts/${slug}.png`
    : `/images/supported-concerts/${slug}.jpg`;

  if (failed) {
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

  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={533}
      className="size-full rounded-xl object-cover object-top shadow-lg"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 400px"
      onError={() => {
        if (!triedPng) {
          setTriedPng(true);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
