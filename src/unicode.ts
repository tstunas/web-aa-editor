export type UnicodeRange = { start: number; end: number };

export const KOREAN_RANGES: UnicodeRange[] = [
  { start: 0xac00, end: 0xd7a3 },
  { start: 0x3130, end: 0x318f },
];

export function inRanges(codePoint: number, ranges: UnicodeRange[]): boolean {
  for (const r of ranges) {
    if (codePoint >= r.start && codePoint <= r.end) return true;
  }
  return false;
}

export type CodePointItem = { s: string; codePoint: number };

export function toCodePoints(str: string): CodePointItem[] {
  const out: CodePointItem[] = [];
  for (const s of Array.from(str)) {
    out.push({ s, codePoint: s.codePointAt(0)! });
  }
  return out;
}
