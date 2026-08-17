"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const action = episode ? updateEpisode : createEpisode;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [formNonce, setFormNonce] = useState(0);
  const formKey = episode
    ? `edit-${episode.id}-${episode.updated_at}`
    : `new-${workId}-${nextRevealOrder}-${formNonce}`;
  const [revealOrder, setRevealOrder] = useState(
    String(episode?.reveal_order ?? nextRevealOrder)
  );
  const [episodeNumber, setEpisodeNumber] = useState(
    episode?.episode_number != null ? String(episode.episode_number) : ""
  );

  useEffect(() => {
    if (!episode) {
      setRevealOrder(String(nextRevealOrder));
    }
  }, [episode, nextRevealOrder]);

  // After successful create/update, refresh server components so the schedule appears.
  useEffect(() => {
    if (!state.message) {
      return;
    }

    router.refresh();

    if (!episode) {
      setEpisodeNumber("");
      setRevealOrder(String(nextRevealOrder + 1));
      setFormNonce((value) => value + 1);
    }
  }, [state.message, episode, nextRevealOrder, router]);

  return (
    <form key={formKey} action={formAction} className="grid gap-3">
      <input type="hidden" name="work_id" value={workId} />
      {episode ? <input type="hidden" name="episode_id" value={episode.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr_1fr_1fr]">
        <div className="grid gap-1.5">
          <Label htmlFor={`season-${episode?.id ?? "new"}-${formNonce}`}>
            시즌/권
          </Label>
          <Input
            id={`season-${episode?.id ?? "new"}-${formNonce}`}
            name="season_label"
            defaultValue={episode?.season_label ?? ""}
            placeholder="시즌 1"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`number-${episode?.id ?? "new"}-${formNonce}`}>
            회차 번호
          </Label>
          <Input
            id={`number-${episode?.id ?? "new"}-${formNonce}`}
            name="episode_number"
            type="number"
            step="1"
            min="0"
            value={episodeNumber}
            onChange={(event) => {
              const value = event.target.value;
              setEpisodeNumber(value);

              if (!episode && value !== "" && Number.isInteger(Number(value))) {
                setRevealOrder(value);
              }
            }}
            placeholder="1"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`label-${episode?.id ?? "new"}-${formNonce}`}>
            회차 라벨
          </Label>
          <Input
            id={`label-${episode?.id ?? "new"}-${formNonce}`}
            name="episode_label"
            defaultValue={episode?.episode_label ?? ""}
            placeholder="1화"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`reveal-${episode?.id ?? "new"}-${formNonce}`}>
            스포 순서
          </Label>
          <Input
            id={`reveal-${episode?.id ?? "new"}-${formNonce}`}
            name="reveal_order"
            type="number"
            step="1"
            min="0"
            value={revealOrder}
            onChange={(event) => setRevealOrder(event.target.value)}
            required
          />
          {!episode ? (
            <p className="text-xs text-muted-foreground">
              이미 쓴 순서면 서버가 다음 빈 번호로 자동 보정합니다.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`title-${episode?.id ?? "new"}-${formNonce}`}>
          회차 제목
        </Label>
        <Input
          id={`title-${episode?.id ?? "new"}-${formNonce}`}
          name="title"
          defaultValue={episode?.title ?? ""}
          placeholder="선택 사항"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`summary-${episode?.id ?? "new"}-${formNonce}`}>
          줄거리 메모
        </Label>
        <textarea
          id={`summary-${episode?.id ?? "new"}-${formNonce}`}
          name="summary"
          rows={3}
          className="rounded-md border border-white/10 bg-muted px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue={episode?.summary ?? ""}
          placeholder="이 회차에서 기억할 핵심 줄거리나 감상 전 복습 메모"
        />
      </div>

      {state.error ? (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-md bg-secondary p-3 text-sm text-secondary-foreground">
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        variant={episode ? "secondary" : "default"}
        disabled={isPending}
      >
        {isPending ? "저장 중" : episode ? "회차 수정" : "회차 추가"}
      </Button>
    </form>
  );
}
