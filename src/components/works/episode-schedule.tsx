"use client";

import { useState } from "react";
import { ChevronDown, Film } from "lucide-react";

import { DeleteEpisodeButton } from "@/components/works/delete-episode-button";
import { EpisodeForm } from "@/components/works/episode-form";
import { formatEpisodeLabel } from "@/lib/storylog-format";
import { cn } from "@/lib/utils";
import type { Episode } from "@/types/database";

export function EpisodeSchedule({
  workId,
  episodes,
  currentEpisodeId
}: {
  workId: string;
  episodes: Episode[];
  currentEpisodeId: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (episodes.length === 0) {
    return (
      <div className="cinema-card rounded-2xl p-8 text-center text-muted-foreground">
        <Film className="mx-auto mb-3 h-8 w-8 text-primary/70" aria-hidden="true" />
        아직 회차가 없습니다. 첫 회차를 추가해 현재 위치를 설정하세요.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {episodes.map((episode, index) => {
        const isCurrent = currentEpisodeId === episode.id;
        const isOpen = openId === episode.id;
        const label =
          formatEpisodeLabel(episode) || `스포 순서 ${episode.reveal_order}`;

        return (
          <article
            key={episode.id}
            className={cn(
              "cinema-card overflow-hidden rounded-2xl border transition-colors",
              isCurrent ? "border-primary/50 shadow-[0_0_24px_rgba(231,26,15,0.15)]" : ""
            )}
          >
            <div className="flex items-stretch">
              <div
                className={cn(
                  "flex w-16 shrink-0 flex-col items-center justify-center border-r border-white/5",
                  isCurrent ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}
              >
                <span className="text-[10px] font-bold tracking-widest opacity-80">
                  EP
                </span>
                <span className="text-xl font-black leading-none">
                  {episode.episode_number ?? index + 1}
                </span>
              </div>

              <div className="min-w-0 flex-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setOpenId(isOpen ? null : episode.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-bold">{label}</h3>
                      {isCurrent ? (
                        <span className="cinema-badge cinema-badge-solid text-[10px]">
                          NOW
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      스포 순서 {episode.reveal_order}
                      {episode.title ? ` · ${episode.title}` : ""}
                    </p>
                    {episode.summary ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/70">
                        {episode.summary}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        줄거리 메모 없음 · 탭해서 수정
                      </p>
                    )}
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    <DeleteEpisodeButton workId={workId} episodeId={episode.id} />
                    <button
                      type="button"
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/5 hover:text-white",
                        isOpen && "bg-white/5 text-primary"
                      )}
                      onClick={() => setOpenId(isOpen ? null : episode.id)}
                      aria-label={isOpen ? "접기" : "수정 펼치기"}
                    >
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 transition-transform",
                          isOpen && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>

                {isOpen ? (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <EpisodeForm workId={workId} episode={episode} />
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
