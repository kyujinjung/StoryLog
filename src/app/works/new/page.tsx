import Link from "next/link";

import { AuthState } from "@/components/works/auth-state";
import { CreateWorkForm } from "@/components/works/create-work-form";
import { Button } from "@/components/ui/button";
import { getAuthDataState } from "@/lib/data/storylog";

export const dynamic = "force-dynamic";

export default async function NewWorkPage() {
  const authState = await getAuthDataState();

  if (authState.status !== "ready") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <AuthState status={authState.status} />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="cinema-section-label">NEW TITLE</p>
          <h1 className="cinema-title mt-2 text-3xl">새 상영작</h1>
          <p className="mt-2 text-muted-foreground">
            스포일러 안전 기록의 기준이 되는 작품을 만듭니다.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/works">목록</Link>
        </Button>
      </div>
      <CreateWorkForm />
    </div>
  );
}
