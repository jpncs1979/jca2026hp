import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <Link
            href="/"
            className="flex shrink-0 flex-col items-center gap-2 transition-opacity hover:opacity-80 md:items-start"
            aria-label="日本クラリネット協会 トップページ"
          >
            <Image
              src="/images/logo.png"
              alt="JCA 一般社団法人 日本クラリネット協会"
              width={160}
              height={56}
              className="h-12 w-auto"
            />
            <p className="max-w-xs text-sm text-muted-foreground">
              クラリネットの普及と発展を目指し、演奏・教育・研究の支援を行っています。
            </p>
          </Link>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-border pt-8 text-center text-sm text-muted-foreground md:flex-row md:justify-between md:text-left">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-start">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              利用規約
            </Link>
          </div>
          <p className="font-soft">© {new Date().getFullYear()} 一般社団法人日本クラリネット協会</p>
        </div>
      </div>
    </footer>
  );
}
