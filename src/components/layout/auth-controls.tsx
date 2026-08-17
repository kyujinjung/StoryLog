import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";

import { signOutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

type AuthControlsProps = {
  isLoggedIn: boolean;
  /** Optional short label for email display */
  email?: string | null;
};

export function AuthControls({ isLoggedIn, email }: AuthControlsProps) {
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        {email ? (
          <span
            className="hidden max-w-[10rem] truncate text-xs text-muted-foreground md:inline"
            title={email}
          >
            {email}
          </span>
        ) : null}
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" size="sm">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">로그아웃</span>
          </Button>
        </form>
      </div>
    );
  }

  return (
    <Button asChild size="sm">
      <Link href="/login">
        <LogIn className="h-4 w-4" aria-hidden="true" />
        로그인
      </Link>
    </Button>
  );
}
