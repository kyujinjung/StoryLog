import { C, bg, title, footer, card } from "./shared.mjs";

export async function slide09(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "MVP는 스포일러 없는 복습 경험부터 검증한다", "커뮤니티와 AI는 매력적이지만, 첫 검증은 개인 기록과 진행도 필터가 제대로 작동하는지입니다.");
  ctx.addShape(slide, { x: 112, y: 338, w: 1038, h: 6, fill: "#D8D1C8" });
  const phases = [
    ["1차 MVP", "작품 생성\n진행도 설정\n인물·사건·용어 기록\n회차별 줄거리\n스포일러 필터", 136, C.teal],
    ["2차", "관계도\n타임라인\n1분 복습\n자연어 검색 초안", 456, C.blue],
    ["3차", "AI 자동 정리\n떡밥 추출\n사용자 승인 저장", 776, C.gold],
    ["확장", "작품별 라운지\n스포일러 범위 게시글\n메모로 저장", 1030, C.coral],
  ];
  phases.forEach(([name, desc, x, color], i) => {
    ctx.addShape(slide, { x: x - 17, y: 322, w: 40, h: 40, fill: color, geometry: "ellipse" });
    ctx.addText(slide, { text: String(i + 1), x: x - 5, y: 331, w: 16, h: 18, fontSize: 15, bold: true, color: C.white, align: "center", typeface: "Aptos" });
    card(slide, ctx, x - 82, i % 2 === 0 ? 160 : 392, 220, 138, C.white);
    ctx.addText(slide, { text: name, x: x - 54, y: i % 2 === 0 ? 188 : 420, w: 170, h: 26, fontSize: 20, bold: true, color, typeface: "Apple SD Gothic Neo" });
    ctx.addText(slide, { text: desc, x: x - 54, y: i % 2 === 0 ? 226 : 458, w: 170, h: 68, fontSize: 13.5, color: C.muted, typeface: "Apple SD Gothic Neo" });
  });
  footer(slide, ctx, 9);
  return slide;
}
