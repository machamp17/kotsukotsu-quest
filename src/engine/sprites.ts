// Procedural pixel-art sprites: 16x24 walking characters (4 directions x stand + 2 steps),
// 32x32 dialogue portraits, the cat, "fuan no moya" and UI balloons.
import { LOOKS, type Look } from "../data/characters";
import type { CharacterId, Direction } from "../types";
import { Pix } from "./pixel";

export const SPR_W = 16;
export const SPR_H = 24;
const EYE = "#2e2a3a";
const BLUSH = "#f59a9a";
const MOUTH = "#d9776a";
const GLASS = "#4a4a5a";
const STETH = "#6a7078";

type Frame = 0 | 1 | 2;

function isCoat(L: Look): boolean {
  return L.top === "#f6fbfb";
}

function drawLegsFront(p: Pix, L: Look, f: Frame): void {
  const lLift = f === 2 ? 1 : 0;
  const rLift = f === 1 ? 1 : 0;
  if (L.skirt) {
    p.rect(4, 18, 8, 2, L.bottom);
    p.rect(5, 20, 2, 2 - lLift, L.skin);
    p.rect(9, 20, 2, 2 - rLift, L.skin);
  } else {
    p.rect(5, 18, 2, 4 - lLift, L.bottom);
    p.rect(9, 18, 2, 4 - rLift, L.bottom);
  }
  p.rect(4, 22 - lLift, 3, 1, L.shoes);
  p.rect(9, 22 - rLift, 3, 1, L.shoes);
}

function drawHeadFront(p: Pix, L: Look): void {
  p.rect(4, 3, 8, 8, L.skin);
  const H = L.hair, S = L.hairShade;
  switch (L.hairStyle) {
    case "bald":
      p.rect(5, 2, 6, 1, L.skin);
      p.rect(3, 5, 1, 3, H); p.rect(12, 5, 1, 3, H);
      p.rect(4, 4, 1, 2, H); p.rect(11, 4, 1, 2, H);
      p.rect(5, 6, 2, 1, H); p.rect(9, 6, 2, 1, H);
      break;
    case "bun":
      p.rect(6, 0, 4, 2, H); p.set(7, 1, S);
      p.rect(4, 2, 8, 2, H); p.rect(3, 3, 1, 4, H); p.rect(12, 3, 1, 4, H);
      p.rect(4, 4, 2, 1, H); p.rect(10, 4, 2, 1, H); p.set(8, 3, S);
      break;
    case "cap":
      p.rect(4, 0, 8, 3, L.capColor ?? "#fff"); p.rect(4, 2, 8, 1, "#2bb3a8");
      p.set(7, 1, "#e0574a"); p.set(8, 1, "#e0574a");
      p.rect(3, 3, 10, 1, H); p.rect(3, 4, 1, 4, H); p.rect(12, 4, 1, 4, H);
      p.rect(4, 4, 3, 1, H); p.rect(9, 4, 3, 1, S);
      break;
    default: {
      p.rect(5, 1, 6, 1, H);
      p.rect(3, 2, 10, 2, H);
      p.set(5, 2, S); p.set(10, 2, S);
      if (L.hairStyle === "side") {
        p.rect(4, 4, 6, 1, H); p.rect(4, 5, 3, 1, S);
        p.rect(3, 4, 1, 4, H); p.rect(12, 4, 1, 4, H);
      } else {
        p.rect(4, 4, 8, 1, H); p.set(6, 4, S); p.set(9, 4, S); p.set(7, 5, H);
        const side = L.hairStyle === "bob" ? 7 : L.hairStyle === "long" ? 11 : 4;
        p.rect(3, 4, 1, side, H); p.rect(12, 4, 1, side, H);
        if (L.hairStyle === "bob") { p.set(4, 9, S); p.set(11, 9, S); p.set(4, 10, H); p.set(11, 10, H); }
        if (L.hairStyle === "long") { p.rect(3, 11, 1, 4, S); p.rect(12, 11, 1, 4, S); }
        if (L.hairStyle === "ponytail") { p.rect(13, 4, 1, 5, H); p.set(13, 9, S); p.set(12, 3, "#e0574a"); }
      }
    }
  }
  if (L.elder) {
    p.set(6, 8, EYE); p.set(9, 8, EYE); p.set(5, 7, L.hairShade); p.set(10, 7, L.hairShade);
  } else {
    p.rect(6, 7, 1, 2, EYE); p.rect(9, 7, 1, 2, EYE);
  }
  if (L.glasses) { p.set(5, 7, GLASS); p.set(7, 7, GLASS); p.set(8, 7, GLASS); p.set(10, 7, GLASS); p.rect(5, 6, 6, 1, GLASS); p.set(7, 6, L.skin); p.set(8, 6, L.skin); }
  p.set(5, 9, BLUSH); p.set(10, 9, BLUSH);
  p.set(7, 10, MOUTH); p.set(8, 10, MOUTH);
}

