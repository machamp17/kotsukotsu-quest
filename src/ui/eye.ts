// MedicalMiniGame (eye exam at home): hear how things look, check the front of the eye,
// photograph the fundus, measure the pressure, then decide to connect to an eye specialist.
// Results are schematic; the player never picks "normal / abnormal".
import { audio } from "../engine/audio";
import { makeCanvas, OUTLINE } from "../engine/pixel";
import type { Avatar } from "../types";
import { wait } from "./effects";
import { drawFaces, MG_H as H, MG_W as W, schematicCorners } from "./mgdraw";
import { interview, openMinigame, pickRight } from "./mgkit";

export async function runEye(name: string, avatar: Avatar): Promise<void> {
  const kit = openMinigame(name);
  const STEPS = 5;

  // 1. how does it look?
  kit.setStep(1, STEPS, "見え方を聞く");
  kit.setScene((g) => drawFaces(g, avatar, "haru"));
  await interview(kit, "haru", [
    { label: "どんなふうに見えにくいですか", answer: "全体がかすむのよ。晴れた日の外は、まぶしくてねえ。" },
    { label: "片目ずつだと、どうですか", answer: "右目のほうが、見えにくい気がするねえ。" },
    { label: "見えない場所はありますか", answer: "端のほうが、ときどき欠けて見える気がするの。" },
  ], { min: 2 });
  await kit.say("player", "ありがとうございます。目の前の部分、奥の部分、目の圧を、順番に確かめますね。");

  // 2. anterior segment: catch the moment the image is sharp
  kit.setStep(2, STEPS, "前眼部を確認する");
  const period = 2600;
  const t0 = performance.now();
  let misses = 0;
  const blurAt = (t: number) => Math.abs(Math.sin(((t - t0) / period) * Math.PI)); // 0 = sharp
  kit.setScene((g, t) => drawAnterior(g, blurAt(t)));
  await kit.say("", "細い光で、目の表面と水晶体を見る。ピントがくっきり合った瞬間に記録しよう。");
  await kit.operate({
    button: "記録する",
    hint: () => (blurAt(performance.now()) < 0.3 ? "くっきり見えている！　今だ。" : "ピントが合うのを待とう……"),
    // nobody gets stuck: after a few misses the image is kept anyway
    onConfirm: () => blurAt(performance.now()) < 0.35 || ++misses >= 3,
    failText: "少しぼやけていた。くっきりした瞬間にもう一度。",
  });
  audio.sfx("shutter");
  kit.setScene((g) => drawAnterior(g, 0));
  await kit.say("", "水晶体に、うっすらとにごりがあるようだ。（ゲーム用の模式表示です）");

  // 3. fundus photo
  kit.setStep(3, STEPS, "眼底を撮影する");
  kit.setScene((g) => drawCamera(g));
  await pickRight(kit, "撮影の前に、ハルさんに何と伝える？", [
    { label: "「この緑の光を、ゆっくり見ていてくださいね」" },
    { label: "「絶対に動かないでください！」", hintBy: "pharmacist", hint: "先生、強く言うと緊張させてしまうかもしれません。見る場所を教えてあげましょう。" },
  ], 0);
  await kit.say("haru", "緑の光ね。……はい、見ていますよ。");
  audio.sfx("shutter");
  await wait(200);
  kit.setScene((g) => drawFundus(g));
  await kit.say("", "目の奥の写真が撮れた。視神経の出口のくぼみが、少し大きめに見える。（模式表示）");

  // 4. pressure
  kit.setStep(4, STEPS, "眼圧を測る");
  kit.setScene((g) => drawCamera(g, true));
  await pickRight(kit, "眼圧計を当てる前に、どうする？", [
    { label: "「少し風が当たります。驚かなくて大丈夫ですよ」と伝える" },
    { label: "何も言わずに測る", hintBy: "careManager", hint: "ハルさん、急に風が来るとびっくりされると思います。先にひと声かけてあげてください。" },
  ], 0);
  audio.sfx("beep");
  kit.setScene((g) => drawPressure(g));
  await kit.say("", "眼圧は、やや高めの値だった。（ゲーム用の模式表示です）");

  // 5. decide
  kit.setStep(5, STEPS, "結果をもとに考える");
  await pickRight(kit, "ここまでの結果から、どうする？", [
    { label: "「異常はありません。このままで大丈夫です」", hint: "（にごりや眼圧など、気になる点がある。言い切らずに、専門の目で確かめてもらおう）" },
    { label: "「すぐに手術が必要です」", hint: "（ここで決めつけるのは早い。詳しい検査は眼科の専門医にお願いしよう）" },
    { label: "結果をまとめて、眼科の専門医につなぐ" },
  ], 2);
  await kit.say("player", "目のにごりと、眼圧がやや高めな点が気になります。ここで決めつけず、眼科の先生に詳しく診てもらいましょう。");
  await kit.say("player", "今日の画像と結果は、紹介状と一緒にお送りします。受診の日の送り迎えも、相談しましょう。");
  await kit.say("haru", "目医者さんまで行くのは大変だと思っていたけど、先に分かっていると安心だねえ。");
  kit.close();
}

