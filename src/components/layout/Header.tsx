"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // Sheet (Base UI) の動的 ID による hydration エラー回避のため、クライアントマウント後のみ描画する
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const res = await fetch("/api/mypage/admin-check");
        const { isAdmin: admin } = await res.json();
        setIsAdmin(admin === true);
      } catch {
        setIsAdmin(false);
      }
    });
  }, []);

  const mypageHref = isAdmin === true ? "/admin" : "/mypage";

  const associationMenu = [
    { href: "/membership", label: "入会案内" },
    { href: "/about", label: "協会案内" },
    { href: "/contact", label: "問い合わせ" },
  ] as const;

  const eventsMenu = [
    { href: "/events#concours", label: "コンクール" },
    { href: "/events#events", label: "フェスティバル" },
    { href: "/members/supported-concerts", label: "会員後援演奏会" },
  ] as const;

  const inquiryMenu = [
    { href: "/contact", label: "問い合わせ" },
    { href: "/consultation", label: "相談室" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-80"
          aria-label="日本クラリネット協会 トップページ"
        >
          <Image
            src="/images/logo.png"
            alt="JCA 一般社団法人 日本クラリネット協会"
            width={140}
            height={48}
            className="h-10 w-auto md:h-12"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-0.5">
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-0.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-navy"
              aria-expanded="false"
              aria-haspopup="menu"
            >
              協会案内
              <ChevronDown className="size-4 opacity-70" aria-hidden />
            </button>
            <ul
              role="menu"
              className="invisible absolute left-0 top-full z-50 mt-1 min-w-[11rem] rounded-lg border border-border bg-white py-1 shadow-md opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              {associationMenu.map((item) => (
                <li key={item.href} role="none">
                  <Link
                    role="menuitem"
                    href={item.href}
                    className="block px-3 py-2 text-sm text-foreground hover:bg-muted hover:text-navy"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-0.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-navy"
              aria-expanded="false"
              aria-haspopup="menu"
            >
              イベント
              <ChevronDown className="size-4 opacity-70" aria-hidden />
            </button>
            <ul
              role="menu"
              className="invisible absolute left-0 top-full z-50 mt-1 min-w-[11rem] rounded-lg border border-border bg-white py-1 shadow-md opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              {eventsMenu.map((item) => (
                <li key={item.href} role="none">
                  <Link
                    role="menuitem"
                    href={item.href}
                    className="block px-3 py-2 text-sm text-foreground hover:bg-muted hover:text-navy"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-0.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-navy"
              aria-expanded="false"
              aria-haspopup="menu"
            >
              問い合わせ
              <ChevronDown className="size-4 opacity-70" aria-hidden />
            </button>
            <ul
              role="menu"
              className="invisible absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-lg border border-border bg-white py-1 shadow-md opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              {inquiryMenu.map((item) => (
                <li key={item.href} role="none">
                  <Link
                    role="menuitem"
                    href={item.href}
                    className="block px-3 py-2 text-sm text-foreground hover:bg-muted hover:text-navy"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={mypageHref}
            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-navy"
          >
            会員マイページ
          </Link>
        </nav>

        {/* Mobile menu trigger - Sheet はクライアントマウント後のみ描画（Base UI の動的 ID による hydration エラー回避） */}
        {mounted ? (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="inline-flex size-8 items-center justify-center rounded-lg md:hidden hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="メニューを開く"
            >
              <Menu className="size-6" aria-hidden />
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>メニュー</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4 text-sm">
                <div>
                  <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    協会案内
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {associationMenu.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-3 py-2 font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    イベント
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {eventsMenu.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-3 py-2 font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    問い合わせ
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {inquiryMenu.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-3 py-2 font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <Link
                  href={mypageHref}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 font-medium text-foreground transition-colors hover:bg-muted"
                >
                  会員マイページ
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg md:hidden hover:bg-muted"
            aria-label="メニューを開く"
          >
            <Menu className="size-6" aria-hidden />
          </button>
        )}
      </div>
    </header>
  );
}
