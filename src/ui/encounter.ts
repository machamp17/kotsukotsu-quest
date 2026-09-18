// Encounter: short "battles" with fictional obstacles to care. Nobody gets hurt;
// the doctor's actions and the party's abilities clear the obstacle in three actions.
import { PARTY_INFO } from "../data/characters";
import { audio } from "../engine/audio";
import { enemySprite } from "../engine/enemies";
import { input } from "../engine/input";
import { makeCanvas } from "../engine/pixel";
import { characterSprite, portrait } from "../engine/sprites";
import { C } from "../engine/tiles";
import type { Avatar, BgmId, EnemyId, PartyMemberId } from "../types";
import { wait } from "./effects";

interface Command { label: string; member?: PartyMemberId; first: string; again: string; }
interface EnemyDef {
  intro: string[];
  gauge: string;
  scenery: "bridge" | "street" | "fence";
  commands: Command[];
  turns: string[];
  clear: string[];
}

const skill = (m: PartyMemberId, first: string, again: string): Command => ({
  label: PARTY_INFO[m].ability, member: m, first: `${PARTY_INFO[m].name}の「${PARTY_INFO[m].ability}」！　${first}`, again,
});

const ENEMIES: Record<EnemyId, EnemyDef> = {
  moya: {
    intro: ["ふあんのモヤが現れた！", "攻撃する必要はない。何が起きているのかを確かめて、落ち着いて向き合おう。"],
    gauge: "モヤの濃さ",
    scenery: "bridge",
    commands: [
      { label: "観察する", first: "{name}先生は、モヤをじっくり観察した。……「分からないこと」から膨らんだ、不安のかたまりのようだ。", again: "{name}先生は、もう一度よく見た。モヤの輪郭が、少しずつはっきりしてきた。" },
      { label: "声をかける", first: "「大丈夫。分からないことは、一つずつ確かめていきましょう」　モヤが少し薄くなった。", again: "「一人で抱えなくていいんですよ」　モヤがふわりとゆらいだ。" },
      { label: "落ち着かせる", first: "{name}先生は、ゆっくり呼吸をして、これからの見通しを言葉にした。モヤが静かになっていく。", again: "深呼吸をひとつ。あわてず、順番に。モヤの色がやわらいだ。" },
    ],
    turns: ["ふあんのモヤは、ぐるぐると渦を巻いている。", "「もし骨が折れていたら……」そんなささやきが聞こえた気がした。"],
    clear: ["ふあんのモヤが晴れた！", "分からないことが分かってくると、不安は少し軽くなる。"],
  },
  bat: {
    intro: ["みおとしコウモリが、羽を広げてあらわれた！", "小さな変化を、羽の下に隠してしまうらしい。"],
    gauge: "見落とし",
    scenery: "street",
    commands: [
      { label: "よく見る", first: "{name}先生は、家の前をよく見た。……郵便受けに、何日分もの新聞がたまっている。", again: "見落としがないか、もう一度ていねいに確かめた。" },
      skill("careManager", "「最近、外に出る回数が減っていたんです」　コウモリの羽が少し下がった。", "暮らしの様子を、もう一度思い出した。羽がゆるんだ。"),
      skill("nurse", "「小さな変化も、先生と共有しましょう」　コウモリの羽がたたまれていく。", "気づいたことを、もう一度チームに伝えた。"),
    ],
    turns: ["みおとしコウモリは、ぱたぱたと羽で景色を隠している。", "「小さなことだし、まあいいか……」そんな声がした気がした。"],
    clear: ["みおとしコウモリの羽が、そっとたたまれた！", "小さな変化に気づければ、大きな困りごとを防げることがある。"],
  },
  tsutawaran: {
    intro: ["書類をばらまきながら、つたわらんが現れた！", "大事な情報を、途中でぽろぽろ落としてしまうらしい。"],
    gauge: "とぎれた情報",
    scenery: "fence",
    commands: [
      { label: "書きとめる", first: "{name}先生は、落ちた紙を拾って書きとめた。「退院日」「飲んでいる薬」……。", again: "拾った情報を、もう一度読み返して整理した。" },
      skill("careManager", "暮らしの情報が、1枚にまとまった。", "暮らしの情報を、もう一度確かめた。"),
      skill("nurse", "最近の体の変化が、チームに届いた。", "変化を、もう一度伝えた。"),
      skill("pharmacist", "お薬の情報が、きちんと並んだ。", "お薬の情報を、もう一度見直した。"),
    ],
    turns: ["つたわらんは、書類をひらひらと落としていく。", "「誰かが伝えてくれているはず……」そんなつぶやきが聞こえた。"],
    clear: ["つたわらんの書類が、全部そろった！", "情報は、落とさずにつなげば、次の人の力になる。"],
  },
};

