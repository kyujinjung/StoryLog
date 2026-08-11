import { C, bg, pill } from "./shared.mjs";

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, C.paper);
  await ctx.addImage(slide, {
    path: `${ctx.assetDir}/app-dashboard-concept.png`,
    x: 610,
    y: 0,
    w: 670,
    h: 720,
    fit: "cover",
    alt: "Story memory app dashboard concept",
  });
  ctx.addShape(slide, { x: 0, y: 0, w: 640, h: 720, fill: "linear(0deg, #F7F3EC 0%, #F7F3EC 72%, #F7F3EC00 100%)" });
  pill(slide, ctx, "Product concept deck", 64, 64, 170, C.teal, C.mint);
  ctx.addText(slide, {
    text: "StoryLog",
    x: 62,
    y: 160,
    w: 420,
    h: 68,
    fontSize: 54,
    bold: true,
    color: C.ink,
    typeface: "Aptos Display",
  });
  ctx.addText(slide, {
    text: "스포일러 없이 기억하는\n스토리 전용 메모 앱",
    x: 66,
    y: 244,
    w: 500,
    h: 110,
    fontSize: 30,
    bold: true,
    color: C.tealDark,
    typeface: "Apple SD Gothic Neo",
  });
  ctx.addText(slide, {
    text: "책, 영화, 드라마, 웹툰의 인물·사건·관계·떡밥을 내가 본 위치 기준으로 정리하고 다시 떠올리게 해주는 제품 아이디어입니다.",
    x: 68,
    y: 386,
    w: 470,
    h: 92,
    fontSize: 17,
    color: C.muted,
    typeface: "Apple SD Gothic Neo",
  });
  ctx.addShape(slide, { x: 68, y: 535, w: 330, h: 1.5, fill: C.coral });
  ctx.addText(slide, {
    text: "기획 요약 · MVP 방향 · 기능 구조 · 기술 스택",
    x: 68,
    y: 554,
    w: 460,
    h: 30,
    fontSize: 14,
    color: C.ink,
    typeface: "Apple SD Gothic Neo",
  });
  return slide;
}
