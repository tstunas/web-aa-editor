import { CompositeFont } from "./saitamaarFont";
import { SpaceGlyphInfo, composePrefixSpacing } from "./spaceComposer";
import { snapX1px, snapYToLines } from "./snap";
import { typesetCompositeText, TypesetOptions, TypesetResult } from "./typeset";

export type Rect = { x: number; y: number; w: number; h: number };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export class TextBoxObject {
  public id: string;
  public selected = false;

  public text: string;
  public fontSize: number;
  public letterSpacingPx = 0;
  public useKerning = true;

  public x: number;
  public baselineY: number;
  public box: Rect;

  public lineHeightPx: number;
  public originBaseline: number;

  private dragging = false;
  private dragDx = 0;
  private dragDy = 0;

  private layoutCache: TypesetResult | null = null;
  private layoutDirty = true;

  constructor(params: {
    id: string;
    text: string;
    fontSize: number;
    x: number;
    baselineY: number;
    box: Rect;
    lineHeightPx?: number;
    originBaseline?: number;
    letterSpacingPx?: number;
    useKerning?: boolean;
  }) {
    this.id = params.id;
    this.text = params.text;
    this.fontSize = params.fontSize;
    this.x = params.x;
    this.baselineY = params.baselineY;
    this.box = params.box;

    this.letterSpacingPx = params.letterSpacingPx ?? 0;
    this.useKerning = params.useKerning ?? true;

    this.lineHeightPx = params.lineHeightPx ?? Math.round(this.fontSize * 1.2);
    this.originBaseline = params.originBaseline ?? this.baselineY;
  }

  private layout(cf: CompositeFont): TypesetResult {
    if (!this.layoutDirty && this.layoutCache) return this.layoutCache;

    const opts: TypesetOptions = {
      fontSize: this.fontSize,
      letterSpacingPx: this.letterSpacingPx,
      useKerning: this.useKerning,
    };

    this.layoutCache = typesetCompositeText(cf, this.text, this.x, this.baselineY, opts);
    this.layoutDirty = false;
    return this.layoutCache;
  }

  public clampInsideBox(cf: CompositeFont) {
    const l = this.layout(cf);

    if (this.x < this.box.x) this.x = this.box.x;

    const minBaseline = this.box.y + l.maxAscent;
    const maxBaseline = this.box.y + this.box.h - l.maxDescent;
    this.baselineY = clamp(this.baselineY, minBaseline, maxBaseline);

    this.layoutDirty = true;
  }

  public hitTest(_cf: CompositeFont, px: number, py: number): boolean {
    return (
      px >= this.box.x &&
      px <= this.box.x + this.box.w &&
      py >= this.box.y &&
      py <= this.box.y + this.box.h
    );
  }

  public onPointerDown(cf: CompositeFont, px: number, py: number) {
    if (!this.hitTest(cf, px, py)) return false;
    this.dragging = true;
    this.dragDx = px - this.x;
    this.dragDy = py - this.baselineY;
    return true;
  }

  public onPointerMove(cf: CompositeFont, px: number, py: number) {
    if (!this.dragging) return;

    this.x = snapX1px(px - this.dragDx);
    this.baselineY = snapYToLines(py - this.dragDy, this.lineHeightPx, this.originBaseline);

    this.layoutDirty = true;
    this.clampInsideBox(cf);
  }

  public onPointerUp() {
    this.dragging = false;
  }

  public buildCopyText(spaceTable: SpaceGlyphInfo[]) {
    const offsetPx = this.x - this.box.x;
    const { prefix, achievedPx, deltaPx } = composePrefixSpacing(spaceTable, offsetPx);

    return {
      text: prefix + this.text,
      targetOffsetPx: Math.round(offsetPx),
      achievedOffsetPx: achievedPx,
      deltaPx,
    };
  }

  public render(ctx: CanvasRenderingContext2D, cf: CompositeFont) {
    ctx.save();
    if (this.selected) {
      ctx.fillStyle = "rgba(59,130,246,0.08)";
      ctx.fillRect(this.box.x, this.box.y, this.box.w, this.box.h);
      ctx.strokeStyle = "rgba(59,130,246,0.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.box.x, this.box.y, this.box.w, this.box.h);
    } else {
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(this.box.x, this.box.y, this.box.w, this.box.h);
    }
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(this.box.x, this.box.y, this.box.w, this.box.h);
    ctx.clip();

    const l = this.layout(cf);

    ctx.fillStyle = "#111";
    for (const p of l.placements) {
      const path = p.glyph.getPath(p.x, p.y, this.fontSize);
      path.draw(ctx);
      ctx.fill();
    }
    ctx.restore();
  }
}