function drawTorsoFront(p: Pix, L: Look, f: Frame): void {
  p.rect(4, 11, 8, 7, L.top);
  p.rect(4, 11, 1, 7, L.topShade); p.rect(11, 11, 1, 7, L.topShade);
  if (isCoat(L)) {
    p.rect(7, 11, 2, 5, L.inner); p.set(6, 11, L.topShade); p.set(9, 11, L.topShade);
    p.set(5, 15, L.topShade); p.set(10, 15, L.topShade);
  } else {
    p.set(7, 11, L.inner); p.set(8, 11, L.inner);
  }
  if (L.apron) { p.rect(5, 13, 6, 5, L.apron); p.set(5, 13, "#e8e8e8"); }
  if (L.stethoscope) { p.set(5, 11, STETH); p.set(5, 12, STETH); p.set(6, 13, STETH); p.set(10, 11, STETH); p.set(10, 12, STETH); p.set(9, 13, STETH); p.set(10, 14, "#9aa3ad"); }
  const la = f === 1 ? 1 : 0, ra = f === 2 ? 1 : 0;
  p.rect(3, 11 + la, 1, 5, L.topShade); p.set(3, 16 + la, L.skin);
  p.rect(12, 11 + ra, 1, 5, L.topShade); p.set(12, 16 + ra, L.skin);
}

function drawPropFront(p: Pix, L: Look, f: Frame): void {
  const c = L.propColor ?? "#888";
  const ra = f === 2 ? 1 : 0;
  switch (L.prop) {
    case "bag": p.rect(12, 16 + ra, 3, 3, c); p.set(13, 15 + ra, c); p.set(13, 17 + ra, "#e0c070"); break;
    case "case": p.rect(12, 16 + ra, 3, 3, c); p.set(13, 17 + ra, "#ffffff"); break;
    case "file": p.rect(5, 13, 4, 4, c); p.rect(6, 14, 2, 1, "#ffffff"); break;
    case "papers": p.rect(5, 13, 3, 4, c); p.set(6, 14, "#9aa3ad"); p.set(6, 15, "#9aa3ad"); break;
    case "cane": p.rect(13, 15, 1, 8, c); p.set(12, 15, c); break;
    case "towel": p.rect(4, 11, 2, 4, c); break;
  }
}

function drawFront(p: Pix, L: Look, f: Frame): void {
  drawLegsFront(p, L, f);
  drawTorsoFront(p, L, f);
  drawHeadFront(p, L);
  drawPropFront(p, L, f);
}

