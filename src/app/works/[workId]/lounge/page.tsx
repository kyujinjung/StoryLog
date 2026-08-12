import Link from "next/link";
import { notFound } from "next/navigation";
import { MessagesSquare, ShieldCheck } from "lucide-react";

import { LoungePanel } from "@/components/community/lounge-panel";
import { Button } from "@/components/ui/button";
import { getLoungeData } from "@/lib/data/community";

type LoungePageProps = {
  params: Promise<{
    workId: string;
  }>;
};

export default async function WorkLoungePage({ params }: LoungePageProps) {
  const { workId } = await params;
  const lounge = await getLoungeData(workId);

  if (!lounge) {
    notFound();
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
            <Link href={`/works/${lounge.work.id}`}>← {lounge.work.title}</Link>
          </Button>
          <h1 className="flex items-center gap-2 text-3xl font-semibold">
            <MessagesSquare className="h-8 w-8 text-primary" aria-hidden="true" />
            작품 라운지
          </h1>
          <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
            같은 제목의 작품을 보는 사용자와 질문·이론을 나눕니다. 글마다 스포
            범위를 붙이고, 내 진행도보다 앞선 글은 숨깁니다.
          </p>
        </div>
        <div className="rounded-md bg-secondary px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Safe mode · 공개 상한{" "}
            {lounge.currentRevealOrder < 0
              ? "미설정"
              : lounge.currentRevealOrder}
          </span>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <p>
          라운지 공간: <strong>{lounge.space.title}</strong>
          {lounge.space.medium ? ` · ${lounge.space.medium}` : ""}
        </p>
        <p className="mt-1">
          제목이 같으면 같은 라운지를 공유합니다. 진행도를 먼저 저장해야 로어와
          같은 기준으로 글을 볼 수 있습니다.
        </p>
      </div>

      <LoungePanel
        workId={lounge.work.id}
        episodes={lounge.episodes}
        posts={lounge.visiblePosts}
        hiddenPostCount={lounge.hiddenPostCount}
        currentRevealOrder={lounge.currentRevealOrder}
      />
    </div>
  );
}
