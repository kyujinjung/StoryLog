"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import {
  acceptLoreDraftAction,
  generateLoreDraftAction,
  type AcceptDraftState,
  type GenerateDraftState
} from "@/app/works/ai-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { LoreDraft } from "@/lib/ai/lore-draft";
import { formatEpisodeLabel } from "@/lib/storylog-format";
import type { Episode } from "@/types/database";

type LoreDraftPanelProps = {
  workId: string;
  episodes: Episode[];
  hasXaiKey: boolean;
};

const generateInitial: GenerateDraftState = {};
const acceptInitial: AcceptDraftState = {};

function DraftCheckboxList<T>({
  title,
  items,
  prefix,
  renderLabel
}: {
  title: string;
  items: T[];
  prefix: string;
  renderLabel: (item: T, index: number) => string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2 rounded-md border p-3">
      <h4 className="text-sm font-semibold">
        {title} ({items.length})
      </h4>
      <ul className="grid gap-2">
        {items.map((item, index) => (
          <li key={`${prefix}-${index}`} className="flex items-start gap-2 text-sm">
            <input
              id={`${prefix}-${index}`}
              name={`${prefix}_${index}`}
              type="checkbox"
              defaultChecked
              className="mt-1"
            />
            <label htmlFor={`${prefix}-${index}`} className="leading-6">
              {renderLabel(item, index)}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LoreDraftPanel({
  workId,
  episodes,
  hasXaiKey
}: LoreDraftPanelProps) {
  const [generateState, generateAction, isGenerating] = useActionState(
    generateLoreDraftAction,
    generateInitial
  );
  const [acceptState, acceptAction, isAccepting] = useActionState(
    acceptLoreDraftAction,
    acceptInitial
  );
  const [episodeId, setEpisodeId] = useState(episodes[0]?.id ?? "");
  const [memo, setMemo] = useState("");
  const [draft, setDraft] = useState<LoreDraft | null>(null);

  useEffect(() => {
    if (generateState.draft) {
      setDraft(generateState.draft);
    }
  }, [generateState.draft]);

  useEffect(() => {
    if (acceptState.message && !acceptState.error) {
      setDraft(null);
      setMemo("");
    }
  }, [acceptState.message, acceptState.error]);

  const selectedEpisode = useMemo(
    () => episodes.find((episode) => episode.id === episodeId) ?? null,
    [episodes, episodeId]
  );

  if (episodes.length === 0) {
    return (
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">AI 초안 정리</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          회차를 먼저 추가한 뒤 메모에서 인물·사건·용어 초안을 뽑을 수 있습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-5 rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            AI 초안 정리
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            회차 메모를 넣으면 인물·사건·용어·관계 후보를 만듭니다.{" "}
            <strong>자동 저장하지 않고</strong> 선택한 항목만 저장합니다.
          </p>
        </div>
        <p className="rounded-md bg-secondary px-3 py-1.5 text-xs">
          {hasXaiKey ? "XAI_API_KEY 연결됨" : "XAI_API_KEY 필요"}
        </p>
      </div>

      {!hasXaiKey ? (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          SpaceXAI(xAI) 키를 <code className="text-xs">.env.local</code>에{" "}
          <code className="text-xs">XAI_API_KEY=...</code> 로 넣은 뒤{" "}
          <code className="text-xs">npm run dev</code>를 재시작하세요. 키는{" "}
          <a
            className="underline"
            href="https://console.x.ai"
            target="_blank"
            rel="noreferrer"
          >
            console.x.ai
          </a>
          에서 발급합니다.
        </p>
      ) : null}

      <form action={generateAction} className="grid gap-3">
        <input type="hidden" name="work_id" value={workId} />

        <div className="grid gap-1.5">
          <Label htmlFor="ai-episode">공개 회차 (초안 공개 시점)</Label>
          <select
            id="ai-episode"
            name="episode_id"
            value={episodeId}
            onChange={(event) => setEpisodeId(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          >
            {episodes.map((episode) => (
              <option key={episode.id} value={episode.id}>
                {formatEpisodeLabel(episode) || `순서 ${episode.reveal_order}`}
                {` · 순서 ${episode.reveal_order}`}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="ai-memo">회차 메모 / 줄거리</Label>
          <textarea
            id="ai-memo"
            name="memo"
            rows={6}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="예: 1화에서 주인공 민수가 북부 기사단 레이나와 만나고, 검은 문양 사건이 언급된다..."
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="use_episode_summary"
            defaultChecked
          />
          선택한 회차의 저장된 줄거리 메모도 함께 사용
          {selectedEpisode?.summary ? " (줄거리 있음)" : " (줄거리 없음)"}
        </label>

        {generateState.error ? (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            {generateState.error}
          </p>
        ) : null}
        {generateState.message ? (
          <p className="rounded-md bg-secondary p-3 text-sm">{generateState.message}</p>
        ) : null}

        <Button type="submit" disabled={isGenerating || !hasXaiKey}>
          {isGenerating ? "초안 생성 중…" : "AI 초안 만들기"}
        </Button>
      </form>

      {draft ? (
        <form action={acceptAction} className="grid gap-4 border-t pt-5">
          <input type="hidden" name="work_id" value={workId} />
          <input
            type="hidden"
            name="episode_id"
            value={generateState.episodeId || episodeId}
          />
          <input type="hidden" name="draft_json" value={JSON.stringify(draft)} />

          <div>
            <h3 className="font-semibold">초안 검토</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              저장할 항목만 체크하세요. 공개 시점은 선택한 회차 기준입니다.
            </p>
          </div>

          <DraftCheckboxList
            title="인물"
            items={draft.characters}
            prefix="character"
            renderLabel={(item) =>
              `${item.name}${item.role ? ` · ${item.role}` : ""}${
                item.description ? ` — ${item.description}` : ""
              }`
            }
          />
          <DraftCheckboxList
            title="사건"
            items={draft.events}
            prefix="event"
            renderLabel={(item) => `${item.title} — ${item.summary}`}
          />
          <DraftCheckboxList
            title="용어"
            items={draft.terms}
            prefix="term"
            renderLabel={(item) => `${item.term} — ${item.definition}`}
          />
          <DraftCheckboxList
            title="메모"
            items={draft.notes}
            prefix="note"
            renderLabel={(item) =>
              `${item.note_type ?? "fact"}${item.title ? ` · ${item.title}` : ""} — ${item.body}`
            }
          />
          <DraftCheckboxList
            title="관계"
            items={draft.relationships}
            prefix="relationship"
            renderLabel={(item) =>
              `${item.source_name} → ${item.target_name} (${item.relationship_type})${
                item.description ? ` — ${item.description}` : ""
              }`
            }
          />

          {acceptState.error ? (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {acceptState.error}
            </p>
          ) : null}
          {acceptState.message ? (
            <p className="rounded-md bg-secondary p-3 text-sm">{acceptState.message}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isAccepting}>
              {isAccepting ? "저장 중…" : "선택한 초안 저장"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDraft(null)}
              disabled={isAccepting}
            >
              초안 버리기
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
