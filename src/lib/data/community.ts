import { normalizeWorkTitleKey } from "@/lib/community";
import { getAuthDataState, getWorkDetail } from "@/lib/data/storylog";
import { getProgressRevealOrder } from "@/lib/spoiler-filter";
import type {
  CommunityComment,
  CommunityPost,
  CommunitySpace,
  Episode,
  Work
} from "@/types/database";

export type LoungePost = CommunityPost & {
  isOwn: boolean;
  visible: boolean;
  comments: Array<CommunityComment & { isOwn: boolean; visible: boolean }>;
  visibleCommentCount: number;
  hiddenCommentCount: number;
};

export type LoungeData = {
  work: Work;
  episodes: Episode[];
  currentRevealOrder: number;
  space: CommunitySpace;
  visiblePosts: LoungePost[];
  hiddenPostCount: number;
};

export async function getOrCreateCommunitySpace(
  title: string,
  medium: string | null
): Promise<CommunitySpace | null> {
  const state = await getAuthDataState();

  if (state.status !== "ready") {
    return null;
  }

  const titleKey = normalizeWorkTitleKey(title);

  if (!titleKey) {
    return null;
  }

  const { data: existing } = await state.supabase
    .from("community_spaces")
    .select("*")
    .eq("title_key", titleKey)
    .maybeSingle();

  if (existing) {
    return existing as CommunitySpace;
  }

  const { data: created, error } = await state.supabase
    .from("community_spaces")
    .insert({
      title: title.trim(),
      title_key: titleKey,
      medium
    })
    .select("*")
    .single();

  if (error) {
    // Concurrent create: fetch again
    const { data: raced } = await state.supabase
      .from("community_spaces")
      .select("*")
      .eq("title_key", titleKey)
      .maybeSingle();

    return (raced as CommunitySpace | null) ?? null;
  }

  return created as CommunitySpace;
}

export async function getLoungeData(workId: string): Promise<LoungeData | null> {
  const state = await getAuthDataState();
  const work = await getWorkDetail(workId);

  if (state.status !== "ready" || !work) {
    return null;
  }

  const space = await getOrCreateCommunitySpace(work.title, work.medium);

  if (!space) {
    return null;
  }

  const currentRevealOrder = getProgressRevealOrder(work.progress, work.episodes);
  // Not started: only spoiler-free posts (order 0). With progress: up to that order.
  const loungeCeiling = currentRevealOrder < 0 ? 0 : currentRevealOrder;

  const { data: posts } = await state.supabase
    .from("community_posts")
    .select("*")
    .eq("space_id", space.id)
    .order("created_at", { ascending: false });

  const postRows = (posts ?? []) as CommunityPost[];
  const postIds = postRows.map((post) => post.id);

  let commentRows: CommunityComment[] = [];

  if (postIds.length > 0) {
    const { data: comments } = await state.supabase
      .from("community_comments")
      .select("*")
      .in("post_id", postIds)
      .order("created_at", { ascending: true });

    commentRows = (comments ?? []) as CommunityComment[];
  }

  const commentsByPost = new Map<string, CommunityComment[]>();

  for (const comment of commentRows) {
    const list = commentsByPost.get(comment.post_id) ?? [];
    list.push(comment);
    commentsByPost.set(comment.post_id, list);
  }

  const loungePosts: LoungePost[] = postRows.map((post) => {
    const comments = (commentsByPost.get(post.id) ?? []).map((comment) => {
      const visible = comment.spoiler_reveal_order <= loungeCeiling;

      return {
        ...comment,
        isOwn: comment.author_id === state.userId,
        visible
      };
    });

    const visibleComments = comments.filter((comment) => comment.visible);

    return {
      ...post,
      isOwn: post.author_id === state.userId,
      visible: post.spoiler_reveal_order <= loungeCeiling,
      comments: visibleComments,
      visibleCommentCount: visibleComments.length,
      hiddenCommentCount: comments.length - visibleComments.length
    };
  });

  const visiblePosts = loungePosts.filter((post) => post.visible);
  const hiddenPostCount = loungePosts.length - visiblePosts.length;

  return {
    work,
    episodes: work.episodes,
    currentRevealOrder,
    space,
    visiblePosts,
    hiddenPostCount
  };
}
