import { C, bg, title, footer, card, pill, bullet } from "./shared.mjs";

export async function slide10(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "1차 구현은 웹 MVP로 빠르게 검증하는 편이 현실적", "관계도·타임라인·검색 UI를 먼저 웹에서 검증하고, 이후 모바일 앱으로 확장합니다.");
  const lanes = [
    ["프런트", "Next.js\nTailwind CSS\nshadcn/ui", 92, C.teal],
    ["백엔드", "Supabase\nPostgreSQL\nAuth / Storage", 342, C.blue],
    ["시각화", "React Flow\nTimeline UI\n관계도 그래프", 592, C.gold],
    ["AI", "OpenAI API\n메모 분석\n후보 추출", 842, C.coral],
  ];
  lanes.forEach(([name, desc, x, color]) => {
    card(slide, ctx, x, 172, 202, 224, C.white);
    ctx.addShape(slide, { x, y: 172, w: 202, h: 10, fill: color });
    ctx.addText(slide, { text: name, x: x + 22, y: 210, w: 150, h: 30, fontSize: 22, bold: true, color: C.ink, typeface: "Apple SD Gothic Neo" });
    ctx.addText(slide, { text: desc, x: x + 24, y: 272, w: 150, h: 86, fontSize: 17, color: C.muted, typeface: "Aptos" });
  });
  card(slide, ctx, 126, 470, 440, 116, "#13292D", "#13292D");
  ctx.addText(slide, { text: "추천 1차 조합", x: 164, y: 498, w: 180, h: 24, fontSize: 18, bold: true, color: C.white, typeface: "Apple SD Gothic Neo" });
  ctx.addText(slide, { text: "Next.js + Supabase + React Flow + OpenAI API + Vercel", x: 164, y: 532, w: 350, h: 34, fontSize: 17, color: "#DDEFEA", typeface: "Aptos" });
  card(slide, ctx, 640, 470, 440, 116, C.white);
  pill(slide, ctx, "다음 결정", 676, 492, 110, C.coral, C.coralSoft);
  bullet(slide, ctx, "앱 이름 확정: StoryLog / 플롯로그 / 노스포 노트", 676, 534, 330);
  bullet(slide, ctx, "MVP 화면 설계와 DB 스키마 초안 작성", 676, 564, 330);
  footer(slide, ctx, 10);
  return slide;
}