function drawBack(p: Pix, L: Look, f: Frame): void {
  drawLegsFront(p, L, f === 1 ? 2 : f === 2 ? 1 : 0);
  p.rect(4, 11, 8, 7, L.top);
  p.rect(4, 11, 1, 7, L.topShade); p.rect(11, 11, 1, 7, L.topShade);
  if (isCoat(L)) p.rect(7, 15, 2, 3, L.topShade);
  const la = f === 2 ? 1 : 0, ra = f === 1 ? 1 : 0;
  p.rect(3, 11 + la, 1, 5, L.topShade); p.set(3, 16 + la, L.skin);
  p.rect(12, 11 + ra, 1, 5, L.topShade); p.set(12, 16 + ra, L.skin);
  const H = L.hair, S = L.hairShade;
  if (L.hairStyle === "bald") {
    p.rect(4, 2, 8, 8, L.skin); p.rect(5, 1, 6, 1, L.skin);
    p.rect(3, 5, 10, 4, H); p.rect(4, 9, 8, 1, S);
  } else {
    p.rect(5, 1, 6, 1, H); p.rect(3, 2, 10, 8, H); p.rect(4, 10, 8, 1, S);
    p.set(5, 3, S); p.set(10, 5, S);
    if (L.hairStyle === "bun") { p.rect(6, 0, 4, 2, H); p.set(7, 0, S); }
    if (L.hairStyle === "cap") { p.rect(4, 0, 8, 3, L.capColor ?? "#fff"); p.rect(4, 2, 8, 1, "#2bb3a8"); }
    if (L.hairStyle === "ponytail") { p.rect(7, 9, 2, 5, H); p.set(7, 8, "#e0574a"); p.set(8, 8, "#e0574a"); }
    if (L.hairStyle === "long") p.rect(4, 11, 8, 3, H);
    if (L.hairStyle === "bob") p.rect(3, 10, 10, 1, S);
  }
  const c = L.propColor ?? "#888";
  if (L.prop === "bag" || L.prop === "case") p.rect(1, 16 + la, 3, 3, c);
  if (L.prop === "cane") p.rect(2, 15, 1, 8, c);
  if (L.prop === "towel") p.rect(4, 11, 2, 3, c);
}

function drawLeft(p: Pix, L: Look, f: Frame): void {
  const B = L.bottom;
  if (f === 0) {
    if (L.skirt) { p.rect(5, 18, 6, 2, B); p.rect(6, 20, 4, 2, L.skin); }
    else { p.rect(6, 18, 4, 4, B); p.rect(8, 18, 1, 4, shade(B)); }
    p.rect(5, 22, 5, 1, L.shoes);
  } else if (f === 1) {
    if (L.skirt) { p.rect(5, 18, 6, 2, B); p.rect(4, 20, 2, 2, L.skin); p.rect(9, 20, 2, 2, L.skin); }
    else { p.rect(4, 18, 2, 4, B); p.rect(9, 18, 2, 4, shade(B)); p.rect(6, 18, 3, 1, B); }
    p.rect(3, 22, 3, 1, L.shoes); p.rect(9, 22, 3, 1, L.shoes);
  } else {
    if (L.skirt) { p.rect(5, 18, 6, 2, B); p.rect(5, 20, 2, 1, L.skin); p.rect(8, 20, 2, 2, L.skin); }
    else { p.rect(5, 18, 2, 3, shade(B)); p.rect(8, 18, 2, 4, B); p.rect(7, 18, 1, 1, B); }
    p.rect(4, 21, 3, 1, L.shoes); p.rect(8, 22, 3, 1, L.shoes);
  }
  p.rect(5, 11, 6, 7, L.top); p.rect(10, 11, 1, 7, L.topShade);
  if (isCoat(L)) p.rect(5, 11, 1, 4, L.inner);
  if (L.apron) p.rect(5, 13, 2, 5, L.apron);
  // head
  p.rect(4, 3, 7, 8, L.skin);
  const H = L.hair, S = L.hairShade;
  if (L.hairStyle === "bald") {
    p.rect(5, 2, 5, 1, L.skin); p.rect(8, 5, 3, 4, H); p.set(11, 6, H); p.set(5, 6, H);
  } else {
    p.rect(5, 1, 6, 1, H); p.rect(4, 2, 8, 2, H);
    p.rect(8, 4, 4, 5, H); p.set(11, 9, S); p.set(9, 6, S);
    if (L.hairStyle !== "bun" && L.hairStyle !== "cap") p.rect(4, 4, 3, 1, H);
    if (L.hairStyle === "bob") { p.rect(8, 9, 4, 2, H); p.set(9, 10, S); }
    if (L.hairStyle === "long") p.rect(9, 9, 3, 5, H);
    if (L.hairStyle === "ponytail") { p.rect(12, 4, 2, 5, H); p.set(12, 3, "#e0574a"); }
    if (L.hairStyle === "bun") { p.rect(10, 0, 3, 3, H); p.set(11, 1, S); }
    if (L.hairStyle === "cap") { p.rect(4, 0, 8, 3, L.capColor ?? "#fff"); p.rect(4, 2, 8, 1, "#2bb3a8"); }
  }
  p.set(8, 7, L.skin); p.set(8, 8, shade(L.skin)); // ear
  if (L.elder) p.set(5, 8, EYE); else p.rect(5, 7, 1, 2, EYE);
  if (L.glasses) { p.rect(4, 6, 3, 1, GLASS); p.set(7, 7, GLASS); }
  p.set(6, 9, BLUSH); p.set(4, 10, MOUTH);
  // arm swing
  const ax = f === 1 ? 5 : f === 2 ? 8 : 7;
  p.rect(ax, 12, 2, 4, L.topShade); p.rect(ax, 16, 2, 1, L.skin);
  const c = L.propColor ?? "#888";
  switch (L.prop) {
    case "bag": case "case": p.rect(ax - 1, 17, 3, 3, c); break;
    case "file": p.rect(3, 13, 2, 4, c); break;
    case "papers": p.rect(3, 13, 2, 3, c); break;
    case "cane": p.rect(3, 14, 1, 9, c); p.set(4, 14, c); break;
    case "towel": p.rect(8, 11, 2, 3, c); break;
  }
  if (L.stethoscope) { p.set(5, 12, STETH); p.set(5, 13, STETH); }
}

