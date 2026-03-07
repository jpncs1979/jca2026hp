import type { Metadata } from "next";
import { Geist, Geist_Mono, M_PLUS_Rounded_1c } from "next/font/google";
import { Header, Footer } from "@/components/layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mPlusRounded = M_PLUS_Rounded_1c({
  variable: "--font-rounded",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "一般社団法人 日本クラリネット協会 公式サイト",
  description:
    "日本クラリネット協会の公式サイト。クラリネットの普及・発展を目的に、中高生からプロ奏者、愛好家まで幅広い層の皆様にクラリネットの魅力をお届けしています。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${mPlusRounded.variable} flex min-h-screen flex-col antialiased`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
