// Fictional "obstacles to care" drawn as original pixel art.
// None of them represent a disease, a patient, a family or a profession.
import type { EnemyId } from "../types";
import { hash2, Pix } from "./pixel";
import { moyaSprite } from "./sprites";

const cache = new Map<string, HTMLCanvasElement>();

function blobFill(p: Pix, s: number, blobs: [number, number, number][], cols: [string, string, string], wob = 0): void {
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      const fx = x / s + 0.5, fy = y / s + 0.5;
      let v = 0;
      for (const [bx, by, r] of blobs) v = Math.max(v, 1 - Math.hypot(fx - bx - wob, fy - by) / r);
      if (v > 0.45) p.set(x, y, cols[2]);
      else if (v > 0.2) p.set(x, y, cols[1]);
      else if (v > 0.02) p.set(x, y, cols[0]);
    }
  }
}

/** みおとしコウモリ: a sleepy bat that hides small changes under its wings. */
function bat(size: number, frame: number, clear: number): Pix {
  const p = new Pix(size, size);
  const s = size / 16;
  const fade = [["#5a5a86", "#7a7aa8", "#a4a4cc"], ["#6a6a94", "#8a8ab4", "#b4b4d6"], ["#8a8aac", "#a8a8c8", "#cfcfe4"], ["#b0b0c8", "#c8c8dc", "#e6e6f0"]][Math.min(3, clear)];
  const up = frame % 2 === 0;
  // wings
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    const fx = x / s, fy = y / s;
    const wingY = up ? 5 : 8;
    const inL = fx < 6 && fy > wingY - (6 - fx) * 0.5 && fy < wingY + 4 - Math.abs(Math.sin(fx * 1.6)) * 1.5;
    const inR = fx > 10 && fy > wingY - (fx - 10) * 0.5 && fy < wingY + 4 - Math.abs(Math.sin(fx * 1.6)) * 1.5;
    if (inL || inR) p.set(x, y, fade[0]);
  }
  blobFill(p, s, [[8, 9, 4.2], [8, 6, 3.4]], [fade[0], fade[1], fade[2]]);
  // ears
  p.rect(Math.round(5.5 * s), Math.round(2 * s), Math.ceil(s), Math.ceil(2 * s), fade[1]);
  p.rect(Math.round(9.5 * s), Math.round(2 * s), Math.ceil(s), Math.ceil(2 * s), fade[1]);
  // sleepy eyes (closed lines) and a small smile
  const e = Math.max(1, Math.round(s));
  p.rect(Math.round(6 * s), Math.round(7 * s), e * 2, e, "#2e2a3a");
  p.rect(Math.round(9 * s), Math.round(7 * s), e * 2, e, "#2e2a3a");
  p.rect(Math.round(7.5 * s), Math.round(9.5 * s), e, e, "#f59a9a");
  p.outline("#2a2a44");
  return p;
}

/** つたわらん: a folded note that keeps dropping pieces of information. */
function tsutawaran(size: number, frame: number, clear: number): Pix {
  const p = new Pix(size, size);
  const s = size / 16;
  const fade = [["#e8dcb0", "#f6eecf", "#fffaf0"], ["#e8e0c0", "#f6f0d8", "#fffbf4"], ["#ece6d4", "#f6f2e6", "#fffdf8"], ["#f2eee6", "#f8f6f0", "#ffffff"]][Math.min(3, clear)];
  const bob = frame % 2;
  const R = (x: number, y: number, w: number, h: number, c: string) => p.rect(Math.round(x * s), Math.round((y + bob * 0.5) * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)), c);
  R(3, 3, 10, 9, fade[1]);
  R(3, 3, 10, 2, fade[2]);
  R(3, 11, 10, 1, fade[0]);
  // envelope flap lines
  for (let i = 0; i < 5; i++) { R(3 + i, 5 + i * 0.6, 1, 1, "#c9b98a"); R(12 - i, 5 + i * 0.6, 1, 1, "#c9b98a"); }
  // confused eyes
  R(5.5, 6.5, 1.5, 1.5, "#2e2a3a"); R(9, 6.5, 1.5, 1.5, "#2e2a3a");
  R(7, 9, 2, 1, "#d9776a");
  // legs
  R(5, 12, 1, 2, "#8a7a5a"); R(10, 12, 1, 2, "#8a7a5a");
  // dropped scraps
  const scraps = [[1, 13], [14, 12], [12, 15], [2, 9]];
  scraps.forEach(([x, y], i) => { if ((frame + i) % 3 !== 0) R(x, y, 1.5, 1, "#fff6c0"); });
  p.outline("#6a5a3a");
  return p;
}

