import Link from "next/link";
import { Clapperboard, Plus } from "lucide-react";

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

const mediumAccent: Record<string, string> = {
  book: "from-amber-600/40",
  movie: "from-primary/50",
  drama: "from-violet-600/40",
  webtoon: "from-sky-600/40",
  other: "from-zinc-500/40"
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="cinema-section-label">MY TICKETS</p>
          <h1 className="cinema-title mt-2 text-3xl sm:text-4xl">내 작품</h1>
          <p className="mt-2 text-muted-foreground">
            예매한 상영작처럼 작품별 진행도와 회차를 관리합니다.
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
            첫 작품을 등록하고 회차 티켓(진행도)을 만들어 보세요.
          </p>
          <Button asChild className="mt-6">
            <Link href="/works/new">작품 만들기</Link>
          </Button>
        </div>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((work) => {
            const medium = work.medium ?? "other";
            const gradient = mediumAccent[medium] ?? mediumAccent.other;

            return (
              <Link
                key={work.id}
                href={`/works/${work.id}`}
                className="cinema-card cinema-card-hover group overflow-hidden rounded-2xl"
              >
                <div
                  className={`cinema-poster relative h-36 bg-gradient-to-br ${gradient} to-black`}
                >
                  <div className="relative z-10 flex h-full flex-col justify-between p-4">
                    <span className="cinema-badge cinema-badge-solid w-fit text-[10px]">
                      {mediumLabels[medium] ?? "기타"}
                    </span>
                    <p className="text-xs font-semibold tracking-wide text-white/80">
                      {work.episodeCount} EPISODES
                    </p>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <h2 className="line-clamp-2 text-lg font-bold leading-snug group-hover:text-primary">
                    {work.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {work.genre ? work.genre : "장르 미설정"}
                  </p>
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 text-sm">
                    <span className="text-muted-foreground">현재 위치</span>
                    <span className="font-semibold text-primary">
                      {work.currentEpisode
                        ? formatEpisodeLabel(work.currentEpisode)
                        : work.progress
                          ? "시작 전"
                          : "미설정"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
