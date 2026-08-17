"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Mail, Ticket, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";

type AuthMode = "magic" | "password-login" | "password-signup";

function friendlyAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("email rate limit")) {
    return [
      "이메일 발송 한도를 초과했습니다.",
      "1시간 후 다시 시도하거나, 비밀번호 로그인을 사용하세요."
    ].join("\n");
  }

  if (
    lower.includes("user already registered") ||
    lower.includes("already been registered") ||
    lower.includes("already registered")
  ) {
    return [
      "이미 가입된 이메일입니다.",
      "「비밀번호 로그인」 탭에서 로그인해 주세요.",
      "비밀번호를 모르면 Supabase → Authentication → Users 에서",
      "해당 유저를 열고 비밀번호를 다시 설정하세요."
    ].join("\n");
  }

  if (lower.includes("invalid login credentials")) {
    return [
      "이메일 또는 비밀번호가 올바르지 않습니다.",
      "",
      "확인 사항:",
      "1) 이메일이 맞는지",
      "2) Supabase Users 에서 그 계정 비밀번호를 방금 설정했는지",
      "3) 설정한 비밀번호 그대로 입력했는지",
      "",
      "매직 링크로만 만든 계정은 비밀번호가 없을 수 있습니다.",
      "Users → 유저 선택 → 비밀번호 설정 후 다시 로그인하세요."
    ].join("\n");
  }

  if (lower.includes("email not confirmed")) {
    return [
      "이메일 미확인 계정입니다.",
      "Supabase → Authentication → Providers → Email",
      "→ Confirm email 을 OFF 로 끄거나,",
      "Users 에서 해당 유저를 Confirm 처리하세요."
    ].join("\n");
  }

  return message;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("password-login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [callbackHint, setCallbackHint] = useState("/auth/callback");

  const supabase = useMemo(() => {
    if (!hasSupabaseEnv()) {
      return null;
    }

    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setCallbackHint(`${window.location.origin}/auth/callback`);

    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error) {
      setStatus(
        message
          ? friendlyAuthError(decodeURIComponent(message))
          : "로그인에 실패했습니다."
      );
    }

    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/works");
        router.refresh();
      }
    });
  }, [router, searchParams, supabase]);

  function goWorks() {
    // Full navigation so root layout re-reads the session (logout button, etc.).
    // Note: location.assign is a function — do not assign to it as a property.
    window.location.href = "/works";
  }

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    if (!supabase) {
      setStatus("Supabase 환경 변수를 먼저 설정해 주세요.");
      setIsSubmitting(false);
      return;
    }

    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/works")}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true
      }
    });

    setStatus(
      error
        ? friendlyAuthError(error.message)
        : `로그인 링크를 보냈습니다.\n${origin}/auth/callback`
    );
    setIsSubmitting(false);
  }

  /** Login only — never calls signUp. */
  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    if (!supabase) {
      setStatus("Supabase 환경 변수를 먼저 설정해 주세요.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setStatus("비밀번호는 6자 이상이어야 합니다.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      setStatus(friendlyAuthError(error.message));
      setIsSubmitting(false);
      return;
    }

    if (!data.session) {
      setStatus(
        "세션이 만들어지지 않았습니다. Confirm email 설정을 확인하세요."
      );
      setIsSubmitting(false);
      return;
    }

    goWorks();
  }

  /** Sign-up only — if already registered, tell user to use login tab. */
  async function handlePasswordSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    if (!supabase) {
      setStatus("Supabase 환경 변수를 먼저 설정해 주세요.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setStatus("비밀번호는 6자 이상이어야 합니다.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/works`
      }
    });

    if (error) {
      setStatus(friendlyAuthError(error.message));
      if (
        error.message.toLowerCase().includes("already") ||
        error.message.toLowerCase().includes("registered")
      ) {
        setMode("password-login");
      }
      setIsSubmitting(false);
      return;
    }

    if (data.session) {
      goWorks();
      return;
    }

    // No session: either confirm-email is on, or user already existed (identities empty trick).
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setStatus(
        [
          "이미 가입된 이메일입니다.",
          "「비밀번호 로그인」으로 전환해 로그인하세요.",
          "비밀번호가 없으면 Supabase Users 에서 설정하세요."
        ].join("\n")
      );
      setMode("password-login");
      setIsSubmitting(false);
      return;
    }

    setStatus(
      [
        "가입 요청은 처리됐지만 바로 로그인되지 않았습니다.",
        "Providers → Email → Confirm email 을 OFF 로 끄거나,",
        "확인 메일 후 「비밀번호 로그인」을 사용하세요."
      ].join("\n")
    );
    setMode("password-login");
    setIsSubmitting(false);
  }

  async function handleResetPassword() {
    setIsSubmitting(true);
    setStatus(null);

    if (!supabase) {
      setStatus("Supabase 환경 변수를 먼저 설정해 주세요.");
      setIsSubmitting(false);
      return;
    }

    if (!email.trim()) {
      setStatus("이메일을 입력한 뒤 재설정을 눌러 주세요.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/works`
    });

    setStatus(
      error
        ? friendlyAuthError(error.message)
        : "재설정 메일을 보냈습니다. 한도에 걸리면 대시보드 Users 에서 비밀번호를 직접 설정하세요."
    );
    setIsSubmitting(false);
  }

  const onSubmit =
    mode === "magic"
      ? handleMagicLink
      : mode === "password-signup"
        ? handlePasswordSignup
        : handlePasswordLogin;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-14">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_30px_rgba(231,26,15,0.4)]">
          <Ticket className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="cinema-section-label">MEMBER TICKET</p>
        <h1 className="cinema-title mt-2 text-3xl">로그인</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          이미 가입했다면 「비밀번호 로그인」만 사용하세요.
        </p>
      </div>

      <div className="cinema-card grid grid-cols-3 gap-1 rounded-2xl p-1">
        {(
          [
            ["password-login", "로그인"],
            ["password-signup", "회원가입"],
            ["magic", "매직링크"]
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`rounded-xl px-2 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              mode === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => {
              setMode(value);
              setStatus(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
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

        {mode !== "magic" ? (
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="6자 이상"
              autoComplete={
                mode === "password-signup" ? "new-password" : "current-password"
              }
              required
              minLength={6}
            />
          </div>
        ) : null}

        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {mode === "magic" ? (
            <>
              <Mail className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "전송 중" : "매직 링크 받기"}
            </>
          ) : mode === "password-signup" ? (
            <>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "가입 중" : "회원가입"}
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "로그인 중" : "로그인"}
            </>
          )}
        </Button>

        {mode === "password-login" ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={isSubmitting}
            onClick={() => void handleResetPassword()}
          >
            비밀번호 재설정 메일
          </Button>
        ) : null}

        {status ? (
          <p className="whitespace-pre-wrap rounded-xl bg-muted px-3 py-2 text-left text-sm text-muted-foreground">
            {status}
          </p>
        ) : null}

        {mode === "password-login" ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-3 text-xs leading-5 text-muted-foreground">
            <p className="font-semibold text-foreground">
              「이미 가입된 이메일」이 뜰 때
            </p>
            <p className="mt-1">
              회원가입 탭이 아니라 <strong>로그인</strong> 탭을 쓰세요.
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>
                <a
                  className="text-primary underline"
                  href="https://supabase.com/dashboard/project/yblsvtjcutfpxlsjkfgj/auth/users"
                  target="_blank"
                  rel="noreferrer"
                >
                  Users
                </a>
                에서 이메일 확인
              </li>
              <li>비밀번호를 대시보드에서 설정</li>
              <li>이 화면 「로그인」에 그 비밀번호 입력</li>
            </ol>
          </div>
        ) : null}

        {mode === "magic" ? (
          <p className="text-xs text-muted-foreground">
            Redirect:{" "}
            <code className="break-all text-[11px] text-primary/90">
              {callbackHint}
            </code>
          </p>
        ) : null}
      </form>
    </div>
  );
}
