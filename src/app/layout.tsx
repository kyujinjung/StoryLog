import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, LogIn } from "lucide-react";

import "./globals.css";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";

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
    <html lang="ko">
      <body>
        <div className="min-h-screen">
          <header className="border-b bg-card">
            <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                <span>StoryLog</span>
              </Link>
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/">홈</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/works">작품</Link>
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
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
