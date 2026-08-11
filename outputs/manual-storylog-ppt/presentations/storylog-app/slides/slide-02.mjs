import { C, bg, title, footer, card, bullet } from "./shared.mjs";

export async function slide02(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "문제는 기록 부족이 아니라, 안전하게 다시 보는 방법의 부족", "긴 서사를 즐기는 사용자는 검색과 메모 사이에서 계속 불편함을 겪습니다.");
  const items = [
    ["기억 공백", "이 인물이 누구였는지,\n왜 사건이 시작됐는지\n다시 떠올리기 어렵다."],
    ["스포일러 위험", "위키와 커뮤니티는\n현재 감상 위치보다 앞선\n정보를 쉽게 노출한다."],
    ["정리 난이도", "관계도, 세력, 떡밥,\n용어가 얽히면 일반 메모로\n맥락을 유지하기 어렵다."],
  ];
  items.forEach((item, i) => {
    const x = 80 + i * 390;
    card(slide, ctx, x, 170, 330, 305);
    ctx.addShape(slide, { x: x + 26, y: 198, w: 52, h: 52, fill: i === 1 ? C.coralSoft : C.mint, geometry: "ellipse" });
    ctx.addText(slide, { text: String(i + 1), x: x + 42, y: 207, w: 22, h: 30, fontSize: 24, bold: true, color: i === 1 ? C.coral : C.teal, typeface: "Aptos Display" });
    ctx.addText(slide, { text: item[0], x: x + 26, y: 270, w: 260, h: 34, fontSize: 24, bold: true, color: C.ink, typeface: "Apple SD Gothic Neo" });
    ctx.addText(slide, { text: item[1], x: x + 28, y: 326, w: 270, h: 102, fontSize: 18, color: C.muted, typeface: "Apple SD Gothic Neo" });
  });
  card(slide, ctx, 180, 528, 920, 72, "#13292D", "#13292D");
  bullet(slide, ctx, "핵심 기회: 사용자의 감상 위치를 기준으로 정보 접근을 제어하는 스토리 기억장치", 236, 550, 760, C.white);
  footer(slide, ctx, 2);
  return slide;
}
