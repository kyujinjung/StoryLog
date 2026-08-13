"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clapperboard, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { formatEpisodeLabel } from "@/lib/storylog-format";
import { getWorkCoverUrl } from "@/lib/work-cover";
import type { Episode, Work } from "@/types/database";

export type WorkListItem = Work & {
  episodeCount: number;
  currentEpisode: Episode | null;
  progress: { episode_id: string | null } | null;
};

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

export function WorksSearchGrid({ works }: { works: WorkListItem[] }) {
  const [query, setQuery] = useState("");
  const [medium, setMedium] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return works.filter((work) => {
      if (medium !== "all" && (work.medium ?? "other") !== medium) {
        return false;
      }

      if (!q) {
        return true;
      }

      return [work.title, work.genre, work.description, work.medium]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [works, query, medium]);

  return (
    <div className="grid gap-5">
      <div className="cinema-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="작품 제목 · 장르 검색"
            className="pl-9"
            aria-label="작품 검색"
          />
        </div>
        <select
          value={medium}
          onChange={(event) => setMedium(event.target.value)}
          className="h-11 rounded-xl border border-white/10 bg-muted px-3 text-sm"
          aria-label="유형 필터"
        >
          <option value="all">전체 유형</option>
          <option value="movie">영화</option>
          <option value="drama">드라마</option>
          <option value="webtoon">웹툰</option>
          <option value="book">책</option>
          <option value="other">기타</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="cinema-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
          검색 결과가 없습니다.
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((work) => {
            const mediumKey = work.medium ?? "other";
            const gradient = mediumAccent[mediumKey] ?? mediumAccent.other;
            const cover = getWorkCoverUrl(work);

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
                      {mediumLabels[mediumKey] ?? "기타"}
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
                      <Clapperboard
                        className="h-12 w-12 text-white"
                        aria-hidden="true"
                      />
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
