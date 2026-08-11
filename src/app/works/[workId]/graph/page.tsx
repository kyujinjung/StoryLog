import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { RelationshipFlow } from "@/components/graph/relationship-flow";
import { Button } from "@/components/ui/button";
import { getRelationshipGraphData } from "@/lib/data/storylog";
import { formatEpisodeLabel } from "@/lib/storylog-format";

type GraphPageProps = {
  params: Promise<{
    workId: string;
  }>;
};

export default async function GraphPage({ params }: GraphPageProps) {
  const { workId } = await params;
  const graph = await getRelationshipGraphData(workId);

  if (!graph) {
    notFound();
  }

  const currentLabel = graph.currentEpisode
    ? formatEpisodeLabel(graph.currentEpisode)
    : graph.progress
      ? "아직 시작 전"
      : "미설정";

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3">
            <Link href={`/works/${graph.id}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              작품으로 돌아가기
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold">인물 관계도</h1>
          <p className="mt-2 text-muted-foreground">
            {graph.title} · 현재 위치: {currentLabel}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          Safe mode · reveal_order {graph.currentRevealOrder}
        </div>
      </header>

      <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">표시 인물</p>
          <p className="text-2xl font-semibold">{graph.graphCharacters.length}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">표시 관계</p>
          <p className="text-2xl font-semibold">{graph.graphRelationships.length}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">필터 기준</p>
          <p className="text-2xl font-semibold">{graph.currentRevealOrder}</p>
        </div>
      </div>

      {graph.graphCharacters.length < 2 ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          관계도를 보려면 현재 진행도에서 공개된 인물이 2명 이상 필요합니다.
        </div>
      ) : null}

      <RelationshipFlow
        characters={graph.graphCharacters}
        relationships={graph.graphRelationships}
      />
    </div>
  );
}
