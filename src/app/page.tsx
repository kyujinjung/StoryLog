import Link from "next/link";
import { ArrowRight, EyeOff, Network, NotebookText } from "lucide-react";

import { Button } from "@/components/ui/button";

const features = [
  {
    title: "진행도 기준 기억",
    description: "작품과 회차별로 인물, 사건, 용어를 정리하고 내가 본 곳까지만 확인합니다.",
    icon: EyeOff
  },
  {
    title: "관계 변화 추적",
    description: "인물 관계와 상태 변화를 공개 시점과 함께 저장해 이후 관계도 UI로 확장합니다.",
    icon: Network
  },
  {
    title: "복습용 스토리 노트",
    description: "다음 회차를 보기 전 필요한 줄거리, 떡밥, 개인 추측을 빠르게 되짚습니다.",
    icon: NotebookText
  }
];

export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:py-16">
      <section className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="flex flex-col gap-6">
          <div className="w-fit rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground">
            Phase 1 MVP foundation
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">
              어디까지 봤는지 기준으로 안전하게 기억하는 스토리 로그
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              StoryLog는 긴 서사의 인물, 사건, 관계, 용어, 떡밥을 공개
              시점과 함께 기록해 원치 않는 스포일러를 줄이는 개인 작품
              노트입니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/works">
                시작하기
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/login">로그인</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between border-b pb-4">
            <div>
              <p className="text-sm text-muted-foreground">현재 진행도</p>
              <h2 className="text-xl font-semibold">시즌 1, 6화까지</h2>
            </div>
            <span className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground">
              Spoiler safe
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <p className="rounded-md bg-muted p-3">A는 B를 의심 중</p>
            <p className="rounded-md bg-muted p-3">검은 반지는 3화부터 반복 등장</p>
            <p className="rounded-md border border-dashed p-3 text-muted-foreground">
              7화 이후 공개 정보는 잠금 처리
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article key={feature.title} className="rounded-lg border bg-card p-5">
              <Icon className="mb-4 h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="mb-2 text-lg font-semibold">{feature.title}</h2>
              <p className="leading-7 text-muted-foreground">{feature.description}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