function shade(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 28), g = Math.max(0, ((n >> 8) & 255) - 28), b = Math.max(0, (n & 255) - 28);
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

const cache = new Map<string, HTMLCanvasElement>();

export function characterSprite(id: CharacterId, dir: Direction, frame: Frame): HTMLCanvasElement {
  const key = `${id}:${dir}:${frame}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let p: Pix;
  if (id === "cat") p = catPix(dir, frame);
  else {
    const L = LOOKS[id];
    p = new Pix(SPR_W, SPR_H);
    if (dir === "down") drawFront(p, L, frame);
    else if (dir === "up") drawBack(p, L, frame);
    else drawLeft(p, L, frame);
    p.outline();
    if (dir === "right") p = p.mirrored();
  }
  const c = p.toCanvas();
  cache.set(key, c);
  return c;
}

/** Upper body only, used for a person resting in bed. */
export function bustSprite(id: Exclude<CharacterId, "cat">): HTMLCanvasElement {
  const key = `bust:${id}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const L = LOOKS[id];
  const p = new Pix(SPR_W, 16);
  const full = new Pix(SPR_W, SPR_H);
  drawTorsoFront(full, L, 0);
  drawHeadFront(full, L);
  for (let y = 0; y < 15; y++) for (let x = 0; x < SPR_W; x++) p.set(x, y, full.get(x, y));
  p.outline();
  const c = p.toCanvas();
  cache.set(key, c);
  return c;
}

function catPix(dir: Direction, frame: Frame): Pix {
  const p = new Pix(16, 24);
  const pal = { o: "#f2a65a", w: "#fff7ec", k: EYE, p: "#f59a9a", s: "#d9843a" };
  const tail = frame === 1 ? ["       ss", "      ss "] : ["        s", "       ss"];
  const body = [
    "  o   o  ",
    "  oo ooo ",
    "  ooooooo",
    "  okoook ",
    "  owpwoo ",
    "   wwoooo",
    "   ooooooo",
    "   owwooso",
    "   ow  ow ",
  ];
  p.art(3, 13, dir === "up" ? body.map((r) => r.replace(/[kp]/g, "o")) : body, pal);
  p.art(8, 11, tail, pal);
  p.outline();
  return dir === "right" ? p.mirrored() : p;
}

