"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Trophy,
  MessageCircle,
  UserPlus,
  BookOpen,
  Globe,
} from "lucide-react";

// スクロール表示用アニメーション
function AnimatedSection({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const HERO_SLIDES = [
  {
    title: "第15回 ヤング・クラリネッティストコンクール（2026年夏）",
    copy: "次代を担う、若き才能たちへ。",
    buttons: [
      { label: "詳細", href: "/events/young-2026" },
      { label: "参加申込", href: "/events/young-2026/apply" },
    ],
    bg: "from-navy/90",
  },
  {
    title: "Road to 2029 国際フェスティバル",
    copy: "2029年、世界が日本に響き合う。",
    buttons: [{ label: "最新情報", href: "/events/festival-2029" }],
    bg: "from-navy/95",
  },
  {
    title: "協会への入会のご案内",
    copy: "会員特典・年会費・入会の流れをご確認いただけます。",
    buttons: [
      { label: "入会案内", href: "/membership" },
      { label: "入会申込", href: "/membership/join" },
    ],
    bg: "from-navy/88",
  },
  {
    title: "第３９回日本クラリネットフェスティバル in 広島",
    copy: "2027年2月26日・27日（予定）。クラリネットの祭典が広島で。",
    buttons: [{ label: "最新情報", href: "/events/festival-2027" }],
    bg: "from-navy/92",
  },
  {
    title: "クラリネット・アンサンブルコンクール",
    copy: "2027年 第19回。アンサンブルの調和と表現力を競います。",
    buttons: [
      { label: "参加要項", href: "/events/ensemble" },
      { label: "過去の受賞者", href: "/archive?competition=ensemble" },
    ],
    bg: "from-navy/93",
  },
] as const;

const HERO_SLIDE_COUNT = HERO_SLIDES.length;
const HERO_SLIDE_INTERVAL_MS = 6000;

// メインビジュアル スライド
function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentSlide((s) => (s + 1) % HERO_SLIDE_COUNT),
      HERO_SLIDE_INTERVAL_MS
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[70vh] w-full overflow-hidden">
      <Image
        src="/images/hero.png"
        alt="日本クラリネット協会"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t ${HERO_SLIDES[currentSlide].bg} via-navy/40 to-transparent`}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy/50 to-transparent" />

      <div className="container relative mx-auto flex min-h-[70vh] flex-col justify-end px-4 pb-12 pt-24 md:justify-center md:pb-20 md:pt-32">
        <div className="max-w-2xl">
          <div className="mb-4 flex items-end gap-3">
            <Image
              src="/images/logowhite.png?v=2"
              alt="JCA"
              width={120}
              height={48}
              className="h-12 w-auto shrink-0 drop-shadow-lg md:h-14"
              unoptimized
            />
            <span className="pb-0.5 text-sm font-medium text-white/95 drop-shadow-md md:pb-1 md:text-base">
              一般社団法人日本クラリネット協会
            </span>
          </div>

          <div className="relative min-h-[160px] md:min-h-[180px]">
            {HERO_SLIDES.map((slide, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  opacity: currentSlide === i ? 1 : 0,
                  pointerEvents: currentSlide === i ? "auto" : "none",
                }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                <h2 className="mb-2 text-2xl font-bold leading-tight text-white drop-shadow-md md:text-3xl">
                  {slide.title}
                </h2>
                <p className="mb-8 text-lg text-white/95 drop-shadow-md md:text-xl">
                  {slide.copy}
                </p>
                <div className="flex flex-wrap gap-3">
                  {slide.buttons.map((btn) => (
                    <Link key={btn.label} href={btn.href}>
                      <Button
                        size="lg"
                        className="bg-gold text-gold-foreground shadow-lg transition-all hover:scale-105 hover:bg-gold-muted hover:shadow-xl"
                      >
                        {btn.label}
                        <ArrowRight className="ml-2 size-4" />
                      </Button>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 flex max-w-[min(100%,20rem)] -translate-x-1/2 flex-wrap justify-center gap-1.5 px-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className={`h-2 shrink-0 rounded-full transition-all ${
                currentSlide === i ? "w-8 bg-gold" : "w-2 bg-white/50"
              }`}
              aria-label={`スライド${i + 1}へ`}
              aria-current={currentSlide === i ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ニュース（モックデータ - Supabase接続時に差し替え）
const MOCK_NEWS = [
  {
    id: "1",
    title: "第15回ヤング・クラリネッティストコンクール要項公開",
    date: "2026-02-01",
    isImportant: true,
    href: "/events/young-2026",
  },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* メインビジュアル：スライド */}
      <HeroSlider />

      {/* ニュース（トップ固定の案内 + お知らせ） */}
      <AnimatedSection
        id="news"
        className="scroll-mt-20 border-b border-border bg-muted/30 py-16 md:py-20"
      >
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="font-soft text-2xl font-medium text-navy md:text-3xl">
              ニュース
            </h2>
            <p className="mt-1 font-soft text-muted-foreground">
              協会からの最新のお知らせ
            </p>
          </div>

          <Card className="mb-10 overflow-hidden border-2 border-gold/40 bg-gradient-to-br from-gold/10 to-transparent font-soft">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/20">
                    <Globe className="size-6 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy">
                      今なら入会すると、
                      <span className="text-gold">
                        ICA（国際クラリネット協会）の会員にもなれます
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      追加費用なし。世界最大のクラリネット組織の会員特典を、JCA会員の皆さまにお届けしています。
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href="/membership/ica">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gold/50 text-gold hover:bg-gold/10"
                    >
                      詳細を見る
                    </Button>
                  </Link>
                  <Link href="/membership/join">
                    <Button
                      size="sm"
                      className="bg-gold text-gold-foreground hover:bg-gold-muted"
                    >
                      入会する
                      <ArrowRight className="ml-1 size-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <h3 className="mb-4 font-soft text-lg font-semibold text-navy">お知らせ</h3>
          <ul className="space-y-4 font-soft">
            {MOCK_NEWS.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex flex-col gap-1 rounded-lg border border-transparent p-4 transition-colors hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-foreground">{item.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.date.replace(/-/g, "/")}
                    {item.isImportant ? (
                      <span className="ml-2 rounded bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold-foreground">
                        重要
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </AnimatedSection>

      {/* 協会について・受賞者アーカイブ バナー */}
      <AnimatedSection className="border-b border-border bg-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <Link href="/about" className="group block">
              <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 px-6 py-5 transition-all hover:border-gold/50 hover:bg-gold/5 hover:shadow-md">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy">
                  <BookOpen className="size-6" />
                </div>
                <div>
                  <p className="font-medium text-navy group-hover:text-gold">協会について</p>
                  <p className="text-sm text-muted-foreground">会長挨拶・組織概要</p>
                </div>
                <ArrowRight className="ml-auto size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-gold" />
              </div>
            </Link>
            <Link href="/archive" className="group block">
              <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 px-6 py-5 transition-all hover:border-gold/50 hover:bg-gold/5 hover:shadow-md">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-gold">
                  <Trophy className="size-6" />
                </div>
                <div>
                  <p className="font-medium text-navy group-hover:text-gold">過去の受賞者アーカイブ</p>
                  <p className="text-sm text-muted-foreground">各コンクールの入賞者を年度別に閲覧</p>
                </div>
                <ArrowRight className="ml-auto size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-gold" />
              </div>
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* 協会の取り組み */}
      <AnimatedSection className="container mx-auto px-4 py-16 font-soft md:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-medium text-navy md:text-3xl">
            協会の取り組み
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/events/young-2026" className="group">
            <Card className="h-full border-0 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group-hover:border-gold/30">
              <CardHeader className="pb-2">
                <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-gold/20 text-gold-foreground">
                  <Trophy className="size-6" />
                </div>
                <CardTitle className="text-lg font-medium">ヤングコンクール</CardTitle>
                <CardDescription className="font-normal">
                  2026年夏開催。若き才能の発掘と育成
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center text-sm font-normal text-gold group-hover:underline">
                  詳細を見る
                  <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/consultation" className="group">
            <Card className="h-full border-0 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group-hover:border-gold/30">
              <CardHeader className="pb-2">
                <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-navy/10 text-navy">
                  <MessageCircle className="size-6" />
                </div>
                <CardTitle className="text-lg font-medium">クラリネット相談室</CardTitle>
                <CardDescription className="font-normal">
                  レッスンや相談のご案内
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center text-sm font-normal text-gold group-hover:underline">
                  詳しく見る
                  <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/membership" className="group">
            <Card className="h-full border-0 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group-hover:border-gold/30">
              <CardHeader className="pb-2">
                <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-navy/10 text-navy">
                  <UserPlus className="size-6" />
                </div>
                <CardTitle className="text-lg font-medium">会員募集</CardTitle>
                <CardDescription className="font-normal">
                  協会会員としてクラリネットの輪に
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center text-sm font-normal text-gold group-hover:underline">
                  入会案内
                  <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </AnimatedSection>

      {/* 国際フェスティバル 2029 セクション */}
      <AnimatedSection className="relative overflow-hidden bg-navy py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_70%_0%,rgba(201,162,39,0.15),transparent)]" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-2 text-sm font-medium tracking-[0.3em] text-gold">
              ROAD TO 2029
            </p>
            <h2 className="mb-6 text-3xl font-bold text-gold md:text-4xl">
              国際フェスティバル 2029
            </h2>
            <p className="mb-4 text-xl leading-relaxed text-white/95 md:text-2xl">
              世界が日本に響き合う。
            </p>
            <p className="mb-10 text-gold/90">
              2029年、日本クラリネット協会が国際フェスティバルを開催します。
              <br className="hidden sm:inline" />
              世界各国のクラリネット奏者が集い、交流と芸術の祭典を繰り広げます。
            </p>
            <Link href="/events/festival-2029">
              <Button
                size="lg"
                variant="outline"
                className="border-gold bg-transparent text-gold hover:bg-gold hover:text-navy"
              >
                最新情報を見る
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
