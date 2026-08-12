"use client";

import type * as React from "react";
import { useActionState } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";

import {
  createCharacter,
  createCharacterState,
  createEvent,
  createNote,
  createTerm,
  deleteCharacter,
  deleteCharacterState,
  deleteEvent,
  deleteNote,
  deleteTerm,
  updateCharacter,
  updateCharacterState,
  updateEvent,
  updateNote,
  updateTerm,
  type ActionState
} from "@/app/works/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VisibleLore } from "@/lib/data/storylog";
import { formatEpisodeLabel } from "@/lib/storylog-format";
import type {
  Character,
  CharacterState,
  Episode,
  Event,
  Note,
  Term
} from "@/types/database";

type LorePanelsProps = {
  workId: string;
  episodes: Episode[];
  lore: VisibleLore;
  currentRevealOrder: number;
};

const initialState: ActionState = {};

function Textarea({
  className = "",
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={`rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      {...props}
    />
  );
}

function RevealSelect({
  episodes,
  defaultValue,
  id
}: {
  episodes: Episode[];
  defaultValue?: string | null;
  id: string;
}) {
  return (
    <select
      id={id}
      name="reveal_episode_id"
      defaultValue={defaultValue ?? ""}
      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      required
    >
      <option value="" disabled>
        공개 회차 선택
      </option>
      {episodes.map((episode) => (
        <option key={episode.id} value={episode.id}>
          {formatEpisodeLabel(episode) || `스포 순서 ${episode.reveal_order}`}
        </option>
      ))}
    </select>
  );
}

function ErrorMessage({ error }: { error?: string }) {
  return error ? (
    <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{error}</p>
  ) : null;
}

function DeleteButton({
  action,
  fields,
  label
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label: string;
}) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" variant="ghost" size="icon" aria-label={label}>
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  );
}

function CharacterForm({
  workId,
  episodes,
  character
}: {
  workId: string;
  episodes: Episode[];
  character?: Character;
}) {
  const action = character ? updateCharacter : createCharacter;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="work_id" value={workId} />
      {character ? (
        <input type="hidden" name="character_id" value={character.id} />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`character-name-${character?.id ?? "new"}`}>이름</Label>
          <Input
            id={`character-name-${character?.id ?? "new"}`}
            name="name"
            defaultValue={character?.name ?? ""}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`character-role-${character?.id ?? "new"}`}>역할</Label>
          <Input
            id={`character-role-${character?.id ?? "new"}`}
            name="role"
            defaultValue={character?.role ?? ""}
            placeholder="주인공, 왕실 기사"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`character-aliases-${character?.id ?? "new"}`}>별칭</Label>
          <Input
            id={`character-aliases-${character?.id ?? "new"}`}
            name="aliases"
            defaultValue={character?.aliases.join(", ") ?? ""}
            placeholder="쉼표로 구분"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`character-reveal-${character?.id ?? "new"}`}>공개 회차</Label>
          <RevealSelect
            id={`character-reveal-${character?.id ?? "new"}`}
            episodes={episodes}
            defaultValue={character?.reveal_episode_id}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`character-description-${character?.id ?? "new"}`}>설명</Label>
        <Textarea
          id={`character-description-${character?.id ?? "new"}`}
          name="description"
          rows={3}
          defaultValue={character?.description ?? ""}
        />
      </div>
      <ErrorMessage error={state.error} />
      <Button type="submit" disabled={isPending || episodes.length === 0}>
        {isPending ? "저장 중" : character ? "인물 수정" : "인물 추가"}
      </Button>
    </form>
  );
}

function CharacterStateForm({
  workId,
  episodes,
  characterId,
  characterState
}: {
  workId: string;
  episodes: Episode[];
  characterId: string;
  characterState?: CharacterState;
}) {
  const action = characterState ? updateCharacterState : createCharacterState;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="work_id" value={workId} />
      <input type="hidden" name="character_id" value={characterId} />
      {characterState ? (
        <input type="hidden" name="state_id" value={characterState.id} />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`state-status-${characterState?.id ?? characterId}`}>
            상태
          </Label>
          <Input
            id={`state-status-${characterState?.id ?? characterId}`}
            name="status"
            defaultValue={characterState?.status ?? ""}
            placeholder="실종, 동맹"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`state-affiliation-${characterState?.id ?? characterId}`}>
            소속
          </Label>
          <Input
            id={`state-affiliation-${characterState?.id ?? characterId}`}
            name="affiliation"
            defaultValue={characterState?.affiliation ?? ""}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`state-location-${characterState?.id ?? characterId}`}>
            위치
          </Label>
          <Input
            id={`state-location-${characterState?.id ?? characterId}`}
            name="location"
            defaultValue={characterState?.location ?? ""}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1.3fr]">
        <div className="grid gap-1.5">
          <Label htmlFor={`state-reveal-${characterState?.id ?? characterId}`}>
            공개 회차
          </Label>
          <RevealSelect
            id={`state-reveal-${characterState?.id ?? characterId}`}
            episodes={episodes}
            defaultValue={characterState?.reveal_episode_id}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`state-summary-${characterState?.id ?? characterId}`}>
            요약
          </Label>
          <Input
            id={`state-summary-${characterState?.id ?? characterId}`}
            name="summary"
            defaultValue={characterState?.summary ?? ""}
            required
          />
        </div>
      </div>
      <ErrorMessage error={state.error} />
      <Button type="submit" variant="secondary" disabled={isPending || episodes.length === 0}>
        {isPending ? "저장 중" : characterState ? "상태 수정" : "상태 추가"}
      </Button>
    </form>
  );
}

function EventForm({
  workId,
  episodes,
  event
}: {
  workId: string;
  episodes: Episode[];
  event?: Event;
}) {
  const action = event ? updateEvent : createEvent;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="work_id" value={workId} />
      {event ? <input type="hidden" name="event_id" value={event.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr_0.6fr]">
        <div className="grid gap-1.5">
          <Label htmlFor={`event-title-${event?.id ?? "new"}`}>사건</Label>
          <Input
            id={`event-title-${event?.id ?? "new"}`}
            name="title"
            defaultValue={event?.title ?? ""}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`event-type-${event?.id ?? "new"}`}>유형</Label>
          <Input
            id={`event-type-${event?.id ?? "new"}`}
            name="event_type"
            defaultValue={event?.event_type ?? ""}
            placeholder="전투, 단서"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`event-importance-${event?.id ?? "new"}`}>중요도</Label>
          <Input
            id={`event-importance-${event?.id ?? "new"}`}
            name="importance"
            type="number"
            min="1"
            max="5"
            defaultValue={event?.importance ?? 3}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-1.5">
          <Label htmlFor={`event-reveal-${event?.id ?? "new"}`}>공개 회차</Label>
          <RevealSelect
            id={`event-reveal-${event?.id ?? "new"}`}
            episodes={episodes}
            defaultValue={event?.reveal_episode_id}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`event-summary-${event?.id ?? "new"}`}>요약</Label>
          <Input
            id={`event-summary-${event?.id ?? "new"}`}
            name="summary"
            defaultValue={event?.summary ?? ""}
            required
          />
        </div>
      </div>
      <ErrorMessage error={state.error} />
      <Button type="submit" disabled={isPending || episodes.length === 0}>
        {isPending ? "저장 중" : event ? "사건 수정" : "사건 추가"}
      </Button>
    </form>
  );
}

function TermForm({
  workId,
  episodes,
  term
}: {
  workId: string;
  episodes: Episode[];
  term?: Term;
}) {
  const action = term ? updateTerm : createTerm;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="work_id" value={workId} />
      {term ? <input type="hidden" name="term_id" value={term.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`term-name-${term?.id ?? "new"}`}>용어</Label>
          <Input
            id={`term-name-${term?.id ?? "new"}`}
            name="term"
            defaultValue={term?.term ?? ""}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`term-category-${term?.id ?? "new"}`}>분류</Label>
          <Input
            id={`term-category-${term?.id ?? "new"}`}
            name="category"
            defaultValue={term?.category ?? ""}
            placeholder="조직, 지명"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`term-reveal-${term?.id ?? "new"}`}>공개 회차</Label>
          <RevealSelect
            id={`term-reveal-${term?.id ?? "new"}`}
            episodes={episodes}
            defaultValue={term?.reveal_episode_id}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`term-definition-${term?.id ?? "new"}`}>정의</Label>
        <Textarea
          id={`term-definition-${term?.id ?? "new"}`}
          name="definition"
          rows={3}
          defaultValue={term?.definition ?? ""}
          required
        />
      </div>
      <ErrorMessage error={state.error} />
      <Button type="submit" disabled={isPending || episodes.length === 0}>
        {isPending ? "저장 중" : term ? "용어 수정" : "용어 추가"}
      </Button>
    </form>
  );
}

function NoteForm({
  workId,
  episodes,
  note
}: {
  workId: string;
  episodes: Episode[];
  note?: Note;
}) {
  const action = note ? updateNote : createNote;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="work_id" value={workId} />
      {note ? <input type="hidden" name="note_id" value={note.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_0.7fr_1fr]">
        <div className="grid gap-1.5">
          <Label htmlFor={`note-title-${note?.id ?? "new"}`}>제목</Label>
          <Input
            id={`note-title-${note?.id ?? "new"}`}
            name="title"
            defaultValue={note?.title ?? ""}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`note-type-${note?.id ?? "new"}`}>유형</Label>
          <select
            id={`note-type-${note?.id ?? "new"}`}
            name="note_type"
            defaultValue={note?.note_type ?? "fact"}
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="fact">확정 정보</option>
            <option value="theory">추측</option>
            <option value="question">질문</option>
            <option value="todo">확인할 것</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`note-reveal-${note?.id ?? "new"}`}>공개 회차</Label>
          <RevealSelect
            id={`note-reveal-${note?.id ?? "new"}`}
            episodes={episodes}
            defaultValue={note?.reveal_episode_id}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`note-body-${note?.id ?? "new"}`}>내용</Label>
        <Textarea
          id={`note-body-${note?.id ?? "new"}`}
          name="body"
          rows={3}
          defaultValue={note?.body ?? ""}
          required
        />
      </div>
      <ErrorMessage error={state.error} />
      <Button type="submit" disabled={isPending || episodes.length === 0}>
        {isPending ? "저장 중" : note ? "메모 수정" : "메모 추가"}
      </Button>
    </form>
  );
}

export function LorePanels({
  workId,
  episodes,
  lore,
  currentRevealOrder
}: LorePanelsProps) {
  const statesByCharacter = new Map<string, CharacterState[]>();

  for (const characterState of lore.characterStates) {
    const states = statesByCharacter.get(characterState.character_id) ?? [];
    states.push(characterState);
    statesByCharacter.set(characterState.character_id, states);
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">스포일러 안전 기록</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              현재 진행도 이하의 공개 회차 기록만 표시됩니다.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            {currentRevealOrder < 0
              ? "Safe mode · 진행도 미설정 (로어 숨김)"
              : `Safe mode · 공개 상한 순서 ${currentRevealOrder}`}
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          인물/사건 추가 시 <strong>공개 회차</strong>를 반드시 해당 정보가 처음
          나오는 회차로 지정하세요. 진행도보다 뒤 회차로 저장된 항목은 목록에
          나타나지 않습니다.
        </p>
        {episodes.length === 0 ? (
          <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            회차를 먼저 추가해야 공개 회차를 지정하고 기록을 만들 수 있습니다.
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="grid gap-4 rounded-lg border bg-card p-5">
          <h3 className="text-lg font-semibold">인물</h3>
          <CharacterForm workId={workId} episodes={episodes} />
          {lore.characters.length === 0 ? (
            <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              현재 진행도에서 볼 수 있는 인물이 없습니다.
            </p>
          ) : (
            <div className="grid gap-4">
              {lore.characters.map((character) => (
                <article key={character.id} className="rounded-md border p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">{character.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        공개 순서 {character.reveal_order}
                      </p>
                    </div>
                    <DeleteButton
                      action={deleteCharacter}
                      fields={{ work_id: workId, character_id: character.id }}
                      label="인물 삭제"
                    />
                  </div>
                  <CharacterForm
                    workId={workId}
                    episodes={episodes}
                    character={character}
                  />
                  <div className="mt-5 grid gap-3 border-t pt-4">
                    <h5 className="text-sm font-semibold">회차별 상태</h5>
                    <CharacterStateForm
                      workId={workId}
                      episodes={episodes}
                      characterId={character.id}
                    />
                    {(statesByCharacter.get(character.id) ?? []).map((characterState) => (
                      <div key={characterState.id} className="rounded-md bg-muted p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            공개 순서 {characterState.reveal_order}
                          </p>
                          <DeleteButton
                            action={deleteCharacterState}
                            fields={{ work_id: workId, state_id: characterState.id }}
                            label="상태 삭제"
                          />
                        </div>
                        <CharacterStateForm
                          workId={workId}
                          episodes={episodes}
                          characterId={character.id}
                          characterState={characterState}
                        />
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 rounded-lg border bg-card p-5">
          <h3 className="text-lg font-semibold">사건</h3>
          <EventForm workId={workId} episodes={episodes} />
          {lore.events.length === 0 ? (
            <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              현재 진행도에서 볼 수 있는 사건이 없습니다.
            </p>
          ) : (
            <div className="grid gap-4">
              {lore.events.map((event) => (
                <article key={event.id} className="rounded-md border p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">{event.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        중요도 {event.importance} · 공개 순서 {event.reveal_order}
                      </p>
                    </div>
                    <DeleteButton
                      action={deleteEvent}
                      fields={{ work_id: workId, event_id: event.id }}
                      label="사건 삭제"
                    />
                  </div>
                  <EventForm workId={workId} episodes={episodes} event={event} />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="grid gap-4 rounded-lg border bg-card p-5">
          <h3 className="text-lg font-semibold">용어</h3>
          <TermForm workId={workId} episodes={episodes} />
          {lore.terms.length === 0 ? (
            <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              현재 진행도에서 볼 수 있는 용어가 없습니다.
            </p>
          ) : (
            <div className="grid gap-4">
              {lore.terms.map((term) => (
                <article key={term.id} className="rounded-md border p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">{term.term}</h4>
                      <p className="text-xs text-muted-foreground">
                        {term.category || "분류 없음"} · 공개 순서 {term.reveal_order}
                      </p>
                    </div>
                    <DeleteButton
                      action={deleteTerm}
                      fields={{ work_id: workId, term_id: term.id }}
                      label="용어 삭제"
                    />
                  </div>
                  <TermForm workId={workId} episodes={episodes} term={term} />
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 rounded-lg border bg-card p-5">
          <h3 className="text-lg font-semibold">메모</h3>
          <NoteForm workId={workId} episodes={episodes} />
          {lore.notes.length === 0 ? (
            <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              현재 진행도에서 볼 수 있는 메모가 없습니다.
            </p>
          ) : (
            <div className="grid gap-4">
              {lore.notes.map((note) => (
                <article key={note.id} className="rounded-md border p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">{note.title || "제목 없음"}</h4>
                      <p className="text-xs text-muted-foreground">
                        {note.note_type} · 공개 순서 {note.reveal_order}
                      </p>
                    </div>
                    <DeleteButton
                      action={deleteNote}
                      fields={{ work_id: workId, note_id: note.id }}
                      label="메모 삭제"
                    />
                  </div>
                  <NoteForm workId={workId} episodes={episodes} note={note} />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
