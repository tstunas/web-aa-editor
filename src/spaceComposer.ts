import { CompositeFont } from "./saitamaarFont";
import { typesetCompositeText } from "./typeset";

export type SpaceGlyphInfo = {
  ch: string;
  widthPx: number;
};

const SPACE_CANDIDATES: string[] = [
  "\u00A0",
  "\u2000", "\u2001", "\u2002", "\u2003", "\u2004", "\u2005",
  "\u2006", "\u2007", "\u2008", "\u2009", "\u200A",
  "\u202F",
  "\u205F",
  "\u3000",
];

export function measureSpaceWidths(cf: CompositeFont, fontSize: number): SpaceGlyphInfo[] {
  const infos: SpaceGlyphInfo[] = [];

  for (const ch of SPACE_CANDIDATES) {
    const r = typesetCompositeText(cf, ch, 0, 0, { fontSize, letterSpacingPx: 0, useKerning: false });
    const w = r.width;
    if (!Number.isFinite(w) || w <= 0) continue;
    infos.push({ ch, widthPx: w });
  }

  infos.sort((a, b) => b.widthPx - a.widthPx);
  return infos;
}

export function composePrefixSpacing(
  spaces: SpaceGlyphInfo[],
  targetPx: number,
): { prefix: string; achievedPx: number; deltaPx: number } {
  const target = Math.max(0, Math.round(targetPx));
  if (target === 0) return { prefix: "", achievedPx: 0, deltaPx: 0 };

  const wInt = spaces.map((s) => Math.round(s.widthPx));

  const dpPrev = new Array<number>(target + 1).fill(-1);
  const dpPick = new Array<number>(target + 1).fill(-1);
  dpPrev[0] = 0;

  for (let i = 0; i < spaces.length; i++) {
    const w = wInt[i];
    if (w <= 0) continue;

    for (let x = w; x <= target; x++) {
      if (dpPrev[x] !== -1) continue;
      if (dpPrev[x - w] !== -1) {
        dpPrev[x] = x - w;
        dpPick[x] = i;
      }
    }
  }

  let best = target;
  while (best > 0 && dpPrev[best] === -1) best--;

  let prefix = "";
  let cur = best;
  while (cur > 0) {
    const i = dpPick[cur];
    if (i < 0) break;
    prefix += spaces[i].ch;
    cur = dpPrev[cur];
  }

  return { prefix, achievedPx: best, deltaPx: best - target };
}
