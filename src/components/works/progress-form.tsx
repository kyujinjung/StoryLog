"use client";

import { useState } from "react";

import { setProgress } from "@/app/works/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatEpisodeLabel } from "@/lib/storylog-format";
import type { Episode, UserProgress } from "@/types/database";

type ProgressFormProps = {
  workId: string;
  episodes: Episode[];
  progress: UserProgress | null;
};

export function ProgressForm({ workId, episodes, progress }: ProgressFormProps) {
  const initialEpisode =
    episodes.find((episode) => episode.id === progress?.episode_id) ?? null;
  const [episodeId, setEpisodeId] = useState(initialEpisode?.id ?? "");
  const selectedEpisode =
    episodes.find((episode) => episode.id === episodeId) ?? null;

  return (
    <form action={setProgress} className="grid gap-3 rounded-lg border bg-card p-5">
      <input type="hidden" name="work_id" value={workId} />
      <input type="hidden" name="reveal_order" value={selectedEpisode?.reveal_order ?? 0} />

      <div className="grid gap-2">
        <Label htmlFor="episode_id">현재 감상 위치</Label>
        <select
          id="episode_id"
          name="episode_id"
          value={episodeId}
          onChange={(event) => setEpisodeId(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">아직 시작 전</option>
          {episodes.map((episode) => (
            <option key={episode.id} value={episode.id}>
              {formatEpisodeLabel(episode) || `스포 순서 ${episode.reveal_order}`}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={episodes.length === 0 && !progress}>
        진행도 저장
      </Button>
    </form>
  );
}
