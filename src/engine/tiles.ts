// Tile set (16x16) and multi-tile buildings, all drawn procedurally.
import { hash2, makeCanvas, OUTLINE, Pix } from "./pixel";

export const TILE = 16;

export const C = {
  grass: "#7fd35c", grassD: "#63b84a", grassL: "#a6e36f",
  path: "#ecdcb6", pathD: "#cdb88f", pathL: "#f7eed6",
  water: "#3fc1e6", waterD: "#2a9fd0", foam: "#e6fbff",
  wood: "#c98f55", woodD: "#9a6636", woodL: "#e0ae74",
  leaf: "#3fae4a", leafD: "#2e8a3c", leafL: "#76d86a", trunk: "#8a5a3a",
  teal: "#2bb3a8", tealD: "#1a7f79", tealL: "#7fe0d4",
  wall: "#fbfaf4", wallD: "#dcd6c6", stone: "#b9b3a6", stoneD: "#8f887b",
  glass: "#ffe27a", glassD: "#e0b340", door: "#a56a3c", doorD: "#7a4a26",
  floor: "#e3b980", floorD: "#c9975c", floorL: "#f0cf9c",
  wallpaper: "#f4efe2", wallpaperD: "#dcd3bd",
  red: "#e0574a", white: "#ffffff",
};

/** Characters that are drawn as y-sorted sprites instead of on the flat ground layer. */
export const TALL_TILES = new Set(["T", "L"]);

/** Tiles the player can walk on. */
// "z" (cord) and "u" (curled rug) are tripping hazards: examined from the next tile, never walked on.
export const WALKABLE = new Set([".", ",", "=", "#", "_", "r", "M", "o"]);

const isWater = (ch: string) => ch === "~";

function grass(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number): void {
  ctx.fillStyle = C.grass;
  ctx.fillRect(px, py, TILE, TILE);
  for (let i = 0; i < 5; i++) {
    const hx = Math.floor(hash2(x, y, i) * 14) + 1, hy = Math.floor(hash2(x, y, i + 9) * 13) + 2;
    ctx.fillStyle = i % 2 ? C.grassD : C.grassL;
    ctx.fillRect(px + hx, py + hy, 1, 2);
    ctx.fillRect(px + hx + 1, py + hy + 1, 1, 1);
  }
}

function flowers(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number): void {
  const cols = ["#ffffff", "#ffe15a", "#ff9fc0"];
  for (let i = 0; i < 3; i++) {
    const fx = Math.floor(hash2(x, y, 20 + i) * 12) + 2, fy = Math.floor(hash2(x, y, 30 + i) * 11) + 2;
    ctx.fillStyle = cols[(i + Math.floor(hash2(x, y, 7) * 3)) % 3];
    ctx.fillRect(px + fx - 1, py + fy, 3, 1);
    ctx.fillRect(px + fx, py + fy - 1, 1, 3);
    ctx.fillStyle = "#f2a13a";
    ctx.fillRect(px + fx, py + fy, 1, 1);
  }
}

function stonePath(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number): void {
  ctx.fillStyle = C.path;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = C.pathD;
  const off = (y % 2) * 4;
  for (let r = 0; r < 2; r++) {
    ctx.fillRect(px, py + r * 8 + 7, TILE, 1);
    for (let k = 0; k < 2; k++) ctx.fillRect(px + ((k * 8 + off + r * 4) % 16), py + r * 8, 1, 7);
  }
  ctx.fillStyle = C.pathL;
  ctx.fillRect(px + 2 + Math.floor(hash2(x, y, 3) * 4), py + 2, 2, 1);
  ctx.fillRect(px + 9 + Math.floor(hash2(x, y, 4) * 4), py + 10, 2, 1);
}

function water(ctx: CanvasRenderingContext2D, px: number, py: number, at: (dx: number, dy: number) => string): void {
  ctx.fillStyle = C.water;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = C.waterD;
  ctx.fillRect(px, py + 12, TILE, 4);
  const land = (ch: string) => !isWater(ch) && ch !== "#";
  ctx.fillStyle = C.foam;
  if (land(at(-1, 0))) { ctx.fillRect(px, py, 2, TILE); ctx.fillStyle = C.grassD; ctx.fillRect(px, py, 1, TILE); ctx.fillStyle = C.foam; }
  if (land(at(1, 0))) { ctx.fillRect(px + 14, py, 2, TILE); ctx.fillStyle = C.grassD; ctx.fillRect(px + 15, py, 1, TILE); ctx.fillStyle = C.foam; }
  if (land(at(0, -1))) ctx.fillRect(px, py, TILE, 2);
  if (land(at(0, 1))) ctx.fillRect(px, py + 14, TILE, 2);
}

