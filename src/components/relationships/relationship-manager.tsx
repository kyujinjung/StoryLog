"use client";

import type * as React from "react";
import { useActionState } from "react";
import { Network, Trash2 } from "lucide-react";

import {
  createRelationship,
  createRelationshipChange,
  deleteRelationship,
  deleteRelationshipChange,
  updateRelationship,
  updateRelationshipChange,
  type ActionState
} from "@/app/works/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VisibleLore } from "@/lib/data/storylog";
import { formatEpisodeLabel } from "@/lib/storylog-format";
import type {
  Character,
  Episode,
  Relationship,
  RelationshipChange
} from "@/types/database";

type RelationshipManagerProps = {
  workId: string;
  episodes: Episode[];
  lore: VisibleLore;
};

const initialState: ActionState = {};

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

function CharacterSelect({
  characters,
  defaultValue,
  id,
  name
}: {
  characters: Character[];
  defaultValue?: string;
  id: string;
  name: string;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue ?? ""}
      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      required
    >
      <option value="" disabled>
        인물 선택
      </option>
      {characters.map((character) => (
        <option key={character.id} value={character.id}>
          {character.name}
        </option>
      ))}
    </select>
  );
}

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

function RelationshipForm({
  workId,
  episodes,
  characters,
  relationship
}: {
  workId: string;
  episodes: Episode[];
  characters: Character[];
  relationship?: Relationship;
}) {
  const action = relationship ? updateRelationship : createRelationship;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const canSubmit = episodes.length > 0 && characters.length >= 2;

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="work_id" value={workId} />
      {relationship ? (
        <input type="hidden" name="relationship_id" value={relationship.id} />
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`relationship-source-${relationship?.id ?? "new"}`}>
            From
          </Label>
          <CharacterSelect
            id={`relationship-source-${relationship?.id ?? "new"}`}
            name="source_character_id"
            characters={characters}
            defaultValue={relationship?.source_character_id}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`relationship-target-${relationship?.id ?? "new"}`}>
            To
          </Label>
          <CharacterSelect
            id={`relationship-target-${relationship?.id ?? "new"}`}
            name="target_character_id"
            characters={characters}
            defaultValue={relationship?.target_character_id}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`relationship-type-${relationship?.id ?? "new"}`}>
            관계 유형
          </Label>
          <Input
            id={`relationship-type-${relationship?.id ?? "new"}`}
            name="relationship_type"
            defaultValue={relationship?.relationship_type ?? ""}
            placeholder="동료, 적대, 가족"
            required
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[0.8fr_1fr]">
        <div className="grid gap-1.5">
          <Label htmlFor={`relationship-reveal-${relationship?.id ?? "new"}`}>
            시작/공개 회차
          </Label>
          <RevealSelect
            id={`relationship-reveal-${relationship?.id ?? "new"}`}
            episodes={episodes}
            defaultValue={relationship?.reveal_episode_id}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`relationship-label-${relationship?.id ?? "new"}`}>
            그래프 라벨
          </Label>
          <Input
            id={`relationship-label-${relationship?.id ?? "new"}`}
            name="label"
            defaultValue={relationship?.label ?? ""}
            placeholder="비워두면 관계 유형이 표시됩니다"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`relationship-description-${relationship?.id ?? "new"}`}>
          설명
        </Label>
        <Textarea
          id={`relationship-description-${relationship?.id ?? "new"}`}
          name="description"
          rows={3}
          defaultValue={relationship?.description ?? ""}
        />
      </div>
      <ErrorMessage error={state.error} />
      <Button type="submit" disabled={isPending || !canSubmit}>
        {isPending ? "저장 중" : relationship ? "관계 수정" : "관계 추가"}
      </Button>
    </form>
  );
}

