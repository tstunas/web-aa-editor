import opentype, { Font } from "opentype.js";
import { UnicodeRange, inRanges, KOREAN_RANGES } from "./unicode";

export type FontFaceLike = {
  name: string;
  font: Font;
  unicodeRanges?: UnicodeRange[];
};

export type CompositeFont = {
  family: string;
  faces: FontFaceLike[];
};

async function loadFont(url: string): Promise<Font> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status} ${res.statusText} (${url})`);
  const buf = await res.arrayBuffer();
  return opentype.parse(buf);
}

export function pickFace(cf: CompositeFont, codePoint: number): FontFaceLike {
  for (const face of cf.faces) {
    if (face.unicodeRanges && inRanges(codePoint, face.unicodeRanges)) return face;
  }
  for (const face of cf.faces) {
    if (!face.unicodeRanges) return face;
  }
  return cf.faces[0];
}

export async function buildSaitamaarCompositeFont(): Promise<CompositeFont> {
  const [headKasen, nanum] = await Promise.all([
    loadFont("https://da1eth.github.io/AA/HeadKasen.ttf"),
    loadFont("/assets/font/NanumGothicCoding.ttf"),
  ]);

  return {
    family: "Saitamaar",
    faces: [
      { name: "HeadKasen (default)", font: headKasen },
      { name: "NanumGothicCoding (ko)", font: nanum, unicodeRanges: KOREAN_RANGES },
    ],
  };
}