function bridge(ctx: CanvasRenderingContext2D, px: number, py: number, at: (dx: number, dy: number) => string): void {
  ctx.fillStyle = C.water;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = C.wood;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = C.woodD;
  for (let i = 0; i < 16; i += 4) ctx.fillRect(px + i, py, 1, TILE);
  ctx.fillStyle = C.woodL;
  for (let i = 1; i < 16; i += 4) ctx.fillRect(px + i, py + 2, 1, 3);
  if (at(0, -1) !== "#") { ctx.fillStyle = C.woodD; ctx.fillRect(px, py, TILE, 3); ctx.fillStyle = C.doorD; ctx.fillRect(px, py + 3, TILE, 1); }
  if (at(0, 1) !== "#") { ctx.fillStyle = C.woodD; ctx.fillRect(px, py + 13, TILE, 3); ctx.fillStyle = OUTLINE; ctx.fillRect(px, py + 15, TILE, 1); }
}

function fence(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  ctx.fillStyle = C.woodD;
  ctx.fillRect(px, py + 6, TILE, 2);
  ctx.fillRect(px, py + 11, TILE, 2);
  for (const fx of [2, 11]) {
    ctx.fillStyle = OUTLINE; ctx.fillRect(px + fx - 1, py + 2, 5, 13);
    ctx.fillStyle = C.wood; ctx.fillRect(px + fx, py + 3, 3, 11);
    ctx.fillStyle = C.woodL; ctx.fillRect(px + fx, py + 3, 1, 10);
  }
}

function well(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  const p = new Pix(16, 16);
  p.rect(2, 7, 12, 8, C.stone); p.rect(2, 7, 12, 2, "#d8d3c8"); p.rect(4, 8, 8, 1, "#3a6f8f");
  for (let i = 3; i < 14; i += 3) p.rect(i, 11, 1, 4, C.stoneD);
  p.rect(2, 1, 1, 7, C.woodD); p.rect(13, 1, 1, 7, C.woodD); p.rect(1, 0, 14, 2, C.teal); p.rect(1, 1, 14, 1, C.tealD);
  p.rect(7, 3, 2, 3, "#8a6a4a");
  p.outline();
  ctx.drawImage(p.toCanvas(), px, py);
}

function bench(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  const p = new Pix(16, 16);
  p.rect(1, 5, 14, 2, C.wood); p.rect(1, 8, 14, 3, C.woodL); p.rect(1, 10, 14, 1, C.woodD);
  p.rect(2, 11, 1, 4, C.woodD); p.rect(13, 11, 1, 4, C.woodD);
  p.outline();
  ctx.drawImage(p.toCanvas(), px, py);
}

function planter(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number): void {
  const p = new Pix(16, 16);
  p.rect(1, 9, 14, 6, C.woodD); p.rect(1, 9, 14, 1, C.woodL);
  p.rect(1, 4, 14, 5, C.leaf); p.rect(2, 3, 12, 1, C.leaf);
  const cols = ["#ff9fc0", "#ffe15a", "#ffffff", "#ff7a6a"];
  for (let i = 0; i < 5; i++) {
    const fx = 2 + i * 3, fy = 4 + ((i + x + y) % 2) * 2;
    p.rect(fx, fy, 2, 2, cols[(i + x) % 4]);
  }
  p.outline();
  ctx.drawImage(p.toCanvas(), px, py);
}

function signBoard(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  const p = new Pix(16, 16);
  p.rect(3, 11, 1, 5, C.woodD); p.rect(12, 11, 1, 5, C.woodD);
  p.rect(0, 1, 16, 11, C.teal); p.rect(1, 2, 14, 9, C.white);
  p.rect(2, 4, 3, 1, C.teal); p.rect(3, 3, 1, 3, C.teal);
  p.rect(6, 4, 8, 1, "#6a7a86"); p.rect(6, 7, 7, 1, "#6a7a86"); p.rect(2, 9, 12, 1, C.tealL);
  ctx.drawImage(p.outline().toCanvas(), px, py);
}

