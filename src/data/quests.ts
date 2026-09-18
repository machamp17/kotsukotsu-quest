import type { Chapter, ItemId } from "../types";

export interface QuestStep {
  id: string;
  /** The step is complete once this flag is set. null = open-ended. */
  until: string | null;
  objective: string;
  /** One sentence added to the synopsis once the step is complete ("" = nothing). */
  synopsis: string;
}

export const CHAPTER_TITLES: Record<Chapter, string> = {
  prologue: "プロローグ",
  xray: "第1章　転んだ患者さんとポータブルレントゲン",
  ecg: "第2章　胸が苦しい患者さんとポータブル心電図",
  eye: "第3章　目が見えづらい患者さんと眼科検査",
  ultrasound: "第4章　お腹が苦しい患者さんとポータブルエコー",
  isolationBoss: "最終章　孤立の魔王コリツ",
  ending: "エピローグ",
};

export const QUEST_STEPS: QuestStep[] = [
  // chapter 1
  { id: "talkCareManager", until: "askedForXray", objective: "ケアマネージャーさんに話しかけよう",
    synopsis: "クリニック前で、ケアマネージャーさんから春山ウメさんの相談を受けた。自宅で転んで、腰を痛めているという。" },
  { id: "getXray", until: "gotXray", objective: "機器庫でレントゲンを受け取ろう（東の橋の先）",
    synopsis: "橋のたもとの「ふあんのモヤ」を晴らし、機器庫の専用ケースからポータブルレントゲンを受け取った。" },
  { id: "returnCareManager", until: "gotKey", objective: "ケアマネージャーさんのところへ戻ろう",
    synopsis: "ご本人とご家族の了承を得て、ケアマネージャーさんが預かっていた鍵を受け取った。" },
  { id: "goToPatient", until: "enteredPatientHouse", objective: "患者さんの家へ向かおう（南西の赤い屋根）",
    synopsis: "ケアマネージャーさんの案内で、ウメさんのお宅を訪ねた。" },
  { id: "examine", until: "xrayExamDone", objective: "ウメさんのお話を聞こう（ベッドのそばでA）",
    synopsis: "ウメさんのお話を聞き、自宅でレントゲンを撮影した。ケアマネージャーさんが仲間になった。" },
  { id: "backToClinic", until: "nurseCalled", objective: "クリニックの方へ戻ろう",
    synopsis: "帰り道、訪問看護師さんから緊急の連絡が入った。" },
  // chapter 2
  { id: "ch2Start", until: "ch2Started", objective: "往診バッグを確かめよう", synopsis: "" },
  { id: "rushToTanaka", until: "enteredTanaka", objective: "田中さんの家へ急ごう（クリニックの西、青い屋根）",
    synopsis: "胸の苦しさを訴える田中シゲルさんのお宅へ、心電図を持って駆けつけた。" },
  { id: "ecg", until: "ecgDone", objective: "看護師さんと一緒に、田中さんを診よう",
    synopsis: "救急要請を確かめ、心電図を記録し、病院へ情報を送った。田中さんは救急隊と病院へ向かった。" },
  { id: "nurseJoin", until: "ch2Done", objective: "看護師さんと話そう",
    synopsis: "訪問看護師さんが仲間になった。" },
  // chapter 3
  { id: "toPharmacy", until: "ch3Asked", objective: "薬局の薬剤師さんを訪ねよう（東の橋を渡って南、緑の屋根）",
    synopsis: "薬剤師の森さんから、薬の袋が見えづらい佐藤ハルさんの相談を受けた。" },
  { id: "toHaru", until: "enteredHaru", objective: "ハルさんの家へ向かおう（南の通り、ターコイズの屋根）",
    synopsis: "眠たげな「みおとしコウモリ」をやり過ごし、ハルさんのお宅を訪ねた。" },
  { id: "eyeExam", until: "eyeExamDone", objective: "ハルさんの見え方を確かめよう",
    synopsis: "前眼部・眼底・眼圧を確かめ、眼科の専門医へつなぐことにした。" },
  { id: "hazards", until: "hazardsFound", objective: "家の中の気になる場所を探そう（目印の3か所）",
    synopsis: "薬袋、めくれたマット、床のコード。暮らしの中の困りごとを見つけた。" },
  { id: "medicine", until: "ch3Done", objective: "ハルさんに話しかけよう",
    synopsis: "薬袋の色分けと大きな文字、一包化を決めた。薬剤師さんが仲間になった。" },
  // chapter 4
  { id: "leaveHaru", until: "ch4Called", objective: "外へ出よう",
    synopsis: "地域連携センターから、退院したばかりの方についての相談が入った。" },
  { id: "toCenter", until: "infoHospital", objective: "地域連携センターへ行こう（南の川沿い、青い屋根）",
    synopsis: "地域連携担当の小林さんから、木村タダシさんの退院時の情報を受け取った。" },
  { id: "gather", until: "infoGathered", objective: "話を聞こう：マッサージ師さん（広場の南）・木村さんの娘さん",
    synopsis: "マッサージ師さんと娘さんから、普段の様子や水分・排尿のことを聞いた。" },
  { id: "toKimura", until: "enteredKimura", objective: "木村さんの家へ入ろう（南西、黄色の屋根）", synopsis: "" },
  { id: "echo", until: "echoDone", objective: "木村さんを診よう",
    synopsis: "エコーで確かめ、チームで相談して処置を行った。地域連携担当の小林さんが仲間になった。" },
  // finale
  { id: "outside", until: "bossIntro", objective: "木村さんの家を出よう",
    synopsis: "町に残った不安や遠慮、途切れた情報が、中央の広場に集まっていった。" },
  { id: "boss", until: "bossCleared", objective: "中央の広場へ向かおう（みんなと一緒に）",
    synopsis: "仲間全員の力で、孤立の魔王コリツの壁をほどいた。" },
  { id: "ending", until: "gameClear", objective: "……", synopsis: "" },
  { id: "free", until: null, objective: "これからも、町の物語はつづく（自由に歩けます）", synopsis: "" },
];

