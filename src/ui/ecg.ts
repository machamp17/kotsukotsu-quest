// MedicalMiniGame (portable ECG, emergency): safety first, confirm the ambulance,
// place the limb electrodes, record the trace and send the information ahead.
// There is no time limit and no failure: the nurse gives gentle hints instead.
import { audio } from "../engine/audio";
import { makeCanvas } from "../engine/pixel";
import type { Avatar } from "../types";
import { box, drawFaces, MG_H as H, MG_W as W, schematicCorners, SKIN } from "./mgdraw";
import { openMinigame, pickRight } from "./mgkit";

const CLIPS = [
  { name: "赤", color: "#e0574a", spot: 0 },
  { name: "黄", color: "#ffd45a", spot: 1 },
  { name: "緑", color: "#6fbf5a", spot: 3 },
  { name: "黒", color: "#2e2a3a", spot: 2 },
];
// electrode spots on the figure (patient's right is on the viewer's left)
const SPOTS = [
  { label: "右の手首", x: 33, y: 52 },
  { label: "左の手首", x: 95, y: 52 },
  { label: "右の足首", x: 52, y: 88 },
  { label: "左の足首", x: 76, y: 88 },
];

export async function runEcg(name: string, avatar: Avatar): Promise<void> {
  const kit = openMinigame(name);
  const STEPS = 5;

  // 1. vital signs first
  kit.setStep(1, STEPS, "意識・呼吸・バイタルを確認");
  kit.setScene((g) => drawFaces(g, avatar, "tanaka"));
  await pickRight(kit, "田中さんの枕元に着いた。まず何をする？", [
    { label: "声をかけ、意識・呼吸・脈・血圧を確かめる" },
    { label: "すぐに心電図の電極を付ける", hintBy: "nurse", hint: "先生、まずは意識と呼吸、バイタルを一緒に確かめさせてください。" },
    { label: "飲んでいる薬を探しに行く", hintBy: "nurse", hint: "お薬手帳はここにあります。今は状態の確認を先にしましょう。" },
  ], 0);
  await kit.say("player", "田中さん、分かりますか。{name}です。ゆっくり息をしていてくださいね。");
  await kit.say("tanaka", "……先生か。胸が、締めつけられるようで……。");
  await kit.say("nurse", "意識ははっきりしています。呼吸は少し速め、脈は98、血圧は150の90です。");

  // 2. ambulance
  kit.setStep(2, STEPS, "救急要請を確かめる");
  await pickRight(kit, "救急車については？", [
    { label: "看護師さんに、要請の状況を確かめる" },
    { label: "自分でも119番に電話する", hintBy: "nurse", hint: "要請は済んでいます。重ねて電話すると混乱するので、到着までにできることをしましょう。" },
    { label: "救急車を待たずに、車で病院へ運ぶ", hintBy: "nurse", hint: "胸が苦しいときは、自分たちで運ぶより、救急隊を待つほうが安全です。" },
  ], 0);
  await kit.say("nurse", "要請済みです。到着まであと10分ほど。玄関の鍵も開けてあります。");
  await kit.say("player", "ありがとうございます。その間に心電図をとりましょう。");

  // 3. electrodes
  kit.setStep(3, STEPS, "電極を正しい位置へ");
  const placed: (string | null)[] = [null, null, null, null];
  kit.setScene((g, t) => drawBody(g, placed, t));
  await kit.say("", "手足に付けるクリップは4色。どこに付けるか、1つずつ選ぼう。");
  for (const clip of CLIPS) {
    for (;;) {
      const i = await kit.choose(`${clip.name}のクリップはどこへ？`, SPOTS.map((s, k) => ({ label: s.label, disabled: placed[k] !== null })));
      if (i === clip.spot) { placed[i] = clip.color; audio.sfx("cursor"); break; }
      await kit.say("nurse", "右の手首から、あか・き・みどり・くろ、の順に時計回りです。赤が右手、黄が左手、緑が左足、黒が右足ですね。");
    }
  }
  await kit.say("nurse", "胸の電極も付けました。田中さん、少しだけじっとしていてくださいね。");

  // 4. record
  kit.setStep(4, STEPS, "波形を記録する");
  const t0 = performance.now();
  const stable = () => performance.now() - t0 > 2200;
  kit.setScene((g, t) => drawMonitor(g, t, t0, stable()));
  await kit.operate({
    button: "記録する",
    hint: () => (stable() ? "波形が安定した。Aボタンで記録しよう。" : "波形が安定するまで、少し待とう……"),
    onConfirm: stable,
    failText: "まだ波形がゆれている。落ち着くのを待とう。",
  });
  audio.sfx("beep");
  await kit.say("", "記録した。いつもの田中さんの記録と比べて、気になる変化がある。（ゲーム用の模式表示です）");
  await kit.say("nurse", "先週の記録では、この変化はありませんでした。");

  // 5. hand over
  kit.setStep(5, STEPS, "病院へ情報を送る");
  await pickRight(kit, "受け入れ先の病院へ、どう伝える？", [
    { label: "心電図・バイタル・始まった時刻・普段の様子をまとめて送る" },
    { label: "心電図だけを送る", hintBy: "nurse", hint: "いつから苦しいのか、普段はどうなのかも、病院にとって大事な情報です。" },
    { label: "救急隊が着いてから考える", hintBy: "nurse", hint: "今のうちに送っておくと、病院が受け入れの準備をできます。" },
  ], 0);
  await kit.say("player", "病院へ、心電図と経過をまとめて送りました。受け入れの準備をしてもらえます。");
  await kit.say("nurse", "お薬手帳の写しも、救急隊の方に渡せるように用意しました。");
  kit.close();
}

