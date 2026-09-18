// Short presentation pieces: fades, item get, party join, lessons, chapter cards.
import { PARTY_INFO } from "../data/characters";
import { ITEMS } from "../data/quests";
import { audio } from "../engine/audio";
import { itemIcon } from "../engine/icons";
import { input } from "../engine/input";
import { portrait } from "../engine/sprites";
import type { BgmId, ItemId, PartyMemberId } from "../types";

const overlayRoot = () => document.getElementById("overlay")!;

export function wait(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}

export async function fade(to: "out" | "in", ms = 220): Promise<void> {
  const el = document.getElementById("fader")!;
  el.classList.toggle("is-on", to === "out");
  await wait(ms);
}

function scaled(src: HTMLCanvasElement, s: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.width * s;
  c.height = src.height * s;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

/** Shows a window in the play area and waits for A / tap. */
export function card(build: (el: HTMLElement) => void, cls = "", minMs = 350): Promise<void> {
  const root = overlayRoot();
  const wrap = document.createElement("div");
  wrap.className = `card-wrap ${cls}`;
  const el = document.createElement("div");
  el.className = "window card";
  build(el);
  const hint = document.createElement("div");
  hint.className = "card-hint";
  hint.textContent = "Aボタン／タップで次へ";
  el.appendChild(hint);
  wrap.appendChild(el);
  root.appendChild(wrap);
  const shown = performance.now();
  return new Promise((resolve) => {
    const close = () => {
      if (performance.now() - shown < minMs) return;
      pop();
      wrap.remove();
      resolve();
    };
    wrap.addEventListener("pointerdown", (e) => { e.preventDefault(); close(); });
    const pop = input.push({ a: close, b: close });
  });
}

export async function itemGet(id: ItemId): Promise<void> {
  audio.sfx("item");
  const info = ITEMS[id];
  await card((el) => {
    const row = document.createElement("div");
    row.className = "item-get";
    const icon = scaled(itemIcon(id), 4);
    icon.className = "pixel";
    const txt = document.createElement("div");
    txt.innerHTML = `<p class="card-title"></p><p class="card-text"></p>`;
    txt.querySelector(".card-title")!.textContent = `「${info.name}」を受け取った`;
    txt.querySelector(".card-text")!.textContent = info.text;
    row.append(icon, txt);
    el.appendChild(row);
  }, "is-item");
}

export async function joinEffect(id: PartyMemberId, resume: BgmId | null): Promise<void> {
  const info = PARTY_INFO[id];
  const flash = document.getElementById("flash")!;
  flash.classList.remove("is-on");
  void flash.offsetWidth;
  flash.classList.add("is-on");
  audio.jingle("join", resume, 2300);
  await wait(250);
  await card((el) => {
    const face = scaled(portrait(id), 3);
    face.className = "pixel join-face";
    const rays = document.createElement("div");
    rays.className = "join-rays";
    rays.appendChild(face);
    const t = document.createElement("p");
    t.className = "card-title join-title";
    t.textContent = `${info.name}が仲間になった！`;
    const ab = document.createElement("div");
    ab.className = "ability";
    ab.innerHTML = `<span class="ability-label">能力</span><strong></strong><p></p>`;
    ab.querySelector("strong")!.textContent = `「${info.ability}」`;
    ab.querySelector("p")!.textContent = info.abilityText;
    el.append(rays, t, ab);
  }, "is-join", 1200);
}

export async function lesson(text: string): Promise<void> {
  audio.sfx("clear");
  await card((el) => {
    el.innerHTML = `<p class="card-eyebrow">訪問診療でできること</p><p class="card-text lesson"></p>`;
    el.querySelector(".lesson")!.textContent = text;
  }, "is-lesson", 600);
}

export async function chapterCard(title: string, sub: string, foot?: string): Promise<void> {
  audio.sfx("clear");
  await card((el) => {
    el.innerHTML = `<p class="chapter-title"></p><p class="chapter-sub"></p><p class="chapter-foot"></p><p class="chapter-brand">生きる事を嬉しく。こつこつクリニック</p>`;
    el.querySelector(".chapter-title")!.textContent = title;
    el.querySelector(".chapter-sub")!.textContent = sub;
    el.querySelector(".chapter-foot")!.textContent = foot ?? "";
  }, "is-chapter", 900);
}

/** Incoming call: a ringing phone window until the player answers. */
export async function phoneRing(caller: string): Promise<void> {
  await card((el) => {
    el.innerHTML = `<div class="phone"><span class="phone-icon" aria-hidden="true"></span><div><p class="card-title">呼び出し音が鳴っている</p><p class="card-text"></p></div></div>`;
    el.querySelector(".card-text")!.textContent = `${caller}からの着信だ。`;
  }, "is-phone", 700);
}
