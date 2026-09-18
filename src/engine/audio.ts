// Original chiptune music and sound effects synthesized with Web Audio.
// Starts muted; sound only begins after the player turns it on (a user gesture).
import type { BgmId, SfxId } from "../types";

type Note = [string | 0, number]; // note name ("C5") or rest, length in beats
interface Song { bpm: number; voices: { wave: OscillatorType; gain: number; notes: Note[] }[]; loop: boolean; }

const n = (s: string): Note[] => s.trim().split(/\s+/).map((t) => {
  const [p, d] = t.split(":");
  return [p === "r" ? 0 : p, parseFloat(d)];
});

const SONGS: Record<BgmId, Song> = {
  town: {
    bpm: 112, loop: true, voices: [
      { wave: "square", gain: 0.05, notes: n("E5:1 G5:.5 A5:.5 G5:1 E5:1 D5:1 E5:.5 G5:.5 E5:2 C5:1 D5:.5 E5:.5 G5:1 A5:1 G5:1.5 E5:.5 D5:2 E5:1 G5:.5 A5:.5 C6:1 A5:1 G5:1 E5:.5 D5:.5 C5:2 D5:1 E5:.5 G5:.5 A5:1 G5:.5 E5:.5 D5:2 C5:2") },
      { wave: "triangle", gain: 0.12, notes: n("C3:2 G2:2 A2:2 E2:2 F2:2 C3:2 G2:2 G2:2 C3:2 A2:2 F2:2 C3:2 F2:2 G2:2 C3:2 G2:2") },
    ],
  },
  title: {
    bpm: 100, loop: true, voices: [
      { wave: "square", gain: 0.045, notes: n("C5:1 E5:1 G5:1 C6:1 B5:1.5 G5:.5 A5:2 F5:1 A5:1 C6:1 A5:1 G5:3 r:1 E5:1 G5:1 C6:1 E6:1 D6:1.5 C6:.5 A5:2 F5:1 G5:1 A5:1 B5:1 C6:3 r:1") },
      { wave: "triangle", gain: 0.12, notes: n("C3:2 G3:2 A2:2 E3:2 F2:2 C3:2 G2:2 G2:2 C3:2 G3:2 A2:2 E3:2 F2:2 G2:2 C3:4") },
    ],
  },
  house: {
    bpm: 80, loop: true, voices: [
      { wave: "triangle", gain: 0.09, notes: n("C5:2 E5:1 G5:1 F5:2 E5:2 D5:2 F5:1 A5:1 G5:4 E5:2 G5:1 C6:1 B5:2 A5:2 G5:2 F5:1 D5:1 C5:4") },
      { wave: "sine", gain: 0.1, notes: n("C3:4 F2:4 D3:4 G2:4 C3:4 E3:4 G2:4 C3:4") },
    ],
  },
  battle: {
    bpm: 138, loop: true, voices: [
      { wave: "square", gain: 0.04, notes: n("A4:.5 C5:.5 E5:.5 C5:.5 A4:.5 C5:.5 E5:.5 G5:.5 F4:.5 A4:.5 C5:.5 A4:.5 G4:.5 B4:.5 D5:.5 B4:.5") },
      { wave: "triangle", gain: 0.12, notes: n("A2:1 A2:1 A2:1 A2:1 F2:1 F2:1 G2:1 G2:1") },
    ],
  },
  emergency: {
    bpm: 120, loop: true, voices: [
      { wave: "square", gain: 0.035, notes: n("D5:1 r:.5 F5:.5 E5:1 r:1 D5:1 r:.5 A4:.5 C5:2 D5:1 r:.5 F5:.5 G5:1 r:1 F5:1 E5:1 D5:2") },
      { wave: "triangle", gain: 0.12, notes: n("D3:1 A2:1 D3:1 A2:1 A#2:1 F2:1 C3:1 A2:1 D3:1 A2:1 D3:1 A2:1 A#2:1 C3:1 D3:2") },
    ],
  },
  boss: {
    bpm: 92, loop: true, voices: [
      { wave: "square", gain: 0.035, notes: n("A4:1 C5:1 E5:2 D5:1 C5:1 B4:2 A4:1 C5:1 E5:1.5 G5:.5 F5:3 r:1 E5:1 D5:1 C5:2 B4:1 A4:1 G#4:2 A4:1 B4:1 C5:1 D5:1 E5:4") },
      { wave: "triangle", gain: 0.12, notes: n("A2:4 F2:4 C3:4 G2:4 A2:4 E2:4 F2:2 G2:2 A2:4") },
    ],
  },
  ending: {
    bpm: 84, loop: true, voices: [
      { wave: "triangle", gain: 0.1, notes: n("E5:2 G5:1 E5:1 D5:2 C5:2 F5:2 A5:1 G5:1 E5:4 D5:2 E5:1 F5:1 G5:2 C6:2 B5:1 A5:1 G5:1 F5:1 E5:4") },
      { wave: "sine", gain: 0.1, notes: n("C3:4 A2:4 F2:4 C3:4 G2:4 C3:4 G2:4 C3:4") },
    ],
  },
  join: {
    bpm: 150, loop: false, voices: [
      { wave: "square", gain: 0.06, notes: n("C5:.5 E5:.5 G5:.5 C6:.5 r:.25 G5:.25 C6:2") },
      { wave: "triangle", gain: 0.12, notes: n("C3:.5 E3:.5 G3:.5 C4:.5 r:.25 G3:.25 C4:2") },
    ],
  },
};

