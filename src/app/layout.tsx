import type { Metadata } from "next";
import Link from "next/link";
import { Black_Han_Sans, Noto_Sans_KR } from "next/font/google";
import { Clapperboard, LogIn, Ticket } from "lucide-react";

import "./globals.css";
import "@xyflow/react/dist/style.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";

const bodyFont = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-body",
  display: "swap"
});

const displayFont = Black_Han_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap"
});

export const metadata: Metadata = {
  title: "StoryLog",
  description: "Spoiler-safe story memory notes for long narratives."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className={bodyFont.className}>
        <div className="cinema-shell min-h-screen">
          <div className="cinema-header-accent" />
          <header className="cinema-header sticky top-0 z-40">
            <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
              <Link href="/" className="group flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_rgba(231,26,15,0.45)]">
                  <Clapperboard className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="cinema-title text-xl tracking-tight">
                  Story<span className="text-primary">Log</span>
                </span>
              </Link>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/">홈</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/works" className="gap-1.5">
                    <Ticket className="hidden h-4 w-4 sm:inline" aria-hidden="true" />
                    내 작품
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/login">
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    로그인
                  </Link>
                </Button>
              </div>
            </nav>
          </header>
          <main className="pb-28">{children}</main>
          <footer className="hidden border-t border-white/5 py-8 text-center text-xs text-muted-foreground sm:block sm:pb-28">
            StoryLog · 스포일러 없는 시네마 메모리
          </footer>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
