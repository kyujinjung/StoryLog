import { C, bg, title, footer, card, pill } from "./shared.mjs";

export async function slide06(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "스포일러 방지는 기능이 아니라 데이터 모델이다", "정보마다 공개 시점을 저장하면, 같은 작품도 사용자 진행도에 맞춰 다르게 보입니다.");
  card(slide, ctx, 88, 180, 330, 330, C.white);
  ctx.addText(slide, { text: "사용자 진행도", x: 122, y: 214, w: 250, h: 30, fontSize: 23, bold: true, color: C.ink, typeface: "Apple SD Gothic Neo" });
  pill(slide, ctx, "시즌 1 · 6화까지", 122, 274, 190, C.teal, C.mint);
  ctx.addText(slide, { text: "progress\nwork_id: 42\nseason: 1\nepisode: 6", x: 124, y: 342, w: 235, h: 110, fontSize: 22, color: C.tealDark, typeface: "Aptos Mono" });
  ctx.addShape(slide, { x: 484, y: 278, w: 88, h: 88, fill: C.dark, geometry: "ellipse" });
  ctx.addText(slide, { text: "FILTER", x: 502, y: 310, w: 54, h: 18, fontSize: 14, bold: true, color: C.white, align: "center", typeface: "Aptos" });
  ctx.addShape(slide, { x: 430, y: 318, w: 46, h: 5, fill: C.teal });
  ctx.addShape(slide, { x: 572, y: 318, w: 46, h: 5, fill: C.teal });
  card(slide, ctx, 680, 160, 430, 376, C.white);
  ctx.addText(slide, { text: "정보별 공개 시점", x: 720, y: 194, w: 250, h: 30, fontSize: 23, bold: true, color: C.ink, typeface: "Apple SD Gothic Neo" });
  const rows = [
    ["A의 정체", "S1E8", "잠김", C.coral],
    ["검은 반지", "S1E3", "표시", C.teal],
    ["북부 동맹", "S1E6", "표시", C.teal],
    ["B의 사망", "S2E1", "잠김", C.coral],
  ];
  rows.forEach((r, i) => {
    const y = 260 + i * 54;
    ctx.addShape(slide, { x: 720, y, w: 330, h: 1, fill: "#E7E0D6" });
    ctx.addText(slide, { text: r[0], x: 720, y: y + 16, w: 140, h: 22, fontSize: 15, color: C.ink, typeface: "Apple SD Gothic Neo" });
    ctx.addText(slide, { text: r[1], x: 878, y: y + 16, w: 64, h: 22, fontSize: 14, color: C.muted, typeface: "Aptos" });
    ctx.addText(slide, { text: r[2], x: 972, y: y + 16, w: 60, h: 22, fontSize: 14, bold: true, color: r[3], typeface: "Apple SD Gothic Neo" });
  });
  ctx.addText(slide, { text: "핵심 규칙: 공개 시점 <= 현재 진행도인 정보만 보여준다.", x: 270, y: 574, w: 740, h: 34, fontSize: 22, bold: true, color: C.tealDark, align: "center", typeface: "Apple SD Gothic Neo" });
  footer(slide, ctx, 6);
  return slide;
}
