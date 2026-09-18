// DialogueBox: speaker tab, pixel portrait, typewriter text and choice lists.
import { NAMES } from "../data/characters";
import { audio } from "../engine/audio";
import { input } from "../engine/input";
import { portrait } from "../engine/sprites";
import type { Avatar, CharacterId } from "../types";

interface SpeakerInfo { name: string; face: Exclude<CharacterId, "cat"> | null; }

export class DialogueBox {
  private root: HTMLElement;
  private nameEl: HTMLElement;
  private textEl: HTMLElement;
  private face: HTMLCanvasElement;
  private choicesEl: HTMLElement;
  private advance: (() => void) | null = null;

  constructor(root: HTMLElement, private who: () => { name: string; avatar: Avatar }) {
    this.root = root;
    this.nameEl = root.querySelector(".dlg-name")!;
    this.textEl = root.querySelector(".dlg-text")!;
    this.face = root.querySelector(".dlg-face")!;
    this.choicesEl = document.getElementById("choices")!;
    root.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.advance?.();
    });
  }

  fill(text: string): string {
    return text.split("{name}").join(this.who().name);
  }

  private speaker(id: string | null): SpeakerInfo {
    if (!id) return { name: "", face: null };
    const w = this.who();
    if (id === "player") return { name: `${w.name}先生`, face: w.avatar };
    if (id === "nursePhone") return { name: "訪問看護師（電話）", face: "nurse" };
    if (id === "liaisonPhone") return { name: "地域連携担当（電話）", face: "liaison" };
    if (id in NAMES && id !== "cat") return { name: NAMES[id as CharacterId], face: id as Exclude<CharacterId, "cat"> };
    return { name: id, face: null };
  }

  private show(id: string | null): void {
    const s = this.speaker(id);
    this.root.hidden = false;
    this.root.classList.toggle("is-narration", !s.name);
    this.nameEl.textContent = s.name;
    this.nameEl.hidden = !s.name;
    this.face.hidden = !s.face;
    if (s.face) {
      const g = this.face.getContext("2d")!;
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, 32, 32);
      g.drawImage(portrait(s.face), 0, 0);
    }
  }

  /** Types out one message; resolves after the player confirms it. */
  say(id: string | null, raw: string, think = false): Promise<void> {
    const text = this.fill(raw);
    this.show(id);
    this.root.classList.toggle("is-thought", think);
    this.root.classList.remove("is-done");
    this.textEl.textContent = "";
    return new Promise((resolve) => {
      let i = 0;
      let done = false;
      const chars = Array.from(text);
      const finish = () => {
        done = true;
        window.clearInterval(timer);
        this.textEl.textContent = text;
        this.root.classList.add("is-done");
      };
      const timer = window.setInterval(() => {
        i++;
        this.textEl.textContent = chars.slice(0, i).join("");
        if (i % 3 === 0) audio.sfx("talk");
        if (i >= chars.length) finish();
      }, 28);
      const pop = input.push({
        a: () => this.advance?.(),
        b: () => this.advance?.(),
      });
      this.advance = () => {
        if (!done) { finish(); return; }
        this.advance = null;
        pop();
        resolve();
      };
    });
  }

  /** Shows a prompt and a list of options. Resolves with the chosen index. */
  choose(id: string | null, prompt: string, options: string[]): Promise<number> {
    this.show(id);
    this.root.classList.add("is-done");
    this.root.classList.remove("is-thought");
    this.textEl.textContent = this.fill(prompt);
    this.choicesEl.innerHTML = "";
    this.choicesEl.hidden = false;
    let cursor = 0;
    const buttons = options.map((label, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.textContent = this.fill(label);
      b.addEventListener("pointerenter", () => setCursor(i));
      this.choicesEl.appendChild(b);
      return b;
    });
    const setCursor = (i: number) => {
      cursor = (i + options.length) % options.length;
      buttons.forEach((b, k) => b.classList.toggle("is-active", k === cursor));
    };
    setCursor(0);
    this.advance = null;
    return new Promise((resolve) => {
      const pick = (i: number) => {
        pop();
        audio.sfx("select");
        this.choicesEl.hidden = true;
        this.choicesEl.innerHTML = "";
        resolve(i);
      };
      buttons.forEach((b, i) => b.addEventListener("click", () => pick(i)));
      const pop = input.push({
        repeat: true,
        dir: (d) => {
          if (d === "up") { setCursor(cursor - 1); audio.sfx("cursor"); }
          if (d === "down") { setCursor(cursor + 1); audio.sfx("cursor"); }
        },
        a: () => pick(cursor),
      });
    });
  }

  /** A tap anywhere on the play area advances the current message. */
  tap(): boolean {
    if (!this.advance) return false;
    this.advance();
    return true;
  }

  hide(): void {
    this.root.hidden = true;
    this.choicesEl.hidden = true;
    this.advance = null;
  }
}
