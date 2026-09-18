// QuestTracker (top HUD), Inventory icons and the in-game menu.
import { PARTY_INFO } from "../data/characters";
import { CHAPTER_TITLES, currentStep, ITEMS, synopsis } from "../data/quests";
import { audio } from "../engine/audio";
import { itemIcon } from "../engine/icons";
import { input } from "../engine/input";
import { portrait } from "../engine/sprites";
import type { GameState } from "../types";

function pixelCanvas(src: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.width * scale;
  c.height = src.height * scale;
  c.className = "pixel";
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export class Hud {
  private chapterEl = document.getElementById("hud-chapter")!;
  private objectiveEl = document.getElementById("hud-objective")!;
  private itemsEl = document.getElementById("hud-items")!;
  private soundBtns = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-sound-toggle]"));
  private lastObjective = "";
  private lastItems = "";

  constructor(private onToggleSound: () => void) {
    this.soundBtns.forEach((b) => b.addEventListener("click", () => this.onToggleSound()));
  }

  refresh(s: GameState): void {
    this.chapterEl.textContent = CHAPTER_TITLES[s.chapter];
    const obj = currentStep(s.flags).objective;
    if (obj !== this.lastObjective) {
      this.objectiveEl.textContent = obj;
      this.objectiveEl.classList.remove("is-new");
      void this.objectiveEl.offsetWidth;
      if (this.lastObjective) this.objectiveEl.classList.add("is-new");
      this.lastObjective = obj;
    }
    const key = s.inventory.join(",");
    if (key !== this.lastItems) {
      this.lastItems = key;
      this.itemsEl.innerHTML = "";
      // the three most recent devices fit the phone HUD; the menu lists everything
      s.inventory.filter((id) => id !== "medicalBag" && id !== "patientKey" && id !== "dischargeNote").slice(-3).forEach((id) => {
        const c = pixelCanvas(itemIcon(id), 2);
        c.title = ITEMS[id].name;
        c.setAttribute("aria-label", ITEMS[id].name);
        this.itemsEl.appendChild(c);
      });
    }
  }

  setMuted(muted: boolean): void {
    this.soundBtns.forEach((b) => {
      b.textContent = muted ? "音：切" : "音：入";
      b.setAttribute("aria-pressed", String(!muted));
    });
  }

  reset(): void { this.lastObjective = ""; this.lastItems = ""; }
}

/** Opens the menu; resolves "title" if the player chose to return to the title screen. */
export function openMenu(s: GameState, onToggleSound: () => void): Promise<"close" | "title"> {
  const root = document.getElementById("overlay")!;
  const wrap = document.createElement("div");
  wrap.className = "menu-wrap";
  const el = document.createElement("div");
  el.className = "window menu";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "メニュー");
  const step = currentStep(s.flags);
  const syn = synopsis(s.flags);
  el.innerHTML = `
    <div class="menu-scroll">
      <section><h2>次の目的</h2><p class="menu-objective"></p></section>
      <section><h2>これまでのあらすじ</h2><ol class="menu-synopsis"></ol></section>
      <section><h2>仲間</h2><ul class="menu-party"></ul></section>
      <section><h2>持ち物</h2><ul class="menu-items"></ul></section>
    </div>
    <div class="menu-actions">
      <button type="button" class="choice" data-act="sound"></button>
      <button type="button" class="choice" data-act="title">保存してタイトルへ</button>
      <button type="button" class="choice" data-act="close">とじる</button>
    </div>`;
  el.querySelector(".menu-objective")!.textContent = step.objective;
  const ol = el.querySelector(".menu-synopsis")!;
  if (!syn.length) ol.innerHTML = `<li class="muted">まだ物語は始まったばかり。</li>`;
  syn.forEach((t) => { const li = document.createElement("li"); li.textContent = t; ol.appendChild(li); });

  const party = el.querySelector(".menu-party")!;
  const me = document.createElement("li");
  me.appendChild(pixelCanvas(portrait(s.avatar), 1));
  me.insertAdjacentHTML("beforeend", `<div><strong></strong><p>訪問診療医。「診る」「聴く」「つなぐ」。</p></div>`);
  me.querySelector("strong")!.textContent = `${s.playerName}先生`;
  party.appendChild(me);
  s.party.forEach((id) => {
    const info = PARTY_INFO[id];
    const li = document.createElement("li");
    li.appendChild(pixelCanvas(portrait(id), 1));
    li.insertAdjacentHTML("beforeend", `<div><strong></strong><p></p></div>`);
    li.querySelector("strong")!.textContent = `${info.name}　能力「${info.ability}」`;
    li.querySelector("p")!.textContent = info.abilityText;
    party.appendChild(li);
  });
  if (!s.party.length) party.insertAdjacentHTML("beforeend", `<li class="muted">町の専門職と出会うと、仲間が増えていく。</li>`);

  const items = el.querySelector(".menu-items")!;
  s.inventory.forEach((id) => {
    const info = ITEMS[id];
    const li = document.createElement("li");
    li.appendChild(pixelCanvas(itemIcon(id), 2));
    li.insertAdjacentHTML("beforeend", `<div><strong></strong><p></p></div>`);
    li.querySelector("strong")!.textContent = info.name;
    li.querySelector("p")!.textContent = info.text;
    items.appendChild(li);
  });

  wrap.appendChild(el);
  root.appendChild(wrap);
  const soundBtn = el.querySelector<HTMLButtonElement>('[data-act="sound"]')!;
  const paintSound = () => { soundBtn.textContent = audio.muted ? "音を出す（いまは消音）" : "音を消す（いまは音あり）"; };
  paintSound();

  const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>(".menu-actions .choice"));
  let cursor = buttons.length - 1;
  const setCur = (i: number) => { cursor = (i + buttons.length) % buttons.length; buttons.forEach((b, k) => b.classList.toggle("is-active", k === cursor)); };
  setCur(cursor);

  return new Promise((resolve) => {
    const finish = (r: "close" | "title") => { pop(); wrap.remove(); resolve(r); };
    const act = (name: string) => {
      audio.sfx("select");
      if (name === "sound") { onToggleSound(); paintSound(); return; }
      finish(name === "title" ? "title" : "close");
    };
    buttons.forEach((b, i) => {
      b.addEventListener("click", () => act(b.dataset.act!));
      b.addEventListener("pointerenter", () => setCur(i));
    });
    wrap.addEventListener("pointerdown", (e) => { if (e.target === wrap) finish("close"); });
    const pop = input.push({
      repeat: true,
      dir: (d) => {
        if (d === "up" || d === "left") setCur(cursor - 1);
        else setCur(cursor + 1);
        audio.sfx("cursor");
      },
      a: () => act(buttons[cursor].dataset.act!),
      b: () => finish("close"),
    });
  });
}
