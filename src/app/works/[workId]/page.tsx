import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Network } from "lucide-react";

import { LorePanels } from "@/components/lore/lore-panels";
import { RelationshipManager } from "@/components/relationships/relationship-manager";
import { DeleteEpisodeButton } from "@/components/works/delete-episode-button";
import { EpisodeForm } from "@/components/works/episode-form";
import { ProgressForm } from "@/components/works/progress-form";
import { Button } from "@/components/ui/button";
import { getNextRevealOrder, getWorkDetail } from "@/lib/data/storylog";
import { formatEpisodeLabel } from "@/lib/storylog-format";

type WorkDetailPageProps = {
  params: Promise<{
    workId: string;
  }>;
};

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

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
            <Link href="/works">작품 목록</Link>
          </Button>
          <h1 className="text-3xl font-semibold">{work.title}</h1>
          <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
            {work.description || "작품 메모가 아직 없습니다."}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
            현재 위치: {currentLabel}
          </div>
          <p className="text-xs text-muted-foreground">{progressCeilingLabel}</p>
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
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <ProgressForm
          workId={work.id}
          episodes={work.episodes}
          progress={work.progress}
        />

        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold">회차 추가</h2>
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
          <h2 className="text-xl font-semibold">회차 목록</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            시즌/권, 회차 번호, 제목, 스포 순서를 수정할 수 있습니다.
          </p>
        </div>

        {work.episodes.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            아직 회차가 없습니다. 첫 회차를 추가해 현재 위치를 설정하세요.
          </div>
        ) : (
          <div className="grid gap-4">
            {work.episodes.map((episode) => (
              <article key={episode.id} className="rounded-lg border bg-card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      {formatEpisodeLabel(episode) ||
                        `스포 순서 ${episode.reveal_order}`}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      reveal_order {episode.reveal_order}
                    </p>
                  </div>
                  <DeleteEpisodeButton workId={work.id} episodeId={episode.id} />
                </div>
                <EpisodeForm workId={work.id} episode={episode} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
