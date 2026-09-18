// BossBattle: 孤立の魔王コリツ. There is no HP. The doctor alone cannot move the walls;
// the four partners' abilities, in the right order, untie the four walls of isolation,
// and then the combined art "つながる医療" turns the dark squares into light.
import { NAMES, PARTY_INFO } from "../data/characters";
import { audio } from "../engine/audio";
import { koritsuSprite } from "../engine/enemies";
import { input } from "../engine/input";
import { makeCanvas } from "../engine/pixel";
import { characterSprite } from "../engine/sprites";
import { C } from "../engine/tiles";
import type { Avatar, PartyMemberId } from "../types";
import { wait } from "./effects";

const ORDER: PartyMemberId[] = ["careManager", "nurse", "pharmacist", "liaison"];

const SUCCESS: Record<PartyMemberId, string> = {
  careManager: "ご本人が何に困り、何を望んでいるかを、言葉にした。1枚目の壁がほどけた。",
  nurse: "日々の小さな変化が、チームへ届いた。2枚目の壁がほどけた。",
  pharmacist: "治療が、暮らしの中で続けられる形になった。3枚目の壁がほどけた。",
  liaison: "病院、在宅、家族、地域の情報が結ばれた。4枚目の壁がほどけた。",
};

const HINT: Record<PartyMemberId, string> = {
  careManager: "まずは、その人が何に困り、何を望んでいるか。そこから始めましょう。",
  nurse: "望みが分かったら、日々の小さな変化を見逃さずに届けることです。",
  pharmacist: "治療を、暮らしの中で続けられる形にしないと。",
  liaison: "最後に、病院と在宅と家族の情報を、一本につなぎましょう。",
};

const KORITSU_REACT = [
  "……なぜ、そこまでして声をかける。",
  "届くはずがない。みんな、遠慮して黙ってしまうのだから……。",
  "……ばらばらの情報が、つながっていく……？",
  "壁が……もう、ない……。",
];

