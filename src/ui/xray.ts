// MedicalMiniGame (portable X-ray): locate the pain, take the history, align the
// X-ray, call for safety, take the image and talk through what it means.
// Deliberately simplified: the image is a schematic and no diagnosis is declared.
import { audio } from "../engine/audio";
import { makeCanvas } from "../engine/pixel";
import { C } from "../engine/tiles";
import type { Avatar } from "../types";
import { wait } from "./effects";
import { box, drawFaces, drawLyingPatient, MG_H as H, MG_W as W, schematicCorners, SKIN } from "./mgdraw";
import { interview, openMinigame, pickRight } from "./mgkit";

export async function runXray(name: string, avatar: Avatar): Promise<void> {
  const kit = openMinigame(name);
  const STEPS = 5;

  // 1. pain location
  kit.setStep(1, STEPS, "痛む場所を確認する");
  let marked: number | null = null;
  const REGIONS = [
    { label: "肩・背中", y: 24, h: 12 },
    { label: "腰", y: 38, h: 10 },
    { label: "太もも・ひざ", y: 52, h: 18 },
  ];
  kit.setScene((g, t) => drawBackView(g, marked, t, REGIONS));
  await kit.say("ume", "痛いのはね……腰の、少し右のあたりかねえ。");
  for (;;) {
    const i = await kit.choose("ウメさんが痛いと言う場所を、そっと確かめよう。", REGIONS.map((r) => ({ label: r.label })));
    marked = i;
    if (i === 1) break;
    await kit.say("ume", "そこは大丈夫なのよ。もう少し下の、腰のところ。");
  }
  await kit.say("player", "ここですね。押すと痛みますか？　足のしびれはどうでしょう。");
  await kit.say("ume", "押すと、ずきっとするねえ。足はしびれていないよ。");

  // 2. history
  kit.setStep(2, STEPS, "転んだときのことを聞く");
  kit.setScene((g) => drawFaces(g, avatar, "ume"));
  await interview(kit, "ume", [
    { label: "いつ、どこで転びましたか", answer: "昨日の夕方、台所で振り向いたときに、しりもちをついたの。" },
    { label: "頭は打っていませんか", answer: "頭は打っていないよ。気分が悪いこともないねえ。" },
    { label: "今、どのくらい動けますか", answer: "寝返りが一番痛くて。トイレには、つかまりながら何とか行けるよ。" },
  ], { min: 2, required: 1, reminder: { id: "careManager", text: "先生、頭を打っていないかも、確かめておきませんか？" } });
  await kit.say("player", "ありがとうございます。骨の状態を確かめるために、ここで撮影しましょう。");

  // 3. positioning
  kit.setStep(3, STEPS, "レントゲンの位置を合わせる");
  const target = { x: 74, y: 50 };
  const aim = { x: 34, y: 30 };
  const dist = () => Math.hypot(aim.x - target.x, aim.y - target.y);
  kit.setScene((g, t) => { drawLyingPatient(g, "ume"); drawPanel(g); drawXrayHead(g, t, aim, dist() <= 4); });
  await kit.say("", "撮影パネルを腰の下に入れた。照射口を動かして、光の十字を腰の中心に合わせよう。");
  await kit.operate({
    button: "この位置で決定",
    hint: () => (dist() <= 4 ? "ぴったり合った。Aボタンで決定。" : dist() < 14 ? "もう少し。十字キーで細かく合わせよう。" : "十字キー、または画面をタップして照射口を動かそう。"),
    onDir: (d) => {
      if (d === "up") aim.y = Math.max(8, aim.y - 2);
      if (d === "down") aim.y = Math.min(H - 8, aim.y + 2);
      if (d === "left") aim.x = Math.max(8, aim.x - 2);
      if (d === "right") aim.x = Math.min(W - 8, aim.x + 2);
    },
    onTap: (x, y) => {
      aim.x = x; aim.y = y;
      // a tap close to the target snaps into place so small screens stay easy
      if (dist() < 7) { aim.x = target.x; aim.y = target.y; }
    },
    onConfirm: () => dist() <= 4,
    failText: "まだ少しずれている。腰の中心、パネルの真ん中に合わせよう。",
  });

  // 4. safety & shot
  kit.setStep(4, STEPS, "撮影する");
  await pickRight(kit, "撮影の前に、どうする？", [
    { label: "「周りの方は少し離れてください」と声をかける" },
    { label: "すぐに撮影する", hint: "撮影の前に、そばにいる人に声をかけて、少し離れてもらおう。" },
  ], 0);
  await kit.say("player", "南さん、撮影するので少し離れていてください。ウメさん、少しだけ動かずにいてくださいね。");
  await kit.say("careManager", "はい、廊下のほうへ下がりますね。");
  await kit.choose("準備ができた。", [{ label: "撮影する" }]);
  audio.sfx("shutter");
  let flash = 1;
  kit.setScene((g, t) => {
    drawLyingPatient(g, "ume"); drawPanel(g); drawXrayHead(g, t, aim, true);
    if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash})`; g.fillRect(0, 0, W, H); }
  });
  for (let k = 0; k < 8; k++) { flash = 1 - k / 8; await wait(40); }
  kit.setScene((g) => drawXrayImage(g));
  await kit.say("", "画像が映し出された。（ゲーム用の模式図です）");

  // 5. explain
  kit.setStep(5, STEPS, "結果を一緒に考える");
  await pickRight(kit, "画像と診察の結果を、ウメさんにどう伝えよう？", [
    { label: "「骨は大丈夫です。もう心配いりません」", hint: "（画像だけで言い切らず、痛みの経過と合わせて考えることを伝えよう）" },
    { label: "画像を一緒に見ながら、分かったことと今後の見方を伝える" },
    { label: "「念のため、すぐに入院しましょう」", hint: "（今のところ、急いで病院へ向かう必要がある様子は見当たらない。まず分かったことを共有しよう）" },
  ], 1);
  await kit.say("player", "この画像では、はっきりした大きなずれは見当たりません。");
  await kit.say("player", "ただ、画像だけでは分からないこともあります。痛みが強くなったり、動けない日が続くときは、追加の検査も考えましょう。");
  await kit.say("player", "しばらくは痛みを和らげる工夫をして、無理のない動き方を一緒に見つけていきましょう。");
  await kit.say("careManager", "ベッドの高さや手すりのこと、私も一緒に考えます。");
  kit.close();
}

// ---------------------------------------------------------------- drawing

function drawBackView(g: CanvasRenderingContext2D, marked: number | null, t: number, regions: { y: number; h: number }[]): void {
  g.fillStyle = "#e6f6f3"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#d3ede8"; for (let x = 0; x < W; x += 8) g.fillRect(x, 0, 1, H);
  const cx = 64;
  box(g, cx - 7, 6, 14, 14, "#dcd8dc"); g.fillStyle = "#a9a2aa"; g.fillRect(cx - 3, 4, 6, 3);
  box(g, cx - 13, 21, 26, 26, "#b9a3d9");
  box(g, cx - 18, 23, 5, 20, "#9580bb"); box(g, cx + 13, 23, 5, 20, "#9580bb");
  box(g, cx - 18, 43, 5, 4, SKIN); box(g, cx + 13, 43, 5, 4, SKIN);
  box(g, cx - 12, 47, 11, 30, "#8a7aa0"); box(g, cx + 1, 47, 11, 30, "#8a7aa0");
  box(g, cx - 12, 77, 11, 6, SKIN); box(g, cx + 1, 77, 11, 6, SKIN);
  box(g, cx - 13, 83, 12, 4, "#6a4a3a"); box(g, cx + 1, 83, 12, 4, "#6a4a3a");
  if (marked !== null) {
    const r = regions[marked];
    const on = Math.floor(t / 300) % 2 === 0;
    g.strokeStyle = marked === 1 ? C.red : "#f2a13a";
    g.lineWidth = 2;
    g.strokeRect(cx - 20, r.y, 40, r.h);
    if (marked === 1 && on) { g.fillStyle = "rgba(224,87,74,0.35)"; g.fillRect(cx, r.y + 2, 12, r.h - 4); }
  }
}

function drawPanel(g: CanvasRenderingContext2D): void {
  // detector panel peeking out from under the lower back
  g.fillStyle = "#6a7a86"; g.fillRect(62, 34, 24, 4); g.fillRect(62, 62, 24, 4);
}

function drawXrayHead(g: CanvasRenderingContext2D, t: number, aim: { x: number; y: number }, ok: boolean): void {
  const ax = Math.round(aim.x), ay = Math.round(aim.y);
  g.fillStyle = "#6a7a86"; g.fillRect(ax - 1, 0, 3, Math.max(0, ay - 10));
  box(g, ax - 6, ay - 13, 12, 6, "#c9d6da");
  const pulse = Math.floor(t / 250) % 2;
  g.strokeStyle = ok ? "#1a7f79" : "#e0a020";
  g.lineWidth = 1;
  g.strokeRect(ax - 9.5, ay - 7.5, 19, 15);
  g.fillStyle = ok ? "rgba(43,179,168,0.28)" : "rgba(255,226,122,0.35)";
  g.fillRect(ax - 9, ay - 7, 18, 14);
  g.fillStyle = ok ? "#1a7f79" : pulse ? "#e0574a" : "#e0a020";
  g.fillRect(ax - 6, ay, 13, 1);
  g.fillRect(ax, ay - 5, 1, 11);
}

function drawXrayImage(g: CanvasRenderingContext2D): void {
  const [c, x] = makeCanvas(W, H);
  x.fillStyle = "#10262a"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#1b3a3f"; x.fillRect(36, 0, 56, H);
  for (let i = 0; i < 5; i++) {
    const y = 6 + i * 14;
    x.fillStyle = "#cfe3e0"; x.fillRect(54, y, 20, 10);
    x.fillStyle = "#a9c6c2"; x.fillRect(54, y + 8, 20, 2); x.fillRect(46, y + 3, 8, 3); x.fillRect(74, y + 3, 8, 3);
    x.fillStyle = "#5f8a86"; x.fillRect(56, y + 10, 16, 4);
  }
  x.fillStyle = "#b7d2ce";
  x.fillRect(24, 76, 30, 6); x.fillRect(74, 76, 30, 6); x.fillRect(20, 70, 10, 8); x.fillRect(98, 70, 10, 8);
  x.fillRect(56, 76, 16, 14);
  schematicCorners(x);
  g.drawImage(c, 0, 0);
}
