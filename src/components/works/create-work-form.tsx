"use client";

import { useActionState } from "react";

import { createWork, type ActionState } from "@/app/works/actions";
import { CoverFields } from "@/components/works/cover-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function CreateWorkForm() {
  const [state, formAction, isPending] = useActionState(createWork, initialState);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="cinema-card grid gap-5 rounded-2xl p-6 sm:p-8"
    >
      <div className="grid gap-2">
        <Label htmlFor="title">작품 제목</Label>
        <Input id="title" name="title" placeholder="예: 반지의 제왕" required />
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-semibold">대표 이미지 (선택)</p>
        <CoverFields idPrefix="new-work" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="medium">작품 유형</Label>
        <select
          id="medium"
          name="medium"
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue="book"
          required
        >
          <option value="book">책</option>
          <option value="movie">영화</option>
          <option value="drama">드라마</option>
          <option value="webtoon">웹툰</option>
          <option value="other">기타</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="genre">장르</Label>
        <Input id="genre" name="genre" placeholder="예: 판타지, 추리, SF" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">메모</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          className="rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="세계관, 원작 여부, 감상 계획 등을 적어두세요."
        />
      </div>

      {state.error ? (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "저장 중" : "작품 만들기"}
      </Button>
    </form>
  );
}
