// Ending: short scenes of each patient's life afterwards, then the whole team in front
// of the clinic and the closing words. Nobody is "cured of everything"; each person is
// a little safer and less alone in their own home.
import { audio } from "../engine/audio";
import { input } from "../engine/input";
import { OUTLINE } from "../engine/pixel";
import { bustSprite, characterSprite } from "../engine/sprites";
import { C } from "../engine/tiles";
import { World } from "../engine/world";
import type { Avatar, CharacterId, Direction } from "../types";
import { wait } from "./effects";

type Draw = (g: CanvasRenderingContext2D, t: number) => void;

const VW = 160, VH = 100;

function room(g: CanvasRenderingContext2D, wall = C.wallpaper): void {
  g.fillStyle = wall; g.fillRect(0, 0, VW, 52);
  g.fillStyle = C.wallpaperD; for (let x = 4; x < VW; x += 10) g.fillRect(x, 0, 1, 48);
  g.fillStyle = C.woodD; g.fillRect(0, 48, VW, 4);
  g.fillStyle = C.floor; g.fillRect(0, 52, VW, 48);
  g.fillStyle = C.floorD; for (let y = 58; y < VH; y += 8) g.fillRect(0, y, VW, 1);
  g.fillStyle = OUTLINE; g.fillRect(110, 8, 34, 26);
  g.fillStyle = "#bfeaff"; g.fillRect(111, 9, 32, 24);
  g.fillStyle = "#ffffff"; g.fillRect(114, 12, 6, 2);
}

const person = (g: CanvasRenderingContext2D, id: CharacterId, x: number, y: number, dir: Direction = "down", frame: 0 | 1 | 2 = 0) =>
  g.drawImage(characterSprite(id, dir, frame), x, y, 32, 48);

function bed(g: CanvasRenderingContext2D, who: Exclude<CharacterId, "cat">, x: number, y: number): void {
  g.fillStyle = OUTLINE; g.fillRect(x - 1, y - 1, 34, 42);
  g.fillStyle = "#ffffff"; g.fillRect(x, y, 32, 40);
  g.drawImage(bustSprite(who), x, y - 4, 32, 32);
  g.fillStyle = "#9fdcf2"; g.fillRect(x, y + 22, 32, 18);
}

function scenes(avatar: Avatar): { draw: Draw; text: string }[] {
  return [
    {
      text: "ウメさんは、廊下に付けた手すりを使いながら、家で安全に過ごす工夫をケアマネージャーさんと相談している。",
      draw: (g, t) => {
        room(g);
        g.fillStyle = C.wood; g.fillRect(0, 40, 100, 3); g.fillStyle = C.woodD; g.fillRect(10, 43, 2, 5); g.fillRect(60, 43, 2, 5);
        person(g, "ume", 40 + (Math.floor(t / 900) % 2), 38, "right", Math.floor(t / 450) % 2 ? 1 : 0);
        person(g, "careManager", 82, 40, "left");
      },
    },
    {
      text: "田中さんの入院中の情報は、病院から訪問看護師さんへ引き継がれた。家に帰る準備が、少しずつ進んでいる。",
      draw: (g) => {
        room(g, "#f4fbfb");
        bed(g, "tanaka", 24, 50);
        person(g, "tanakaWife", 60, 44);
        person(g, "nurse", 100, 44, "left");
        g.fillStyle = "#ffffff"; g.fillRect(90, 60, 10, 12); g.fillStyle = "#9aa3ad"; g.fillRect(92, 63, 6, 1); g.fillRect(92, 66, 6, 1);
      },
    },
    {
      text: "ハルさんは、見やすい色の薬袋を使いながら、遠くに住む家族と電話で話している。",
      draw: (g, t) => {
        room(g);
        g.fillStyle = C.wood; g.fillRect(20, 70, 60, 8); g.fillStyle = C.woodD; g.fillRect(24, 78, 4, 14); g.fillRect(72, 78, 4, 14);
        ["#ffd45a", "#6fbf5a", "#5f84d8"].forEach((c, i) => { g.fillStyle = OUTLINE; g.fillRect(27 + i * 16, 59, 12, 12); g.fillStyle = c; g.fillRect(28 + i * 16, 60, 10, 10); });
        person(g, "haru", 92, 42);
        g.fillStyle = OUTLINE; g.fillRect(118, 58, 5, 9); g.fillStyle = "#ffffff"; g.fillRect(119, 59, 3, 7);
        if (Math.floor(t / 500) % 2) { g.fillStyle = "#ffffff"; g.fillRect(126, 48, 10, 6); g.fillStyle = OUTLINE; g.fillRect(128, 50, 1, 1); g.fillRect(131, 50, 1, 1); g.fillRect(134, 50, 1, 1); }
      },
    },
    {
      text: "木村さんの家には、困ったときの連絡先が大きく貼られた。娘さんの表情も、やわらいでいる。",
      draw: (g) => {
        room(g);
        g.fillStyle = OUTLINE; g.fillRect(20, 10, 30, 30); g.fillStyle = "#ffffff"; g.fillRect(21, 11, 28, 28);
        [C.teal, "#4f7fd0", "#e0574a"].forEach((c, i) => { g.fillStyle = c; g.fillRect(24, 15 + i * 8, 5, 5); g.fillStyle = "#6a7a86"; g.fillRect(31, 17 + i * 8, 15, 1); });
        bed(g, "kimura", 64, 50);
        person(g, "kimuraDaughter", 100, 44, "left");
        person(g, "liaison", 28, 46);
      },
    },
    {
      text: "専門職たちは、必要な情報を共有し、それぞれの場所へ向かっていく。",
      draw: (g, t) => {
        g.fillStyle = "#9fe3ff"; g.fillRect(0, 0, VW, 40);
        g.fillStyle = C.path; g.fillRect(0, 40, VW, 60);
        g.fillStyle = C.pathD; for (let y = 46; y < VH; y += 8) g.fillRect(0, y, VW, 1);
        const step = Math.floor(t / 300) % 2 ? 1 : 2;
        const drift = (t / 60) % 40;
        person(g, "careManager", 20 - drift / 2, 48, "left", step);
        person(g, "nurse", 56, 40 - drift / 4, "up", step);
        person(g, "pharmacist", 90, 56 + drift / 4, "down", step);
        person(g, "liaison", 118 + drift / 2, 46, "right", step);
        person(g, avatar, 64, 60, "down");
      },
    },
  ];
}

