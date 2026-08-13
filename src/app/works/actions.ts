"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthDataState, type AuthDataState } from "@/lib/data/storylog";
import {
  resolveCoverImageUrl,
  withCoverMetadata
} from "@/lib/work-cover";

export type ActionState = {
  error?: string;
  message?: string;
};

const WORK_TYPES = new Set(["book", "movie", "drama", "webtoon", "other"]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, key: string) {
  const rawValue = getString(formData, key);

  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);

  return Number.isFinite(value) ? value : null;
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
    .select("id,reveal_order")
    .eq("id", episodeId)
    .eq("work_id", workId)
    .eq("user_id", state.userId)
    .single();

  if (error || !data) {
    return { error: "공개 회차를 찾을 수 없습니다." } as const;
  }

  return {
    reveal_episode_id: data.id as string,
    reveal_order: data.reveal_order as number
  } as const;
}

function parseAliases(value: string) {
  return value
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean);
}

async function validateRelationshipCharacters(
  state: Extract<AuthDataState, { status: "ready" }>,
  workId: string,
  sourceCharacterId: string,
  targetCharacterId: string
) {
  const { data, error } = await state.supabase
    .from("characters")
    .select("id")
    .eq("work_id", workId)
    .eq("user_id", state.userId)
    .in("id", [sourceCharacterId, targetCharacterId]);

  if (error || (data ?? []).length !== 2) {
    return { error: "선택한 인물을 이 작품에서 찾을 수 없습니다." } as const;
  }

  return { ok: true } as const;
}

export async function createWork(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const title = getString(formData, "title");
  const medium = getString(formData, "medium");
  const genre = getString(formData, "genre");
  const description = getString(formData, "description");

  if (title.length < 1) {
    return { error: "작품 제목을 입력해 주세요." };
  }

  if (!WORK_TYPES.has(medium)) {
    return { error: "작품 유형을 선택해 주세요." };
  }

  const cover = await resolveCoverImageUrl(state, formData);

  if (cover.error) {
    return { error: cover.error };
  }

  // Prefer column + metadata. If column is missing (migration not applied),
  // retry with metadata-only so covers still show on the works list.
  const baseRow = {
    user_id: state.userId,
    title,
    medium,
    genre: genre || null,
    description: description || null,
    status: "watching" as const,
    metadata: withCoverMetadata({}, cover.url)
  };

  let data: { id: string } | null = null;
  let errorMessage: string | null = null;

  {
    const first = await state.supabase
      .from("works")
      .insert({
        ...baseRow,
        cover_image_url: cover.url
      })
      .select("id")
      .single();

    if (!first.error && first.data) {
      data = first.data as { id: string };
    } else if (
      first.error &&
      (first.error.message.includes("cover_image_url") ||
        first.error.message.includes("schema cache") ||
        first.error.code === "PGRST204" ||
        first.error.code === "42703")
    ) {
      const fallback = await state.supabase
        .from("works")
        .insert(baseRow)
        .select("id")
        .single();

      if (fallback.error || !fallback.data) {
        errorMessage = fallback.error?.message ?? "작품 생성에 실패했습니다.";
      } else {
        data = fallback.data as { id: string };
      }
    } else {
      errorMessage = first.error?.message ?? "작품 생성에 실패했습니다.";
    }
  }

  if (!data) {
    return { error: errorMessage ?? "작품 생성에 실패했습니다." };
  }

  revalidatePath("/works");
  redirect(`/works/${data.id}`);
}

