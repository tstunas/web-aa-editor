export function snapX1px(x: number) {
  return Math.round(x);
}

export function snapYToLines(baselineY: number, lineHeightPx: number, originBaseline: number) {
  const k = Math.round((baselineY - originBaseline) / lineHeightPx);
  return originBaseline + k * lineHeightPx;
}
