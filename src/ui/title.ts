// TitleScreen: a daytime sky over the real town map, the team standing in the plaza.
import { audio } from "../engine/audio";
import { input } from "../engine/input";
import { hash2, Pix } from "../engine/pixel";
import { C } from "../engine/tiles";
import { World } from "../engine/world";

const TITLE_FLAGS = { askedForXray: true, gotKey: true, storeTalked: true, xrayExamDone: true };

function cloudSprite(w: number): HTMLCanvasElement {
  const p = new Pix(w, 12);
  for (let y = 0; y < 12; y++) for (let x = 0; x < w; x++) {
    const bumps = [[w * 0.3, 6, 5], [w * 0.55, 4, 6], [w * 0.75, 7, 4.5], [w * 0.15, 8, 3.5]];
    let v = 0;
    for (const [bx, by, r] of bumps) v = Math.max(v, 1 - Math.hypot(x - bx, (y - by) * 1.1) / r);
    if (y >= 8 && x > 2 && x < w - 3) v = Math.max(v, 0.3);
    if (v > 0) p.set(x, y, y > 8 ? "#d9f1fb" : "#ffffff");
  }
  return p.outline("#9fd3ea").toCanvas();
}

function sunSprite(): HTMLCanvasElement {
  const p = new Pix(28, 28);
  for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) {
    const d = Math.hypot(x - 13.5, y - 13.5);
    if (d < 7) p.set(x, y, d < 5 ? "#fff3a0" : "#ffe15a");
  }
  const rays: [number, number][] = [[13, 1], [13, 24], [1, 13], [24, 13], [4, 4], [22, 4], [4, 22], [22, 22]];
  rays.forEach(([x, y]) => p.rect(x, y, 3, 3, "#ffe15a"));
  return p.toCanvas();
}

export class TitleScreen {
  private world: World;
  private sky: HTMLCanvasElement;
  private loopId = 0;
  private pop: (() => void) | null = null;
  private clouds = [cloudSprite(34), cloudSprite(24), cloudSprite(40)];
  private sun = sunSprite();

  constructor() {
    this.sky = document.getElementById("title-sky") as HTMLCanvasElement;
    const town = document.getElementById("title-town") as HTMLCanvasElement;
    this.world = new World(town, {
      flags: () => TITLE_FLAGS, canMove: () => false,
      onWarp: () => {}, onDoorLocked: () => {}, onTrigger: () => {}, onStep: () => {},
    });
    this.world.load("town", 11, 11, "down", []);
    this.world.hidePlayer = true;
    this.world.extras = [
      { id: "nurse", x: 9, y: 9, dir: "down" },
      { id: "careManager", x: 10, y: 9, dir: "down" },
      { id: "doctorA", x: 11, y: 9, dir: "down" },
      { id: "doctorB", x: 12, y: 9, dir: "down" },
      { id: "pharmacist", x: 13, y: 9, dir: "down" },
      { id: "liaison", x: 14, y: 9, dir: "down" },
    ];
  }

  start(hasSave: boolean, onNew: () => void, onContinue: () => void): void {
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("#title-menu .choice"));
    const cont = buttons.find((b) => b.dataset.act === "continue")!;
    cont.disabled = !hasSave;
    const enabled = () => buttons.filter((b) => !b.disabled);
    let cursor = hasSave ? 1 : 0;
    const setCur = (i: number) => {
      const list = enabled();
      cursor = (i + list.length) % list.length;
      buttons.forEach((b) => b.classList.toggle("is-active", b === list[cursor]));
    };
    setCur(cursor);
    const act = (b: HTMLButtonElement) => {
      if (b.disabled) return;
      audio.sfx("select");
      if (b.dataset.act === "continue") onContinue(); else onNew();
    };
    buttons.forEach((b) => {
      b.onclick = () => act(b);
      b.onpointerenter = () => { const k = enabled().indexOf(b); if (k >= 0) setCur(k); };
    });
    this.pop?.();
    this.pop = input.push({
      repeat: true,
      dir: (d) => { if (d === "up") setCur(cursor - 1); if (d === "down") setCur(cursor + 1); audio.sfx("cursor"); },
      a: () => act(enabled()[cursor]),
    });
    audio.playBgm("title");
    this.resize();
    const id = ++this.loopId;
    const frame = (t: number) => {
      if (id !== this.loopId) return;
      this.world.render(t);
      this.drawSky(t);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  stop(): void {
    this.loopId++;
    this.pop?.();
    this.pop = null;
  }

  resize(): void {
    const town = this.world;
    const box = document.getElementById("title-town-box")!;
    const scale = town.resize(box.clientWidth, box.clientHeight);
    const skyBox = document.getElementById("title-sky-box")!;
    this.sky.width = Math.ceil(skyBox.clientWidth / scale);
    this.sky.height = Math.ceil(skyBox.clientHeight / scale);
    this.sky.style.width = `${this.sky.width * scale}px`;
    this.sky.style.height = `${this.sky.height * scale}px`;
  }

  private drawSky(t: number): void {
    const g = this.sky.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    const w = this.sky.width, h = this.sky.height;
    const bands = ["#4fbdf0", "#62c7f3", "#78d1f6", "#8fdaf8", "#a6e3fa", "#bdebfc"];
    const bh = Math.ceil(h / bands.length);
    bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * bh, w, bh); });
    g.drawImage(this.sun, w - 40, 8);
    // mountains
    const ridge = (base: number, amp: number, col: string, snow: string | null, seed: number) => {
      for (let x = 0; x < w; x++) {
        const k = x / w;
        const y = Math.round(base - amp * (0.55 + 0.45 * Math.sin(k * 7 + seed) * Math.cos(k * 3 + seed * 2)) - hash2(x >> 2, seed) * 2);
        g.fillStyle = col; g.fillRect(x, y, 1, h - y);
        if (snow && base - y > amp * 0.78) { g.fillStyle = snow; g.fillRect(x, y, 1, 3); }
      }
    };
    ridge(h - 6, h * 0.42, "#8fb4dc", "#ffffff", 1.3);
    ridge(h - 2, h * 0.22, "#6fae8a", null, 4.1);
    // distant tree line
    for (let x = 0; x < w; x += 6) {
      const r = 4 + Math.floor(hash2(x, 3) * 3);
      g.fillStyle = C.leafD; g.fillRect(x - 1, h - r - 1, 8, r + 1);
      g.fillStyle = C.leaf; g.fillRect(x, h - r, 6, r);
    }
    // clouds drift slowly
    this.clouds.forEach((c, i) => {
      const speed = 0.004 + i * 0.002;
      const x = ((t * speed + i * 90) % (w + 60)) - 50;
      g.drawImage(c, Math.round(x), 10 + i * 16);
    });
  }
}
