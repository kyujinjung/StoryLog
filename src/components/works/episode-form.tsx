"use client";

import { useActionState } from "react";

import {
  createEpisode,
  updateEpisode,
  type ActionState
} from "@/app/works/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Episode } from "@/types/database";

type EpisodeFormProps = {
  workId: string;
  episode?: Episode;
  nextRevealOrder?: number;
};

const initialState: ActionState = {};

export function EpisodeForm({
  workId,
  episode,
  nextRevealOrder = 1
}: EpisodeFormProps) {
  const action = episode ? updateEpisode : createEpisode;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="work_id" value={workId} />
      {episode ? <input type="hidden" name="episode_id" value={episode.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr_1fr_1fr]">
        <div className="grid gap-1.5">
          <Label htmlFor={`season-${episode?.id ?? "new"}`}>시즌/권</Label>
          <Input
            id={`season-${episode?.id ?? "new"}`}
            name="season_label"
            defaultValue={episode?.season_label ?? ""}
            placeholder="시즌 1"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`number-${episode?.id ?? "new"}`}>회차 번호</Label>
          <Input
            id={`number-${episode?.id ?? "new"}`}
            name="episode_number"
            type="number"
            step="1"
            min="0"
            defaultValue={episode?.episode_number ?? ""}
            placeholder="1"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`label-${episode?.id ?? "new"}`}>회차 라벨</Label>
          <Input
            id={`label-${episode?.id ?? "new"}`}
            name="episode_label"
            defaultValue={episode?.episode_label ?? ""}
            placeholder="1화"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`reveal-${episode?.id ?? "new"}`}>스포 순서</Label>
          <Input
            id={`reveal-${episode?.id ?? "new"}`}
            name="reveal_order"
            type="number"
            step="1"
            min="0"
            defaultValue={episode?.reveal_order ?? nextRevealOrder}
            required
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`title-${episode?.id ?? "new"}`}>회차 제목</Label>
        <Input
          id={`title-${episode?.id ?? "new"}`}
          name="title"
          defaultValue={episode?.title ?? ""}
          placeholder="선택 사항"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`summary-${episode?.id ?? "new"}`}>줄거리 메모</Label>
        <textarea
          id={`summary-${episode?.id ?? "new"}`}
          name="summary"
          rows={3}
          className="rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue={episode?.summary ?? ""}
          placeholder="이 회차에서 기억할 핵심 줄거리나 감상 전 복습 메모"
        />
      </div>

      {state.error ? (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant={episode ? "secondary" : "default"} disabled={isPending}>
        {isPending ? "저장 중" : episode ? "회차 수정" : "회차 추가"}
      </Button>
    </form>
  );
}
