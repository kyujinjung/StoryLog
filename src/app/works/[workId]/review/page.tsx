import Link from "next/link";
import type * as React from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getReviewData } from "@/lib/data/storylog";
import { formatEpisodeLabel } from "@/lib/storylog-format";

type ReviewPageProps = {
  params: Promise<{
    workId: string;
  }>;
  searchParams: Promise<{
    q?: string;
  }>;
};

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export default async function ReviewPage({ params, searchParams }: ReviewPageProps) {
  const { workId } = await params;
  const { q = "" } = await searchParams;
  const review = await getReviewData(workId, q);

  if (!review) {
    notFound();
  }

  const currentLabel = review.currentEpisode
    ? formatEpisodeLabel(review.currentEpisode)
    : review.progress
      ? "아직 시작 전"
      : "미설정";
  const hasQuery = review.query.length > 0;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10">
      <header className="grid gap-5">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3">
            <Link href={`/works/${review.id}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              작품으로 돌아가기
            </Link>
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">빠른 복습</h1>
              <p className="mt-2 text-muted-foreground">
                {review.title} · 현재 위치: {currentLabel}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Safe mode · reveal_order {review.currentRevealOrder}
            </div>
          </div>
        </div>

        <form className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              name="q"
              defaultValue={q}
              className="pl-9"
              placeholder="안전한 범위 안에서 이름, 사건, 용어 검색"
            />
          </div>
          <Button type="submit">검색</Button>
          {hasQuery ? (
            <Button asChild variant="secondary">
              <Link href={`/works/${review.id}/review`}>초기화</Link>
            </Button>
          ) : null}
        </form>
      </header>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold">최근 회차</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            현재 진행도까지의 회차 중 최근 기록을 보여줍니다.
          </p>
        </div>
        {review.recentEpisodes.length === 0 ? (
          <EmptyState>
            {hasQuery
              ? "검색어와 일치하는 회차 메모가 없습니다."
              : "현재 진행도 안에서 복습할 회차가 없습니다. 회차를 추가하고 진행도를 저장해 주세요."}
          </EmptyState>
        ) : (
          <div className="grid gap-3">
            {review.recentEpisodes.map((episode) => (
              <article key={episode.id} className="rounded-lg border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold">
                    {formatEpisodeLabel(episode) || `스포 순서 ${episode.reveal_order}`}
                  </h3>
                  <span className="rounded-md bg-secondary px-2.5 py-1 text-xs">
                    reveal_order {episode.reveal_order}
                  </span>
                </div>
                <p className="mt-3 leading-7 text-muted-foreground">
                  {episode.summary || "줄거리 메모가 아직 없습니다."}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">등장 인물</h2>
          {review.matches.characters.length === 0 ? (
            <EmptyState>
              {hasQuery
                ? "검색어와 일치하는 인물이 없습니다."
                : "현재 진행도에서 공개된 인물이 없습니다."}
            </EmptyState>
          ) : (
            <div className="grid gap-3">
              {review.matches.characters.map((character) => (
                <article key={character.id} className="rounded-lg border bg-card p-5">
                  <h3 className="font-semibold">{character.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {character.role || "역할 미입력"} · 공개 순서{" "}
                    {character.reveal_order}
                  </p>
                  {character.description ? (
                    <p className="mt-3 leading-7 text-muted-foreground">
                      {character.description}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">인물 상태</h2>
          {review.matches.characterStates.length === 0 ? (
            <EmptyState>
              {hasQuery
                ? "검색어와 일치하는 인물 상태가 없습니다."
                : "현재 진행도에서 공개된 인물 상태가 없습니다."}
            </EmptyState>
          ) : (
            <div className="grid gap-3">
              {review.matches.characterStates.slice(-6).reverse().map((state) => (
                <article key={state.id} className="rounded-lg border bg-card p-5">
                  <p className="text-sm text-muted-foreground">
                    공개 순서 {state.reveal_order}
                  </p>
                  <h3 className="mt-1 font-semibold">{state.summary}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {[state.status, state.affiliation, state.location]
                      .filter(Boolean)
                      .join(" · ") || "상세 상태 미입력"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">열린 사건</h2>
          {review.matches.events.length === 0 ? (
            <EmptyState>
              {hasQuery
                ? "검색어와 일치하는 사건이 없습니다."
                : "현재 진행도에서 공개된 사건이 없습니다."}
            </EmptyState>
          ) : (
            <div className="grid gap-3">
              {review.matches.events.map((event) => (
                <article key={event.id} className="rounded-lg border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">{event.title}</h3>
                    <span className="rounded-md bg-secondary px-2.5 py-1 text-xs">
                      중요도 {event.importance}
                    </span>
                  </div>
                  <p className="mt-3 leading-7 text-muted-foreground">
                    {event.summary}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">용어</h2>
          {review.matches.terms.length === 0 ? (
            <EmptyState>
              {hasQuery
                ? "검색어와 일치하는 용어가 없습니다."
                : "현재 진행도에서 공개된 용어가 없습니다."}
            </EmptyState>
          ) : (
            <div className="grid gap-3">
              {review.matches.terms.map((term) => (
                <article key={term.id} className="rounded-lg border bg-card p-5">
                  <h3 className="font-semibold">{term.term}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {term.category || "분류 없음"} · 공개 순서 {term.reveal_order}
                  </p>
                  <p className="mt-3 leading-7 text-muted-foreground">
                    {term.definition}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">개인 메모</h2>
        {review.matches.notes.length === 0 ? (
          <EmptyState>
            {hasQuery
              ? "검색어와 일치하는 메모가 없습니다."
              : "현재 진행도에서 공개된 메모가 없습니다."}
          </EmptyState>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {review.matches.notes.slice(0, 6).map((note) => (
              <article key={note.id} className="rounded-lg border bg-card p-5">
                <h3 className="font-semibold">{note.title || "제목 없음"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {note.note_type} · 공개 순서 {note.reveal_order}
                </p>
                <p className="mt-3 leading-7 text-muted-foreground">{note.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
