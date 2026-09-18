// MedicalMiniGame (portable ultrasound): hear the story, move the probe, hold the
// angle until the image is clear, record it, then decide the next step as a team.
import { audio } from "../engine/audio";
import { hash2, makeCanvas, OUTLINE } from "../engine/pixel";
import type { Avatar } from "../types";
import { box, drawFaces, drawLyingPatient, MG_H as H, MG_W as W, schematicCorners } from "./mgdraw";
import { interview, openMinigame, pickRight } from "./mgkit";

export async function runEcho(name: string, avatar: Avatar): Promise<void> {
  const kit = openMinigame(name);
  const STEPS = 5;

  // 1. story
  kit.setStep(1, STEPS, "症状と経過を聞く");
  kit.setScene((g) => drawFaces(g, avatar, "kimura"));
  await interview(kit, "kimura", [
    { label: "いつから苦しいですか", answer: "昨日の夜からだね。だんだん張ってきて……。" },
    { label: "おしっこは出ていますか", answer: "出そうで出ないんだ。トイレに何度も行くんだけどね。" },
    { label: "痛みは強いですか", answer: "張って苦しいけど、刺すような痛みではないよ。" },
  ], { min: 2 });
  await kit.say("liaison", "病院の記録では、入院中に一時期、尿の管を使っていたそうです。");
  await kit.say("player", "ありがとうございます。お腹の中の様子を、エコーで見てみましょう。");

  // 2. probe position
  kit.setStep(2, STEPS, "プローブを当てる");
  const target = { x: 72, y: 50 };
  const probe = { x: 44, y: 34 };
  const dist = () => Math.hypot(probe.x - target.x, probe.y - target.y);
  kit.setScene((g, t) => {
    drawLyingPatient(g, "kimura", false);
    drawProbe(g, probe);
    drawInset(g, t, Math.min(1, dist() / 30));
  });
  await kit.say("", "ゼリーを付けたプローブを、下腹部へ。右上の画面が、はっきり映る場所を探そう。");
  await kit.operate({
    button: "ここで見る",
    hint: () => (dist() <= 4 ? "画面に何か映ってきた。Aボタンで決定。" : dist() < 14 ? "もう少し。画面のざらざらが減ってきた。" : "十字キー、または画面をタップしてプローブを動かそう。"),
    onDir: (d) => {
      if (d === "up") probe.y = Math.max(28, probe.y - 2);
      if (d === "down") probe.y = Math.min(72, probe.y + 2);
      if (d === "left") probe.x = Math.max(36, probe.x - 2);
      if (d === "right") probe.x = Math.min(110, probe.x + 2);
    },
    onTap: (x, y) => {
      probe.x = x; probe.y = y;
      if (dist() < 7) { probe.x = target.x; probe.y = target.y; }
    },
    onConfirm: () => dist() <= 4,
    failText: "まだ映りがはっきりしない。下腹部の真ん中を探そう。",
  });

  // 3. hold the angle
  kit.setStep(3, STEPS, "見える角度で保つ");
  let angle = 3;
  kit.setScene((g, t) => drawSector(g, t, Math.abs(angle) / 4, angle));
  await kit.say("", "左右でプローブの傾きを変えて、黒い袋の形がくっきり見える角度を探そう。");
  await kit.operate({
    button: "この角度で保つ",
    hint: () => (angle === 0 ? "くっきり映った！　Aボタンで決定。" : `傾き：${angle > 0 ? "右" : "左"}に${Math.abs(angle)}　（十字キーの左右で調整）`),
    onDir: (d) => {
      if (d === "left") angle = Math.max(-4, angle - 1);
      if (d === "right") angle = Math.min(4, angle + 1);
      audio.sfx("cursor");
    },
    onTap: (x) => { angle = Math.max(-4, Math.min(4, angle + (x < W / 2 ? -1 : 1))); },
    onConfirm: () => angle === 0,
    failText: "まだ少しぼやけている。傾きを0にしよう。",
  });

  // 4. record
  kit.setStep(4, STEPS, "必要な情報を記録する");
  await pickRight(kit, "この画像をどうする？", [
    { label: "膀胱の大きさを測って、記録する" },
    { label: "見ただけで終える", hintBy: "nurse", hint: "数字で残しておくと、処置の後や、病院の記録と比べられます。" },
  ], 0);
  audio.sfx("shutter");
  kit.setScene((g, t) => drawSector(g, t, 0, 0, true));
  await kit.say("", "膀胱に、尿がたくさんたまっているようだ。（ゲーム用の模式表示です）");

  // 5. team decision
  kit.setStep(5, STEPS, "チームで考える");
  await pickRight(kit, "この後、どうする？", [
    { label: "すぐに病院へ運ぶ", hintBy: "liaison", hint: "まず、ここでできることがないか、みんなで考えてみませんか。" },
    { label: "何もせず、様子を見る", hintBy: "kimuraDaughter", hint: "父は、こんなに苦しそうなのに……。" },
    { label: "チームで相談して、必要な処置と病院への連絡を決める" },
  ], 2);
  await kit.say("nurse", "尿を出す処置は、ご自宅でも行える場合があります。準備できます。");
  await kit.say("pharmacist", "お薬の中に、尿が出にくくなるものがないかも確かめますね。");
  await kit.say("careManager", "水分のとり方や、トイレまでの動き方も、一緒に見直しましょう。");
  await kit.say("liaison", "処置の結果は、退院した病院にも共有しておきます。");
  await kit.say("player", "では、まず処置をして楽になってもらいましょう。そのうえで、病院とも相談します。");
  await kit.say("", "処置が終わり、木村さんの表情がやわらいだ。");
  kit.close();
}

