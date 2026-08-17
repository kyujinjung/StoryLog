import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, MessagesSquare, Network } from "lucide-react";

import { LoreDraftPanel } from "@/components/ai/lore-draft-panel";
import { LorePanels } from "@/components/lore/lore-panels";
import { RelationshipManager } from "@/components/relationships/relationship-manager";
import { EpisodeForm } from "@/components/works/episode-form";
import { EpisodeSchedule } from "@/components/works/episode-schedule";
import { ProgressForm } from "@/components/works/progress-form";
import { WorkCoverForm } from "@/components/works/work-cover-form";
import { Button } from "@/components/ui/button";
import { hasXaiApiKey } from "@/lib/ai/xai";
import { getNextRevealOrder, getWorkDetail } from "@/lib/data/storylog";
import { formatEpisodeLabel } from "@/lib/storylog-format";
import { getWorkCoverUrl } from "@/lib/work-cover";

type WorkDetailPageProps = {
  params: Promise<{
    workId: string;
  }>;
};

// Always fetch fresh work/episodes after mutations (createEpisode, progress, etc.)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { workId } = await params;
  const work = await getWorkDetail(workId);

  if (!work) {
    notFound();
  }

  const currentLabel = work.currentEpisode
    ? formatEpisodeLabel(work.currentEpisode)
    : work.progress
      ? "아직 시작 전"
      : "미설정";
  const progressCeilingLabel =
    work.currentRevealOrder < 0
      ? "진행도 미설정 · 로어 숨김"
      : `공개 상한 순서 ${work.currentRevealOrder}`;
  const coverUrl = getWorkCoverUrl(work);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10">
      <div className="cinema-card overflow-hidden rounded-2xl">
        <div className="relative min-h-[200px] overflow-hidden bg-gradient-to-br from-primary/40 via-black to-black sm:min-h-[240px]">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 p-6 sm:p-8">
            <div className="flex gap-4">
              {coverUrl ? (
                <div className="hidden shrink-0 overflow-hidden rounded-xl border border-white/15 shadow-2xl sm:block sm:w-28 md:w-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverUrl}
                    alt={`${work.title} 포스터`}
                    className="aspect-[2/3] h-auto w-full object-cover"
                  />
                </div>
              ) : null}
              <div>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="mb-3 -ml-2 text-white/80 hover:text-white"
                >
                  <Link href="/works">← 상영 목록</Link>
                </Button>
                <p className="cinema-section-label">NOW WATCHING</p>
                <h1 className="cinema-title mt-2 max-w-2xl text-3xl sm:text-4xl">
                  {work.title}
                </h1>
                <p className="mt-2 max-w-2xl leading-7 text-white/70">
                  {work.description || "작품 메모가 아직 없습니다."}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="cinema-badge cinema-badge-solid text-sm">
                현재 위치 · {currentLabel}
              </div>
              <p className="text-xs text-white/60">{progressCeilingLabel}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/works/${work.id}/review`}>
                    <ClipboardList className="h-4 w-4" aria-hidden="true" />
                    빠른 복습
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/works/${work.id}/graph`}>
                    <Network className="h-4 w-4" aria-hidden="true" />
                    관계도
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/works/${work.id}/lounge`}>
                    <MessagesSquare className="h-4 w-4" aria-hidden="true" />
                    라운지
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-5">
          <ProgressForm
            workId={work.id}
            episodes={work.episodes}
            progress={work.progress}
          />
          <WorkCoverForm workId={work.id} coverImageUrl={coverUrl} />
        </div>

        <div className="cinema-card rounded-2xl p-5">
          <p className="cinema-section-label">EPISODE</p>
          <h2 className="mt-1 text-lg font-bold">회차 추가</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            스포 순서는 나중에 스포일러 필터의 기준으로 사용됩니다.
          </p>
          <div className="mt-5">
            <EpisodeForm
              key={`create-${work.id}-${getNextRevealOrder(work.episodes)}`}
              workId={work.id}
              nextRevealOrder={getNextRevealOrder(work.episodes)}
            />
          </div>
        </div>
      </section>

      <LoreDraftPanel
        workId={work.id}
        episodes={work.episodes}
        hasXaiKey={hasXaiApiKey()}
      />

      <LorePanels
        workId={work.id}
        episodes={work.episodes}
        lore={work.lore}
        currentRevealOrder={work.currentRevealOrder}
      />

      <RelationshipManager
        workId={work.id}
        episodes={work.episodes}
        lore={work.lore}
      />

      <section className="grid gap-4">
        <div>
          <p className="cinema-section-label">SCHEDULE</p>
          <h2 className="cinema-title mt-1 text-2xl">상영 회차표</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            극장 시간표처럼 회차를 보고, 탭해서 수정합니다. 현재 진행 회차는 NOW로
            표시됩니다.
          </p>
        </div>

        <EpisodeSchedule
          workId={work.id}
          episodes={work.episodes}
          currentEpisodeId={work.currentEpisode?.id ?? null}
        />
      </section>
    </div>
  );
}
