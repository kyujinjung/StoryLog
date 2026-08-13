"use client";

import { useActionState, useEffect, useState } from "react";

import { setProgress, type ActionState } from "@/app/works/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatEpisodeLabel } from "@/lib/storylog-format";
import type { Episode, UserProgress } from "@/types/database";

type ProgressFormProps = {
  workId: string;
  episodes: Episode[];
  progress: UserProgress | null;
};

const initialState: ActionState = {};

export function ProgressForm({ workId, episodes, progress }: ProgressFormProps) {
  const savedEpisodeId = progress?.episode_id ?? "";
  const [episodeId, setEpisodeId] = useState(savedEpisodeId);
  const [state, formAction, isPending] = useActionState(setProgress, initialState);

  // After server revalidation, always mirror the saved progress into the select.
  useEffect(() => {
    setEpisodeId(savedEpisodeId);
  }, [savedEpisodeId, progress?.updated_at]);

  const selectedEpisode =
    episodes.find((episode) => episode.id === episodeId) ?? null;
  const savedEpisode =
    episodes.find((episode) => episode.id === savedEpisodeId) ?? null;

  return (
    <form
      action={formAction}
      className="cinema-card grid gap-3 rounded-2xl p-5"
      key={`progress-form-${workId}-${progress?.updated_at ?? "none"}-${savedEpisodeId || "unset"}`}
    >
      <input type="hidden" name="work_id" value={workId} />
      <div>
        <p className="cinema-section-label">TICKET</p>
        <h2 className="mt-1 text-lg font-bold">현재 감상 위치</h2>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="episode_id">회차 선택</Label>
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
              {` · 순서 ${episode.reveal_order}`}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          선택한 회차의 스포 순서 이하 정보만 인물/복습/관계도에 표시됩니다.
          {selectedEpisode
            ? ` 선택 중: 순서 ${selectedEpisode.reveal_order}`
            : " 진행도를 저장해야 로어가 열립니다."}
          {savedEpisode
            ? ` · 저장됨: ${formatEpisodeLabel(savedEpisode) || `순서 ${savedEpisode.reveal_order}`}`
            : progress
              ? " · 저장됨: 아직 시작 전"
              : ""}
        </p>
      </div>

      {state.error ? (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-md bg-secondary p-3 text-sm">{state.message}</p>
      ) : null}

      <Button type="submit" disabled={isPending || (episodes.length === 0 && !progress)}>
        {isPending ? "저장 중" : "진행도 저장"}
      </Button>
    </form>
  );
}
