"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/news", label: "ニュース" },
  { href: "/events#concours", label: "コンクール" },
  { href: "/events#events", label: "イベント" },
  { href: "/consultation", label: "相談室" },
  { href: "/about", label: "協会案内" },
  { href: "/membership", label: "入会案内" },
] as const;

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
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
  const mypageLabel = isAdmin === true ? "事務局管理" : "会員マイページ";

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

        {/* Right side buttons - Desktop */}
        <div className="hidden md:flex md:items-center md:gap-2">
          <Link href={mypageHref}>
            <Button variant="outline" size="sm">
              {mypageLabel}
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold-muted">
              お問い合わせ
            </Button>
          </Link>
        </div>

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
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  <Link href={mypageHref} onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {mypageLabel}
                    </Button>
                  </Link>
                  <Link href="/contact" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-gold text-gold-foreground hover:bg-gold-muted">
                      お問い合わせ
                    </Button>
                  </Link>
                </div>
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