/** Flags computed from other flags (kept in the save like any other flag). */
export function deriveFlags(flags: Record<string, boolean>): void {
  if (flags.foundMedicine && flags.foundRug && flags.foundCord) flags.hazardsFound = true;
  if (flags.infoMassage && flags.infoFamily) flags.infoGathered = true;
}

export function currentStep(flags: Record<string, boolean>): QuestStep {
  const step = QUEST_STEPS.find((s) => s.until === null || !flags[s.until])!;
  if (step.id === "gather") {
    // only name the people still to talk to
    const left = [!flags.infoMassage && "マッサージ師さん（広場の南）", !flags.infoFamily && "木村さんの娘さん（黄色の屋根の前）"].filter(Boolean);
    return { ...step, objective: `話を聞こう：${left.join("・")}` };
  }
  return step;
}

export function synopsis(flags: Record<string, boolean>): string[] {
  const out: string[] = [];
  for (const s of QUEST_STEPS) {
    if (s.until && flags[s.until]) { if (s.synopsis) out.push(s.synopsis); }
    else break;
  }
  return out;
}

export function chapterFor(flags: Record<string, boolean>): Chapter {
  if (flags.gameClear) return "ending";
  if (flags.echoDone) return "isolationBoss";
  if (flags.ch3Done) return "ultrasound";
  if (flags.ch2Done) return "eye";
  if (flags.chapter1Clear) return "ecg";
  if (flags.askedForXray) return "xray";
  return "prologue";
}

export interface ItemInfo { id: ItemId; name: string; text: string; }

export const ITEMS: Record<ItemId, ItemInfo> = {
  xray: { id: "xray", name: "ポータブルレントゲン", text: "持ち運べるレントゲン装置。移動が難しい方の自宅でも、画像検査ができる場合がある。" },
  ecg: { id: "ecg", name: "ポータブル心電図", text: "手足と胸に電極を付けて、心臓の電気の状態を記録する。記録は病院とも共有できる。" },
  eyeKit: { id: "eyeKit", name: "眼科の検査機器", text: "前眼部・眼底・眼圧を、自宅で確かめるための機器。" },
  echo: { id: "echo", name: "ポータブルエコー", text: "プローブを当てて、お腹の中の様子を画面で確かめる。" },
  dischargeNote: { id: "dischargeNote", name: "退院時の情報", text: "病院から地域連携センターに届いた、入院中の経過とお薬の情報。" },
  patientKey: { id: "patientKey", name: "患者宅の鍵", text: "ご本人とご家族の了承のもと、ケアマネージャーさんが預かっていた鍵。" },
  medicalBag: { id: "medicalBag", name: "往診バッグ", text: "聴診器や血圧計が入った、いつものバッグ。" },
};
