// Unified input: on-screen D-pad (pointer events, slide to change direction),
// A button, and keyboard. Modal UI pushes handlers onto a stack; only the
// top handler receives presses, so the world never moves behind a dialogue.
import type { Direction } from "../types";

export interface Handler {
  dir?(d: Direction): void;
  a?(): void;
  b?(): void;
  /** Receive repeated dir() calls while a direction is held. */
  repeat?: boolean;
}

const KEY_DIR: Record<string, Direction> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right",
};
const CODE_DIR: Record<string, Direction> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right",
};
const KEY_A = new Set(["Enter", " ", "z", "Z"]);
const KEY_B = new Set(["Escape", "x", "X"]);
const CODE_A = new Set(["Enter", "NumpadEnter", "Space", "KeyZ"]);
const CODE_B = new Set(["Escape", "KeyX"]);

// e.key depends on layout / IME; e.code is the physical key. Accept either.
const dirOf = (e: KeyboardEvent): Direction | undefined => KEY_DIR[e.key] ?? CODE_DIR[e.code];
const isA = (e: KeyboardEvent) => KEY_A.has(e.key) || CODE_A.has(e.code);
const isB = (e: KeyboardEvent) => KEY_B.has(e.key) || CODE_B.has(e.code);

export class Input {
  private stack: Handler[] = [];
  private keysHeld: Direction[] = [];
  private padDir: Direction | null = null;
  private repeatTimer: number | null = null;
  private lastDir: Direction | null = null;
  private lastA = 0;

  push(h: Handler): () => void {
    this.stack.push(h);
    this.tapped = null;
    this.clearRepeat();
    return () => {
      const i = this.stack.lastIndexOf(h);
      if (i >= 0) this.stack.splice(i, 1);
      this.clearRepeat();
    };
  }

  get depth(): number { return this.stack.length; }

  heldDir(): Direction | null {
    return this.padDir ?? this.keysHeld[this.keysHeld.length - 1] ?? null;
  }

  private tapped: Direction | null = null;
  private dirSince = 0;

  /**
   * Direction the player should walk this frame.
   * A press always gives exactly one step (even if released before the next frame);
   * continuous walking starts only after the direction has been held for HOLD_MS.
   */
  walkDir(now: number): Direction | null {
    if (this.tapped) {
      const d = this.tapped;
      this.tapped = null;
      return d;
    }
    return this.holdDir(now);
  }

  /** The held direction once it counts as "walking" (no tap consumed). */
  holdDir(now: number): Direction | null {
    const held = this.heldDir();
    return held && now - this.dirSince >= Input.HOLD_MS ? held : null;
  }

  static readonly HOLD_MS = 300;

  private top(): Handler | undefined { return this.stack[this.stack.length - 1]; }

  pressA(): void {
    const now = performance.now();
    if (now - this.lastA < 120) return; // guard against double taps firing twice
    this.lastA = now;
    this.top()?.a?.();
  }

  pressB(): void { this.top()?.b?.(); }

  private dirChanged(): void {
    const d = this.heldDir();
    if (d === this.lastDir) return;
    this.lastDir = d;
    this.clearRepeat();
    if (!d) return;
    this.dirSince = performance.now();
    this.tapped = this.stack.length === 1 ? d : null;
    const h = this.top();
    h?.dir?.(d);
    if (h?.repeat) {
      const fire = (delay: number) => {
        this.repeatTimer = window.setTimeout(() => {
          if (this.heldDir() !== d || this.top() !== h) return;
          h.dir?.(d);
          fire(90);
        }, delay);
      };
      fire(280);
    }
  }

  private clearRepeat(): void {
    if (this.repeatTimer !== null) window.clearTimeout(this.repeatTimer);
    this.repeatTimer = null;
  }

  /** Forget held directions (e.g. when the page loses focus). */
  release(): void {
    this.keysHeld = [];
    this.padDir = null;
    this.lastDir = null;
    this.clearRepeat();
  }

  bind(dpad: HTMLElement, aBtn: HTMLElement): void {
    const dirFromPoint = (e: PointerEvent): Direction | null => {
      const r = dpad.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < r.width * 0.12) return this.padDir;
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    };
    const setPad = (d: Direction | null) => {
      this.padDir = d;
      dpad.dataset.dir = d ?? "";
      this.dirChanged();
    };
    dpad.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      try { dpad.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      padPointer = e.pointerId;
      setPad(dirFromPoint(e));
    });
    dpad.addEventListener("pointermove", (e) => {
      if (padPointer !== e.pointerId) return;
      setPad(dirFromPoint(e));
    });
    let padPointer: number | null = null;
    const end = (e: PointerEvent) => { e.preventDefault(); padPointer = null; setPad(null); };
    dpad.addEventListener("pointerup", end);
    dpad.addEventListener("pointercancel", end);
    dpad.addEventListener("lostpointercapture", () => setPad(null));

    aBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      aBtn.classList.add("is-down");
      this.pressA();
    });
    const aUp = () => aBtn.classList.remove("is-down");
    aBtn.addEventListener("pointerup", aUp);
    aBtn.addEventListener("pointercancel", aUp);
    aBtn.addEventListener("pointerleave", aUp);

    window.addEventListener("keydown", (e) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.isComposing) return;
      const d = dirOf(e);
      if (d) {
        e.preventDefault();
        if (!e.repeat && !this.keysHeld.includes(d)) { this.keysHeld.push(d); this.dirChanged(); }
        return;
      }
      if (isA(e)) {
        const focused = document.activeElement;
        if (focused instanceof HTMLButtonElement && this.stack.length === 0) return; // let native buttons work
        e.preventDefault();
        if (!e.repeat) this.pressA();
      } else if (isB(e)) {
        e.preventDefault();
        if (!e.repeat) this.pressB();
      }
    });
    window.addEventListener("keyup", (e) => {
      const d = dirOf(e);
      if (d) { this.keysHeld = this.keysHeld.filter((k) => k !== d); this.dirChanged(); }
    });
    window.addEventListener("blur", () => this.release());
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.release(); });
  }
}

export const input = new Input();
