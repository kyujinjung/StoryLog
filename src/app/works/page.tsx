import Link from "next/link";
import { Clapperboard, Plus } from "lucide-react";

import { AuthState } from "@/components/works/auth-state";
import { WorksSearchGrid } from "@/components/works/works-search";
import { Button } from "@/components/ui/button";
import { getAuthDataState, listWorks } from "@/lib/data/storylog";

export const dynamic = "force-dynamic";

export default async function WorksPage() {
  const authState = await getAuthDataState();

  if (authState.status !== "ready") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <AuthState status={authState.status} />
      </div>
    );
  }

  const works = await listWorks();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="cinema-section-label">MY TICKETS</p>
          <h1 className="cinema-title mt-2 text-3xl sm:text-4xl">내 작품</h1>
          <p className="mt-2 text-muted-foreground">
            포스터 · 검색 · 유형 필터로 상영 목록을 관리합니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/works/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            새 상영작
          </Link>
        </Button>
      </div>

      {works.length === 0 ? (
        <div className="cinema-card rounded-2xl p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Clapperboard className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="cinema-title mt-5 text-2xl">아직 상영 목록이 비어 있습니다</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            첫 작품을 등록하고 포스터·회차 티켓을 만들어 보세요.
          </p>
          <Button asChild className="mt-6">
            <Link href="/works/new">작품 만들기</Link>
          </Button>
        </div>
      ) : (
        <WorksSearchGrid works={works} />
      )}
    </div>
  );
}
