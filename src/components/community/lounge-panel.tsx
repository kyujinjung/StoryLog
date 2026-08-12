"use client";

import { useActionState } from "react";
import { BookmarkPlus, MessageSquare, Trash2 } from "lucide-react";

import {
  createCommunityCommentAction,
  createCommunityPostAction,
  deleteCommunityCommentAction,
  deleteCommunityPostAction,
  savePostToPersonalNoteAction,
  type LoungeActionState
} from "@/app/works/lounge-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  COMMUNITY_CATEGORIES,
  communityCategoryLabel
} from "@/lib/community";
import type { LoungePost } from "@/lib/data/community";
import { formatEpisodeLabel } from "@/lib/storylog-format";
import type { Episode } from "@/types/database";

const initialState: LoungeActionState = {};

function SpoilerEpisodeSelect({
  id,
  episodes,
  name = "spoiler_episode_id"
}: {
  id: string;
  episodes: Episode[];
  name?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      defaultValue={episodes[0]?.id ?? ""}
    >
      <option value="">시작 전 / 스포 없음 (순서 0)</option>
      {episodes.map((episode) => (
        <option key={episode.id} value={episode.id}>
          {formatEpisodeLabel(episode) || `순서 ${episode.reveal_order}`}
          {` · 순서 ${episode.reveal_order}`}
        </option>
      ))}
    </select>
  );
}

function CreatePostForm({
  workId,
  episodes
}: {
  workId: string;
  episodes: Episode[];
}) {
  const [state, action, isPending] = useActionState(
    createCommunityPostAction,
    initialState
  );

  return (
    <form action={action} className="grid gap-3 rounded-lg border p-4">
      <input type="hidden" name="work_id" value={workId} />
      <h3 className="font-semibold">글 쓰기</h3>
      <p className="text-sm text-muted-foreground">
        스포일러 범위를 반드시 지정하세요. 다른 사용자의 진행도보다 앞선 글은
        자동으로 숨겨집니다.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="post-category">유형</Label>
          <select
            id="post-category"
            name="category"
            defaultValue="question"
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {COMMUNITY_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="post-spoiler">스포일러 범위 (이 회차까지)</Label>
          <SpoilerEpisodeSelect id="post-spoiler" episodes={episodes} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="post-title">제목</Label>
        <Input id="post-title" name="title" required placeholder="질문이나 주제" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="post-body">본문</Label>
        <textarea
          id="post-body"
          name="body"
          rows={4}
          required
          className="rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="원문 복붙보다 해석/질문 위주로 적어 주세요."
        />
      </div>

      {state.error ? (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-md bg-secondary p-3 text-sm">{state.message}</p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "게시 중…" : "게시하기"}
      </Button>
    </form>
  );
}

function CommentForm({
  workId,
  postId,
  episodes
}: {
  workId: string;
  postId: string;
  episodes: Episode[];
}) {
  const [state, action, isPending] = useActionState(
    createCommunityCommentAction,
    initialState
  );

  return (
    <form action={action} className="mt-3 grid gap-2 border-t pt-3">
      <input type="hidden" name="work_id" value={workId} />
      <input type="hidden" name="post_id" value={postId} />
      <div className="grid gap-2 sm:grid-cols-[1fr_0.7fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor={`comment-body-${postId}`}>댓글</Label>
          <Input
            id={`comment-body-${postId}`}
            name="body"
            required
            placeholder="짧은 답변"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`comment-spoiler-${postId}`}>댓글 스포 범위</Label>
          <SpoilerEpisodeSelect
            id={`comment-spoiler-${postId}`}
            episodes={episodes}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "…" : "댓글"}
        </Button>
      </div>
      {state.error ? (
        <p className="text-sm text-muted-foreground">{state.error}</p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-muted-foreground">{state.message}</p>
      ) : null}
    </form>
  );
}

function SaveNoteButton({ workId, postId }: { workId: string; postId: string }) {
  const [state, action, isPending] = useActionState(
    savePostToPersonalNoteAction,
    initialState
  );

  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="work_id" value={workId} />
      <input type="hidden" name="post_id" value={postId} />
      <Button type="submit" size="sm" variant="ghost" disabled={isPending}>
        <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
        {isPending ? "저장 중" : "내 메모로"}
      </Button>
      {state.error ? (
        <span className="max-w-[12rem] text-right text-xs text-muted-foreground">
          {state.error}
        </span>
      ) : null}
      {state.message ? (
        <span className="text-xs text-muted-foreground">{state.message}</span>
      ) : null}
    </form>
  );
}

function PostCard({
  workId,
  episodes,
  post
}: {
  workId: string;
  episodes: Episode[];
  post: LoungePost;
}) {
  return (
    <article className="grid gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-md bg-secondary px-2 py-0.5">
              {communityCategoryLabel(post.category)}
            </span>
            <span>
              스포 범위: {post.spoiler_label || `순서 ${post.spoiler_reveal_order}`}
            </span>
            {post.isOwn ? <span>내 글</span> : null}
          </div>
          <h3 className="mt-2 text-lg font-semibold">{post.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <SaveNoteButton workId={workId} postId={post.id} />
          {post.isOwn ? (
            <form action={deleteCommunityPostAction}>
              <input type="hidden" name="work_id" value={workId} />
              <input type="hidden" name="post_id" value={post.id} />
              <Button type="submit" size="icon" variant="ghost" aria-label="글 삭제">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <p className="whitespace-pre-wrap leading-7 text-sm">{post.body}</p>

      <div className="grid gap-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          댓글 {post.visibleCommentCount}
          {post.hiddenCommentCount > 0
            ? ` · 숨김 ${post.hiddenCommentCount}`
            : ""}
        </h4>

        {post.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 댓글이 없습니다.</p>
        ) : (
          <ul className="grid gap-2">
            {post.comments.map((comment) => (
              <li
                key={comment.id}
                className="flex items-start justify-between gap-3 rounded-md bg-muted px-3 py-2 text-sm"
              >
                <div>
                  <p className="whitespace-pre-wrap leading-6">{comment.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    스포 순서 {comment.spoiler_reveal_order}
                    {comment.isOwn ? " · 내 댓글" : ""}
                  </p>
                </div>
                {comment.isOwn ? (
                  <form action={deleteCommunityCommentAction}>
                    <input type="hidden" name="work_id" value={workId} />
                    <input type="hidden" name="comment_id" value={comment.id} />
                    <Button
                      type="submit"
                      size="icon"
                      variant="ghost"
                      aria-label="댓글 삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <CommentForm workId={workId} postId={post.id} episodes={episodes} />
      </div>
    </article>
  );
}

export function LoungePanel({
  workId,
  episodes,
  posts,
  hiddenPostCount,
  currentRevealOrder
}: {
  workId: string;
  episodes: Episode[];
  posts: LoungePost[];
  hiddenPostCount: number;
  currentRevealOrder: number;
}) {
  return (
    <div className="grid gap-6">
      <CreatePostForm workId={workId} episodes={episodes} />

      <section className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">라운지 글</h2>
            <p className="text-sm text-muted-foreground">
              현재 공개 상한 순서 {currentRevealOrder < 0 ? "미설정" : currentRevealOrder}
              {hiddenPostCount > 0
                ? ` · 진행도 때문에 숨긴 글 ${hiddenPostCount}개`
                : ""}
            </p>
          </div>
        </div>

        {posts.length === 0 ? (
          <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            지금 진행도에서 볼 수 있는 글이 없습니다. 글을 쓰거나 진행도를 올려
            보세요.
          </p>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                workId={workId}
                episodes={episodes}
                post={post}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