export async function updateWorkCover(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const clearCover = getString(formData, "clear_cover") === "1";

  if (!workId) {
    return { error: "작품 정보를 찾을 수 없습니다." };
  }

  let coverImageUrl: string | null = null;

  if (!clearCover) {
    const cover = await resolveCoverImageUrl(state, formData, workId);

    if (cover.error) {
      return { error: cover.error };
    }

    if (!cover.url) {
      return {
        error: "이미지 파일을 선택하거나 이미지 URL을 입력해 주세요."
      };
    }

    coverImageUrl = cover.url;
  }

  const { data: existing } = await state.supabase
    .from("works")
    .select("metadata")
    .eq("id", workId)
    .eq("user_id", state.userId)
    .maybeSingle();

  if (!existing) {
    return { error: "작품을 찾을 수 없습니다." };
  }

  const metadata = withCoverMetadata(
    (existing.metadata as import("@/types/database").Json) ?? {},
    coverImageUrl
  );

  // Dual-write: column when available, always metadata (migration-safe).
  const withColumn = await state.supabase
    .from("works")
    .update({
      cover_image_url: coverImageUrl,
      metadata
    })
    .eq("id", workId)
    .eq("user_id", state.userId);

  if (withColumn.error) {
    const missingColumn =
      withColumn.error.message.includes("cover_image_url") ||
      withColumn.error.message.includes("schema cache") ||
      withColumn.error.code === "PGRST204" ||
      withColumn.error.code === "42703";

    if (!missingColumn) {
      return { error: withColumn.error.message };
    }

    const metadataOnly = await state.supabase
      .from("works")
      .update({ metadata })
      .eq("id", workId)
      .eq("user_id", state.userId);

    if (metadataOnly.error) {
      return { error: metadataOnly.error.message };
    }
  }

  revalidatePath("/works");
  revalidatePath(`/works/${workId}`);
  return {
    message: clearCover
      ? "대표 이미지를 제거했습니다."
      : "대표 이미지를 저장했습니다. 내 작품 목록에서 확인해 주세요."
  };
}

async function allocateRevealOrder(
  state: Extract<AuthDataState, { status: "ready" }>,
  workId: string,
  preferred: number | null,
  episodeNumber: number | null,
  excludeEpisodeId?: string
) {
  let query = state.supabase
    .from("episodes")
    .select("id,reveal_order")
    .eq("work_id", workId)
    .eq("user_id", state.userId)
    .order("reveal_order", { ascending: true });

  const { data, error } = await query;

  if (error) {
    return { error: error.message } as const;
  }

  const rows = (data ?? []).filter(
    (row) => !excludeEpisodeId || row.id !== excludeEpisodeId
  );
  const used = new Set(rows.map((row) => row.reveal_order as number));
  const maxOrder = rows.reduce(
    (highest, row) => Math.max(highest, row.reveal_order as number),
    0
  );

  const candidates = [
    preferred,
    episodeNumber !== null && Number.isInteger(episodeNumber)
      ? episodeNumber
      : null,
    maxOrder + 1,
    rows.length === 0 ? 1 : null
  ];

  for (const candidate of candidates) {
    if (
      candidate !== null &&
      candidate >= 0 &&
      Number.isInteger(candidate) &&
      !used.has(candidate)
    ) {
      return { reveal_order: candidate } as const;
    }
  }

  let next = maxOrder + 1;
  while (used.has(next)) {
    next += 1;
  }

  return { reveal_order: next } as const;
}

export async function createEpisode(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const seasonLabel = getString(formData, "season_label");
  const episodeNumber = getNumber(formData, "episode_number");
  const episodeLabel = getString(formData, "episode_label");
  const preferredRevealOrder = getNumber(formData, "reveal_order");
  const title = getString(formData, "title");
  const summary = getString(formData, "summary");

  if (!workId) {
    return { error: "작품 정보를 찾을 수 없습니다." };
  }

  if (!episodeLabel && episodeNumber === null) {
    return { error: "회차 번호 또는 회차 라벨을 입력해 주세요." };
  }

  if (
    preferredRevealOrder !== null &&
    (preferredRevealOrder < 0 || !Number.isInteger(preferredRevealOrder))
  ) {
    return { error: "스포일러 순서는 0 이상의 정수여야 합니다." };
  }

  const allocated = await allocateRevealOrder(
    state,
    workId,
    preferredRevealOrder,
    episodeNumber
  );

  if ("error" in allocated) {
    return { error: allocated.error };
  }

  const normalizedLabel =
    episodeLabel || (episodeNumber !== null ? `${episodeNumber}화` : "");

  const { error } = await state.supabase.from("episodes").insert({
    user_id: state.userId,
    work_id: workId,
    season_label: seasonLabel || null,
    episode_label: normalizedLabel,
    episode_number: episodeNumber,
    reveal_order: allocated.reveal_order,
    title: title || null,
    summary: summary || null
  });

  if (error) {
    if (error.message.includes("episodes_work_id_reveal_order_key")) {
      return {
        error:
          "스포 순서가 이미 사용 중입니다. 다른 번호를 쓰거나 비운 뒤 다시 저장해 주세요."
      };
    }

    return { error: error.message };
  }

  revalidatePath("/works");
  revalidatePath(`/works/${workId}`);
  return {};
}

