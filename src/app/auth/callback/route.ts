import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

function getRedirectBase(request: NextRequest) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";

  if (!isLocal && forwardedHost) {
    return `https://${forwardedHost}`;
  }

  return url.origin;
}

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/works";
  }

  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));
  const base = getRedirectBase(request);
  const errorRedirect = `${base}/login?error=auth_callback`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${base}/login?error=missing_env`);
  }

  // Build redirect response first so auth cookies can be written onto it.
  const successRedirect = NextResponse.redirect(`${base}${next}`);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          successRedirect.cookies.set(name, value, options);
        });
      }
    }
  });

  // PKCE / OAuth style: ?code=
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession", error.message);
      return NextResponse.redirect(
        `${errorRedirect}&message=${encodeURIComponent(error.message)}`
      );
    }

    return successRedirect;
  }

  // Magic link / OTP style: ?token_hash=&type=
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash
    });

    if (error) {
      console.error("[auth/callback] verifyOtp", error.message);
      return NextResponse.redirect(
        `${errorRedirect}&message=${encodeURIComponent(error.message)}`
      );
    }

    return successRedirect;
  }

  // Implicit hash tokens are handled client-side only; nothing to do here.
  console.error("[auth/callback] missing code/token_hash", {
    hasCode: Boolean(code),
    hasTokenHash: Boolean(tokenHash),
    type
  });

  return NextResponse.redirect(
    `${errorRedirect}&message=${encodeURIComponent(
      "로그인 링크에 인증 코드가 없습니다. 이메일의 링크를 다시 열어 주세요."
    )}`
  );
}
