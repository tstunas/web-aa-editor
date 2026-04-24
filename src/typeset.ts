import { Font, Glyph } from "opentype.js";
import { CompositeFont, pickFace } from "./saitamaarFont";
import { toCodePoints } from "./unicode";

export type Placement = {
  index: number;
  text: string;
  font: Font;
  glyph: Glyph;
  x: number;
  y: number;
  advance: number;
  kernToNext: number;
};

export type TypesetOptions = {
  fontSize: number;
  letterSpacingPx?: number;
  useKerning?: boolean;
};

export type TypesetResult = {
  placements: Placement[];
  width: number;
  maxAscent: number;
  maxDescent: number;
};

export function typesetCompositeText(
  cf: CompositeFont,
  text: string,
  startX: number,
  baselineY: number,
  options: TypesetOptions,
): TypesetResult {
  const fontSize = options.fontSize;
  const letterSpacingPx = options.letterSpacingPx ?? 0;
  const useKerning = options.useKerning ?? true;

  const cps = toCodePoints(text);

  let penX = startX;
  const placements: Placement[] = [];

  let maxAscent = 0;
  let maxDescent = 0;

  for (let i = 0; i < cps.length; i++) {
    const cur = cps[i];
    const next = i + 1 < cps.length ? cps[i + 1] : null;

    const curFace = pickFace(cf, cur.codePoint);
    const curFont = curFace.font;
    const curGlyph = curFont.charToGlyph(cur.s);

    const scale = fontSize / curFont.unitsPerEm;

    const ascent = (curFont.ascender ?? 0) * scale;
    const descent = Math.abs((curFont.descender ?? 0) * scale);
    if (ascent > maxAscent) maxAscent = ascent;
    if (descent > maxDescent) maxDescent = descent;

    const advance = (curGlyph.advanceWidth ?? 0) * scale;

    let kernToNext = 0;
    if (useKerning && next) {
      const nextFace = pickFace(cf, next.codePoint);
      if (nextFace.font === curFont) {
        const nextGlyph = curFont.charToGlyph(next.s);
        kernToNext = curFont.getKerningValue(curGlyph, nextGlyph) * scale;
      }
    }

    placements.push({
      index: i,
      text: cur.s,
      font: curFont,
      glyph: curGlyph,
      x: penX,
      y: baselineY,
      advance,
      kernToNext,
    });

    penX += advance + kernToNext + letterSpacingPx;
  }

  return { placements, width: penX - startX, maxAscent, maxDescent };
}