export async function runEnding(avatar: Avatar): Promise<void> {
  const root = document.getElementById("overlay")!;
  const el = document.createElement("div");
  el.className = "ending";
  el.innerHTML = `
    <div class="ending-stage"><canvas class="ending-canvas pixel" width="${VW}" height="${VH}"></canvas><canvas class="ending-town pixel" hidden></canvas></div>
    <div class="window ending-text"><p></p></div>`;
  root.appendChild(el);
  const canvas = el.querySelector<HTMLCanvasElement>(".ending-canvas")!;
  const town = el.querySelector<HTMLCanvasElement>(".ending-town")!;
  const textEl = el.querySelector<HTMLElement>(".ending-text p")!;
  const box = el.querySelector<HTMLElement>(".ending-text")!;
  const g = canvas.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  let draw: Draw = () => {};
  let alive = true;
  let world: World | null = null;
  const loop = (t: number) => {
    if (!alive) return;
    if (world) world.render(t);
    else { g.clearRect(0, 0, VW, VH); draw(g, t); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const next = (text: string, cls = "") => new Promise<void>((resolve) => {
    textEl.textContent = text;
    box.className = `window ending-text ${cls}`;
    box.classList.add("is-done");
    const t0 = performance.now();
    const go = () => {
      if (performance.now() - t0 < 500) return;
      pop();
      el.removeEventListener("pointerdown", go);
      resolve();
    };
    el.addEventListener("pointerdown", go);
    const pop = input.push({ a: go, b: go });
  });

  for (const s of scenes(avatar)) {
    el.classList.remove("is-shown");
    draw = s.draw;
    await wait(80);
    el.classList.add("is-shown");
    await next(s.text);
  }

  // the whole team in front of the clinic
  canvas.hidden = true;
  town.hidden = false;
  const flags: Record<string, boolean> = { askedForXray: true, gotKey: true, storeTalked: true, xrayExamDone: true, ecgDone: true, infoHospital: true, infoMassage: true, infoFamily: true, enteredKimura: true, ch3Asked: true, eyeExamDone: true, echoDone: true };
  world = new World(town, {
    flags: () => flags, canMove: () => false,
    onWarp: () => {}, onDoorLocked: () => {}, onTrigger: () => {}, onStep: () => {},
  });
  world.load("town", 11, 8, "down", []);
  world.hidePlayer = true;
  world.extras = [
    { id: "careManager", x: 9, y: 9, dir: "down" },
    { id: "nurse", x: 10, y: 9, dir: "down" },
    { id: avatar, x: 11, y: 9, dir: "down" },
    { id: "pharmacist", x: 12, y: 9, dir: "down" },
    { id: "liaison", x: 13, y: 9, dir: "down" },
  ];
  const stage = el.querySelector<HTMLElement>(".ending-stage")!;
  world.resize(stage.clientWidth, stage.clientHeight);
  await next("病気や老いが、すべてなくなるわけではない。");
  await next("それでも、声を聴き、知恵を持ち寄り、つながることで、安心は増やしていける。");
  audio.sfx("clear");
  await next("生きる事を嬉しく。\nこつこつクリニック", "is-brand");
  await next("これからも、町の物語はつづく。", "is-last");
  alive = false;
  el.remove();
}
