import { C, bg, title, footer, card } from "./shared.mjs";

export async function slide05(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "기능은 ‘작품 기억’을 구성하는 여섯 모듈로 묶인다", "각 모듈은 독립 기록이 아니라 회차와 연결되어 스포일러 필터의 대상이 됩니다.");
  ctx.addShape(slide, { x: 500, y: 242, w: 280, h: 160, fill: C.dark, geometry: "roundRect" });
  ctx.addText(slide, { text: "작품별\n기억 허브", x: 530, y: 281, w: 220, h: 72, fontSize: 30, bold: true, color: C.white, align: "center", typeface: "Apple SD Gothic Neo" });
  const modules = [
    ["인물", "사진·별칭·상태 변화", 128, 184, C.teal],
    ["관계도", "회차별 관계 변화", 394, 142, C.blue],
    ["사건", "큰 사건 타임라인", 840, 142, C.coral],
    ["용어", "세계관 고유 명사", 964, 360, C.gold],
    ["떡밥", "복선·미회수 단서", 610, 500, C.tealDark],
    ["세력", "가문·조직·소속", 190, 404, C.coral],
  ];
  modules.forEach(([name, desc, x, y, color]) => {
    card(slide, ctx, x, y, 210, 94, C.white, "#DED7CC");
    ctx.addShape(slide, { x: x + 18, y: y + 20, w: 18, h: 54, fill: color });
    ctx.addText(slide, { text: name, x: x + 52, y: y + 18, w: 130, h: 28, fontSize: 22, bold: true, color: C.ink, typeface: "Apple SD Gothic Neo" });
    ctx.addText(slide, { text: desc, x: x + 52, y: y + 53, w: 140, h: 24, fontSize: 13, color: C.muted, typeface: "Apple SD Gothic Neo" });
  });
  footer(slide, ctx, 5);
  return slide;
}
