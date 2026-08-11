import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";

import { AuthState } from "@/components/works/auth-state";
import { Button } from "@/components/ui/button";
import { getAuthDataState, listWorks } from "@/lib/data/storylog";
import { formatEpisodeLabel } from "@/lib/storylog-format";

export const dynamic = "force-dynamic";

const mediumLabels: Record<string, string> = {
  book: "책",
  movie: "영화",
  drama: "드라마",
  webtoon: "웹툰",
  other: "기타"
};

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">내 작품</h1>
          <p className="mt-2 text-muted-foreground">
            작품별 회차와 현재 감상 위치를 관리합니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/works/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            새 작품
          </Link>
        </Button>
      </div>

      {works.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold">아직 작품이 없습니다</h2>
          <p className="mt-2 text-muted-foreground">
            첫 작품을 만들고 회차 구조를 추가해 보세요.
          </p>
          <Button asChild className="mt-5">
            <Link href="/works/new">작품 만들기</Link>
          </Button>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {works.map((work) => (
            <Link
              key={work.id}
              href={`/works/${work.id}`}
              className="rounded-lg border bg-card p-5 transition-colors hover:bg-muted"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{work.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mediumLabels[work.medium ?? "other"] ?? "기타"}
                    {work.genre ? ` · ${work.genre}` : ""}
                  </p>
                </div>
                <span className="rounded-md bg-secondary px-2.5 py-1 text-xs">
                  {work.episodeCount}개 회차
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                현재 위치:{" "}
                <span className="font-medium text-foreground">
                  {work.currentEpisode
                    ? formatEpisodeLabel(work.currentEpisode)
                    : work.progress
                      ? "시작 전"
                      : "미설정"}
                </span>
              </p>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