function drawAnterior(g: CanvasRenderingContext2D, blur: number): void {
  const [c, x] = makeCanvas(W, H);
  x.fillStyle = "#1a1a24"; x.fillRect(0, 0, W, H);
  const off = Math.round(blur * 6);
  const draw = (dx: number, alpha: number) => {
    x.globalAlpha = alpha;
    x.fillStyle = "#f2d2c0"; x.fillRect(14 + dx, 30, 100, 36);
    x.fillStyle = "#ffffff"; x.beginPath(); x.ellipse(64 + dx, 48, 38, 18, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#7a5a3a"; x.beginPath(); x.arc(64 + dx, 48, 15, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#2a2020"; x.beginPath(); x.arc(64 + dx, 48, 7, 0, Math.PI * 2); x.fill();
    x.fillStyle = "rgba(230,230,210,0.55)"; x.beginPath(); x.arc(64 + dx, 48, 6, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#ffffff"; x.fillRect(58 + dx, 42, 3, 3);
  };
  if (off === 0) draw(0, 1);
  else { draw(-off, 0.5); draw(off, 0.5); }
  x.globalAlpha = 1;
  // slit beam
  x.fillStyle = "rgba(255,255,220,0.55)"; x.fillRect(72, 18, 3, 60);
  schematicCorners(x);
  g.drawImage(c, 0, 0);
}

function drawCamera(g: CanvasRenderingContext2D, pressure = false): void {
  g.fillStyle = "#fff4e0"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#e3b980"; g.fillRect(0, 72, W, 24);
  // handheld device
  g.fillStyle = OUTLINE; g.fillRect(20, 30, 44, 30);
  g.fillStyle = pressure ? "#c9d6da" : "#f6fbfb"; g.fillRect(21, 31, 42, 28);
  g.fillStyle = "#2bb3a8"; g.fillRect(24, 34, 20, 14);
  g.fillStyle = OUTLINE; g.fillRect(63, 38, 14, 12);
  g.fillStyle = "#6a7a86"; g.fillRect(64, 39, 12, 10);
  // fixation light
  g.fillStyle = pressure ? "#9fdcf2" : "#6fe07a"; g.fillRect(78, 42, 4, 4);
  // eye (simple profile)
  g.fillStyle = "#f7cfa8"; g.fillRect(92, 26, 30, 44);
  g.fillStyle = "#ffffff"; g.fillRect(92, 42, 8, 6);
  g.fillStyle = "#2e2a3a"; g.fillRect(92, 43, 4, 4);
  g.fillStyle = "#f0eef0"; g.fillRect(96, 18, 28, 10);
}

function drawFundus(g: CanvasRenderingContext2D): void {
  const [c, x] = makeCanvas(W, H);
  x.fillStyle = "#101014"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#c8562a"; x.beginPath(); x.arc(64, 48, 42, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#e07a3a"; x.beginPath(); x.arc(58, 44, 30, 0, Math.PI * 2); x.fill();
  // optic disc with an enlarged cup (schematic)
  x.fillStyle = "#ffd89a"; x.beginPath(); x.arc(82, 46, 9, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#fff6e0"; x.beginPath(); x.arc(82, 46, 6, 0, Math.PI * 2); x.fill();
  // vessels
  x.strokeStyle = "#8a1a1a"; x.lineWidth = 1.5;
  [[-1, -1], [-1, 1], [0, -1], [0, 1], [-1, 0.2]].forEach(([dx, dy]) => {
    x.beginPath(); x.moveTo(82, 46); x.quadraticCurveTo(82 + dx * 20, 46 + dy * 18, 82 + dx * 44 - 4, 46 + dy * 34); x.stroke();
  });
  x.fillStyle = "#b04a22"; x.fillRect(46, 46, 5, 5);
  schematicCorners(x);
  g.drawImage(c, 0, 0);
}

function drawPressure(g: CanvasRenderingContext2D): void {
  g.fillStyle = "#0e2a2c"; g.fillRect(0, 0, W, H);
  // a simple gauge: green / yellow / orange band with a needle in the yellow zone
  const bands = ["#6fbf5a", "#ffd45a", "#f2a13a"];
  bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(20 + i * 30, 44, 30, 10); });
  g.fillStyle = OUTLINE; g.fillRect(19, 43, 92, 1); g.fillRect(19, 54, 92, 1);
  g.fillStyle = "#ffffff"; g.fillRect(70, 34, 2, 28);
  g.fillStyle = "#ffffff"; g.fillRect(66, 30, 10, 4);
  schematicCorners(g);
}
