// Minimal pixel grid used to author every sprite, tile and icon in code.
// Nothing in the game is drawn from images or font glyphs.

export const OUTLINE = "#2e2a3a";

export class Pix {
  readonly w: number;
  readonly h: number;
  private px: (string | null)[];

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.px = new Array(w * h).fill(null);
  }

  set(x: number, y: number, c: string | null): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = c;
  }

  get(x: number, y: number): string | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.px[y * this.w + x];
  }

  rect(x: number, y: number, w: number, h: number, c: string | null): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  /** Paints the outline colour on every empty pixel that touches a filled one. */
  outline(color = OUTLINE): this {
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
      }
    }
    add.forEach(([x, y]) => this.set(x, y, color));
    return this;
  }

  mirrored(): Pix {
    const m = new Pix(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) m.set(this.w - 1 - x, y, this.get(x, y));
    return m;
  }

  /** Stamps a string-art pattern. Each char maps through `pal`; spaces and unknown chars stay untouched. */
  art(x0: number, y0: number, rows: string[], pal: Record<string, string>): void {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = pal[row[x]];
        if (c) this.set(x0 + x, y0 + y, c);
      }
    });
  }

  toCanvas(scale = 1): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = this.w * scale;
    c.height = this.h * scale;
    const ctx = c.getContext("2d")!;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const col = this.px[y * this.w + x];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return c;
  }
}

/** Deterministic hash for tile variation. */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}
