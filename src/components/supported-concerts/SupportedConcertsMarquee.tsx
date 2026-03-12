"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { FileImage } from "lucide-react";
import type { SupportedConcert } from "@/data/supported-concerts";

const LIST_URL = "/members/supported-concerts";

const NORMAL_SPEED = 0.6;

/** チラシサムネイル（日付順の concerts を前提） */
function FlyerThumb({ concert }: { concert: SupportedConcert }) {
  const [failed, setFailed] = useState(false);
  const [triedPng, setTriedPng] = useState(false);
  const src = triedPng
    ? `/images/supported-concerts/${concert.slug}.png`
    : `/images/supported-concerts/${concert.slug}.jpg`;

  return (
    <Link
      href={`${LIST_URL}#${concert.slug}`}
      className="group flex shrink-0 flex-col items-center gap-1 transition-transform hover:scale-[1.02]"
      title={`${concert.dateLabel} ${concert.venue}`}
    >
      <div className="relative aspect-[3/4] w-[120px] overflow-hidden rounded-lg border border-border bg-muted/50 shadow-md sm:w-[140px]">
        {failed ? (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <FileImage className="size-8" />
          </div>
        ) : (
          <Image
            src={src}
            alt={`${concert.dateLabel} ${concert.venue} チラシ`}
            width={140}
            height={187}
            className="size-full object-cover object-top"
            sizes="140px"
            onError={() => {
              if (!triedPng) setTriedPng(true);
              else setFailed(true);
            }}
          />
        )}
      </div>
      <span className="max-w-[120px] truncate text-xs text-muted-foreground group-hover:text-gold sm:max-w-[140px]">
        {concert.dateLabel}
      </span>
    </Link>
  );
}

/** チラシを横に流し、ドラッグ・スワイプでスクロール、クリックで該当公演へ */
export function SupportedConcertsMarquee({
  concerts,
}: {
  concerts: SupportedConcert[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstSetRef = useRef<HTMLDivElement>(null);

  const [scrollOffset, setScrollOffset] = useState(0);
  const [setWidth, setSetWidth] = useState(0);

  const rafRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const scrollOffsetRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const clickTargetRef = useRef<string | null>(null); // 押し始めたリンクの href（クリック時のみ遷移用）
  scrollOffsetRef.current = scrollOffset;

  // 1セット分の幅を計測
  useEffect(() => {
    const el = firstSetRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSetWidth(el.offsetWidth);
    });
    ro.observe(el);
    setSetWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, [concerts]);

  // アニメーションループ（ドラッグ中は止める）
  useEffect(() => {
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.2);
      lastTime = now;
      if (isDraggingRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      setScrollOffset((prev) => {
        let next = prev + NORMAL_SPEED * dt * 60;
        if (setWidth > 0) {
          while (next >= setWidth) next -= setWidth;
          while (next < 0) next += setWidth;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [setWidth]);

  const touchStartRef = useRef<{ x: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0]!.clientX };
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartRef.current;
      if (!start) return;
      const dx = e.touches[0]!.clientX - start.x;
      if (dx !== 0) hasDraggedRef.current = true;
      setScrollOffset((prev) => {
        let next = prev - dx;
        if (setWidth > 0) {
          while (next >= setWidth) next -= setWidth;
          while (next < 0) next += setWidth;
        }
        return next;
      });
      touchStartRef.current = { x: e.touches[0]!.clientX };
    },
    [setWidth]
  );

  const onTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  // マウス・ポインター：押している最中にドラッグでスクロール、離しただけならそのチラシへ遷移
  const dragRef = useRef<{ x: number; startOffset: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.target !== containerRef.current && !trackRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      hasDraggedRef.current = false;
      const target = e.target as Element;
      const link = target.closest?.("a");
      clickTargetRef.current = link?.getAttribute("href") ?? null;
      dragRef.current = { x: e.clientX, startOffset: scrollOffsetRef.current };
      isDraggingRef.current = true;
      containerRef.current?.setPointerCapture(e.pointerId);
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (dx !== 0) hasDraggedRef.current = true;
      let next = drag.startOffset - dx;
      if (setWidth > 0) {
        while (next >= setWidth) next -= setWidth;
        while (next < 0) next += setWidth;
      }
      setScrollOffset(next);
      dragRef.current = { x: e.clientX, startOffset: next };
    },
    [setWidth]
  );

  const onPointerUpOrLeave = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const wasDragging = hasDraggedRef.current;
    const href = clickTargetRef.current;
    containerRef.current?.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    isDraggingRef.current = false;
    clickTargetRef.current = null;
    if (!wasDragging && href) {
      window.location.href = href;
    }
  }, []);

  const onContainerClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="relative -mx-4 py-2 md:-mx-6">
      <p className="mb-2 px-4 text-xs text-muted-foreground md:px-6">
        ドラッグまたはスワイプでスクロール、クリックで公演詳細へ
      </p>
      <div
        ref={containerRef}
        className="relative cursor-grab overflow-hidden touch-pan-y active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUpOrLeave}
        onPointerLeave={onPointerUpOrLeave}
        onClickCapture={onContainerClick}
      >
        <div
          ref={trackRef}
          className="flex w-max gap-4 px-4 md:px-6"
          style={{ transform: `translateX(${-scrollOffset}px)` }}
        >
          <div ref={firstSetRef} className="flex shrink-0 gap-4">
            {concerts.map((concert) => (
              <FlyerThumb key={concert.slug} concert={concert} />
            ))}
          </div>
          <div className="flex shrink-0 gap-4">
            {concerts.map((concert) => (
              <FlyerThumb key={`${concert.slug}-dup`} concert={concert} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
