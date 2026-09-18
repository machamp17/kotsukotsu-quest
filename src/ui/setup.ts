// CharacterSetup: player name (1-8 characters) and appearance.
import { audio } from "../engine/audio";
import { characterSprite, portrait } from "../engine/sprites";
import type { Avatar, Direction } from "../types";

export const DEFAULT_NAME = "コツコツ";

export function validateName(raw: string): { ok: true; name: string } | { ok: false; error: string } {
  // drop control characters (written as a code-point test so no raw control
  // character can end up inside the inlined bundle)
  const printable = Array.from(raw).filter((ch) => { const c = ch.codePointAt(0)!; return c >= 32 && c !== 127; }).join("");
  const name = printable.trim().replace(/\s+/g, " ");
  const len = Array.from(name).length;
  if (len === 0) return { ok: false, error: "名前を入力してください（空白だけの名前は使えません）。" };
  if (len > 8) return { ok: false, error: "名前は8文字以内で入力してください。" };
  return { ok: true, name };
}

export class CharacterSetup {
  private input = document.getElementById("name-input") as HTMLInputElement;
  private error = document.getElementById("name-error")!;
  private cards = Array.from(document.querySelectorAll<HTMLButtonElement>(".avatar-card"));
  private avatar: Avatar = "doctorA";
  private timer: number | null = null;

  constructor() {
    this.cards.forEach((c) => {
      c.addEventListener("click", () => this.pick(c.dataset.avatar as Avatar));
      const face = c.querySelector<HTMLCanvasElement>(".avatar-face")!.getContext("2d")!;
      face.imageSmoothingEnabled = false;
      face.drawImage(portrait(c.dataset.avatar as Avatar), 0, 0);
    });
    this.input.addEventListener("input", () => { this.error.textContent = ""; });
    this.input.addEventListener("focus", () => {
      // keep the field visible above the on-screen keyboard
      window.setTimeout(() => this.input.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
    });
  }

  private pick(a: Avatar): void {
    this.avatar = a;
    audio.sfx("cursor");
    this.cards.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.avatar === a)));
  }

  open(onStart: (name: string, avatar: Avatar) => void, onBack: () => void): void {
    this.input.value = DEFAULT_NAME;
    this.error.textContent = "";
    this.pick("doctorA");
    const start = () => {
      const v = validateName(this.input.value);
      if (!v.ok) {
        this.error.textContent = v.error;
        audio.sfx("bump");
        this.input.focus();
        return;
      }
      this.input.blur();
      this.close();
      onStart(v.name, this.avatar);
    };
    (document.getElementById("setup-start") as HTMLButtonElement).onclick = start;
    (document.getElementById("setup-back") as HTMLButtonElement).onclick = () => { this.close(); onBack(); };
    this.input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); start(); } };
    const dirs: Direction[] = ["down", "left", "up", "right"];
    let tick = 0;
    const paint = () => {
      const dir = dirs[Math.floor(tick / 8) % 4];
      const frame = ([1, 0, 2, 0] as const)[tick % 4];
      this.cards.forEach((c) => {
        const g = c.querySelector<HTMLCanvasElement>(".avatar-walk")!.getContext("2d")!;
        g.imageSmoothingEnabled = false;
        g.clearRect(0, 0, 16, 24);
        g.drawImage(characterSprite(c.dataset.avatar as Avatar, dir, frame), 0, 0);
      });
      tick++;
    };
    paint();
    this.timer = window.setInterval(paint, 180);
  }

  close(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }
}
