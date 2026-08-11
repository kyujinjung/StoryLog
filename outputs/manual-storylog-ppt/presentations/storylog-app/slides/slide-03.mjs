import { C, bg, title, footer, card, pill } from "./shared.mjs";

export async function slide03(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "StoryLog의 한 문장: 내가 본 곳까지만 기억해준다", "정보를 저장하는 앱이 아니라, 모든 정보에 공개 시점을 붙이는 앱입니다.");
  card(slide, ctx, 88, 176, 420, 330, "#FFF9F5", "#E8C9BD");
  card(slide, ctx, 772, 176, 420, 330, "#F4FBF8", "#BBDAD3");
  ctx.addText(slide, { text: "기존 검색 경험", x: 124, y: 212, w: 320, h: 34, fontSize: 24, bold: true, color: C.coral, typeface: "Apple SD Gothic Neo" });
  ctx.addText(slide, { text: "작품명 검색\n→ 위키/커뮤니티 진입\n→ 결말·정체·사망 정보 노출", x: 124, y: 284, w: 320, h: 118, fontSize: 23, color: C.ink, typeface: "Apple SD Gothic Neo" });
  ctx.addText(slide, { text: "StoryLog 경험", x: 808, y: 212, w: 320, h: 34, fontSize: 24, bold: true, color: C.teal, typeface: "Apple SD Gothic Neo" });
  ctx.addText(slide, { text: "현재 위치 설정\n→ 인물·사건·관계 조회\n→ 이후 정보 자동 잠금", x: 808, y: 284, w: 320, h: 118, fontSize: 23, color: C.ink, typeface: "Apple SD Gothic Neo" });
  ctx.addShape(slide, { x: 566, y: 304, w: 96, h: 8, fill: C.teal });
  ctx.addShape(slide, { x: 646, y: 286, w: 35, h: 44, fill: C.teal, geometry: "triangle" });
  pill(slide, ctx, "스포일러 필터", 540, 350, 190, C.tealDark, C.mint);
  const steps = ["작품", "회차", "인물", "사건", "관계", "떡밥"];
  steps.forEach((s, i) => {
    const x = 188 + i * 154;
    ctx.addShape(slide, { x, y: 560, w: 108, h: 42, fill: i < 2 ? C.dark : C.white, line: ctx.line(i < 2 ? C.dark : C.line, 1), geometry: "roundRect" });
    ctx.addText(slide, { text: s, x, y: 572, w: 108, h: 20, fontSize: 14, bold: true, align: "center", color: i < 2 ? C.white : C.ink, typeface: "Apple SD Gothic Neo" });
  });
  footer(slide, ctx, 3);
  return slide;
}
