// "薬を整える": with the pharmacist, choose changes that make medicine easier to
// take correctly despite poor eyesight. The bags on screen change as you decide.
import { audio } from "../engine/audio";
import { OUTLINE } from "../engine/pixel";
import { MG_H as H, MG_W as W } from "./mgdraw";
import { openMinigame, pickRight } from "./mgkit";

export async function runMedicine(name: string): Promise<void> {
  const kit = openMinigame(name);
  const STEPS = 3;
  const state = { colors: false, labels: false, packs: false };
  kit.setScene((g, t) => drawBags(g, state, t));

  kit.setStep(1, STEPS, "薬袋を見分けやすく");
  await kit.say("pharmacist", "今は、朝・昼・夜の薬が、同じ白い袋に入っています。これだと取り違えやすいですね。");
  await pickRight(kit, "薬袋をどうする？", [
    { label: "朝・昼・夜で、色の違う袋に分ける" },
    { label: "今のまま、白い袋で続ける", hintBy: "pharmacist", hint: "見えにくいときは、色の違いが大きな助けになりますよ。" },
  ], 0);
  state.colors = true; audio.sfx("item");
  await kit.say("pharmacist", "朝は黄色、昼は緑、夜は青。お日さまと夜空の色で覚えやすくしました。");

  kit.setStep(2, STEPS, "文字を読みやすく");
  await pickRight(kit, "袋の文字は？", [
    { label: "小さな文字のままにする", hintBy: "pharmacist", hint: "ハルさんは、小さな字が読みにくいとおっしゃっていましたね。" },
    { label: "大きな文字のラベルを貼る" },
  ], 1);
  state.labels = true; audio.sfx("item");

  kit.setStep(3, STEPS, "飲み方をシンプルに");
  await pickRight(kit, "1回に飲む薬が何種類もある。どうする？", [
    { label: "見えにくそうな薬を、自分の判断で減らす", hintBy: "pharmacist", hint: "薬を減らすかどうかは、先生と相談して決めましょう。自己判断はやめておきましょう。" },
    { label: "1回分ずつまとめる「一包化」を、先生と相談して行う" },
  ], 1);
  state.packs = true; audio.sfx("item");
  await kit.say("player", "一包化にしましょう。私から処方の指示を出します。飲み方の変化があれば、森さんから教えてください。");
  await kit.say("pharmacist", "お任せください。お薬カレンダーも用意しますね。");
  kit.close();
}

function drawBags(g: CanvasRenderingContext2D, s: { colors: boolean; labels: boolean; packs: boolean }, t: number): void {
  g.fillStyle = "#e3b980"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#c9975c"; for (let y = 0; y < H; y += 12) g.fillRect(0, y, W, 1);
  const cols = s.colors ? ["#ffd45a", "#6fbf5a", "#5f84d8"] : ["#ffffff", "#ffffff", "#ffffff"];
  cols.forEach((c, i) => {
    const x = 10 + i * 40, y = 16;
    g.fillStyle = OUTLINE; g.fillRect(x - 1, y - 1, 30, 46);
    g.fillStyle = c; g.fillRect(x, y, 28, 44);
    g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(x, y, 28, 4);
    if (s.labels) {
      // big label: a large pictogram (sun / half sun / moon) instead of small text
      g.fillStyle = "#ffffff"; g.fillRect(x + 3, y + 8, 22, 18);
      g.fillStyle = OUTLINE;
      if (i === 0) { g.fillRect(x + 10, y + 12, 8, 8); g.fillRect(x + 13, y + 9, 2, 2); g.fillRect(x + 13, y + 21, 2, 2); g.fillRect(x + 7, y + 15, 2, 2); g.fillRect(x + 19, y + 15, 2, 2); }
      if (i === 1) { g.fillRect(x + 8, y + 16, 12, 6); g.fillRect(x + 10, y + 13, 8, 3); }
      if (i === 2) { g.fillRect(x + 9, y + 11, 8, 11); g.fillStyle = "#ffffff"; g.fillRect(x + 12, y + 11, 6, 8); }
    } else {
      g.fillStyle = "#9aa3ad";
      for (let k = 0; k < 4; k++) g.fillRect(x + 4, y + 10 + k * 4, 18 - (k % 2) * 6, 1);
    }
    if (s.packs) {
      const bob = Math.floor(t / 400 + i) % 2;
      g.fillStyle = OUTLINE; g.fillRect(x + 3, y + 30 + bob, 22, 10);
      g.fillStyle = "#f6fbfb"; g.fillRect(x + 4, y + 31 + bob, 20, 8);
      g.fillStyle = "#e0574a"; g.fillRect(x + 7, y + 34 + bob, 3, 3);
      g.fillStyle = "#ffffff"; g.fillRect(x + 12, y + 34 + bob, 3, 3);
      g.fillStyle = "#ffd45a"; g.fillRect(x + 17, y + 34 + bob, 3, 3);
    }
  });
  g.fillStyle = "#2bb3a8"; g.fillRect(0, H - 14, W, 14);
  g.fillStyle = "#ffffff";
  [s.colors, s.labels, s.packs].forEach((on, i) => {
    g.fillStyle = on ? "#ffd45a" : "rgba(255,255,255,0.35)";
    g.fillRect(40 + i * 18, H - 9, 10, 4);
  });
}
