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
  book: "from-amber-600/50",
  movie: "from-primary/60",
  drama: "from-violet-600/50",
  webtoon: "from-sky-600/50",
  other: "from-zinc-500/50"
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
            포스터와 함께 작품별 진행도를 한눈에 관리합니다.
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
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {works.map((work) => {
            const medium = work.medium ?? "other";
            const gradient = mediumAccent[medium] ?? mediumAccent.other;
            const cover = work.cover_image_url;

            return (
              <Link
                key={work.id}
                href={`/works/${work.id}`}
                className="cinema-card cinema-card-hover group overflow-hidden rounded-2xl"
              >
                <div
                  className={`relative aspect-[2/3] overflow-hidden bg-gradient-to-br ${gradient} to-black`}
                >
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={`${work.title} 포스터`}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 z-10 space-y-2 p-3">
                    <span className="cinema-badge cinema-badge-solid text-[10px]">
                      {mediumLabels[medium] ?? "기타"}
                    </span>
                    <h2 className="line-clamp-2 text-sm font-bold leading-snug text-white drop-shadow sm:text-base">
                      {work.title}
                    </h2>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-white/80">
                      <span>{work.episodeCount}화</span>
                      <span className="truncate font-semibold text-primary">
                        {work.currentEpisode
                          ? formatEpisodeLabel(work.currentEpisode)
                          : work.progress
                            ? "시작 전"
                            : "미설정"}
                      </span>
                    </div>
                  </div>
                  {!cover ? (
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <Clapperboard className="h-12 w-12 text-white" aria-hidden="true" />
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
