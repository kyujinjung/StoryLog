import { C, bg, title, footer, card, bullet } from "./shared.mjs";

export async function slide08(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "커뮤니티는 ‘게시판’보다 작품별 집단 기억장치로 설계한다", "같은 작품을 보는 사람끼리도 내가 본 범위 안에서만 안전하게 이야기할 수 있어야 합니다.");
  await ctx.addImage(slide, {
    path: `${ctx.assetDir}/spoiler-community-concept.png`,
    x: 70,
    y: 162,
    w: 560,
    h: 392,
    fit: "cover",
    alt: "Spoiler-safe community concept illustration",
  });
  card(slide, ctx, 690, 170, 420, 330, C.white);
  ctx.addText(slide, { text: "진행도 기반 토론", x: 728, y: 210, w: 260, h: 32, fontSize: 24, bold: true, color: C.ink, typeface: "Apple SD Gothic Neo" });
  bullet(slide, ctx, "게시글 작성 시 스포일러 범위 필수 선택", 730, 280, 310);
  bullet(slide, ctx, "사용자 진행도보다 앞선 글은 자동 잠금", 730, 328, 310);
  bullet(slide, ctx, "좋은 글은 개인 메모나 작품 DB 후보로 저장", 730, 376, 310);
  bullet(slide, ctx, "질문·해석·떡밥·관계·오류 정정으로 분류", 730, 424, 310);
  ctx.addShape(slide, { x: 694, y: 538, w: 420, h: 52, fill: C.dark, geometry: "roundRect" });
  ctx.addText(slide, { text: "내가 본 곳까지만 안전하게 이야기하는 작품 라운지", x: 724, y: 553, w: 360, h: 24, fontSize: 16, bold: true, color: C.white, align: "center", typeface: "Apple SD Gothic Neo" });
  footer(slide, ctx, 8);
  return slide;
}
