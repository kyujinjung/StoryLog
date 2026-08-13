"use client";

import { FormEvent, useMemo, useState } from "react";
import { Mail, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    if (!supabase) {
      setStatus("Supabase 환경 변수를 먼저 설정해 주세요.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/works`
      }
    });

    setStatus(error ? error.message : "로그인 링크를 이메일로 보냈습니다.");
    setIsSubmitting(false);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-14">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_30px_rgba(231,26,15,0.4)]">
          <Ticket className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="cinema-section-label">MEMBER TICKET</p>
        <h1 className="cinema-title mt-2 text-3xl">로그인</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          이메일 매직 링크로 StoryLog 상영관에 입장합니다.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="cinema-card space-y-5 rounded-2xl p-6 sm:p-8"
      >
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <Button className="w-full" type="submit" disabled={isSubmitting}>
          <Mail className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? "전송 중" : "매직 링크 받기"}
        </Button>

        {status ? (
          <p className="rounded-xl bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
            {status}
          </p>
        ) : null}
      </form>
    </div>
  );
}