function drawProbe(g: CanvasRenderingContext2D, p: { x: number; y: number }): void {
  const x = Math.round(p.x), y = Math.round(p.y);
  g.fillStyle = "#6a7a86"; g.fillRect(x + 3, y - 18, 2, 12);
  box(g, x - 3, y - 7, 8, 7, "#2bb3a8");
  g.fillStyle = "#c9f0ff"; g.fillRect(x - 3, y, 8, 2);
}

function speckle(x: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number, noise: number, t: number): void {
  const f = Math.floor(t / 120);
  for (let j = 0; j < h; j += 2) for (let i = 0; i < w; i += 2) {
    const v = hash2(i + f * 3, j + f, 7);
    if (v < 0.25 + noise * 0.5) { x.fillStyle = v < 0.1 ? "#9aa3ad" : "#5a6470"; x.fillRect(ox + i, oy + j, 2, 2); }
  }
}

function drawInset(g: CanvasRenderingContext2D, t: number, noise: number): void {
  g.fillStyle = OUTLINE; g.fillRect(83, 1, 44, 24);
  g.fillStyle = "#101418"; g.fillRect(84, 2, 42, 22);
  speckle(g, 84, 2, 42, 22, noise, t);
  if (noise < 0.6) {
    g.fillStyle = `rgba(8,10,14,${1 - noise})`;
    g.beginPath(); g.ellipse(105, 13, 12, 7, 0, 0, Math.PI * 2); g.fill();
  }
}

function drawSector(g: CanvasRenderingContext2D, t: number, blur: number, angle: number, measured = false): void {
  const [c, x] = makeCanvas(W, H);
  x.fillStyle = "#07090c"; x.fillRect(0, 0, W, H);
  x.save();
  x.beginPath(); x.moveTo(64, 4); x.lineTo(118, 90); x.lineTo(10, 90); x.closePath(); x.clip();
  x.fillStyle = "#1a2026"; x.fillRect(0, 0, W, H);
  speckle(x, 0, 0, W, H, 0.2 + blur * 0.5, t);
  const shift = angle * 5;
  const alpha = Math.max(0.15, 1 - blur);
  x.fillStyle = `rgba(4,6,8,${alpha})`;
  x.beginPath(); x.ellipse(64 + shift, 58, 30 - blur * 10, 18 - blur * 6, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = `rgba(200,210,220,${alpha * 0.8})`;
  x.fillRect(64 + shift - 30, 58 + 18, 60, 2);
  x.restore();
  if (measured) {
    x.fillStyle = "#ffd45a";
    x.fillRect(34, 58, 60, 1); x.fillRect(34, 55, 1, 7); x.fillRect(93, 55, 1, 7);
    x.fillRect(64, 40, 1, 36); x.fillRect(61, 40, 7, 1); x.fillRect(61, 75, 7, 1);
  }
  schematicCorners(x);
  g.drawImage(c, 0, 0);
}
