import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-14 text-center text-muted-foreground">
          로그인 화면을 불러오는 중…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