function drawBody(g: CanvasRenderingContext2D, placed: (string | null)[], t: number): void {
  g.fillStyle = "#eef7f6"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#dcefec"; for (let y = 0; y < H; y += 8) g.fillRect(0, y, W, 1);
  const cx = 64;
  box(g, cx - 8, 4, 16, 14, SKIN); g.fillStyle = "#bcb6b8"; g.fillRect(cx - 8, 4, 16, 4);
  box(g, cx - 16, 20, 32, 34, "#7fa6c9");
  box(g, cx - 26, 22, 8, 26, "#5f84a8"); box(g, cx + 18, 22, 8, 26, "#5f84a8");
  box(g, cx - 26, 48, 8, 8, SKIN); box(g, cx + 18, 48, 8, 8, SKIN);
  box(g, cx - 14, 55, 12, 28, "#6a6a7a"); box(g, cx + 2, 55, 12, 28, "#6a6a7a");
  box(g, cx - 14, 83, 12, 8, SKIN); box(g, cx + 2, 83, 12, 8, SKIN);
  // chest electrodes
  g.fillStyle = "#ffffff"; [[58, 30], [64, 32], [70, 34]].forEach(([x, y]) => g.fillRect(x, y, 3, 3));
  const blink = Math.floor(t / 300) % 2 === 0;
  SPOTS.forEach((s, i) => {
    const c = placed[i];
    if (c) { box(g, s.x - 3, s.y - 2, 6, 4, c); }
    else if (blink) { g.strokeStyle = "#e0a020"; g.lineWidth = 1; g.strokeRect(s.x - 4.5, s.y - 3.5, 9, 7); }
  });
  g.fillStyle = "#1a7f79";
  g.fillRect(2, 2, 22, 7); g.fillStyle = "#ffffff"; g.fillRect(4, 4, 4, 3); g.fillRect(10, 4, 12, 3);
}

function drawMonitor(g: CanvasRenderingContext2D, t: number, t0: number, stable: boolean): void {
  const [c, x] = makeCanvas(W, H);
  x.fillStyle = "#0e2a2c"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#16403f";
  for (let i = 0; i < W; i += 8) x.fillRect(i, 0, 1, H);
  for (let j = 0; j < H; j += 8) x.fillRect(0, j, W, 1);
  const beat = 44;
  const scroll = Math.floor((t - t0) / 25);
  const noise = stable ? 0 : Math.max(0, 1 - (t - t0) / 2200);
  x.fillStyle = "#7fffb0";
  let prev = 48;
  for (let i = 0; i < W; i++) {
    const k = (i + scroll) % beat;
    let y = 48;
    if (k === 10) y = 44; if (k === 11) y = 44;               // P wave
    if (k === 16) y = 52; if (k === 17) y = 22; if (k === 18) y = 58; // QRS
    if (k >= 20 && k <= 26) y = 42;                           // raised segment (schematic change)
    if (k >= 27 && k <= 31) y = 40;                           // T wave
    y += Math.round(Math.sin((i + scroll) * 1.7) * 4 * noise);
    const a = Math.min(prev, y), b = Math.max(prev, y);
    x.fillRect(i, a, 1, b - a + 1);
    prev = y;
  }
  // the heart-rate lamp
  x.fillStyle = Math.floor((t - t0) / 600) % 2 ? "#e0574a" : "#7a2a2a";
  x.fillRect(116, 6, 6, 6);
  schematicCorners(x);
  g.drawImage(c, 0, 0);
}