const FREQ: Record<string, number> = {};
["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].forEach((name, i) => {
  for (let o = 1; o < 8; o++) FREQ[name + o] = 440 * Math.pow(2, (i + (o - 4) * 12 - 9) / 12);
});

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = true;
  private bgm: BgmId | null = null;
  private timer: number | null = null;
  private cursors: { i: number; t: number }[] = [];

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (m) {
      this.stopLoop();
      if (this.ctx) void this.ctx.suspend();
    } else {
      this.ensure();
      const b = this.bgm;
      this.bgm = null;
      if (b) this.playBgm(b);
    }
  }

  private tone(freq: number, start: number, dur: number, wave: OscillatorType, gain: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = wave;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.01);
    g.gain.setValueAtTime(gain, start + Math.max(0.02, dur * 0.7));
    g.gain.linearRampToValueAtTime(0, start + dur * 0.95);
    o.connect(g).connect(this.master!);
    o.start(start);
    o.stop(start + dur);
  }

  playBgm(id: BgmId | null): void {
    if (id === this.bgm) return;
    this.stopLoop();
    this.bgm = id;
    if (!id) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const song = SONGS[id];
    const t0 = ctx.currentTime + 0.08;
    this.cursors = song.voices.map(() => ({ i: 0, t: t0 }));
    const beat = 60 / song.bpm;
    const tick = () => {
      if (!this.ctx) return;
      const horizon = this.ctx.currentTime + 0.35;
      let finished = true;
      song.voices.forEach((v, vi) => {
        const cur = this.cursors[vi];
        while (cur.t < horizon) {
          if (cur.i >= v.notes.length) {
            if (!song.loop) break;
            cur.i = 0;
          }
          const [p, len] = v.notes[cur.i++];
          const d = len * beat;
          if (p) this.tone(FREQ[p], cur.t, d, v.wave, v.gain);
          cur.t += d;
        }
        if (cur.i < v.notes.length) finished = false;
      });
      if (!song.loop && finished) { this.stopLoop(); this.bgm = null; }
    };
    tick();
    this.timer = window.setInterval(tick, 100);
  }

  private stopLoop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  /** Plays a one-shot jingle, then resumes the given background track. */
  jingle(id: BgmId, resume: BgmId | null, ms: number): void {
    this.playBgm(id);
    window.setTimeout(() => { this.bgm = null; this.playBgm(resume); }, ms);
  }

  get current(): BgmId | null { return this.bgm; }

  sfx(id: SfxId): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime + 0.01;
    switch (id) {
      case "select": this.tone(988, t, 0.06, "square", 0.05); this.tone(1319, t + 0.06, 0.08, "square", 0.05); break;
      case "cursor": this.tone(1175, t, 0.04, "square", 0.03); break;
      case "talk": this.tone(660, t, 0.03, "square", 0.02); break;
      case "beep": this.tone(1568, t, 0.08, "square", 0.04); this.tone(1568, t + 0.14, 0.08, "square", 0.04); break;
      case "bump": this.tone(110, t, 0.08, "square", 0.05); break;
      case "door": this.tone(330, t, 0.07, "triangle", 0.12); this.tone(247, t + 0.08, 0.12, "triangle", 0.12); break;
      case "item": [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, t + i * 0.08, 0.12, "square", 0.05)); break;
      case "clear": [659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.1, 0.25, "triangle", 0.12)); break;
      case "phone":
        for (let k = 0; k < 2; k++) for (let i = 0; i < 8; i++) this.tone(i % 2 ? 1319 : 1047, t + k * 0.7 + i * 0.05, 0.05, "square", 0.035);
        break;
      case "shutter": {
        const len = Math.floor(ctx.sampleRate * 0.12);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = ctx.createBufferSource();
        const g = ctx.createGain();
        g.gain.value = 0.12;
        src.buffer = buf;
        src.connect(g).connect(this.master!);
        src.start(t);
        this.tone(1760, t + 0.12, 0.05, "square", 0.03);
        break;
      }
    }
  }
}

export const audio = new AudioEngine();