export async function runBoss(name: string, avatar: Avatar): Promise<void> {
  const root = document.getElementById("overlay")!;
  const el = document.createElement("div");
  el.className = "battle is-boss";
  el.innerHTML = `
    <canvas class="battle-scene pixel" width="160" height="120"></canvas>
    <div class="window battle-status">
      <div><p class="battle-name">孤立の魔王コリツ</p><p class="battle-gauge-label">孤立の壁</p><div class="battle-gauge"><i></i><i></i><i></i><i></i></div></div>
    </div>
    <div class="window battle-msg"><p class="battle-speaker"></p><p class="battle-text"></p></div>
    <div class="window battle-cmds is-two" hidden></div>`;
  root.appendChild(el);
  const fill = (s: string) => s.split("{name}").join(name);
  const pips = Array.from(el.querySelectorAll<HTMLElement>(".battle-gauge i"));
  const speakerEl = el.querySelector<HTMLElement>(".battle-speaker")!;
  const msg = el.querySelector<HTMLElement>(".battle-text")!;
  const msgBox = el.querySelector<HTMLElement>(".battle-msg")!;
  const cmds = el.querySelector<HTMLElement>(".battle-cmds")!;

  audio.playBgm("boss");

  const canvas = el.querySelector<HTMLCanvasElement>(".battle-scene")!;
  const g = canvas.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const [bg, b] = makeCanvas(160, 120);
  b.fillStyle = "#7fb4d8"; b.fillRect(0, 0, 160, 60);
  b.fillStyle = "#a6cce4"; b.fillRect(0, 44, 160, 16);
  b.fillStyle = C.path; b.fillRect(0, 60, 160, 60);
  b.fillStyle = C.pathD; for (let y = 66; y < 120; y += 8) b.fillRect(0, y, 160, 1);
  // houses of the town on the horizon
  [[6, "#2bb3a8"], [40, "#e07a4f"], [100, "#6fbf5a"], [132, "#4f7fd0"]].forEach(([x, col]) => {
    b.fillStyle = col as string; b.fillRect(x as number, 38, 24, 8);
    b.fillStyle = C.wall; b.fillRect((x as number) + 2, 46, 20, 14);
    b.fillStyle = C.glass; b.fillRect((x as number) + 8, 50, 6, 5);
  });

  let open = 0;          // walls untied
  let light = 0;         // 0..1 in the finale
  let ring = 0;          // 0..1 ring of light
  let links = 0;         // 0..1 lines between houses
  let alive = true;
  const team: (Avatar | PartyMemberId)[] = [avatar, ...ORDER];
  const loop = (t: number) => {
    if (!alive) return;
    g.drawImage(bg, 0, 0);
    // dimming veil that lifts as the walls untie
    g.fillStyle = `rgba(40,30,80,${0.35 * (1 - open / 4) * (1 - light)})`;
    g.fillRect(0, 0, 160, 120);
    if (links > 0) {
      g.strokeStyle = `rgba(255,236,150,${links})`;
      g.lineWidth = 1;
      const pts = [[18, 50], [52, 50], [112, 50], [144, 50], [30, 108], [130, 108]];
      pts.forEach(([x1, y1], i) => pts.slice(i + 1).forEach(([x2, y2]) => { g.beginPath(); g.moveTo(x1 + 0.5, y1 + 0.5); g.lineTo(x2 + 0.5, y2 + 0.5); g.stroke(); }));
    }
    const f = Math.floor(t / 200);
    const bob = Math.round(Math.sin(t / 500) * 2);
    g.globalAlpha = Math.max(0, 1 - Math.max(0, light - 0.6) * 2.5);
    g.drawImage(koritsuSprite(80, f, open, light), 40, 2 + bob);
    g.globalAlpha = 1;
    if (ring > 0) {
      const cols = ["#ffffff", "#f59bb0", "#9fdcf2", "#7bc86c", "#4f7fd0"];
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2 + t / 700;
        g.fillStyle = cols[i % 5];
        g.fillRect(Math.round(80 + Math.cos(a) * 44 * ring), Math.round(46 + Math.sin(a) * 30 * ring), 3, 3);
      }
    }
    team.forEach((m, i) => g.drawImage(characterSprite(m, "up", 0), 80 - team.length * 9 + i * 18, 92, 16, 24));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const who = (id: string) => (id === "player" ? `${name}先生` : id === "koritsu" ? "孤立の魔王コリツ" : id ? NAMES[id as keyof typeof NAMES] : "");
  const say = (id: string, text: string) => new Promise<void>((resolve) => {
    speakerEl.textContent = who(id);
    speakerEl.hidden = !id;
    msg.textContent = fill(text);
    msgBox.classList.add("is-done");
    const t0 = performance.now();
    const go = () => {
      if (performance.now() - t0 < 250) return;
      pop();
      el.removeEventListener("pointerdown", onTap);
      msgBox.classList.remove("is-done");
      resolve();
    };
    const onTap = (e: Event) => { if (!(e.target as HTMLElement).closest(".battle-cmds")) go(); };
    el.addEventListener("pointerdown", onTap);
    const pop = input.push({ a: go, b: go });
  });

  const pick = (labels: string[]) => new Promise<number>((resolve) => {
    speakerEl.hidden = true;
    msg.textContent = "どうする？";
    cmds.hidden = false;
    cmds.innerHTML = "";
    let cursor = 0;
    const btns = labels.map((l, i) => {
      const bt = document.createElement("button");
      bt.type = "button";
      bt.className = "choice";
      bt.textContent = l;
      bt.addEventListener("click", () => done(i));
      bt.addEventListener("pointerenter", () => setCur(i));
      cmds.appendChild(bt);
      return bt;
    });
    const setCur = (i: number) => { cursor = (i + btns.length) % btns.length; btns.forEach((x, k) => x.classList.toggle("is-active", k === cursor)); };
    setCur(0);
    const done = (i: number) => { pop(); audio.sfx("select"); cmds.hidden = true; resolve(i); };
    const pop = input.push({
      repeat: true,
      dir: (d) => {
        const cols = 2;
        if (d === "left") setCur(cursor - 1);
        if (d === "right") setCur(cursor + 1);
        if (d === "up") setCur(cursor - cols);
        if (d === "down") setCur(cursor + cols);
        audio.sfx("cursor");
      },
      a: () => done(cursor),
    });
  });

  await say("", "広場の真ん中に、崩れかけた影の王が立っている。");
  await say("", "孤立の魔王コリツは、攻撃してこない。ただ、厚い壁の向こうから、静かにこちらを見ている。");
  await say("koritsu", "……また、ひとりで来たのか。");

  // the doctor alone
  await pick(["診察する"]);
  await say("", "{name}先生は、コリツを診察した。……しかし、孤立の壁はびくともしない。");
  await say("koritsu", "症状を診ても、その人の孤独までは消せない。");
  await say("player", "その通りかもしれない。だから、私は一人で来たんじゃない。");
  audio.sfx("item");
  await say("", "仲間たちが、{name}先生の隣に並んだ！");

  // the four abilities, in order
  const labels = ORDER.map((m) => PARTY_INFO[m].ability);
  while (open < 4) {
    const i = await pick([...labels, "診察する"]);
    if (i === 4) {
      await say("", "{name}先生は、もう一度診察した。……壁は動かない。仲間の力を借りよう。");
      continue;
    }
    const member = ORDER[i];
    const expected = ORDER[open];
    if (member !== expected) {
      await say(member, `（「${PARTY_INFO[member].ability}」を使おうとしたが、壁は動かない）`);
      await say(expected, HINT[expected]);
      continue;
    }
    audio.sfx("clear");
    await say("", `${PARTY_INFO[member].name}の「${PARTY_INFO[member].ability}」！`);
    open++;
    pips.forEach((p, k) => p.classList.toggle("is-off", k < open));
    await say("", SUCCESS[member]);
    await say("koritsu", KORITSU_REACT[open - 1]);
  }

  // the combined art
  await say("", "4つの力がそろった。みんなの想いが、ひとつにつながっていく……！");
  await pick(["連携奥義「つながる医療」"]);
  audio.playBgm("ending");
  await say("", "連携奥義「つながる医療」！");
  for (let k = 1; k <= 12; k++) { ring = k / 12; await wait(60); }
  await say("", "全員の光が輪になり、孤立の壁を、攻撃するのではなく、ほどいていく。");
  for (let k = 1; k <= 12; k++) { light = k / 20; links = k / 12; await wait(80); }
  await say("", "暗い粒が光に変わり、町の人と人を結ぶ線になっていく。");
  await say("koritsu", "声が届けば……私は、ここにはいられない……。");
  await say("player", "一人にしない。困ったときに、声が届く町にしよう。");
  for (let k = 11; k <= 20; k++) { light = k / 20; await wait(80); }
  await say("", "孤立の魔王コリツは、光の中へ、静かにほどけていった。");
  alive = false;
  el.remove();
}
