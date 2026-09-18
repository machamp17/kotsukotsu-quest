// Merges every chapter's dialogue into the tables the game reads.
// Later-chapter variants of town NPCs are listed first (the first matching entry wins).
import type { ScriptCmd, Talk } from "../types";
import { SCRIPTS as SCRIPTS1, TALKS as TALKS1 } from "./chapter1";
import { SCRIPTS2, TALKS2 } from "./chapter2";
import { SCRIPTS3, TALKS3 } from "./chapter3";
import { FINALE_SCRIPTS, SCRIPTS4, TALKS4 } from "./chapter4";

const LATE: Record<string, Talk[]> = {
  elder: [
    { when: { all: ["gameClear"] }, script: [{ say: "elder", text: "広場の空気が、なんだか明るくなったねえ。困ったら、声をかけてもいいんだな。" }] },
    { when: { all: ["bossIntro"] }, script: [{ say: "elder", text: "広場のほうに、なんだか寂しそうな影が……。先生、みんなと一緒に行っておやり。" }] },
    { when: { all: ["ch4Called"] }, script: [{ say: "elder", text: "木村さん、退院したって聞いたよ。娘さんが毎日通っているんだ。" }] },
    { when: { all: ["ch3Asked"], none: ["ch3Done"] }, script: [{ say: "elder", text: "ハルさんは、昔は洋裁の先生だったんだよ。細かい字もすらすら読めたのにねえ。" }] },
    { when: { all: ["ch2Started"], none: ["ch2Done"] }, script: [{ say: "elder", text: "田中さんの家のほうへ、看護師さんが走っていったよ。先生、急いで！" }] },
  ],
  neighbor: [
    { when: { all: ["gameClear"] }, script: [{ say: "neighbor", text: "ウメさん、手すりのおかげで、お庭まで出られるようになったのよ。" }] },
    { when: { all: ["ch3Asked"], none: ["ch3Done"] }, script: [{ say: "neighbor", text: "お隣のハルさん、最近は回覧板の字が読みにくいって言っていたわ。" }] },
  ],
  massage: [
    { when: { all: ["infoHospital"], none: ["infoMassage"] }, script: TALKS4.massageInfo[0].script },
    { when: { all: ["gameClear"] }, script: [{ say: "massage", text: "木村さん、今日は立ち上がりが楽だとおっしゃっていました。動き方の練習、続けていきます。" }] },
    { when: { all: ["infoMassage"] }, script: [{ say: "massage", text: "何か変わったことがあれば、私からもチームにお伝えしますね。" }] },
  ],
  mr: [
    { when: { all: ["gameClear"] }, script: [{ say: "mr", text: "先生方の連携の勉強会、私も資料づくりでお手伝いさせてください。" }] },
  ],
  cat: [
    { when: { all: ["gameClear"] }, script: [{ narrate: "ネコが、仲間たちの足元にすり寄ってきた。" }] },
  ],
};

function merge(...tables: Record<string, Talk[]>[]): Record<string, Talk[]> {
  const out: Record<string, Talk[]> = {};
  tables.forEach((t) => Object.entries(t).forEach(([k, v]) => { out[k] = [...(out[k] ?? []), ...v]; }));
  return out;
}

export const TALKS: Record<string, Talk[]> = merge(LATE, TALKS1, TALKS2, TALKS3, TALKS4);

export const SCRIPTS: Record<string, ScriptCmd[]> = {
  ...SCRIPTS1,
  ...SCRIPTS2,
  ...SCRIPTS3,
  ...SCRIPTS4,
  ...FINALE_SCRIPTS,
  // chapter 2 begins straight after the call at the end of chapter 1
  nurseCall: [...SCRIPTS1.nurseCall, ...SCRIPTS2.ch2Start],
};

/** A locked door can point at a plain script or at a conditional talk. */
export function lockedScript(key: string, check: (c: Talk["when"]) => boolean): ScriptCmd[] {
  if (SCRIPTS[key]) return SCRIPTS[key];
  return (TALKS[key] ?? []).find((t) => check(t.when))?.script ?? [];
}