function garden(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  ctx.fillStyle = "#9a6a42"; ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "#7d5232"; ctx.fillRect(px, py + 5, TILE, 1); ctx.fillRect(px, py + 12, TILE, 1);
  for (const [gx, gy] of [[3, 1], [11, 1], [3, 8], [11, 8]]) {
    ctx.fillStyle = C.leafD; ctx.fillRect(px + gx - 2, py + gy + 1, 5, 3);
    ctx.fillStyle = C.leafL; ctx.fillRect(px + gx - 1, py + gy, 3, 2);
  }
}

function rock(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  const p = new Pix(16, 16);
  p.rect(3, 6, 10, 8, C.stone); p.rect(4, 5, 7, 1, C.stone); p.rect(4, 6, 4, 2, "#d8d3c8"); p.rect(3, 12, 10, 2, C.stoneD);
  ctx.drawImage(p.outline().toCanvas(), px, py);
}

// ---------------- interior tiles ----------------

function floor(ctx: CanvasRenderingContext2D, px: number, py: number, y: number): void {
  ctx.fillStyle = C.floor; ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = C.floorD;
  ctx.fillRect(px, py + 7, TILE, 1); ctx.fillRect(px, py + 15, TILE, 1);
  ctx.fillRect(px + ((y * 5) % 16), py, 1, 7); ctx.fillRect(px + ((y * 5 + 8) % 16), py + 8, 1, 7);
  ctx.fillStyle = C.floorL; ctx.fillRect(px + 2, py + 2, 4, 1);
}

function wallTile(ctx: CanvasRenderingContext2D, px: number, py: number, at: (dx: number, dy: number) => string, win: boolean): void {
  ctx.fillStyle = C.wallpaper; ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = C.wallpaperD;
  for (let i = 2; i < 16; i += 5) ctx.fillRect(px + i, py, 1, 12);
  ctx.fillStyle = C.woodD; ctx.fillRect(px, py + 12, TILE, 4);
  ctx.fillStyle = C.wood; ctx.fillRect(px, py + 12, TILE, 1);
  if (at(0, -1) !== "X" && at(0, -1) !== "w") { ctx.fillStyle = "#b99a78"; ctx.fillRect(px, py, TILE, 2); }
  if (win) {
    ctx.fillStyle = OUTLINE; ctx.fillRect(px + 2, py + 1, 12, 10);
    ctx.fillStyle = "#bfeaff"; ctx.fillRect(px + 3, py + 2, 10, 8);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(px + 4, py + 3, 3, 1); ctx.fillRect(px + 4, py + 4, 1, 2);
    ctx.fillStyle = C.wood; ctx.fillRect(px + 7, py + 2, 2, 8); ctx.fillRect(px + 3, py + 5, 10, 1);
  }
}

function darkTile(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  ctx.fillStyle = "#4a3a3a"; ctx.fillRect(px, py, TILE, TILE);
}

function rug(ctx: CanvasRenderingContext2D, px: number, py: number, at: (dx: number, dy: number) => string): void {
  ctx.fillStyle = "#e89aa0"; ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "#f6c3c5";
  ctx.fillRect(px + 3, py + 3, 2, 2); ctx.fillRect(px + 11, py + 11, 2, 2); ctx.fillRect(px + 11, py + 3, 2, 2); ctx.fillRect(px + 3, py + 11, 2, 2);
  ctx.fillStyle = "#c86c78";
  if (at(-1, 0) !== "r") ctx.fillRect(px, py, 2, TILE);
  if (at(1, 0) !== "r") ctx.fillRect(px + 14, py, 2, TILE);
  if (at(0, -1) !== "r") ctx.fillRect(px, py, TILE, 2);
  if (at(0, 1) !== "r") ctx.fillRect(px, py + 14, TILE, 2);
}

function mat(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  ctx.fillStyle = C.tealD; ctx.fillRect(px + 1, py + 3, 14, 11);
  ctx.fillStyle = C.teal; ctx.fillRect(px + 2, py + 4, 12, 9);
  ctx.fillStyle = C.tealL; for (let i = 3; i < 14; i += 3) ctx.fillRect(px + i, py + 5, 1, 7);
}

