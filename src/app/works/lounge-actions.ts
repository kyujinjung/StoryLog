"use server";

import { revalidatePath } from "next/cache";

import { COMMUNITY_CATEGORIES } from "@/lib/community";
import { getOrCreateCommunitySpace } from "@/lib/data/community";
import { getAuthDataState, type AuthDataState } from "@/lib/data/storylog";
import type { CommunityPostCategory } from "@/types/database";

export type LoungeActionState = {
  error?: string;
  message?: string;
};

const CATEGORY_VALUES = new Set(
  COMMUNITY_CATEGORIES.map((item) => item.value)
);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
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

async function getOwnedWork(
  state: Extract<AuthDataState, { status: "ready" }>,
  workId: string
) {
  const { data, error } = await state.supabase
    .from("works")
    .select("id,title,medium")
    .eq("id", workId)
    .eq("user_id", state.userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as { id: string; title: string; medium: string | null };
}

async function resolveSpoilerEpisode(
  state: Extract<AuthDataState, { status: "ready" }>,
  workId: string,
  episodeId: string
) {
  if (!episodeId) {
    return {
      spoiler_reveal_order: 0,
      spoiler_label: "시작 전/스포 없음"
    } as const;
  }

  const { data, error } = await state.supabase
    .from("episodes")
    .select("id,reveal_order,episode_label,title,season_label")
    .eq("id", episodeId)
    .eq("work_id", workId)
    .eq("user_id", state.userId)
    .maybeSingle();

  if (error || !data) {
    return { error: "스포일러 기준 회차를 찾을 수 없습니다." } as const;
  }

  const label = [data.season_label, data.episode_label, data.title]
    .filter(Boolean)
    .join(" · ");

  return {
    spoiler_reveal_order: data.reveal_order as number,
    spoiler_label: label || `순서 ${data.reveal_order}`
  } as const;
}

export async function createCommunityPostAction(
  _previousState: LoungeActionState,
  formData: FormData
): Promise<LoungeActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const category = getString(formData, "category") as CommunityPostCategory;
  const title = getString(formData, "title");
  const body = getString(formData, "body");
  const episodeId = getString(formData, "spoiler_episode_id");

  if (!workId) {
    return { error: "작품 정보를 찾을 수 없습니다." };
  }

  if (!CATEGORY_VALUES.has(category)) {
    return { error: "게시 유형을 선택해 주세요." };
  }

  if (title.length < 2) {
    return { error: "제목을 입력해 주세요." };
  }

  if (body.length < 2) {
    return { error: "본문을 입력해 주세요." };
  }

  if (body.length > 4000) {
    return { error: "본문은 4000자 이하로 작성해 주세요." };
  }

  const work = await getOwnedWork(state, workId);

  if (!work) {
    return { error: "작품을 찾을 수 없습니다." };
  }

  const spoiler = await resolveSpoilerEpisode(state, workId, episodeId);

  if ("error" in spoiler) {
    return { error: spoiler.error };
  }

  const space = await getOrCreateCommunitySpace(work.title, work.medium);

  if (!space) {
    return {
      error:
        "라운지 공간을 만들지 못했습니다. Phase 2 마이그레이션을 적용했는지 확인해 주세요."
    };
  }

  const { error } = await state.supabase.from("community_posts").insert({
    space_id: space.id,
    author_id: state.userId,
    category,
    title,
    body,
    spoiler_reveal_order: spoiler.spoiler_reveal_order,
    spoiler_label: spoiler.spoiler_label
  });

  if (error) {
    return {
      error:
        error.message.includes("community_posts") || error.code === "42P01"
          ? "커뮤니티 테이블이 없습니다. Supabase에 phase2 마이그레이션을 실행해 주세요."
          : error.message
    };
  }

  revalidatePath(`/works/${workId}/lounge`);
  return { message: "글을 게시했습니다. 진행도 이하 스포 범위만 목록에 보입니다." };
}