export function portrait(id: Exclude<CharacterId, "cat">): HTMLCanvasElement {
  const key = `portrait:${id}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const L = LOOKS[id];
  const p = new Pix(32, 32);
  const H = L.hair, S = L.hairShade;
  // long hair behind shoulders
  if (L.hairStyle === "long") { p.rect(6, 10, 5, 20, H); p.rect(21, 10, 5, 20, H); }
  if (L.hairStyle === "bob") { p.rect(6, 10, 4, 14, H); p.rect(22, 10, 4, 14, H); }
  if (L.hairStyle === "ponytail") { p.rect(24, 9, 3, 13, H); p.rect(25, 12, 2, 8, S); }
  // shoulders
  p.rect(4, 26, 24, 6, L.top); p.rect(4, 26, 2, 6, L.topShade); p.rect(26, 26, 2, 6, L.topShade);
  p.rect(13, 22, 6, 5, shade(L.skin));
  p.rect(13, 26, 6, 2, L.inner); p.rect(14, 28, 4, 1, L.inner); p.rect(15, 29, 2, 1, L.inner);
  if (isCoat(L)) { p.rect(12, 26, 1, 6, L.topShade); p.rect(19, 26, 1, 6, L.topShade); p.rect(13, 28, 1, 4, L.inner); p.rect(18, 28, 1, 4, L.inner); }
  if (L.apron) p.rect(9, 29, 14, 3, L.apron);
  if (L.stethoscope) { p.set(12, 25, STETH); p.set(11, 26, STETH); p.set(11, 27, STETH); p.set(20, 25, STETH); p.set(21, 26, STETH); p.set(21, 27, STETH); p.rect(21, 28, 2, 2, "#9aa3ad"); }
  // face
  p.rect(9, 8, 14, 15, L.skin); p.rect(8, 10, 16, 11, L.skin);
  p.rect(10, 23, 12, 1, L.skin); p.rect(7, 14, 1, 4, L.skin); p.rect(24, 14, 1, 4, L.skin);
  // hair
  switch (L.hairStyle) {
    case "bald":
      p.rect(10, 6, 12, 3, L.skin); p.rect(7, 11, 2, 5, H); p.rect(23, 11, 2, 5, H);
      p.rect(9, 9, 3, 2, H); p.rect(20, 9, 3, 2, H);
      break;
    case "bun":
      p.rect(12, 1, 8, 5, H); p.rect(14, 2, 3, 1, S);
      p.rect(9, 5, 14, 4, H); p.rect(7, 7, 2, 8, H); p.rect(23, 7, 2, 8, H);
      p.rect(8, 9, 4, 2, H); p.rect(20, 9, 4, 2, H); p.rect(15, 5, 1, 3, S);
      break;
    case "cap":
      p.rect(8, 1, 16, 6, L.capColor ?? "#fff"); p.rect(8, 6, 16, 1, "#2bb3a8");
      p.rect(15, 2, 2, 4, "#e0574a"); p.rect(14, 3, 4, 2, "#e0574a");
      p.rect(7, 7, 18, 3, H); p.rect(7, 10, 2, 7, H); p.rect(23, 10, 2, 7, H); p.rect(10, 10, 5, 1, S);
      break;
    default:
      p.rect(9, 3, 14, 3, H); p.rect(7, 5, 18, 5, H);
      p.rect(7, 10, 2, 6, H); p.rect(23, 10, 2, 6, H);
      p.rect(11, 4, 6, 1, S);
      if (L.hairStyle === "side") { p.rect(9, 10, 10, 1, H); p.rect(9, 11, 6, 1, H); p.rect(9, 12, 3, 1, S); }
      else { p.rect(9, 10, 14, 1, H); p.set(12, 11, H); p.set(13, 11, H); p.set(18, 11, H); p.set(19, 11, H); p.set(15, 10, S); }
      if (L.hairStyle === "ponytail") { p.rect(22, 8, 3, 2, "#e0574a"); }
      if (L.hairStyle === "bob" || L.hairStyle === "long") { p.rect(7, 16, 2, 6, H); p.rect(23, 16, 2, 6, H); }
  }
  // eyes & brows
  if (L.elder) {
    p.set(11, 17, EYE); p.set(12, 16, EYE); p.set(13, 16, EYE); p.set(14, 17, EYE);
    p.set(18, 17, EYE); p.set(19, 16, EYE); p.set(20, 16, EYE); p.set(21, 17, EYE);
    p.rect(11, 13, 3, 1, S); p.rect(19, 13, 3, 1, S);
    p.set(10, 19, shade(L.skin)); p.set(22, 19, shade(L.skin));
  } else {
    p.rect(11, 15, 3, 4, EYE); p.rect(19, 15, 3, 4, EYE);
    p.set(12, 15, "#ffffff"); p.set(20, 15, "#ffffff");
    p.rect(11, 13, 3, 1, S); p.rect(19, 13, 3, 1, S);
  }
  if (L.glasses) {
    p.rect(10, 14, 5, 1, GLASS); p.rect(10, 19, 5, 1, GLASS); p.rect(10, 14, 1, 6, GLASS); p.rect(14, 14, 1, 6, GLASS);
    p.rect(18, 14, 5, 1, GLASS); p.rect(18, 19, 5, 1, GLASS); p.rect(18, 14, 1, 6, GLASS); p.rect(22, 14, 1, 6, GLASS);
    p.rect(15, 16, 3, 1, GLASS);
  }
  p.rect(9, 19, 2, 2, BLUSH); p.rect(22, 19, 2, 2, BLUSH);
  p.set(16, 18, shade(L.skin));
  p.rect(15, 21, 2, 1, MOUTH); p.set(14, 20, MOUTH); p.set(17, 20, MOUTH);
  p.outline();
  const c = p.toCanvas();
  cache.set(key, c);
  return c;
}

/** Small speech balloon with an exclamation mark (UI pixel art, not a font glyph). */
export function balloonSprite(kind: "!" | "..."): HTMLCanvasElement {
  const key = `balloon:${kind}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = new Pix(11, 12);
  p.rect(1, 0, 9, 9, "#ffffff"); p.rect(0, 1, 11, 7, "#ffffff");
  p.set(4, 9, "#ffffff"); p.set(5, 9, "#ffffff"); p.set(4, 10, "#ffffff");
  if (kind === "!") { p.rect(5, 2, 1, 4, "#e0574a"); p.rect(6, 2, 1, 4, "#c9403a"); p.rect(5, 7, 2, 1, "#e0574a"); }
  else { p.set(2, 5, EYE); p.set(5, 5, EYE); p.set(8, 5, EYE); }
  p.outline();
  const c = p.toCanvas();
  cache.set(key, c);
  return c;
}

