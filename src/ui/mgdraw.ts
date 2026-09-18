// Drawing helpers shared by the minigame scenes (128x96 pixel canvases).
import { LOOKS } from "../data/characters";
import { OUTLINE } from "../engine/pixel";
import { portrait } from "../engine/sprites";
import { C } from "../engine/tiles";
import type { CharacterId } from "../types";

export const MG_W = 128;
export const MG_H = 96;
export const SKIN = "#f7cfa8";

/** Two portraits facing each other: used while talking with the patient. */
export function drawFaces(g: CanvasRenderingContext2D, left: Exclude<CharacterId, "cat">, right: Exclude<CharacterId, "cat">): void {
  g.fillStyle = "#fff4e0"; g.fillRect(0, 0, MG_W, MG_H);
  g.fillStyle = C.floor; g.fillRect(0, 70, MG_W, 26);
  g.fillStyle = C.floorD; for (let x = 0; x < MG_W; x += 16) g.fillRect(x, 70, 1, 26);
  g.drawImage(portrait(left), 8, 18, 48, 48);
  g.drawImage(portrait(right), 72, 18, 48, 48);
  g.fillStyle = "#ffffff"; g.fillRect(52, 8, 24, 12);
  g.fillStyle = OUTLINE; g.fillRect(56, 12, 2, 2); g.fillRect(63, 12, 2, 2); g.fillRect(70, 12, 2, 2);
}

export function box(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string): void {
  g.fillStyle = OUTLINE; g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle = c; g.fillRect(x, y, w, h);
}

/** A patient lying on their back, seen from above, head to the left. */
export function drawLyingPatient(g: CanvasRenderingContext2D, who: Exclude<CharacterId, "cat">, quilt = true): void {
  const L = LOOKS[who];
  g.fillStyle = C.floor; g.fillRect(0, 0, MG_W, MG_H);
  g.fillStyle = C.floorD; for (let y = 0; y < MG_H; y += 12) g.fillRect(0, y, MG_W, 1);
  box(g, 10, 26, 108, 48, C.woodD);
  g.fillStyle = "#ffffff"; g.fillRect(12, 28, 104, 44);
  g.fillStyle = "#e8eef0"; g.fillRect(14, 36, 20, 26);
  box(g, 20, 41, 14, 16, L.hair);
  g.fillStyle = L.skin; g.fillRect(30, 43, 6, 12);
  box(g, 36, 39, 42, 22, L.top);
  box(g, 79, 41, 30, 18, L.bottom);
  g.fillStyle = L.skin; g.fillRect(108, 42, 5, 16);
  if (quilt) { g.fillStyle = "#d6c8ec"; g.fillRect(100, 28, 14, 44); }
}

/** Schematic image frame corners (marks it as a "game display"). */
export function schematicCorners(g: CanvasRenderingContext2D): void {
  g.fillStyle = "#7fe0d4";
  g.fillRect(4, 4, 18, 1); g.fillRect(4, 4, 1, 10);
  g.fillRect(106, 91, 18, 1); g.fillRect(123, 82, 1, 10);
}