function scenery(kind: EnemyDef["scenery"]): HTMLCanvasElement {
  const [bg, b] = makeCanvas(160, 112);
  b.fillStyle = "#9fe3ff"; b.fillRect(0, 0, 160, 50);
  b.fillStyle = "#c9f0ff"; b.fillRect(0, 36, 160, 14);
  b.fillStyle = "#ffffff";
  [[20, 12, 22], [96, 8, 30], [130, 22, 18]].forEach(([x, y, w]) => { b.fillRect(x, y, w, 5); b.fillRect(x + 4, y - 3, w - 10, 3); });
  if (kind === "street") {
    b.fillStyle = C.teal; b.fillRect(0, 22, 70, 10); b.fillStyle = C.wall; b.fillRect(4, 32, 62, 18);
    b.fillStyle = C.glass; b.fillRect(12, 36, 10, 8); b.fillRect(46, 36, 10, 8);
    b.fillStyle = C.path; b.fillRect(0, 50, 160, 62);
    b.fillStyle = C.pathD; for (let y = 56; y < 112; y += 8) b.fillRect(0, y, 160, 1);
  } else {
    b.fillStyle = C.grass; b.fillRect(0, 50, 160, 62);
    b.fillStyle = C.grassL; for (let i = 0; i < 40; i++) b.fillRect((i * 37) % 160, 54 + ((i * 17) % 56), 2, 1);
    if (kind === "bridge") {
      b.fillStyle = C.water; b.fillRect(0, 44, 160, 8);
      b.fillStyle = C.wood; b.fillRect(40, 44, 80, 8);
      b.fillStyle = C.woodD; for (let x = 40; x < 120; x += 6) b.fillRect(x, 44, 1, 8);
    } else {
      b.fillStyle = C.woodD; b.fillRect(0, 44, 160, 2); b.fillRect(0, 49, 160, 2);
      for (let x = 4; x < 160; x += 14) { b.fillStyle = C.wood; b.fillRect(x, 40, 4, 12); }
    }
  }
  b.fillStyle = "rgba(255,255,255,0.35)"; b.beginPath(); b.ellipse(80, 92, 38, 8, 0, 0, Math.PI * 2); b.fill();
  return bg;
}