function RelationshipChangeForm({
  workId,
  episodes,
  relationshipId,
  relationshipChange
}: {
  workId: string;
  episodes: Episode[];
  relationshipId: string;
  relationshipChange?: RelationshipChange;
}) {
  const action = relationshipChange
    ? updateRelationshipChange
    : createRelationshipChange;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="work_id" value={workId} />
      <input type="hidden" name="relationship_id" value={relationshipId} />
      {relationshipChange ? (
        <input
          type="hidden"
          name="relationship_change_id"
          value={relationshipChange.id}
        />
      ) : null}

      <div className="grid gap-3 md:grid-cols-[0.8fr_1fr_1.2fr]">
        <div className="grid gap-1.5">
          <Label
            htmlFor={`relationship-change-reveal-${
              relationshipChange?.id ?? relationshipId
            }`}
          >
            공개 회차
          </Label>
          <RevealSelect
            id={`relationship-change-reveal-${
              relationshipChange?.id ?? relationshipId
            }`}
            episodes={episodes}
            defaultValue={relationshipChange?.reveal_episode_id}
          />
        </div>
        <div className="grid gap-1.5">
          <Label
            htmlFor={`relationship-change-type-${
              relationshipChange?.id ?? relationshipId
            }`}
          >
            변화 유형
          </Label>
          <Input
            id={`relationship-change-type-${
              relationshipChange?.id ?? relationshipId
            }`}
            name="change_type"
            defaultValue={relationshipChange?.change_type ?? ""}
            placeholder="의심, 배신, 화해"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label
            htmlFor={`relationship-change-summary-${
              relationshipChange?.id ?? relationshipId
            }`}
          >
            요약
          </Label>
          <Input
            id={`relationship-change-summary-${
              relationshipChange?.id ?? relationshipId
            }`}
            name="summary"
            defaultValue={relationshipChange?.summary ?? ""}
            required
          />
        </div>
      </div>
      <ErrorMessage error={state.error} />
      <Button
        type="submit"
        variant="secondary"
        disabled={isPending || episodes.length === 0}
      >
        {isPending ? "저장 중" : relationshipChange ? "변화 수정" : "변화 추가"}
      </Button>
    </form>
  );
}

export function RelationshipManager({
  workId,
  episodes,
  lore
}: RelationshipManagerProps) {
  const characterNameById = new Map(
    lore.characters.map((character) => [character.id, character.name])
  );
  const changesByRelationship = new Map<string, RelationshipChange[]>();

  for (const change of lore.relationshipChanges) {
    const changes = changesByRelationship.get(change.relationship_id) ?? [];
    changes.push(change);
    changesByRelationship.set(change.relationship_id, changes);
  }

  return (
    <section className="grid gap-5 rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">인물 관계</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            현재 진행도에서 공개된 인물 사이의 관계와 변화만 관리합니다.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm">
          <Network className="h-4 w-4 text-primary" aria-hidden="true" />
          {lore.relationships.length}개 관계
        </div>
      </div>

      {lore.characters.length < 2 ? (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          관계를 만들려면 현재 진행도에서 공개된 인물이 2명 이상 필요합니다.
        </p>
      ) : null}

      <RelationshipForm
        workId={workId}
        episodes={episodes}
        characters={lore.characters}
      />

      {lore.relationships.length === 0 ? (
        <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
          현재 진행도에서 볼 수 있는 관계가 없습니다.
        </p>
      ) : (
        <div className="grid gap-4">
          {lore.relationships.map((relationship) => (
            <article key={relationship.id} className="rounded-md border p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {characterNameById.get(relationship.source_character_id) ??
                      "알 수 없음"}{" "}
                    →{" "}
                    {characterNameById.get(relationship.target_character_id) ??
                      "알 수 없음"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {relationship.relationship_type} · 공개 순서{" "}
                    {relationship.reveal_order}
                  </p>
                </div>
                <DeleteButton
                  action={deleteRelationship}
                  fields={{ work_id: workId, relationship_id: relationship.id }}
                  label="관계 삭제"
                />
              </div>
              <RelationshipForm
                workId={workId}
                episodes={episodes}
                characters={lore.characters}
                relationship={relationship}
              />

              <div className="mt-5 grid gap-3 border-t pt-4">
                <h4 className="text-sm font-semibold">관계 변화</h4>
                <RelationshipChangeForm
                  workId={workId}
                  episodes={episodes}
                  relationshipId={relationship.id}
                />
                {(changesByRelationship.get(relationship.id) ?? []).map((change) => (
                  <div key={change.id} className="rounded-md bg-muted p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">
                        {change.change_type} · 공개 순서 {change.reveal_order}
                      </p>
                      <DeleteButton
                        action={deleteRelationshipChange}
                        fields={{
                          work_id: workId,
                          relationship_change_id: change.id
                        }}
                        label="관계 변화 삭제"
                      />
                    </div>
                    <RelationshipChangeForm
                      workId={workId}
                      episodes={episodes}
                      relationshipId={relationship.id}
                      relationshipChange={change}
                    />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
