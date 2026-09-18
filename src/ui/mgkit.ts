// Shared building blocks for the medical minigames: a panel with a pixel scene,
// a talk line, choices and a generic "operate the device" interaction.
import { NAMES } from "../data/characters";
import { audio } from "../engine/audio";
import { input } from "../engine/input";
import type { Direction } from "../types";

export type Scene = (g: CanvasRenderingContext2D, t: number) => void;

export interface Kit {
  W: number;
  H: number;
  setStep(n: number, total: number, title: string): void;
  setScene(s: Scene): void;
  say(id: string, text: string): Promise<void>;
  choose(prompt: string, options: { label: string; disabled?: boolean }[], id?: string): Promise<number>;
  /** Lets the player operate something with the D-pad / taps until onConfirm returns true. */
  operate(opts: {
    button: string;
    hint: () => string;
    onDir?: (d: Direction) => void;
    onTap?: (x: number, y: number) => void;
    onConfirm: () => boolean;
    failText: string;
  }): Promise<void>;
  close(): void;
}

export function openMinigame(name: string, W = 128, H = 96): Kit {
  const root = document.getElementById("overlay")!;
  const el = document.createElement("div");
  el.className = "minigame";
  el.innerHTML = `
    <div class="window mg-panel">
      <div class="mg-head"><span class="mg-step"></span><span class="mg-title"></span></div>
      <canvas class="mg-scene pixel" width="${W}" height="${H}"></canvas>
      <div class="mg-talk"><p class="mg-speaker"></p><p class="mg-text"></p></div>
      <div class="mg-actions"></div>
    </div>`;
  root.appendChild(el);
  const stepEl = el.querySelector<HTMLElement>(".mg-step")!;
  const titleEl = el.querySelector<HTMLElement>(".mg-title")!;
  const canvas = el.querySelector<HTMLCanvasElement>(".mg-scene")!;
  const g = canvas.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const speakerEl = el.querySelector<HTMLElement>(".mg-speaker")!;
  const textEl = el.querySelector<HTMLElement>(".mg-text")!;
  const talkEl = el.querySelector<HTMLElement>(".mg-talk")!;
  const actions = el.querySelector<HTMLElement>(".mg-actions")!;
  const fill = (s: string) => s.split("{name}").join(name);
  const who = (id: string) => (id === "player" ? `${name}先生` : id === "" ? "" : NAMES[id as keyof typeof NAMES] ?? id);

  let scene: Scene = () => {};
  let alive = true;
  const loop = (t: number) => {
    if (!alive) return;
    g.clearRect(0, 0, W, H);
    scene(g, t);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const setSpeaker = (id: string) => {
    speakerEl.textContent = who(id);
    speakerEl.hidden = !id;
  };

  const say = (id: string, text: string) => new Promise<void>((resolve) => {
    actions.innerHTML = "";
    setSpeaker(id);
    textEl.textContent = fill(text);
    talkEl.classList.add("is-done");
    const t0 = performance.now();
    const go = () => {
      if (performance.now() - t0 < 200) return;
      pop();
      talkEl.removeEventListener("pointerdown", go);
      canvas.removeEventListener("pointerdown", go);
      talkEl.classList.remove("is-done");
      resolve();
    };
    talkEl.addEventListener("pointerdown", go);
    canvas.addEventListener("pointerdown", go);
    const pop = input.push({ a: go, b: go });
  });

  const choose = (prompt: string, options: { label: string; disabled?: boolean }[], id = "") => new Promise<number>((resolve) => {
    setSpeaker(id);
    textEl.textContent = fill(prompt);
    talkEl.classList.remove("is-done");
    actions.innerHTML = "";
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    let cursor = 0;
    const btns = options.map((o, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.textContent = fill(o.label);
      b.disabled = !!o.disabled;
      b.addEventListener("click", () => done(i));
      b.addEventListener("pointerenter", () => { const k = enabled.indexOf(i); if (k >= 0) setCur(k); });
      actions.appendChild(b);
      return b;
    });
    const setCur = (k: number) => { cursor = (k + enabled.length) % enabled.length; btns.forEach((b, i) => b.classList.toggle("is-active", i === enabled[cursor])); };
    setCur(0);
    const done = (i: number) => { if (options[i].disabled) return; pop(); audio.sfx("select"); actions.innerHTML = ""; resolve(i); };
    const pop = input.push({
      repeat: true,
      dir: (d) => { if (d === "up" || d === "left") setCur(cursor - 1); else setCur(cursor + 1); audio.sfx("cursor"); },
      a: () => done(enabled[cursor]),
    });
  });

  const operate: Kit["operate"] = (o) => new Promise<void>((resolve) => {
    speakerEl.hidden = true;
    talkEl.classList.remove("is-done");
    // while a "not yet" message is shown, the live hint is paused
    let paused = false;
    const hint = () => { if (!paused) textEl.textContent = o.hint(); };
    hint();
    actions.innerHTML = "";
    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = "choice is-active";
    ok.textContent = o.button;
    actions.appendChild(ok);
    const hintTimer = window.setInterval(hint, 150);
    const decide = () => {
      if (!o.onConfirm()) {
        audio.sfx("bump");
        paused = true;
        textEl.textContent = o.failText;
        window.setTimeout(() => { paused = false; hint(); }, 1100);
        return;
      }
      window.clearInterval(hintTimer);
      pop();
      canvas.removeEventListener("pointerdown", tap);
      audio.sfx("select");
      resolve();
    };
    const tap = (e: PointerEvent) => {
      if (!o.onTap) return;
      // the canvas is drawn with object-fit: contain, so account for the letterbox
      const r = canvas.getBoundingClientRect();
      const s = Math.min(r.width / W, r.height / H);
      const ox = r.left + (r.width - W * s) / 2, oy = r.top + (r.height - H * s) / 2;
      o.onTap(Math.round((e.clientX - ox) / s), Math.round((e.clientY - oy) / s));
      hint();
    };
    canvas.addEventListener("pointerdown", tap);
    ok.addEventListener("click", () => { if (!paused) decide(); });
    const pop = input.push({
      repeat: true,
      dir: (d) => { o.onDir?.(d); paused = false; hint(); },
      a: () => { if (!paused) decide(); },
    });
  });

  return {
    W, H,
    setStep: (n, total, title) => { stepEl.textContent = `${n} / ${total}`; titleEl.textContent = title; },
    setScene: (s) => { scene = s; },
    say, choose, operate,
    close: () => { alive = false; el.remove(); },
  };
}

/** Ask up to all questions; at least `min` must be asked, and `required` must be among them. */
export async function interview(
  kit: Kit,
  patient: string,
  questions: { label: string; answer: string }[],
  opts: { min: number; required?: number; reminder?: { id: string; text: string } },
): Promise<void> {
  const asked = new Set<number>();
  for (;;) {
    const opts2 = questions.map((q, i) => ({ label: q.label, disabled: asked.has(i) }));
    opts2.push({ label: "聞き終える", disabled: asked.size < opts.min });
    const i = await kit.choose(`何を聞こう？（${opts.min}つ以上聞いてから進めます）`, opts2);
    if (i === questions.length) {
      if (opts.required !== undefined && !asked.has(opts.required) && opts.reminder) {
        await kit.say(opts.reminder.id, opts.reminder.text);
        continue;
      }
      return;
    }
    asked.add(i);
    await kit.say("player", questions[i].label + "？");
    await kit.say(patient, questions[i].answer);
    if (asked.size === questions.length) return;
  }
}

/** A multiple-choice step that repeats with a gentle hint until the right option is chosen. */
export async function pickRight(kit: Kit, prompt: string, options: { label: string; hint?: string; hintBy?: string }[], right: number): Promise<void> {
  for (;;) {
    const i = await kit.choose(prompt, options.map((o) => ({ label: o.label })));
    if (i === right) return;
    await kit.say(options[i].hintBy ?? "", options[i].hint ?? "もう一度、考えてみよう。");
  }
}