export async function createCommunityCommentAction(
  _previousState: LoungeActionState,
  formData: FormData
): Promise<LoungeActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const postId = getString(formData, "post_id");
  const body = getString(formData, "body");
  const episodeId = getString(formData, "spoiler_episode_id");

  if (!workId || !postId) {
    return { error: "게시글 정보를 찾을 수 없습니다." };
  }

  if (body.length < 1) {
    return { error: "댓글을 입력해 주세요." };
  }

  if (body.length > 2000) {
    return { error: "댓글은 2000자 이하로 작성해 주세요." };
  }

  const work = await getOwnedWork(state, workId);

  if (!work) {
    return { error: "작품을 찾을 수 없습니다." };
  }

  const spoiler = await resolveSpoilerEpisode(state, workId, episodeId);

  if ("error" in spoiler) {
    return { error: spoiler.error };
  }

  const { data: post } = await state.supabase
    .from("community_posts")
    .select("id")
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    return { error: "게시글을 찾을 수 없습니다." };
  }

  const { error } = await state.supabase.from("community_comments").insert({
    post_id: postId,
    author_id: state.userId,
    body,
    spoiler_reveal_order: spoiler.spoiler_reveal_order
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}/lounge`);
  return { message: "댓글을 등록했습니다." };
}

export async function deleteCommunityPostAction(formData: FormData) {
  const state = await getReadyState();
  const workId = getString(formData, "work_id");
  const postId = getString(formData, "post_id");

  if (state.status === "error" || !workId || !postId) {
    return;
  }

  await state.supabase
    .from("community_posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", state.userId);

  revalidatePath(`/works/${workId}/lounge`);
}

export async function deleteCommunityCommentAction(formData: FormData) {
  const state = await getReadyState();
  const workId = getString(formData, "work_id");
  const commentId = getString(formData, "comment_id");

  if (state.status === "error" || !workId || !commentId) {
    return;
  }

  await state.supabase
    .from("community_comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", state.userId);

  revalidatePath(`/works/${workId}/lounge`);
}

export async function savePostToPersonalNoteAction(
  _previousState: LoungeActionState,
  formData: FormData
): Promise<LoungeActionState> {
  const state = await getReadyState();

  if (state.status === "error") {
    return { error: state.error };
  }

  const workId = getString(formData, "work_id");
  const postId = getString(formData, "post_id");

  if (!workId || !postId) {
    return { error: "저장할 글을 찾을 수 없습니다." };
  }

  const work = await getOwnedWork(state, workId);

  if (!work) {
    return { error: "작품을 찾을 수 없습니다." };
  }

  const { data: post } = await state.supabase
    .from("community_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    return { error: "게시글을 찾을 수 없습니다." };
  }

  const { data: progress } = await state.supabase
    .from("user_progress")
    .select("reveal_order,episode_id")
    .eq("work_id", workId)
    .eq("user_id", state.userId)
    .maybeSingle();

  const progressOrder =
    progress && progress.episode_id
      ? ((progress.reveal_order as number | null) ?? 0)
      : -1;

  if ((post.spoiler_reveal_order as number) > progressOrder) {
    return {
      error: "현재 진행도보다 앞선 스포 범위 글은 메모로 저장할 수 없습니다."
    };
  }

  let revealEpisodeId: string | null =
    (progress?.episode_id as string | null) ?? null;
  let revealOrder = Math.max(0, progressOrder);

  if (!revealEpisodeId) {
    const { data: firstEpisode } = await state.supabase
      .from("episodes")
      .select("id,reveal_order")
      .eq("work_id", workId)
      .eq("user_id", state.userId)
      .order("reveal_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstEpisode) {
      revealEpisodeId = firstEpisode.id as string;
      revealOrder = firstEpisode.reveal_order as number;
    }
  }

  if (!revealEpisodeId) {
    return {
      error: "메모로 저장하려면 회차가 하나 이상 필요합니다."
    };
  }

  const { error } = await state.supabase.from("notes").insert({
    user_id: state.userId,
    work_id: workId,
    title: `[라운지] ${post.title as string}`,
    body: `${post.body as string}\n\n— 스포 범위: ${
      (post.spoiler_label as string | null) ?? `순서 ${post.spoiler_reveal_order}`
    }`,
    note_type: "fact",
    reveal_episode_id: revealEpisodeId,
    reveal_order: revealOrder
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/works/${workId}`);
  revalidatePath(`/works/${workId}/lounge`);
  return { message: "개인 메모로 저장했습니다." };
}
