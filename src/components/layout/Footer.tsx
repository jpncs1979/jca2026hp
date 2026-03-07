import Image from "next/image";
import Link from "next/link";

const footerNavItems = [
  { href: "/news", label: "ニュース" },
  { href: "/events", label: "イベント・コンクール" },
  { href: "/learn", label: "学ぶ・相談する" },
  { href: "/about", label: "協会案内" },
  { href: "/membership", label: "入会案内" },
] as const;

const footerLegalItems = [
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/terms", label: "利用規約" },
] as const;

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-navy text-navy-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand & description */}
          <div className="max-w-sm">
            <Link href="/" className="block w-fit">
              <Image
                src="/images/logowhite.png"
                alt="JCA 一般社団法人 日本クラリネット協会"
                width={160}
                height={56}
                className="h-10 w-auto md:h-12"
              />
            </Link>
            <p className="mt-3 text-sm text-white/80">
              クラリネットの普及・発展を目的に、中高生からプロ奏者、愛好家まで、
              幅広い層の皆様にクラリネットの魅力をお届けしています。
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
            <nav>
              <h3 className="mb-3 text-sm font-semibold text-gold">
                サイトナビゲーション
              </h3>
              <ul className="flex flex-col gap-2">
                {footerNavItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/90 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav>
              <h3 className="mb-3 text-sm font-semibold text-gold">
                お問い合わせ
              </h3>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-white/90 transition-colors hover:text-white"
                  >
                    お問い合わせ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mypage"
                    className="text-sm text-white/90 transition-colors hover:text-white"
                  >
                    会員マイページ
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 sm:flex-row">
          <nav className="flex gap-6">
            {footerLegalItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs text-white/70 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-white/60">
            © {currentYear} 一般社団法人 日本クラリネット協会
          </p>
        </div>
      </div>
    </footer>
  );
}