function furniture(kind: string): HTMLCanvasElement {
  const p = new Pix(16, 16);
  switch (kind) {
    case "t": // low table
      p.rect(1, 5, 14, 5, C.wood); p.rect(1, 5, 14, 1, C.woodL); p.rect(2, 10, 2, 5, C.woodD); p.rect(12, 10, 2, 5, C.woodD);
      p.rect(9, 3, 3, 3, "#ffffff"); p.rect(10, 2, 1, 1, "#bfeaff"); p.rect(3, 4, 4, 2, "#e0574a");
      break;
    case "c": // chair
      p.rect(3, 1, 10, 8, C.woodD); p.rect(4, 2, 8, 6, C.wood); p.rect(3, 9, 10, 3, C.woodL);
      p.rect(3, 12, 2, 3, C.woodD); p.rect(11, 12, 2, 3, C.woodD);
      break;
    case "s": // shelf with jars and photo
      p.rect(1, 0, 14, 16, C.woodD); p.rect(2, 1, 12, 14, C.wood);
      p.rect(2, 7, 12, 1, C.woodD); p.rect(3, 3, 3, 4, "#ffd45a"); p.rect(7, 4, 3, 3, "#ffffff"); p.rect(8, 5, 1, 1, "#7fd35c");
      p.rect(11, 2, 2, 5, "#9fdcf2"); p.rect(3, 9, 4, 5, "#e0574a"); p.rect(8, 10, 5, 4, C.tealL);
      break;
    case "p": // potted plant
      p.rect(5, 10, 6, 5, "#c9703a"); p.rect(5, 10, 6, 1, "#e08f5a");
      p.rect(4, 3, 8, 7, C.leaf); p.rect(6, 1, 4, 3, C.leafL); p.rect(3, 6, 2, 3, C.leafD); p.rect(11, 5, 2, 3, C.leafD);
      break;
    case "k": // kitchen counter
      p.rect(0, 2, 16, 14, "#f0f0ea"); p.rect(0, 2, 16, 3, "#c9d6da"); p.rect(2, 7, 5, 7, "#dcdcd2"); p.rect(9, 7, 5, 7, "#dcdcd2");
      p.rect(6, 10, 1, 2, "#8a8a8a"); p.rect(9, 10, 1, 2, "#8a8a8a"); p.rect(10, 0, 4, 3, "#9aa3ad");
      break;
    case "E": // equipment rack
      p.rect(0, 0, 16, 16, "#8a96a0"); p.rect(1, 1, 14, 14, "#c9d6da"); p.rect(1, 7, 14, 1, "#8a96a0");
      p.rect(2, 2, 5, 4, "#ffffff"); p.rect(3, 3, 3, 2, C.tealL); p.rect(9, 3, 5, 3, C.teal);
      p.rect(2, 9, 6, 5, "#f6fbfb"); p.rect(4, 11, 2, 1, C.red); p.rect(10, 9, 4, 5, "#9fdcf2");
      break;
    case "C": // dedicated storage case for the portable X-ray
      p.rect(0, 3, 16, 12, C.tealD); p.rect(1, 4, 14, 10, C.teal); p.rect(1, 4, 14, 2, C.tealL);
      p.rect(6, 1, 4, 3, "#6a7a86"); p.rect(7, 2, 2, 1, C.teal);
      p.rect(3, 8, 10, 4, "#ffffff"); p.rect(4, 9, 3, 2, "#6a7a86"); p.rect(8, 9, 4, 1, "#6a7a86"); p.rect(8, 11, 3, 1, "#9aa3ad");
      break;
    case "B": // storage boxes
      p.rect(1, 6, 7, 9, "#d9a86a"); p.rect(1, 6, 7, 1, "#f0c890"); p.rect(8, 3, 7, 12, "#c99658"); p.rect(8, 3, 7, 1, "#e8b87c");
      p.rect(3, 9, 3, 1, C.teal); p.rect(10, 7, 3, 1, C.teal);
      break;
    case "V": // desk with papers
      p.rect(0, 4, 16, 7, C.wood); p.rect(0, 4, 16, 1, C.woodL); p.rect(1, 11, 2, 4, C.woodD); p.rect(13, 11, 2, 4, C.woodD);
      p.rect(3, 2, 5, 3, "#ffffff"); p.rect(10, 1, 4, 4, "#2e2a3a"); p.rect(11, 2, 2, 2, "#9fdcf2");
      break;
    case "K": // pharmacy / reception counter
      p.rect(0, 3, 16, 12, "#f6fbfb"); p.rect(0, 3, 16, 3, C.teal); p.rect(0, 6, 16, 1, C.tealD);
      p.rect(2, 9, 12, 1, "#c9d6da"); p.rect(3, 0, 4, 3, "#ffffff"); p.rect(4, 1, 2, 1, C.red);
      break;
    case "m": // medicine shelf with coloured boxes
      p.rect(0, 0, 16, 16, "#c9d6da"); p.rect(1, 1, 14, 14, "#f6fbfb");
      p.rect(1, 5, 14, 1, "#9aa7b0"); p.rect(1, 10, 14, 1, "#9aa7b0");
      [["#e0574a", 2], ["#ffd45a", 6], ["#7bc86c", 10]].forEach(([c, x]) => { p.rect(x as number, 2, 3, 3, c as string); p.rect((x as number) + 1, 7, 3, 3, c as string); });
      p.rect(3, 11, 9, 3, "#9fdcf2");
      break;
    case "L": // low cupboard with a phone
      p.rect(1, 5, 14, 10, C.wood); p.rect(1, 5, 14, 1, C.woodL); p.rect(7, 7, 2, 7, C.woodD);
      p.rect(3, 1, 6, 4, "#ffffff"); p.rect(4, 2, 4, 1, C.teal); p.rect(10, 2, 3, 3, "#e0574a");
      break;

      p.rect(3, 1, 10, 11, "#ffffff"); p.rect(3, 1, 10, 3, C.red);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) p.rect(4 + i * 3, 5 + j * 2, 2, 1, "#9aa3ad");
      p.rect(7, 7, 2, 1, C.teal);
      break;
  }
  return p.outline().toCanvas();
}

