import Link from "next/link";
import {
  ArrowRight,
  EyeOff,
  Network,
  NotebookText,
  Play,
  Shield
} from "lucide-react";

import { Button } from "@/components/ui/button";

const features = [
  {
    title: "진행도 세이프존",
    description:
      "내가 본 회차까지만 인물·사건·용어가 열립니다. 극장 입장 티켓처럼 진행도가 입장권입니다.",
    icon: EyeOff
  },
  {
    title: "관계 시놉시스",
    description:
      "인물 관계와 상태 변화를 회차 기준으로 추적하고, 관계도로 한눈에 복습합니다.",
    icon: Network
  },
  {
    title: "상영 전 브리핑",
    description:
      "다음 회차 전에 필요한 줄거리·떡밥·메모만 빠르게 훑는 복습 화면입니다.",
    icon: NotebookText
  }
];

export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-10 sm:py-14">
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="flex flex-col gap-7">
          <div className="cinema-badge w-fit">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            SPOILER SAFE · CINEMA MEMORY
          </div>
          <div className="space-y-5">
            <h1 className="cinema-title max-w-3xl text-4xl leading-tight sm:text-5xl lg:text-[3.4rem]">
              내가 본 곳까지만
              <br />
              <span className="text-primary">안전하게 기억</span>하는
              <br />
              스토리 상영관
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              StoryLog는 긴 드라마·영화·웹툰의 인물, 사건, 관계를{" "}
              <strong className="text-foreground">공개 시점</strong>과 함께
              기록합니다. CGV 앱처럼 진한 다크 톤 위에서, 스포 없는 복습을
              제공합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="default" className="h-12 px-6 text-base">
              <Link href="/works">
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                상영 시작
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-12 px-6 text-base">
              <Link href="/login">로그인 / 티켓 받기</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>🎬 작품 · 회차 관리</span>
            <span>🔒 진행도 스포 필터</span>
            <span>✨ AI 초안 정리</span>
            <span>💬 작품 라운지</span>
          </div>
        </div>

        <div className="cinema-card relative overflow-hidden rounded-2xl p-1">
          <div className="cinema-poster aspect-[4/5] rounded-[0.9rem] p-6 sm:p-8">
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="cinema-section-label">NOW SHOWING</p>
                  <h2 className="cinema-title mt-2 text-2xl sm:text-3xl">
                    시즌 1 · 6화
                  </h2>
                  <p className="mt-1 text-sm text-white/70">현재 관람 위치</p>
                </div>
                <span className="cinema-badge cinema-badge-solid">SAFE</span>
              </div>
              <div className="space-y-3 text-sm">
                <p className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
                  A는 B를 의심 중
                </p>
                <p className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
                  검은 반지 모티브 · 3화부터
                </p>
                <p className="rounded-xl border border-dashed border-primary/40 bg-primary/10 px-4 py-3 text-primary">
                  7화 이후 정보 · 잠금
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <article
              key={feature.title}
              className="cinema-card cinema-card-hover rounded-2xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-xs font-bold tracking-widest text-white/25">
                  0{index + 1}
                </span>
              </div>
              <h2 className="mb-2 text-lg font-bold">{feature.title}</h2>
              <p className="leading-7 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
