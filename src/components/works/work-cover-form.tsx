"use client";

import { useActionState } from "react";

import { updateWorkCover, type ActionState } from "@/app/works/actions";
import { CoverFields } from "@/components/works/cover-fields";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function WorkCoverForm({
  workId,
  coverImageUrl
}: {
  workId: string;
  coverImageUrl: string | null;
}) {
  const [state, action, isPending] = useActionState(updateWorkCover, initialState);

  return (
    <form action={action} className="cinema-card grid gap-4 rounded-2xl p-5">
      <input type="hidden" name="work_id" value={workId} />
      <div>
        <p className="cinema-section-label">POSTER</p>
        <h2 className="mt-1 text-lg font-bold">대표 이미지</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          내 작품 목록 포스터와 상세 헤더에 사용됩니다.
        </p>
      </div>

      <CoverFields
        idPrefix={`work-${workId}`}
        defaultUrl={coverImageUrl}
      />

      {state.error ? (
        <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-xl bg-secondary px-3 py-2 text-sm">{state.message}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중…" : "대표 이미지 저장"}
        </Button>
        {coverImageUrl ? (
          <Button
            type="submit"
            name="clear_cover"
            value="1"
            variant="secondary"
            disabled={isPending}
          >
            이미지 제거
          </Button>
        ) : null}
      </div>
    </form>
  );
}