const furnitureCache = new Map<string, HTMLCanvasElement>();
function drawFurniture(ctx: CanvasRenderingContext2D, kind: string, px: number, py: number): void {
  let c = furnitureCache.get(kind);
  if (!c) { c = furniture(kind); furnitureCache.set(kind, c); }
  ctx.drawImage(c, px, py);
}

/** Draws the flat ground layer for one tile. */
export function drawTile(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, at: (dx: number, dy: number) => string, indoor: boolean): void {
  const px = x * TILE, py = y * TILE;
  const under = () => (indoor ? floor(ctx, px, py, y) : grass(ctx, px, py, x, y));
  switch (ch) {
    case ".": case "T": case "L": grass(ctx, px, py, x, y); break;
    case ",": grass(ctx, px, py, x, y); flowers(ctx, px, py, x, y); break;
    case "=": case "o": stonePath(ctx, px, py, x, y); break;
    case "~": water(ctx, px, py, at); break;
    case "#": bridge(ctx, px, py, at); break;
    case "F": grass(ctx, px, py, x, y); fence(ctx, px, py); break;
    case "W": stonePath(ctx, px, py, x, y); well(ctx, px, py); break;
    case "b": stonePath(ctx, px, py, x, y); bench(ctx, px, py); break;
    case "P": grass(ctx, px, py, x, y); planter(ctx, px, py, x, y); break;
    case "S": grass(ctx, px, py, x, y); signBoard(ctx, px, py); break;
    case "g": garden(ctx, px, py); break;
    case "R": grass(ctx, px, py, x, y); rock(ctx, px, py); break;
    case "_": floor(ctx, px, py, y); break;
    case "X": wallTile(ctx, px, py, at, false); break;
    case "w": wallTile(ctx, px, py, at, true); break;
    case "Q": wallTile(ctx, px, py, at, false); drawFurniture(ctx, "Q", px, py); break;
    case "|": darkTile(ctx, px, py); break;
    case "r": rug(ctx, px, py, at); break;
    case "M": floor(ctx, px, py, y); mat(ctx, px, py); break;
    case "t": case "c": case "s": case "p": case "k": case "E": case "C": case "B": case "V": case "K": case "m":
      under(); drawFurniture(ctx, ch, px, py); break;
    case "l": under(); drawFurniture(ctx, "L", px, py); break;
    case "z": // a power cord across the floor (a tripping hazard)
      floor(ctx, px, py, y);
      ctx.fillStyle = "#3a3a44"; ctx.fillRect(px, py + 8, 6, 1); ctx.fillRect(px + 5, py + 9, 5, 1); ctx.fillRect(px + 9, py + 7, 7, 1);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(px + 13, py + 5, 3, 4);
      break;
    case "u": // a rug with a curled-up corner
      rug(ctx, px, py, at);
      ctx.fillStyle = "#f6c3c5"; ctx.fillRect(px + 10, py + 10, 6, 6);
      ctx.fillStyle = "#c86c78"; ctx.fillRect(px + 10, py + 10, 6, 1); ctx.fillRect(px + 10, py + 10, 1, 6);
      ctx.fillStyle = C.floor; ctx.fillRect(px + 12, py + 12, 4, 4);
      break;
    case "D": floor(ctx, px, py, y); break; // bed is drawn as an object
    default: under();
  }
}