export async function updateEpisode(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const episodeId = getString(formData, "episode_id");
  const seasonLabel = getString(formData, "season_label");
  const episodeNumber = getNumber(formData, "episode_number");
  const episodeLabel = getString(formData, "episode_label");
  const preferredRevealOrder = getNumber(formData, "reveal_order");
  const title = getString(formData, "title");
  const summary = getString(formData, "summary");

  if (!workId || !episodeId) {
    return { error: "회차 정보를 찾을 수 없습니다." };
  }

  if (!episodeLabel && episodeNumber === null) {
    return { error: "회차 번호 또는 회차 라벨을 입력해 주세요." };
  }

  if (
    preferredRevealOrder === null ||
    preferredRevealOrder < 0 ||
    !Number.isInteger(preferredRevealOrder)
  ) {
    return { error: "스포일러 순서는 0 이상의 정수여야 합니다." };
  }

  const allocated = await allocateRevealOrder(
    state,
    workId,
    preferredRevealOrder,
    episodeNumber,
    episodeId
  );

  if ("error" in allocated) {
    return { error: allocated.error };
  }

  const { error } = await state.supabase
    .from("episodes")
    .update({
      season_label: seasonLabel || null,
      episode_label:
        episodeLabel || (episodeNumber !== null ? `${episodeNumber}화` : ""),
      episode_number: episodeNumber,
      reveal_order: allocated.reveal_order,
      title: title || null,
      summary: summary || null
    })
    .eq("id", episodeId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  if (error) {
    if (error.message.includes("episodes_work_id_reveal_order_key")) {
      return {
        error: "스포 순서가 다른 회차와 겹칩니다. 다른 번호를 사용해 주세요."
      };
    }

    return { error: error.message };
  }

  // Keep denormalized reveal_order on lore rows in sync with the linked episode.
  const loreTables = [
    "characters",
    "character_states",
    "events",
    "terms",
    "notes",
    "relationships",
    "relationship_changes",
    "factions",
    "foreshadows"
  ] as const;

  await Promise.all(
    loreTables.map((table) =>
      state.supabase
        .from(table)
        .update({ reveal_order: allocated.reveal_order })
        .eq("work_id", workId)
        .eq("user_id", state.userId)
        .eq("reveal_episode_id", episodeId)
    )
  );

  await state.supabase
    .from("user_progress")
    .update({ reveal_order: allocated.reveal_order })
    .eq("work_id", workId)
    .eq("user_id", state.userId)
    .eq("episode_id", episodeId);

  revalidatePath(`/works/${workId}`);
  revalidatePath(`/works/${workId}/review`);
  revalidatePath(`/works/${workId}/graph`);
  return {};
}

export async function deleteEpisode(formData: FormData) {
  const state = await getReadyState();
  const workId = getString(formData, "work_id");
  const episodeId = getString(formData, "episode_id");

  if (state.status === "error" || !workId || !episodeId) {
    return;
  }

  await state.supabase
    .from("episodes")
    .delete()
    .eq("id", episodeId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  revalidatePath("/works");
  revalidatePath(`/works/${workId}`);
}

export async function setProgress(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();
  const workId = getString(formData, "work_id");
  const episodeId = getString(formData, "episode_id");

  if (state.status === "error") {
    return { error: state.error };
  }

  if (!workId) {
    return { error: "작품 정보를 찾을 수 없습니다." };
  }

  // Always resolve reveal_order from the selected episode in the DB.
  // Never trust a client-provided denormalized value (stale form races).
  let revealOrder = 0;
  let resolvedEpisodeId: string | null = null;

  if (episodeId) {
    const { data: episode, error } = await state.supabase
      .from("episodes")
      .select("id,reveal_order")
      .eq("id", episodeId)
      .eq("work_id", workId)
      .eq("user_id", state.userId)
      .maybeSingle();

    if (error || !episode) {
      return {
        error:
          "선택한 회차를 찾을 수 없습니다. 페이지를 새로고침한 뒤 다시 저장해 주세요."
      };
    }

    resolvedEpisodeId = episode.id as string;
    revealOrder = episode.reveal_order as number;
  }

  const { data: saved, error } = await state.supabase
    .from("user_progress")
    .upsert(
      {
        user_id: state.userId,
        work_id: workId,
        episode_id: resolvedEpisodeId,
        reveal_order: revealOrder
      },
      { onConflict: "user_id,work_id" }
    )
    .select("id,episode_id,reveal_order,updated_at")
    .single();

  if (error || !saved) {
    return { error: error?.message ?? "진행도 저장에 실패했습니다." };
  }

  revalidatePath("/works");
  revalidatePath(`/works/${workId}`);
  revalidatePath(`/works/${workId}/review`);
  revalidatePath(`/works/${workId}/graph`);

  return {
    message: resolvedEpisodeId
      ? `진행도를 저장했습니다. (공개 상한 순서 ${revealOrder})`
      : "진행도를 '아직 시작 전'으로 저장했습니다."
  };
}

export async function createCharacter(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const name = getString(formData, "name");
  const role = getString(formData, "role");
  const aliases = parseAliases(getString(formData, "aliases"));
  const description = getString(formData, "description");
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !name) {
    return { error: "작품과 인물 이름을 입력해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const { error } = await state.supabase.from("characters").insert({
    user_id: state.userId,
    work_id: workId,
    name,
    aliases,
    role: role || null,
    description: description || null,
    reveal_episode_id: reveal.reveal_episode_id,
    reveal_order: reveal.reveal_order
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  return {};
}

export async function updateCharacter(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const characterId = getString(formData, "character_id");
  const name = getString(formData, "name");
  const role = getString(formData, "role");
  const aliases = parseAliases(getString(formData, "aliases"));
  const description = getString(formData, "description");
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !characterId || !name) {
    return { error: "인물 정보를 입력해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const { error } = await state.supabase
    .from("characters")
    .update({
      name,
      aliases,
      role: role || null,
      description: description || null,
      reveal_episode_id: reveal.reveal_episode_id,
      reveal_order: reveal.reveal_order
    })
    .eq("id", characterId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  return {};
}

export async function deleteCharacter(formData: FormData) {
  const state = await getReadyState();
  const workId = getString(formData, "work_id");
  const characterId = getString(formData, "character_id");

  if (state.status === "error" || !workId || !characterId) {
    return;
  }

  await state.supabase
    .from("characters")
    .delete()
    .eq("id", characterId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  revalidatePath(`/works/${workId}`);
}

export async function createCharacterState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const characterId = getString(formData, "character_id");
  const summary = getString(formData, "summary");
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !characterId || !summary) {
    return { error: "상태를 기록할 인물과 요약을 입력해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const { error } = await state.supabase.from("character_states").insert({
    user_id: state.userId,
    work_id: workId,
    character_id: characterId,
    status: getString(formData, "status") || null,
    affiliation: getString(formData, "affiliation") || null,
    location: getString(formData, "location") || null,
    summary,
    reveal_episode_id: reveal.reveal_episode_id,
    reveal_order: reveal.reveal_order
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  return {};
}

export async function updateCharacterState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const stateId = getString(formData, "state_id");
  const summary = getString(formData, "summary");
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !stateId || !summary) {
    return { error: "상태 요약을 입력해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const { error } = await state.supabase
    .from("character_states")
    .update({
      status: getString(formData, "status") || null,
      affiliation: getString(formData, "affiliation") || null,
      location: getString(formData, "location") || null,
      summary,
      reveal_episode_id: reveal.reveal_episode_id,
      reveal_order: reveal.reveal_order
    })
    .eq("id", stateId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  return {};
}

export async function deleteCharacterState(formData: FormData) {
  const state = await getReadyState();
  const workId = getString(formData, "work_id");
  const stateId = getString(formData, "state_id");

  if (state.status === "error" || !workId || !stateId) {
    return;
  }

  await state.supabase
    .from("character_states")
    .delete()
    .eq("id", stateId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  revalidatePath(`/works/${workId}`);
}

export async function createEvent(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const title = getString(formData, "title");
  const summary = getString(formData, "summary");
  const importance = getNumber(formData, "importance") ?? 3;
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !title || !summary) {
    return { error: "사건 제목과 요약을 입력해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const { error } = await state.supabase.from("events").insert({
    user_id: state.userId,
    work_id: workId,
    title,
    event_type: getString(formData, "event_type") || null,
    summary,
    importance: Math.min(5, Math.max(1, importance)),
    reveal_episode_id: reveal.reveal_episode_id,
    reveal_order: reveal.reveal_order
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  return {};
}

export async function updateEvent(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const eventId = getString(formData, "event_id");
  const title = getString(formData, "title");
  const summary = getString(formData, "summary");
  const importance = getNumber(formData, "importance") ?? 3;
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !eventId || !title || !summary) {
    return { error: "사건 제목과 요약을 입력해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const { error } = await state.supabase
    .from("events")
    .update({
      title,
      event_type: getString(formData, "event_type") || null,
      summary,
      importance: Math.min(5, Math.max(1, importance)),
      reveal_episode_id: reveal.reveal_episode_id,
      reveal_order: reveal.reveal_order
    })
    .eq("id", eventId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  return {};
}

export async function deleteEvent(formData: FormData) {
  const state = await getReadyState();
  const workId = getString(formData, "work_id");
  const eventId = getString(formData, "event_id");

  if (state.status === "error" || !workId || !eventId) {
    return;
  }

  await state.supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  revalidatePath(`/works/${workId}`);
}

export async function createTerm(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const term = getString(formData, "term");
  const definition = getString(formData, "definition");
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !term || !definition) {
    return { error: "용어와 정의를 입력해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const { error } = await state.supabase.from("terms").insert({
    user_id: state.userId,
    work_id: workId,
    term,
    category: getString(formData, "category") || null,
    definition,
    reveal_episode_id: reveal.reveal_episode_id,
    reveal_order: reveal.reveal_order
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  return {};
}

export async function updateTerm(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const termId = getString(formData, "term_id");
  const term = getString(formData, "term");
  const definition = getString(formData, "definition");
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !termId || !term || !definition) {
    return { error: "용어와 정의를 입력해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const { error } = await state.supabase
    .from("terms")
    .update({
      term,
      category: getString(formData, "category") || null,
      definition,
      reveal_episode_id: reveal.reveal_episode_id,
      reveal_order: reveal.reveal_order
    })
    .eq("id", termId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  return {};
}

export async function deleteTerm(formData: FormData) {
  const state = await getReadyState();
  const workId = getString(formData, "work_id");
  const termId = getString(formData, "term_id");

  if (state.status === "error" || !workId || !termId) {
    return;
  }

  await state.supabase
    .from("terms")
    .delete()
    .eq("id", termId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  revalidatePath(`/works/${workId}`);
}

export async function createNote(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const body = getString(formData, "body");
  const noteType = getString(formData, "note_type") || "fact";
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !body) {
    return { error: "메모 내용을 입력해 주세요." };
  }

  if (!["fact", "theory", "question", "todo"].includes(noteType)) {
    return { error: "메모 유형을 선택해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const { error } = await state.supabase.from("notes").insert({
    user_id: state.userId,
    work_id: workId,
    title: getString(formData, "title") || null,
    body,
    note_type: noteType,
    reveal_episode_id: reveal.reveal_episode_id,
    reveal_order: reveal.reveal_order
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  return {};
}

export async function updateNote(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const noteId = getString(formData, "note_id");
  const body = getString(formData, "body");
  const noteType = getString(formData, "note_type") || "fact";
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !noteId || !body) {
    return { error: "메모 내용을 입력해 주세요." };
  }

  if (!["fact", "theory", "question", "todo"].includes(noteType)) {
    return { error: "메모 유형을 선택해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const { error } = await state.supabase
    .from("notes")
    .update({
      title: getString(formData, "title") || null,
      body,
      note_type: noteType,
      reveal_episode_id: reveal.reveal_episode_id,
      reveal_order: reveal.reveal_order
    })
    .eq("id", noteId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  return {};
}

export async function deleteNote(formData: FormData) {
  const state = await getReadyState();
  const workId = getString(formData, "work_id");
  const noteId = getString(formData, "note_id");

  if (state.status === "error" || !workId || !noteId) {
    return;
  }

  await state.supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  revalidatePath(`/works/${workId}`);
}

export async function createRelationship(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const sourceCharacterId = getString(formData, "source_character_id");
  const targetCharacterId = getString(formData, "target_character_id");
  const relationshipType = getString(formData, "relationship_type");
  const label = getString(formData, "label");
  const description = getString(formData, "description");
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !sourceCharacterId || !targetCharacterId || !relationshipType) {
    return { error: "관계 인물과 관계 유형을 입력해 주세요." };
  }

  if (sourceCharacterId === targetCharacterId) {
    return { error: "서로 다른 두 인물을 선택해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const characters = await validateRelationshipCharacters(
    state,
    workId,
    sourceCharacterId,
    targetCharacterId
  );

  if ("error" in characters) {
    return { error: characters.error };
  }

  const { error } = await state.supabase.from("relationships").insert({
    user_id: state.userId,
    work_id: workId,
    source_character_id: sourceCharacterId,
    target_character_id: targetCharacterId,
    relationship_type: relationshipType,
    label: label || null,
    description: description || null,
    reveal_episode_id: reveal.reveal_episode_id,
    reveal_order: reveal.reveal_order
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  revalidatePath(`/works/${workId}/graph`);
  return {};
}

export async function updateRelationship(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const relationshipId = getString(formData, "relationship_id");
  const sourceCharacterId = getString(formData, "source_character_id");
  const targetCharacterId = getString(formData, "target_character_id");
  const relationshipType = getString(formData, "relationship_type");
  const label = getString(formData, "label");
  const description = getString(formData, "description");
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (
    !workId ||
    !relationshipId ||
    !sourceCharacterId ||
    !targetCharacterId ||
    !relationshipType
  ) {
    return { error: "관계 정보를 입력해 주세요." };
  }

  if (sourceCharacterId === targetCharacterId) {
    return { error: "서로 다른 두 인물을 선택해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const characters = await validateRelationshipCharacters(
    state,
    workId,
    sourceCharacterId,
    targetCharacterId
  );

  if ("error" in characters) {
    return { error: characters.error };
  }

  const { error } = await state.supabase
    .from("relationships")
    .update({
      source_character_id: sourceCharacterId,
      target_character_id: targetCharacterId,
      relationship_type: relationshipType,
      label: label || null,
      description: description || null,
      reveal_episode_id: reveal.reveal_episode_id,
      reveal_order: reveal.reveal_order
    })
    .eq("id", relationshipId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  revalidatePath(`/works/${workId}/graph`);
  return {};
}

export async function deleteRelationship(formData: FormData) {
  const state = await getReadyState();
  const workId = getString(formData, "work_id");
  const relationshipId = getString(formData, "relationship_id");

  if (state.status === "error" || !workId || !relationshipId) {
    return;
  }

  await state.supabase
    .from("relationships")
    .delete()
    .eq("id", relationshipId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  revalidatePath(`/works/${workId}`);
  revalidatePath(`/works/${workId}/graph`);
}

export async function createRelationshipChange(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const relationshipId = getString(formData, "relationship_id");
  const changeType = getString(formData, "change_type");
  const summary = getString(formData, "summary");
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !relationshipId || !changeType || !summary) {
    return { error: "관계 변화 유형과 요약을 입력해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const { error } = await state.supabase.from("relationship_changes").insert({
    user_id: state.userId,
    work_id: workId,
    relationship_id: relationshipId,
    change_type: changeType,
    summary,
    reveal_episode_id: reveal.reveal_episode_id,
    reveal_order: reveal.reveal_order
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  revalidatePath(`/works/${workId}/graph`);
  return {};
}

export async function updateRelationshipChange(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const relationshipChangeId = getString(formData, "relationship_change_id");
  const changeType = getString(formData, "change_type");
  const summary = getString(formData, "summary");
  const reveal = await getRevealEpisode(
    state,
    workId,
    getString(formData, "reveal_episode_id")
  );

  if (!workId || !relationshipChangeId || !changeType || !summary) {
    return { error: "관계 변화 정보를 입력해 주세요." };
  }

  if ("error" in reveal) {
    return { error: reveal.error };
  }

  const { error } = await state.supabase
    .from("relationship_changes")
    .update({
      change_type: changeType,
      summary,
      reveal_episode_id: reveal.reveal_episode_id,
      reveal_order: reveal.reveal_order
    })
    .eq("id", relationshipChangeId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  revalidatePath(`/works/${workId}/graph`);
  return {};
}

export async function deleteRelationshipChange(formData: FormData) {
  const state = await getReadyState();
  const workId = getString(formData, "work_id");
  const relationshipChangeId = getString(formData, "relationship_change_id");

  if (state.status === "error" || !workId || !relationshipChangeId) {
    return;
  }

  await state.supabase
    .from("relationship_changes")
    .delete()
    .eq("id", relationshipChangeId)
    .eq("work_id", workId)
    .eq("user_id", state.userId);

  revalidatePath(`/works/${workId}`);
  revalidatePath(`/works/${workId}/graph`);
}
