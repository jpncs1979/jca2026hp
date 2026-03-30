"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
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
  const mypageLabel = "会員マイページ";

  const navItems = [
    { href: "/news", label: "ニュース" },
    { href: "/events#concours", label: "コンクール" },
    { href: "/events#events", label: "イベント" },
    { href: "/consultation", label: "相談室" },
    { href: "/contact", label: "問い合わせ" },
    { href: mypageHref, label: mypageLabel },
    { href: "/about", label: "協会案内" },
    { href: "/membership", label: "入会案内" },
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
        <nav className="hidden md:flex md:items-center md:gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-navy"
            >
              {item.label}
            </Link>
          ))}
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
              <nav className="mt-6 flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
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
