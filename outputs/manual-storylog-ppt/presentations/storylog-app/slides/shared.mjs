export const C = {
  ink: "#172126",
  muted: "#65717A",
  paper: "#F7F3EC",
  white: "#FFFFFF",
  teal: "#0C7C74",
  tealDark: "#075E59",
  mint: "#DDEFEA",
  coral: "#E6614F",
  coralSoft: "#F9D8D1",
  gold: "#D99B2B",
  blue: "#3C6EAA",
  line: "#D7D0C4",
  dark: "#13292D",
};

export function bg(slide, ctx, fill = C.paper) {
  ctx.addShape(slide, { x: 0, y: 0, w: ctx.W, h: ctx.H, fill });
}

export function title(slide, ctx, text, sub = "") {
  ctx.addText(slide, {
    text,
    x: 58,
    y: 42,
    w: 760,
    h: 54,
    fontSize: 32,
    bold: true,
    color: C.ink,
    typeface: "Apple SD Gothic Neo",
  });
  if (sub) {
    ctx.addText(slide, {
      text: sub,
      x: 60,
      y: 92,
      w: 900,
      h: 34,
      fontSize: 15,
      color: C.muted,
      typeface: "Apple SD Gothic Neo",
    });
  }
}

export function footer(slide, ctx, n) {
  ctx.addShape(slide, { x: 60, y: 672, w: 1160, h: 1, fill: "#D8D1C8" });
  ctx.addText(slide, {
    text: `StoryLog concept · ${String(n).padStart(2, "0")}`,
    x: 60,
    y: 682,
    w: 260,
    h: 22,
    fontSize: 10,
    color: "#7A858B",
    typeface: "Aptos",
  });
}

export function pill(slide, ctx, text, x, y, w, color = C.teal, fill = C.mint) {
  ctx.addShape(slide, { x, y, w, h: 30, fill, line: ctx.line(color, 1), geometry: "roundRect" });
  ctx.addText(slide, {
    text,
    x: x + 12,
    y: y + 6,
    w: w - 24,
    h: 20,
    fontSize: 12,
    bold: true,
    color,
    align: "center",
    typeface: "Apple SD Gothic Neo",
  });
}

export function card(slide, ctx, x, y, w, h, fill = C.white, line = C.line) {
  ctx.addShape(slide, { x, y, w, h, fill, line: ctx.line(line, 1), geometry: "roundRect" });
}

export function kpi(slide, ctx, value, label, x, y, w, accent = C.teal) {
  ctx.addText(slide, { text: value, x, y, w, h: 34, fontSize: 28, bold: true, color: accent, typeface: "Aptos Display" });
  ctx.addText(slide, { text: label, x, y: y + 36, w, h: 38, fontSize: 13, color: C.muted, typeface: "Apple SD Gothic Neo" });
}

export function bullet(slide, ctx, text, x, y, w, color = C.ink) {
  ctx.addShape(slide, { x, y: y + 6, w: 7, h: 7, fill: C.coral, geometry: "ellipse" });
  ctx.addText(slide, {
    text,
    x: x + 18,
    y,
    w,
    h: 30,
    fontSize: 15,
    color,
    typeface: "Apple SD Gothic Neo",
  });
}

export function label(slide, ctx, text, x, y, w, color = C.muted) {
  ctx.addText(slide, { text, x, y, w, h: 24, fontSize: 12, bold: true, color, typeface: "Apple SD Gothic Neo" });
}