export async function runEncounter(id: EnemyId, name: string, avatar: Avatar, party: PartyMemberId[], resume: BgmId | null): Promise<void> {
  const def = ENEMIES[id];
  const commands = def.commands.filter((c) => !c.member || party.includes(c.member));
  const root = document.getElementById("overlay")!;
  const el = document.createElement("div");
  el.className = "battle";
  el.innerHTML = `
    <canvas class="battle-scene pixel" width="160" height="112"></canvas>
    <div class="window battle-status">
      <canvas class="pixel battle-face" width="32" height="32"></canvas>
      <div><p class="battle-name"></p><p class="battle-gauge-label"></p><div class="battle-gauge"><i></i><i></i><i></i></div></div>
    </div>
    <div class="window battle-msg"><p></p></div>
    <div class="window battle-cmds" hidden></div>`;
  root.appendChild(el);
  const fill = (s: string) => s.split("{name}").join(name);
  el.querySelector(".battle-name")!.textContent = `${name}先生${party.length ? `と仲間${party.length}人` : ""}`;
  el.querySelector(".battle-gauge-label")!.textContent = def.gauge;
  const face = el.querySelector<HTMLCanvasElement>(".battle-face")!.getContext("2d")!;
  face.imageSmoothingEnabled = false;
  face.drawImage(portrait(avatar), 0, 0);
  const pips = Array.from(el.querySelectorAll<HTMLElement>(".battle-gauge i"));
  const msg = el.querySelector<HTMLElement>(".battle-msg p")!;
  const cmds = el.querySelector<HTMLElement>(".battle-cmds")!;

  audio.playBgm("battle");

  const sceneCanvas = el.querySelector<HTMLCanvasElement>(".battle-scene")!;
  const g = sceneCanvas.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const bg = scenery(def.scenery);
  let level = 3;
  let clearing = 0;
  let shake = 0;
  let alive = true;
  const team = [avatar, ...party];
  const loop = (t: number) => {
    if (!alive) return;
    g.drawImage(bg, 0, 0);
    const f = Math.floor(t / 180);
    const dx = shake > 0 ? (f % 2 ? 2 : -2) : 0;
    const bob = Math.round(Math.sin(t / 400) * 2);
    g.globalAlpha = Math.max(0, 1 - clearing);
    g.drawImage(enemySprite(id, 48, f, Math.min(3, 3 - level)), 56 + dx, 34 + bob);
    g.globalAlpha = 1;
    if (clearing > 0) {
      g.fillStyle = "#fff6c0";
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t / 600;
        const r = 10 + clearing * 40;
        g.fillRect(Math.round(80 + Math.cos(a) * r), Math.round(58 + Math.sin(a) * r * 0.6), 2, 2);
      }
    }
    team.forEach((m, i) => {
      const x = 80 - team.length * 9 + i * 18;
      g.drawImage(characterSprite(m, "up", 0), x, 84, 16, 24);
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const say = (text: string) => new Promise<void>((resolve) => {
    msg.textContent = fill(text);
    msg.parentElement!.classList.add("is-done");
    const t0 = performance.now();
    const go = () => {
      if (performance.now() - t0 < 250) return;
      pop();
      el.removeEventListener("pointerdown", onTap);
      msg.parentElement!.classList.remove("is-done");
      resolve();
    };
    const onTap = (e: Event) => { if (!(e.target as HTMLElement).closest(".battle-cmds")) go(); };
    el.addEventListener("pointerdown", onTap);
    const pop = input.push({ a: go, b: go });
  });

  const pick = () => new Promise<number>((resolve) => {
    msg.textContent = "どうする？";
    cmds.hidden = false;
    cmds.classList.toggle("is-two", commands.length % 2 === 0);
    cmds.innerHTML = "";
    let cursor = 0;
    const btns = commands.map((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.textContent = c.label;
      b.addEventListener("click", () => done(i));
      b.addEventListener("pointerenter", () => setCur(i));
      cmds.appendChild(b);
      return b;
    });
    const setCur = (i: number) => { cursor = (i + btns.length) % btns.length; btns.forEach((b, k) => b.classList.toggle("is-active", k === cursor)); };
    setCur(0);
    const done = (i: number) => { pop(); audio.sfx("select"); cmds.hidden = true; resolve(i); };
    const pop = input.push({
      repeat: true,
      dir: (d) => { if (d === "up" || d === "left") setCur(cursor - 1); else setCur(cursor + 1); audio.sfx("cursor"); },
      a: () => done(cursor),
    });
  });

  const used = new Set<number>();
  for (const line of def.intro) await say(line);
  let turn = 0;
  while (level > 0) {
    const i = await pick();
    const c = commands[i];
    await say(used.has(i) ? c.again : c.first);
    used.add(i);
    level--;
    shake = 1;
    pips.forEach((p, k) => p.classList.toggle("is-off", k >= level));
    await wait(300);
    shake = 0;
    if (level > 0) await say(def.turns[turn++ % def.turns.length]);
  }
  audio.sfx("clear");
  for (let k = 1; k <= 10; k++) { clearing = k / 10; await wait(60); }
  for (const line of def.clear) await say(line);
  alive = false;
  el.remove();
  audio.playBgm(resume);
}
