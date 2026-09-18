// WorldMap: tiles, collision, camera, player movement and the party that follows behind.
import { MAPS, type MapDef, type NpcDef, type Warp, type TriggerDef } from "../data/maps";
import type { CharacterId, Cond, Direction, EnemyId } from "../types";
import { enemySprite, koritsuSprite } from "./enemies";
import { balloonSprite, bustSprite, characterSprite } from "./sprites";
import { C, drawBuilding, drawTile, drawWaterSparkle, lampSprite, TILE, treeSprite, WALKABLE } from "./tiles";
import { makeCanvas, OUTLINE } from "./pixel";

export const STEP_MS = 180;

const DELTA: Record<Direction, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const OPPOSITE: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };

export interface Mover {
  x: number; y: number;
  fromX: number; fromY: number;
  t0: number;
  moving: boolean;
  dir: Direction;
  stepParity: number;
}

function mover(x: number, y: number, dir: Direction): Mover {
  return { x, y, fromX: x, fromY: y, t0: 0, moving: false, dir, stepParity: 0 };
}

export function checkCond(c: Cond | undefined, flags: Record<string, boolean>): boolean {
  if (!c) return true;
  if (c.all && !c.all.every((f) => flags[f])) return false;
  if (c.none && c.none.some((f) => flags[f])) return false;
  return true;
}

const staticCache = new Map<string, HTMLCanvasElement>();

/** Pre-renders the flat ground layer (tiles + buildings) of a map. */
export function staticLayer(map: MapDef): HTMLCanvasElement {
  const hit = staticCache.get(map.id);
  if (hit) return hit;
  const h = map.rows.length, w = map.rows[0].length;
  const [c, g] = makeCanvas(w * TILE, h * TILE);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const at = (dx: number, dy: number) => map.rows[y + dy]?.[x + dx] ?? (map.indoor ? "|" : "T");
      drawTile(g, map.rows[y][x], x, y, at, map.indoor);
    }
  }
  map.buildings.forEach((b) => drawBuilding(g, b));
  staticCache.set(map.id, c);
  return c;
}

export interface WorldHooks {
  flags(): Record<string, boolean>;
  canMove(): boolean;
  onWarp(w: Warp): void;
  onDoorLocked(w: Warp): void;
  onTrigger(t: TriggerDef): void;
  onStep(): void;
}

interface Follower { id: CharacterId; m: Mover; }

export class World {
  map!: MapDef;
  private layer!: HTMLCanvasElement;
  player = mover(0, 0, "down");
  avatar: CharacterId = "doctorA";
  followers: Follower[] = [];
  private trail: { x: number; y: number }[] = [];
  private npcDir: Record<string, Direction> = {};
  private balloonUntil: Record<string, number> = {};
  private bumpLock: Direction | null = null;
  private lastBump = 0;
  cam = { x: 0, y: 0 };
  /** Temporary sprite shown on the map just before an encounter. */
  enemyAt: { x: number; y: number; id: EnemyId } | null = null;
  /** Where the final boss waits on the map (set by the shell from flags). */
  bossAt: { x: number; y: number } | null = null;
  /** Standing characters used by the title scene. */
  extras: { id: CharacterId; x: number; y: number; dir: Direction }[] = [];
  hidePlayer = false;

  constructor(private canvas: HTMLCanvasElement, private hooks: WorldHooks) {}

  load(mapId: string, x: number, y: number, facing: Direction, followerIds: CharacterId[]): void {
    this.map = MAPS[mapId] ?? MAPS.town;
    this.layer = staticLayer(this.map);
    this.player = mover(x, y, facing);
    this.npcDir = {};
    this.enemyAt = null;
    this.bumpLock = null;
    this.placeFollowers(followerIds);
  }

  /** Places followers on free tiles behind the player so nobody overlaps. */
  placeFollowers(ids: CharacterId[]): void {
    const taken = new Set([`${this.player.x},${this.player.y}`]);
    this.trail = [];
    let cx = this.player.x, cy = this.player.y;
    let back = OPPOSITE[this.player.dir];
    for (let i = 0; i < ids.length; i++) {
      // behind first, then to the sides, and in front only as a last resort
      const sides: Direction[] = back === "up" || back === "down" ? ["left", "right"] : ["up", "down"];
      const order: Direction[] = [back, ...sides, OPPOSITE[back]];
      let placed = false;
      for (const d of order) {
        const nx = cx + DELTA[d][0], ny = cy + DELTA[d][1];
        const onWarp = this.map.warps.some((w) => w.x === nx && w.y === ny);
        if (!taken.has(`${nx},${ny}`) && !onWarp && this.walkable(nx, ny, true)) {
          this.trail.push({ x: nx, y: ny });
          taken.add(`${nx},${ny}`);
          cx = nx; cy = ny; back = d; placed = true;
          break;
        }
      }
      if (!placed) this.trail.push({ x: cx, y: cy });
    }
    this.followers = ids.map((id, i) => {
      const t = this.trail[i];
      const dir = i === 0 ? this.dirTo(t, this.player) : this.dirTo(t, this.trail[i - 1]);
      return { id, m: mover(t.x, t.y, dir) };
    });
  }

