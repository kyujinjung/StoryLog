import { C, bg, title, footer, card, pill } from "./shared.mjs";

export async function slide07(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "관계도와 타임라인은 ‘이해’를 빠르게 복원한다", "사용자는 줄거리 전문보다 인물 간 변화와 큰 사건의 순서를 먼저 확인하고 싶어합니다.");
  card(slide, ctx, 76, 158, 520, 390, C.white);
  ctx.addText(slide, { text: "회차 기준 관계도", x: 110, y: 190, w: 240, h: 28, fontSize: 22, bold: true, color: C.ink, typeface: "Apple SD Gothic Neo" });
  const nodes = [
    ["A", 232, 280, C.teal],
    ["B", 398, 246, C.coral],
    ["C", 416, 400, C.blue],
    ["D", 188, 420, C.gold],
  ];
  ctx.addShape(slide, { x: 274, y: 311, w: 122, h: 4, fill: C.teal });
  ctx.addShape(slide, { x: 432, y: 294, w: 4, h: 102, fill: C.coral });
  ctx.addShape(slide, { x: 232, y: 420, w: 160, h: 4, fill: C.gold });
  ctx.addText(slide, { text: "동료", x: 318, y: 286, w: 50, h: 22, fontSize: 12, color: C.teal, align: "center", typeface: "Apple SD Gothic Neo" });
  ctx.addText(slide, { text: "의심", x: 444, y: 342, w: 50, h: 22, fontSize: 12, color: C.coral, typeface: "Apple SD Gothic Neo" });
  nodes.forEach(([name, x, y, color]) => {
    ctx.addShape(slide, { x, y, w: 58, h: 58, fill: color, geometry: "ellipse" });
    ctx.addText(slide, { text: name, x, y: y + 14, w: 58, h: 26, fontSize: 24, bold: true, color: C.white, align: "center", typeface: "Aptos Display" });
  });
  pill(slide, ctx, "시즌 1 · 6화", 374, 190, 140, C.teal, C.mint);
  card(slide, ctx, 666, 158, 520, 390, C.white);
  ctx.addText(slide, { text: "사건 타임라인", x: 700, y: 190, w: 240, h: 28, fontSize: 22, bold: true, color: C.ink, typeface: "Apple SD Gothic Neo" });
  ctx.addShape(slide, { x: 728, y: 318, w: 392, h: 5, fill: "#CFC8BE" });
  const events = [
    ["1화", "첫 만남", 728, C.teal],
    ["3화", "검은 반지", 858, C.gold],
    ["6화", "북부 동맹", 988, C.coral],
    ["8화", "잠김", 1118, "#A3A9AD"],
  ];
  events.forEach(([ep, text, x, color], i) => {
    ctx.addShape(slide, { x: x - 10, y: 308, w: 24, h: 24, fill: color, geometry: "ellipse" });
    ctx.addText(slide, { text: ep, x: x - 36, y: 346, w: 80, h: 20, fontSize: 13, bold: true, color, align: "center", typeface: "Apple SD Gothic Neo" });
    ctx.addText(slide, { text, x: x - 50, y: i % 2 === 0 ? 378 : 256, w: 100, h: 38, fontSize: 15, color: C.ink, align: "center", typeface: "Apple SD Gothic Neo" });
  });
  footer(slide, ctx, 7);
  return slide;
}