/** Animated sparkle overlay for water tiles. */
export function drawWaterSparkle(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number, t: number): void {
  const phase = Math.floor(t / 400 + hash2(x, y, 5) * 4) % 4;
  ctx.fillStyle = "#bff0ff";
  const sx = Math.floor(hash2(x, y, 6) * 10) + 2 + phase, sy = 4 + ((phase * 3) % 8);
  ctx.fillRect(px + (sx % 14), py + sy, 3, 1);
  if (phase % 2 === 0) ctx.fillRect(px + ((sx + 7) % 13), py + ((sy + 5) % 11), 2, 1);
}

// ---------------- tall objects ----------------

let treeCanvas: HTMLCanvasElement | null = null;
let treeCanvas2: HTMLCanvasElement | null = null;
export function treeSprite(variant: number): HTMLCanvasElement {
  if (variant % 2 === 0 && treeCanvas) return treeCanvas;
  if (variant % 2 === 1 && treeCanvas2) return treeCanvas2;
  const p = new Pix(16, 26);
  p.rect(6, 18, 4, 7, C.trunk); p.rect(6, 18, 1, 7, "#6a4228");
  const blobs = variant % 2 === 0 ? [[8, 9, 7.2], [4, 13, 4.5], [12, 13, 4.5], [8, 5, 5]] : [[8, 10, 7.4], [4, 12, 4.8], [12, 11, 4.6], [7, 5, 4.6]];
  for (let y = 0; y < 22; y++) for (let x = 0; x < 16; x++) {
    let v = 0;
    for (const [bx, by, r] of blobs) v = Math.max(v, 1 - Math.hypot(x + 0.5 - bx, y + 0.5 - by) / r);
    if (v > 0) {
      const lit = (x + y) < 13 && v > 0.35;
      p.set(x, y, lit ? C.leafL : v > 0.18 ? C.leaf : C.leafD);
    }
  }
  p.set(5, 7, C.leafD); p.set(10, 12, C.leafD); p.set(11, 7, C.leafL); p.set(3, 14, C.leafD);
  p.outline("#1f5a2a");
  const c = p.toCanvas();
  if (variant % 2 === 0) treeCanvas = c; else treeCanvas2 = c;
  return c;
}

let lampCanvas: HTMLCanvasElement | null = null;
export function lampSprite(): HTMLCanvasElement {
  if (lampCanvas) return lampCanvas;
  const p = new Pix(16, 28);
  p.rect(7, 8, 2, 18, "#3a4a5a"); p.rect(5, 25, 6, 2, "#3a4a5a");
  p.rect(5, 2, 6, 6, "#3a4a5a"); p.rect(6, 3, 4, 4, C.glass); p.rect(6, 3, 2, 1, "#fff6c0"); p.rect(4, 1, 8, 1, "#3a4a5a");
  lampCanvas = p.outline().toCanvas();
  return lampCanvas;
}

// ---------------- buildings ----------------

export interface Building {
  id: string;
  x: number; y: number; w: number; h: number;
  roof: string; roofD: string; roofL: string;
  doorX: number; // absolute tile x of the door (on the bottom row)
  kind: "clinic" | "house" | "store" | "pharmacy" | "office";
  chimney?: boolean;
  label?: string;
}

