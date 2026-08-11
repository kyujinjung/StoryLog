import Link from "next/link";

import { Button } from "@/components/ui/button";

type AuthStateProps = {
  status: "missing-env" | "signed-out";
};

export function AuthState({ status }: AuthStateProps) {
  if (status === "missing-env") {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Supabase 설정이 필요합니다</h2>
        <p className="mt-2 leading-7 text-muted-foreground">
          `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과
          `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 설정한 뒤 개발 서버를 다시
          시작해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">로그인이 필요합니다</h2>
      <p className="mt-2 leading-7 text-muted-foreground">
        작품과 진행도는 Supabase Auth 사용자별로 저장됩니다.
      </p>
      <Button asChild className="mt-4">
        <Link href="/login">로그인으로 이동</Link>
      </Button>
    </div>
  );
}
