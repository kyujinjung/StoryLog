"use server";

import { revalidatePath } from "next/cache";

import {
  countDraftItems,
  extractLoreDraft,
  normalizeLoreDraft,
  type LoreDraft
} from "@/lib/ai/lore-draft";
import { hasXaiApiKey } from "@/lib/ai/xai";
import { getAuthDataState, type AuthDataState } from "@/lib/data/storylog";

export type GenerateDraftState = {
  error?: string;
  message?: string;
  draft?: LoreDraft;
  episodeId?: string;
  workId?: string;
};

export type AcceptDraftState = {
  error?: string;
  message?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getChecked(formData: FormData, key: string) {
  const value = formData.get(key);

  return value === "on" || value === "true" || value === "1";
}

async function getReadyState(): Promise<
  | Extract<AuthDataState, { status: "ready" }>
  | { status: "error"; error: string }
> {
  const state = await getAuthDataState();

  if (state.status === "missing-env") {
    return {
      status: "error",
      error: "Supabase 환경 변수를 설정한 뒤 다시 시도해 주세요."
    };
  }

  if (state.status === "signed-out") {
    return { status: "error", error: "로그인 후 다시 시도해 주세요." };
  }

  return state;
}

async function getRevealEpisode(
  state: Extract<AuthDataState, { status: "ready" }>,
  workId: string,
  episodeId: string
) {
  if (!episodeId) {
    return { error: "공개 회차를 선택해 주세요." } as const;
  }

  const { data, error } = await state.supabase
    .from("episodes")
    .select("id,reveal_order,episode_label,title,summary")
    .eq("id", episodeId)
    .eq("work_id", workId)
    .eq("user_id", state.userId)
    .maybeSingle();

  if (error || !data) {
    return { error: "공개 회차를 찾을 수 없습니다." } as const;
  }

  return {
    reveal_episode_id: data.id as string,
    reveal_order: data.reveal_order as number,
    episode_label: data.episode_label as string,
    title: (data.title as string | null) ?? null,
    summary: (data.summary as string | null) ?? null
  } as const;
}

export async function generateLoreDraftAction(
  _previousState: GenerateDraftState,
  formData: FormData
): Promise<GenerateDraftState> {
  if (!hasXaiApiKey()) {
    return {
      error:
        "XAI_API_KEY가 없습니다. .env.local에 SpaceXAI(xAI) 키를 넣고 서버를 재시작해 주세요."
    };
  }

  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const episodeId = getString(formData, "episode_id");
  const memo = getString(formData, "memo");
  const useEpisodeSummary = getChecked(formData, "use_episode_summary");

  if (!workId) {
    return { error: "작품 정보를 찾을 수 없습니다." };
  }

  const reveal = await getRevealEpisode(state, workId, episodeId);

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  let fullMemo = memo;

  if (useEpisodeSummary && reveal.summary) {
    fullMemo = [reveal.summary, memo].filter(Boolean).join("\n\n");
  }

  if (!fullMemo.trim()) {
    return {
      error: "초안을 만들 메모가 없습니다. 텍스트를 입력하거나 회차 줄거리를 사용하세요."
    };
  }

  const [{ data: work }, { data: characters }] = await Promise.all([
    state.supabase
      .from("works")
      .select("title,medium")
      .eq("id", workId)
      .eq("user_id", state.userId)
      .maybeSingle(),
    state.supabase
      .from("characters")
      .select("name")
      .eq("work_id", workId)
      .eq("user_id", state.userId)
  ]);

  if (!work) {
    return { error: "작품을 찾을 수 없습니다." };
  }

  try {
    const draft = await extractLoreDraft({
      workTitle: work.title as string,
      workMedium: (work.medium as string | null) ?? null,
      episodeLabel: reveal.episode_label,
      episodeTitle: reveal.title,
      existingCharacterNames: ((characters ?? []) as { name: string }[]).map(
        (row) => row.name
      ),
      memo: fullMemo
    });

    const count = countDraftItems(draft);

    if (count === 0) {
      return {
        error: "추출된 후보가 없습니다. 메모에 인물/사건/용어를 조금 더 구체적으로 적어 보세요.",
        workId,
        episodeId
      };
    }

    return {
      draft,
      workId,
      episodeId,
      message: `초안 ${count}개를 만들었습니다. 확인할 항목만 저장하세요.`
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "AI 초안 생성 중 오류가 발생했습니다.",
      workId,
      episodeId
    };
  }
}

export async function acceptLoreDraftAction(
  _previousState: AcceptDraftState,
  formData: FormData
): Promise<AcceptDraftState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const episodeId = getString(formData, "episode_id");
  const draftJson = getString(formData, "draft_json");

  if (!workId || !episodeId || !draftJson) {
    return { error: "저장할 초안 정보가 없습니다." };
  }

  const reveal = await getRevealEpisode(state, workId, episodeId);

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  let draft: LoreDraft;

  try {
    draft = normalizeLoreDraft(JSON.parse(draftJson) as unknown);
  } catch {
    return { error: "초안 데이터가 손상되었습니다. 다시 생성해 주세요." };
  }

  const selectedCharacters = draft.characters.filter((_, index) =>
    getChecked(formData, `character_${index}`)
  );
  const selectedEvents = draft.events.filter((_, index) =>
    getChecked(formData, `event_${index}`)
  );
  const selectedTerms = draft.terms.filter((_, index) =>
    getChecked(formData, `term_${index}`)
  );
  const selectedNotes = draft.notes.filter((_, index) =>
    getChecked(formData, `note_${index}`)
  );
  const selectedRelationships = draft.relationships.filter((_, index) =>
    getChecked(formData, `relationship_${index}`)
  );

  const selectedCount =
    selectedCharacters.length +
    selectedEvents.length +
    selectedTerms.length +
    selectedNotes.length +
    selectedRelationships.length;

  if (selectedCount === 0) {
    return { error: "저장할 항목을 하나 이상 선택해 주세요." };
  }

  const nameToId = new Map<string, string>();

  const { data: existingCharacters } = await state.supabase
    .from("characters")
    .select("id,name")
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  for (const row of (existingCharacters ?? []) as { id: string; name: string }[]) {
    nameToId.set(row.name.trim().toLowerCase(), row.id);
  }

  let saved = 0;
  const errors: string[] = [];

  for (const character of selectedCharacters) {
    const key = character.name.trim().toLowerCase();
    const existingId = nameToId.get(key);

    if (existingId) {
      const { error } = await state.supabase
        .from("characters")
        .update({
          role: character.role || null,
          aliases: character.aliases ?? [],
          description: character.description || null,
          reveal_episode_id: reveal.reveal_episode_id,
          reveal_order: reveal.reveal_order
        })
        .eq("id", existingId)
        .eq("user_id", state.userId);

      if (error) {
        errors.push(`인물 ${character.name}: ${error.message}`);
      } else {
        saved += 1;
      }

      continue;
    }

    const { data, error } = await state.supabase
      .from("characters")
      .insert({
        user_id: state.userId,
        work_id: workId,
        name: character.name,
        role: character.role || null,
        aliases: character.aliases ?? [],
        description: character.description || null,
        reveal_episode_id: reveal.reveal_episode_id,
        reveal_order: reveal.reveal_order
      })
      .select("id,name")
      .single();

    if (error || !data) {
      errors.push(`인물 ${character.name}: ${error?.message ?? "저장 실패"}`);
      continue;
    }

    nameToId.set((data.name as string).trim().toLowerCase(), data.id as string);
    saved += 1;
  }

  for (const event of selectedEvents) {
    const { error } = await state.supabase.from("events").insert({
      user_id: state.userId,
      work_id: workId,
      title: event.title,
      summary: event.summary,
      event_type: event.event_type || null,
      importance: event.importance ?? 3,
      reveal_episode_id: reveal.reveal_episode_id,
      reveal_order: reveal.reveal_order
    });

    if (error) {
      errors.push(`사건 ${event.title}: ${error.message}`);
    } else {
      saved += 1;
    }
  }

  for (const term of selectedTerms) {
    const { error } = await state.supabase.from("terms").insert({
      user_id: state.userId,
      work_id: workId,
      term: term.term,
      definition: term.definition,
      category: term.category || null,
      reveal_episode_id: reveal.reveal_episode_id,
      reveal_order: reveal.reveal_order
    });

    if (error) {
      errors.push(`용어 ${term.term}: ${error.message}`);
    } else {
      saved += 1;
    }
  }

  for (const note of selectedNotes) {
    const { error } = await state.supabase.from("notes").insert({
      user_id: state.userId,
      work_id: workId,
      title: note.title || null,
      body: note.body,
      note_type: note.note_type || "fact",
      reveal_episode_id: reveal.reveal_episode_id,
      reveal_order: reveal.reveal_order
    });

    if (error) {
      errors.push(`메모: ${error.message}`);
    } else {
      saved += 1;
    }
  }

  for (const relationship of selectedRelationships) {
    const sourceId = nameToId.get(relationship.source_name.trim().toLowerCase());
    const targetId = nameToId.get(relationship.target_name.trim().toLowerCase());

    if (!sourceId || !targetId) {
      errors.push(
        `관계 ${relationship.source_name}–${relationship.target_name}: 양쪽 인물이 필요합니다. 인물 초안을 함께 저장하세요.`
      );
      continue;
    }

    const { error } = await state.supabase.from("relationships").insert({
      user_id: state.userId,
      work_id: workId,
      source_character_id: sourceId,
      target_character_id: targetId,
      relationship_type: relationship.relationship_type,
      label: relationship.label || null,
      description: relationship.description || null,
      reveal_episode_id: reveal.reveal_episode_id,
      reveal_order: reveal.reveal_order
    });

    if (error) {
      errors.push(
        `관계 ${relationship.source_name}–${relationship.target_name}: ${error.message}`
      );
    } else {
      saved += 1;
    }
  }

  revalidatePath(`/works/${workId}`);
  revalidatePath(`/works/${workId}/review`);
  revalidatePath(`/works/${workId}/graph`);

  if (saved === 0) {
    return {
      error: errors[0] ?? "선택한 항목을 저장하지 못했습니다."
    };
  }

  return {
    message:
      errors.length > 0
        ? `${saved}개 저장. 일부 실패: ${errors.slice(0, 2).join(" / ")}`
        : `${saved}개 항목을 저장했습니다. 진행도 이하 공개 회차만 목록에 보입니다.`,
    error: errors.length > 0 ? errors.slice(0, 3).join(" · ") : undefined
  };
}