/** Fuan no moya: a small purple mist creature. size 16 (map) or 48 (encounter). */
export function moyaSprite(size: 16 | 48, frame: number, clear = 0): HTMLCanvasElement {
  const key = `moya:${size}:${frame % 4}:${clear}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = new Pix(size, size);
  const s = size / 16;
  const wob = [0, 1, 0, -1][frame % 4];
  const fade = clear; // 0..3 : lighter as the mist clears
  const cols = [["#6b4fa8", "#8a6bc9", "#b9a1e8"], ["#7d66b3", "#9d86d2", "#cdbdf0"], ["#9a8cc4", "#b6a9dc", "#e0d8f5"], ["#bfb6de", "#d6cfea", "#f0ecfa"]][fade];
  const blobs: [number, number, number][] = [[8, 9, 5.2], [5, 10, 3.2], [11, 10, 3.4], [8, 6, 3.6], [6, 12, 2.6], [10, 12, 2.8]];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = x / s + 0.5, fy = y / s + 0.5;
      let v = 0;
      for (const [bx, by, r] of blobs) {
        const dx = fx - bx - (by < 9 ? wob * 0.3 : 0), dy = fy - by;
        v = Math.max(v, 1 - Math.sqrt(dx * dx + dy * dy) / r);
      }
      if (v > 0.45) p.set(x, y, cols[2]);
      else if (v > 0.2) p.set(x, y, cols[1]);
      else if (v > 0.02) p.set(x, y, cols[0]);
    }
  }
  // drifting square motes
  const motes = [[2, 4], [13, 3], [14, 13], [1, 14], [12, 1]];
  motes.forEach(([mx, my], i) => { if ((frame + i) % 3 !== 0) p.rect(Math.round((mx + wob * 0.5) * s), Math.round(my * s), Math.max(1, s), Math.max(1, s), cols[1]); });
  // worried eyes
  const e = Math.max(1, Math.round(s));
  p.rect(Math.round(6 * s), Math.round(8 * s), e, e * 2, "#ffffff");
  p.rect(Math.round(10 * s), Math.round(8 * s), e, e * 2, "#ffffff");
  p.rect(Math.round(5.5 * s), Math.round(7 * s), e, e, cols[0]);
  p.rect(Math.round(10.5 * s), Math.round(7 * s), e, e, cols[0]);
  p.outline("#3a2a5a");
  const c = p.toCanvas();
  cache.set(key, c);
  return c;
}
