"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Home, PlusCircle, Ticket, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "홈", icon: Home, match: (path: string) => path === "/" },
  {
    href: "/works",
    label: "내 작품",
    icon: Ticket,
    match: (path: string) =>
      path === "/works" ||
      (path.startsWith("/works/") && !path.startsWith("/works/new"))
  },
  {
    href: "/works/new",
    label: "등록",
    icon: PlusCircle,
    match: (path: string) => path.startsWith("/works/new")
  },
  {
    href: "/login",
    label: "MY",
    icon: UserRound,
    match: (path: string) => path.startsWith("/login")
  }
] as const;

export function BottomNav() {
  const pathname = usePathname() || "/";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      aria-label="하단 메뉴"
    >
      <div className="cinema-header-accent" />
      <ul className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);

          return (
            <li key={item.href} className="contents">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                  active ? "text-primary" : "text-white/50 hover:text-white/80"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                    active
                      ? "bg-primary/15 shadow-[0_0_16px_rgba(231,26,15,0.35)]"
                      : "bg-transparent"
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5", active && "stroke-[2.5]")}
                    aria-hidden="true"
                  />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <span className="sr-only">
        <Clapperboard />
      </span>
    </nav>
  );
}
