import { C, bg, title, footer, card, label } from "./shared.mjs";

export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "사용 흐름은 감상 위치를 중심으로 돈다", "작품을 만들고, 어디까지 봤는지 정한 뒤, 회차별 정보를 안전하게 쌓습니다.");
  const stages = [
    ["1", "작품 생성", "제목, 장르, 시즌/권수,\n세계관 기본 정보"],
    ["2", "현재 위치 설정", "시즌 1 · 6화까지,\n소설 3권 5장까지"],
    ["3", "정보 기록", "인물, 사건, 용어,\n관계, 떡밥"],
    ["4", "복습/검색", "1분 복습,\n자연어 질문"],
  ];
  stages.forEach((stage, i) => {
    const x = 78 + i * 300;
    card(slide, ctx, x, 190, 230, 250, C.white, i === 1 ? C.teal : C.line);
    ctx.addShape(slide, { x: x + 24, y: 218, w: 42, h: 42, fill: i === 1 ? C.teal : C.mint, geometry: "ellipse" });
    ctx.addText(slide, { text: stage[0], x: x + 37, y: 228, w: 18, h: 20, fontSize: 18, bold: true, color: i === 1 ? C.white : C.teal, align: "center", typeface: "Aptos" });
    ctx.addText(slide, { text: stage[1], x: x + 24, y: 292, w: 180, h: 30, fontSize: 21, bold: true, color: C.ink, typeface: "Apple SD Gothic Neo" });
    ctx.addText(slide, { text: stage[2], x: x + 24, y: 348, w: 178, h: 70, fontSize: 15, color: C.muted, typeface: "Apple SD Gothic Neo" });
    if (i < 3) {
      ctx.addShape(slide, { x: x + 246, y: 304, w: 34, h: 4, fill: C.coral });
      ctx.addShape(slide, { x: x + 274, y: 293, w: 18, h: 26, fill: C.coral, geometry: "triangle" });
    }
  });
  card(slide, ctx, 168, 514, 945, 70, "#13292D", "#13292D");
  label(slide, ctx, "설계 포인트", 202, 532, 100, C.coralSoft);
  ctx.addText(slide, { text: "모든 데이터는 작품 ID와 공개 시점을 가진다. 사용자의 진행도보다 앞선 정보는 조회·검색·커뮤니티에서 잠긴다.", x: 310, y: 529, w: 720, h: 38, fontSize: 17, color: C.white, typeface: "Apple SD Gothic Neo" });
  footer(slide, ctx, 4);
  return slide;
}
