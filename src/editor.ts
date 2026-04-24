import { CompositeFont } from "./saitamaarFont";
import { measureSpaceWidths, SpaceGlyphInfo } from "./spaceComposer";
import { TextBoxObject } from "./textBoxObject";

export class Editor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cf: CompositeFont;

  public objects: TextBoxObject[] = [];
  public selectedId: string | null = null;

  private activeObject: TextBoxObject | null = null;
  private spaceTableCache = new Map<number, SpaceGlyphInfo[]>();

  constructor(params: { canvas: HTMLCanvasElement; compositeFont: CompositeFont }) {
    this.canvas = params.canvas;
    this.ctx = this.canvas.getContext("2d")!;
    this.cf = params.compositeFont;

    this.canvas.style.touchAction = "none";
    this.bindEvents();
    this.bindKeyboard();
  }

  addObject(obj: TextBoxObject) {
    obj.clampInsideBox(this.cf);
    this.objects.push(obj);
  }

  private setSelected(obj: TextBoxObject | null) {
    this.selectedId = obj ? obj.id : null;
    for (const o of this.objects) o.selected = obj ? o.id === obj.id : false;
  }

  private bringToFront(obj: TextBoxObject) {
    const idx = this.objects.findIndex((o) => o.id === obj.id);
    if (idx < 0) return;
    this.objects.splice(idx, 1);
    this.objects.push(obj);
  }

  private getPos(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (this.canvas.width / r.width);
    const y = (e.clientY - r.top) * (this.canvas.height / r.height);
    return { x, y };
  }

  private pickTopMost(px: number, py: number): TextBoxObject | null {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const o = this.objects[i];
      if (o.hitTest(this.cf, px, py)) return o;
    }
    return null;
  }

  private getSpaceTable(fontSize: number) {
    let t = this.spaceTableCache.get(fontSize);
    if (!t) {
      t = measureSpaceWidths(this.cf, fontSize);
      this.spaceTableCache.set(fontSize, t);
    }
    return t;
  }

  private bindEvents() {
    this.canvas.addEventListener("pointerdown", (e) => {
      const p = this.getPos(e);
      const target = this.pickTopMost(p.x, p.y);

      if (!target) {
        this.setSelected(null);
        this.activeObject = null;
        return;
      }

      this.setSelected(target);
      this.bringToFront(target);

      const ok = target.onPointerDown(this.cf, p.x, p.y);
      if (ok) {
        this.activeObject = target;
        this.canvas.setPointerCapture(e.pointerId);
      }
    });

    this.canvas.addEventListener("pointermove", (e) => {
      if (!this.activeObject) return;
      const p = this.getPos(e);
      this.activeObject.onPointerMove(this.cf, p.x, p.y);
    });

    const end = (e: PointerEvent) => {
      if (this.activeObject) this.activeObject.onPointerUp();
      this.activeObject = null;
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    this.canvas.addEventListener("pointerup", end);
    this.canvas.addEventListener("pointercancel", end);
  }

  private bindKeyboard() {
    window.addEventListener("keydown", async (e) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && (e.key === "c" || e.key === "C")) {
        const sel = this.objects.find((o) => o.id === this.selectedId) ?? null;
        if (!sel) return;

        const spaceTable = this.getSpaceTable(sel.fontSize);
        const copy = sel.buildCopyText(spaceTable);

        await navigator.clipboard.writeText(copy.text);
        console.debug("copied text offset", copy);
        e.preventDefault();
      }
    });
  }

  render() {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const o of this.objects) o.render(ctx, this.cf);

    requestAnimationFrame(() => this.render());
  }
}