export function drawBuilding(ctx: CanvasRenderingContext2D, b: Building): void {
  const W = b.w * TILE, Hh = b.h * TILE;
  const [c, g] = makeCanvas(W + 4, Hh + 4);
  const ox = 2, oy = 2;
  const wallRows = 2;
  const roofH = (b.h - wallRows) * TILE + 4;
  const wallTop = oy + roofH - 4;
  // walls
  g.fillStyle = OUTLINE; g.fillRect(ox, wallTop - 1, W, Hh - (wallTop - oy) + 1);
  g.fillStyle = b.kind === "store" ? "#eef3f4" : C.wall; g.fillRect(ox + 1, wallTop, W - 2, Hh - (wallTop - oy) - 1);
  g.fillStyle = C.wallD; g.fillRect(ox + 1, wallTop, W - 2, 3);
  g.fillStyle = C.stone; g.fillRect(ox + 1, oy + Hh - 5, W - 2, 4);
  g.fillStyle = C.stoneD; for (let i = 3; i < W - 2; i += 6) g.fillRect(ox + i, oy + Hh - 5, 1, 4);
  // roof
  const roofTop = oy;
  g.fillStyle = OUTLINE; g.fillRect(ox - 2, roofTop, W + 4, roofH);
  g.fillStyle = b.roof; g.fillRect(ox - 1, roofTop + 1, W + 2, roofH - 2);
  g.fillStyle = b.roofD;
  for (let yy = roofTop + 5; yy < roofTop + roofH - 2; yy += 4) {
    g.fillRect(ox - 1, yy, W + 2, 1);
    for (let xx = ((yy >> 2) % 2) * 4; xx < W; xx += 8) g.fillRect(ox + xx, yy - 3, 1, 3);
  }
  g.fillStyle = b.roofL; g.fillRect(ox - 1, roofTop + 1, W + 2, 2);
  g.fillStyle = b.roofD; g.fillRect(ox - 1, roofTop + roofH - 3, W + 2, 2);
  if (b.chimney) {
    g.fillStyle = OUTLINE; g.fillRect(ox + W - 18, roofTop - 1, 8, 9);
    g.fillStyle = "#c9703a"; g.fillRect(ox + W - 17, roofTop, 6, 7);
  }
  const doorPx = ox + (b.doorX - b.x) * TILE;
  const baseY = oy + Hh;
  // clinic gable and emblem
  if (b.kind === "clinic") {
    const gx = doorPx - 12, gw = 40;
    g.fillStyle = OUTLINE; g.fillRect(gx - 1, roofTop + 6, gw + 2, roofH - 6);
    g.fillStyle = C.wall; g.fillRect(gx, roofTop + 7, gw, roofH - 8);
    g.fillStyle = C.wallD; g.fillRect(gx, roofTop + roofH - 3, gw, 2);
    const cx = doorPx + 8, cy = roofTop + 7 + Math.floor((roofH - 10) / 2);
    g.fillStyle = C.teal; g.fillRect(cx - 2, cy - 6, 4, 12); g.fillRect(cx - 6, cy - 2, 12, 4);
    g.fillStyle = C.tealL; g.fillRect(cx - 2, cy - 6, 1, 12); g.fillRect(cx - 6, cy - 2, 12, 1);
  }
  // windows
  for (let tx = 0; tx < b.w; tx++) {
    const wx = ox + tx * TILE;
    if (Math.abs(wx - doorPx) < 14) continue;
    if (b.kind === "clinic" && Math.abs(wx - doorPx) < 20) continue;
    if (tx === 0 || tx === b.w - 1) { if (b.w > 4) { /* corner windows */ } else continue; }
    const wy = wallTop + 5;
    g.fillStyle = OUTLINE; g.fillRect(wx + 2, wy, 12, 11);
    g.fillStyle = C.glass; g.fillRect(wx + 3, wy + 1, 10, 9);
    g.fillStyle = C.glassD; g.fillRect(wx + 3, wy + 6, 10, 4);
    g.fillStyle = "#fff6c0"; g.fillRect(wx + 4, wy + 2, 2, 2);
    g.fillStyle = C.doorD; g.fillRect(wx + 7, wy + 1, 2, 9); g.fillRect(wx + 3, wy + 5, 10, 1);
    g.fillStyle = C.woodD; g.fillRect(wx + 1, wy + 11, 14, 2);
  }
  // door
  if (b.kind === "pharmacy" || b.kind === "office") {
    // glass double door with an awning and a pictogram sign
    g.fillStyle = OUTLINE; g.fillRect(doorPx - 1, baseY - 18, 18, 18);
    g.fillStyle = "#bfeaff"; g.fillRect(doorPx, baseY - 17, 16, 17);
    g.fillStyle = "#ffffff"; g.fillRect(doorPx + 2, baseY - 15, 2, 6);
    g.fillStyle = "#6a7a86"; g.fillRect(doorPx + 7, baseY - 17, 2, 17);
    g.fillStyle = b.roofD; g.fillRect(doorPx - 3, baseY - 21, 22, 3);
    g.fillStyle = OUTLINE; g.fillRect(doorPx + 1, baseY - 31, 14, 10);
    g.fillStyle = "#ffffff"; g.fillRect(doorPx + 2, baseY - 30, 12, 8);
    if (b.kind === "pharmacy") {
      // capsule
      g.fillStyle = "#e0574a"; g.fillRect(doorPx + 4, baseY - 28, 4, 4);
      g.fillStyle = "#7bc86c"; g.fillRect(doorPx + 8, baseY - 28, 4, 4);
      g.fillStyle = "#ffffff"; g.fillRect(doorPx + 5, baseY - 27, 1, 1);
    } else {
      // two linked rings: "connecting"
      g.fillStyle = "#4f7fd0";
      g.fillRect(doorPx + 3, baseY - 29, 5, 1); g.fillRect(doorPx + 3, baseY - 24, 5, 1); g.fillRect(doorPx + 3, baseY - 29, 1, 6); g.fillRect(doorPx + 7, baseY - 29, 1, 6);
      g.fillStyle = C.teal;
      g.fillRect(doorPx + 7, baseY - 28, 5, 1); g.fillRect(doorPx + 7, baseY - 23, 5, 1); g.fillRect(doorPx + 11, baseY - 28, 1, 6); g.fillRect(doorPx + 7, baseY - 28, 1, 5);
    }
  } else if (b.kind === "store") {
    g.fillStyle = OUTLINE; g.fillRect(doorPx - 1, baseY - 20, 18, 20);
    g.fillStyle = "#9aa7b0"; g.fillRect(doorPx, baseY - 19, 16, 19);
    g.fillStyle = "#7d8a94"; for (let i = 2; i < 19; i += 3) g.fillRect(doorPx, baseY - 19 + i, 16, 1);
    g.fillStyle = C.teal; g.fillRect(doorPx + 3, baseY - 27, 10, 6);
    g.fillStyle = C.white; g.fillRect(doorPx + 5, baseY - 26, 6, 4);
    g.fillStyle = C.teal; g.fillRect(doorPx + 7, baseY - 26, 2, 4); g.fillRect(doorPx + 5, baseY - 25, 6, 2);
  } else {
    const dw = b.kind === "clinic" ? 16 : 12, dx = doorPx + (16 - dw) / 2;
    g.fillStyle = OUTLINE; g.fillRect(dx - 1, baseY - 17, dw + 2, 17);
    g.fillStyle = C.door; g.fillRect(dx, baseY - 16, dw, 16);
    g.fillStyle = C.doorD; g.fillRect(dx + dw / 2 - 0.5, baseY - 16, 1, 16);
    g.fillStyle = C.woodL; g.fillRect(dx + 1, baseY - 15, dw - 2, 1);
    g.fillStyle = C.glass; g.fillRect(dx + dw / 2 - 3, baseY - 9, 1, 2); g.fillRect(dx + dw / 2 + 2, baseY - 9, 1, 2);
    if (b.kind === "clinic") {
      for (const lx of [dx - 6, dx + dw + 2]) {
        g.fillStyle = OUTLINE; g.fillRect(lx - 1, baseY - 17, 6, 8);
        g.fillStyle = C.glass; g.fillRect(lx, baseY - 16, 4, 6);
        g.fillStyle = "#fff6c0"; g.fillRect(lx, baseY - 16, 2, 2);
      }
    }
  }
  ctx.drawImage(c, b.x * TILE - ox, b.y * TILE - oy);
}