export function enemySprite(id: EnemyId, size: 16 | 48, frame: number, clear = 0): HTMLCanvasElement {
  if (id === "moya") return moyaSprite(size, frame, clear);
  const key = `${id}:${size}:${frame % 4}:${clear}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = id === "bat" ? bat(size, frame, clear) : tsutawaran(size, frame, clear);
  const c = p.toCanvas();
  cache.set(key, c);
  return c;
}

/**
 * 孤立の魔王コリツ: a king made of indigo shadow, half crumbling into small squares,
 * with a closed, hollow heart. Sad rather than frightening.
 * `open` (0..4) = how many walls of isolation have been untied; `light` 0..1 turns the squares into light.
 */
export function koritsuSprite(size: 32 | 80, frame: number, open = 0, light = 0): HTMLCanvasElement {
  const key = `koritsu:${size}:${frame % 6}:${open}:${Math.round(light * 10)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const W = size, s = size / 40;
  const p = new Pix(W, W);
  const body = "#3b2f6b", bodyD = "#281f4d", bodyL = "#5a4a94", rim = "#1a1433";
  // robe: trapezoid widening to the bottom with a tattered hem
  for (let y = 0; y < W; y++) {
    const fy = y / s;
    if (fy < 12 || fy > 37) continue;
    const half = 6 + (fy - 12) * 0.46;
    for (let x = 0; x < W; x++) {
      const fx = x / s - 20;
      if (Math.abs(fx) > half) continue;
      if (fy > 34 && hash2(Math.floor(x / Math.max(1, s * 2)), 1) > 0.55 && fy > 35) continue;
      p.set(x, y, fx < -half + 2 ? bodyD : fx > half - 2 ? bodyD : body);
    }
  }
  // hood / head
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const fx = x / s - 20, fy = y / s - 12;
    if (fx * fx / 36 + fy * fy / 42 < 1) p.set(x, y, fy < -3 ? bodyL : body);
  }
  // crown
  const cy = Math.round(4 * s), ch = Math.max(2, Math.round(3 * s));
  p.rect(Math.round(14 * s), cy + ch, Math.round(12 * s), Math.max(1, Math.round(2 * s)), "#c9c9d9");
  [14, 18.5, 23].forEach((cx) => p.rect(Math.round(cx * s), cy, Math.max(1, Math.round(3 * s)), ch, "#dcdce8"));
  p.rect(Math.round(19.5 * s), cy + Math.round(s), Math.max(1, Math.round(s)), Math.max(1, Math.round(s)), "#9fdcf2");
  // sad, glowing eyes
  const e = Math.max(1, Math.round(1.5 * s));
  p.rect(Math.round(16.5 * s), Math.round(12 * s), e, e * 2, "#d6c8ff");
  p.rect(Math.round(22 * s), Math.round(12 * s), e, e * 2, "#d6c8ff");
  p.rect(Math.round(15.5 * s), Math.round(10.5 * s), e, Math.max(1, Math.round(s * 0.8)), bodyD);
  p.rect(Math.round(23 * s), Math.round(10.5 * s), e, Math.max(1, Math.round(s * 0.8)), bodyD);
  // the closed, hollow heart in the chest (an outline around an empty centre)
  const hx = 20, hy = 24;
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const fx = (x / s - hx) / 4, fy = -(y / s - hy) / 4;
    const v = Math.pow(fx * fx + fy * fy - 1, 3) - fx * fx * fy * fy * fy;
    if (v < 0 && v > -0.35) p.set(x, y, open >= 4 ? "#ffd45a" : "#8a7ac4");
    else if (v <= -0.35) p.set(x, y, open >= 4 ? "#fff6c0" : rim);
  }
  // crumbling right side: pixels break into squares that drift away
  const drift = frame % 6;
  const grid = Math.max(1, Math.round(2 * s));
  for (let gy = 0; gy < W; gy += grid) {
    for (let gx = Math.round(W * 0.55); gx < W; gx += grid) {
      if (!p.get(gx, gy)) continue;
      const k = hash2(gx, gy, 3);
      const edge = (gx / W - 0.55) / 0.45;
      if (k < edge * 0.9 + open * 0.08) {
        p.rect(gx, gy, grid, grid, null);
        const dx = gx + Math.round((2 + k * 6 + drift) * s), dy = gy - Math.round((k * 4 + drift * 0.5) * s);
        const col = light > k ? "#fff6c0" : k > 0.5 ? bodyL : body;
        p.rect(dx, dy, grid, grid, col);
      }
    }
  }
  if (light > 0) {
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const c = p.get(x, y);
      if (c && c !== "#fff6c0" && hash2(x, y, 9) < light * 0.8) p.set(x, y, "#fff6c0");
    }
  }
  p.outline("#15102a");
  const c = p.toCanvas();
  cache.set(key, c);
  return c;
}