  private dirTo(a: { x: number; y: number }, b: { x: number; y: number }): Direction {
    const dx = b.x - a.x, dy = b.y - a.y;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
    if (dy !== 0) return dy > 0 ? "down" : "up";
    return this.player.dir;
  }

  get width(): number { return this.map.rows[0].length; }
  get height(): number { return this.map.rows.length; }

  tileAt(x: number, y: number): string {
    return this.map.rows[y]?.[x] ?? (this.map.indoor ? "|" : "T");
  }

  visibleNpcs(): NpcDef[] {
    const f = this.hooks.flags();
    return this.map.npcs.filter((n) => checkCond(n.visible, f));
  }

  npcAt(x: number, y: number): NpcDef | undefined {
    return this.visibleNpcs().find((n) => n.x === x && (n.y === y || (n.inBed && n.y + 1 === y)));
  }

  buildingAt(x: number, y: number): boolean {
    return this.map.buildings.some((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
  }

  walkable(x: number, y: number, ignoreNpcs = false): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    if (!WALKABLE.has(this.tileAt(x, y))) return false;
    if (this.buildingAt(x, y)) return false;
    if (!ignoreNpcs && this.npcAt(x, y)) return false;
    if (this.enemyAt && this.enemyAt.x === x && this.enemyAt.y === y) return false;
    if (this.bossAt && this.bossAt.x === x && this.bossAt.y === y) return false;
    return true;
  }

  facingTile(): { x: number; y: number } {
    const [dx, dy] = DELTA[this.player.dir];
    return { x: this.player.x + dx, y: this.player.y + dy };
  }

  faceNpc(id: string, dir: Direction): void { this.npcDir[id] = dir; }

  showBalloon(target: string, ms: number, now: number): void { this.balloonUntil[target] = now + ms; }

  /** Called every frame. Advances movement and starts a new step when a direction is held. */
  update(now: number, held: Direction | null): void {
    const p = this.player;
    if (held !== this.bumpLock) this.bumpLock = null;
    // Steps chain on elapsed time, so walking speed stays the same on slow devices.
    for (let i = 0; i < 4; i++) {
      if (p.moving) {
        if (now - p.t0 < STEP_MS) break;
        const end = p.t0 + STEP_MS;
        p.moving = false;
        this.followers.forEach((f) => { f.m.moving = false; });
        this.arrived();
        if (!held || !this.hooks.canMove() || held === this.bumpLock) break;
        this.tryStep(held, end);
      } else {
        if (held && this.hooks.canMove() && held !== this.bumpLock) this.tryStep(held, now);
        break;
      }
    }
    this.followers.forEach((f) => { if (f.m.moving && now - f.m.t0 >= STEP_MS) f.m.moving = false; });
  }

  private tryStep(dir: Direction, now: number): void {
    const p = this.player;
    p.dir = dir;
    const nx = p.x + DELTA[dir][0], ny = p.y + DELTA[dir][1];
    const warp = this.map.warps.find((w) => w.x === nx && w.y === ny);
    if (warp && this.buildingAt(nx, ny)) {
      this.bumpLock = dir;
      if (checkCond(warp.cond, this.hooks.flags())) this.hooks.onWarp(warp);
      else this.hooks.onDoorLocked(warp);
      return;
    }
    if (!this.walkable(nx, ny)) {
      if (now - this.lastBump > 400) this.lastBump = now;
      return;
    }
    // Each follower steps into the tile the one ahead of it just left. Skip the tile the
    // player is entering and duplicates, so nobody ever stands on the same tile.
    const candidates = [{ x: p.x, y: p.y }, ...this.trail, ...this.followers.map((f) => ({ x: f.m.x, y: f.m.y }))];
    const next: { x: number; y: number }[] = [];
    for (const c of candidates) {
      if (next.length >= Math.max(this.followers.length, 1)) break;
      if (c.x === nx && c.y === ny) continue;
      if (next.some((u) => u.x === c.x && u.y === c.y)) continue;
      next.push(c);
    }
    this.trail = next;
    p.fromX = p.x; p.fromY = p.y; p.x = nx; p.y = ny; p.t0 = now; p.moving = true; p.stepParity ^= 1;
    this.followers.forEach((f, i) => {
      const t = this.trail[i];
      if (!t || (t.x === f.m.x && t.y === f.m.y)) return;
      const adjacent = Math.abs(t.x - f.m.x) + Math.abs(t.y - f.m.y) === 1;
      f.m.dir = this.dirTo(f.m, t);
      f.m.fromX = adjacent ? f.m.x : t.x; f.m.fromY = adjacent ? f.m.y : t.y;
      f.m.x = t.x; f.m.y = t.y; f.m.t0 = now; f.m.moving = true; f.m.stepParity ^= 1;
    });
  }

  private arrived(): void {
    const p = this.player;
    this.hooks.onStep();
    const warp = this.map.warps.find((w) => w.x === p.x && w.y === p.y);
    if (warp && checkCond(warp.cond, this.hooks.flags())) { this.hooks.onWarp(warp); return; }
    const trig = this.triggerAt(p.x, p.y);
    if (trig) this.hooks.onTrigger(trig);
  }

  triggerAt(x: number, y: number): TriggerDef | undefined {
    const f = this.hooks.flags();
    return this.map.triggers.find((t) => x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h && checkCond(t.cond, f));
  }

  // ------------------------------------------------------------ rendering

  resize(viewW: number, viewH: number): number {
    const scale = Math.max(2, Math.min(5, Math.round(Math.min(viewW / 200, viewH / 170))));
    this.canvas.width = Math.ceil(viewW / scale);
    this.canvas.height = Math.ceil(viewH / scale);
    this.canvas.style.width = `${this.canvas.width * scale}px`;
    this.canvas.style.height = `${this.canvas.height * scale}px`;
    return scale;
  }

  private pixelPos(m: Mover, now: number): [number, number] {
    if (!m.moving) return [m.x * TILE, m.y * TILE];
    const k = Math.min(1, (now - m.t0) / STEP_MS);
    return [(m.fromX + (m.x - m.fromX) * k) * TILE, (m.fromY + (m.y - m.fromY) * k) * TILE];
  }

  private frameOf(m: Mover, now: number): 0 | 1 | 2 {
    if (!m.moving) return 0;
    const k = (now - m.t0) / STEP_MS;
    return k < 0.5 ? (m.stepParity ? 1 : 2) : 0;
  }

  render(now: number): void {
    const ctx = this.canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const vw = this.canvas.width, vh = this.canvas.height;
    const mw = this.width * TILE, mh = this.height * TILE;
    const [ppx, ppy] = this.pixelPos(this.player, now);
    let cx = Math.round(ppx + 8 - vw / 2), cy = Math.round(ppy + 4 - vh / 2);
    cx = mw <= vw ? Math.round((mw - vw) / 2) : Math.max(0, Math.min(mw - vw, cx));
    cy = mh <= vh ? Math.round((mh - vh) / 2) : Math.max(0, Math.min(mh - vh, cy));
    this.cam = { x: cx, y: cy };
    ctx.fillStyle = this.map.indoor ? "#2e2a3a" : C.leafD;
    ctx.fillRect(0, 0, vw, vh);
    ctx.drawImage(this.layer, -cx, -cy);

    const x0 = Math.max(0, Math.floor(cx / TILE) - 1), x1 = Math.min(this.width - 1, Math.ceil((cx + vw) / TILE) + 1);
    const y0 = Math.max(0, Math.floor(cy / TILE) - 1), y1 = Math.min(this.height - 1, Math.ceil((cy + vh) / TILE) + 2);
    const draws: { y: number; fn: () => void }[] = [];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = this.tileAt(x, y);
        const sx = x * TILE - cx, sy = y * TILE - cy;
        if (ch === "~") drawWaterSparkle(ctx, sx, sy, x, y, now);
        else if (ch === "T") { const v = (x * 7 + y * 3) % 2; draws.push({ y: y * TILE + 15, fn: () => ctx.drawImage(treeSprite(v), sx, sy - 10) }); }
        else if (ch === "L") draws.push({ y: y * TILE + 15, fn: () => ctx.drawImage(lampSprite(), sx, sy - 12) });
      }
    }
    const f = this.hooks.flags();
    for (const n of this.visibleNpcs()) {
      const sx = n.x * TILE - cx, sy = n.y * TILE - cy;
      if (n.inBed) {
        draws.push({ y: (n.y + 1) * TILE + 15, fn: () => this.drawBed(ctx, n, sx, sy) });
      } else {
        const dir = this.npcDir[n.id] ?? n.facing;
        // the cat flicks its tail now and then
        const idle = n.char === "cat" && Math.floor(now / 600 + n.x) % 4 === 0 ? 1 : 0;
        draws.push({ y: n.y * TILE + 14, fn: () => this.drawChar(ctx, n.char, dir, idle, sx, sy) });
      }
      if (n.balloon && checkCond(n.balloon, f)) {
        const bob = Math.floor(now / 300) % 2;
        draws.push({ y: 99999, fn: () => ctx.drawImage(balloonSprite("!"), sx + 3, sy - (n.inBed ? 10 : 20) - bob) });
      }
    }
    for (const o of this.map.objects) {
      if (!o.balloon || !checkCond(o.balloon, f)) continue;
      const sx = o.x * TILE - cx, sy = o.y * TILE - cy;
      const bob = Math.floor(now / 300) % 2;
      draws.push({ y: 99999, fn: () => ctx.drawImage(balloonSprite("!"), sx + 3, sy - 12 - bob) });
    }
    if (this.enemyAt) {
      const e = this.enemyAt;
      const sx = e.x * TILE - cx, sy = e.y * TILE - cy;
      draws.push({ y: e.y * TILE + 14, fn: () => ctx.drawImage(enemySprite(e.id, 16, Math.floor(now / 200)), sx, sy - 4) });
    }
    if (this.bossAt) {
      const b = this.bossAt;
      const sx = b.x * TILE - cx - 8, sy = b.y * TILE - cy - 18;
      draws.push({ y: b.y * TILE + 15, fn: () => ctx.drawImage(koritsuSprite(32, Math.floor(now / 240)), sx, sy + Math.round(Math.sin(now / 500))) });
    }
    this.followers.forEach((fo) => {
      const [fx, fy] = this.pixelPos(fo.m, now);
      draws.push({ y: fy + 14, fn: () => this.drawChar(ctx, fo.id, fo.m.dir, this.frameOf(fo.m, now), Math.round(fx - cx), Math.round(fy - cy)) });
    });
    this.extras.forEach((e) => {
      const sx = e.x * TILE - cx, sy = e.y * TILE - cy;
      draws.push({ y: e.y * TILE + 14, fn: () => this.drawChar(ctx, e.id, e.dir, 0, sx, sy) });
    });
    if (!this.hidePlayer) {
      draws.push({ y: ppy + 14.5, fn: () => this.drawChar(ctx, this.avatar, this.player.dir, this.frameOf(this.player, now), Math.round(ppx - cx), Math.round(ppy - cy)) });
    }
    if ((this.balloonUntil.player ?? 0) > now) {
      draws.push({ y: 99999, fn: () => ctx.drawImage(balloonSprite("!"), Math.round(ppx - cx) + 3, Math.round(ppy - cy) - 21) });
    }
    draws.sort((a, b) => a.y - b.y).forEach((d) => d.fn());
  }

  private drawChar(ctx: CanvasRenderingContext2D, id: CharacterId, dir: Direction, frame: 0 | 1 | 2, sx: number, sy: number): void {
    ctx.fillStyle = "rgba(30,40,40,0.22)";
    ctx.fillRect(sx + 3, sy + 13, 10, 3);
    ctx.fillRect(sx + 4, sy + 12, 8, 5);
    ctx.drawImage(characterSprite(id, dir, frame), sx, sy - 9);
  }

  private drawBed(ctx: CanvasRenderingContext2D, n: NpcDef, sx: number, sy: number): void {
    ctx.fillStyle = OUTLINE; ctx.fillRect(sx, sy - 3, 16, 35);
    ctx.fillStyle = C.woodD; ctx.fillRect(sx + 1, sy - 2, 14, 33);
    ctx.fillStyle = C.wood; ctx.fillRect(sx + 1, sy - 2, 14, 4);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(sx + 2, sy + 2, 12, 27);
    ctx.fillStyle = "#e8eef0"; ctx.fillRect(sx + 3, sy + 3, 10, 5);
    if (n.char !== "cat") ctx.drawImage(bustSprite(n.char), sx, sy - 3);
    ctx.fillStyle = OUTLINE; ctx.fillRect(sx + 1, sy + 11, 14, 1);
    ctx.fillStyle = "#b9a3d9"; ctx.fillRect(sx + 1, sy + 12, 14, 18);
    ctx.fillStyle = "#d6c8ec"; ctx.fillRect(sx + 1, sy + 12, 14, 2);
    ctx.fillStyle = "#9580bb";
    for (let i = 0; i < 3; i++) ctx.fillRect(sx + 3 + i * 4, sy + 17 + (i % 2) * 5, 2, 2);
  }
}
