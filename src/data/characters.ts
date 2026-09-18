import type { CharacterId, PartyMemberId } from "../types";

export type HairStyle = "short" | "side" | "bob" | "ponytail" | "bun" | "long" | "cap" | "bald";
export type Prop = "bag" | "file" | "cane" | "case" | "towel" | "papers" | null;

export interface Look {
  skin: string;
  hair: string;
  hairShade: string;
  hairStyle: HairStyle;
  top: string;
  topShade: string;
  inner: string;
  bottom: string;
  skirt?: boolean;
  shoes: string;
  prop: Prop;
  propColor?: string;
  glasses?: boolean;
  stethoscope?: boolean;
  apron?: string;
  capColor?: string;
  elder?: boolean;
}

const SKIN = "#f7cfa8";
const SKIN2 = "#eab78e";
const COAT = "#f6fbfb";
const COAT_SHADE = "#bcd8da";

export const LOOKS: Record<Exclude<CharacterId, "cat">, Look> = {
  doctorA: {
    skin: SKIN, hair: "#3b2a26", hairShade: "#231816", hairStyle: "side",
    top: COAT, topShade: COAT_SHADE, inner: "#2bb3a8", bottom: "#34466e", shoes: "#5a3b2a",
    prop: "bag", propColor: "#6b3f2a", stethoscope: false,
  },
  doctorB: {
    skin: SKIN, hair: "#6a3d24", hairShade: "#4a2716", hairStyle: "ponytail",
    top: COAT, topShade: COAT_SHADE, inner: "#2bb3a8", bottom: "#3d4f7a", shoes: "#5a3b2a",
    prop: "bag", propColor: "#6b3f2a", stethoscope: true,
  },
  careManager: {
    skin: SKIN, hair: "#4a2e24", hairShade: "#2f1c16", hairStyle: "bob",
    top: "#f59bb0", topShade: "#d9728d", inner: "#fff4e0", bottom: "#c9a778", shoes: "#6a4a3a",
    prop: "file", propColor: "#2bb3a8",
  },
  nurse: {
    skin: SKIN, hair: "#5a3526", hairShade: "#3a2016", hairStyle: "cap",
    top: "#9fdcf2", topShade: "#6fb7d6", inner: "#ffffff", bottom: "#9fdcf2", shoes: "#ffffff",
    prop: "bag", propColor: "#1a7f79", capColor: "#ffffff",
  },
  pharmacist: {
    skin: SKIN, hair: "#2a2a34", hairShade: "#16161e", hairStyle: "short",
    top: COAT, topShade: COAT_SHADE, inner: "#7bc86c", bottom: "#4a4a5a", shoes: "#3a3a3a",
    prop: "papers", propColor: "#ffe9a8", glasses: true,
  },
  liaison: {
    skin: SKIN, hair: "#7a4a2e", hairShade: "#55311c", hairStyle: "long",
    top: "#4f7fd0", topShade: "#3a5fa8", inner: "#ffffff", bottom: "#2f3b5a", skirt: true, shoes: "#2a2a2a",
    prop: "papers", propColor: "#ffffff",
  },
  ume: {
    skin: SKIN, hair: "#dcd8dc", hairShade: "#a9a2aa", hairStyle: "bun",
    top: "#b9a3d9", topShade: "#9580bb", inner: "#fff4e0", bottom: "#8a7aa0", skirt: true, shoes: "#6a4a3a",
    prop: null, elder: true,
  },
  tanaka: {
    skin: SKIN2, hair: "#bcb6b8", hairShade: "#8f888c", hairStyle: "short",
    top: "#7fa6c9", topShade: "#5f84a8", inner: "#ffffff", bottom: "#6a6a7a", shoes: "#4a3a2a",
    prop: null, elder: true,
  },
  tanakaWife: {
    skin: SKIN, hair: "#cfc9cc", hairShade: "#a39ca0", hairStyle: "bob",
    top: "#e89a6a", topShade: "#c9784a", inner: "#fff4e0", bottom: "#7a6a5a", skirt: true, shoes: "#6a4a3a",
    prop: null, elder: true, apron: "#fff6e8",
  },
  haru: {
    skin: SKIN, hair: "#f0eef0", hairShade: "#bdb7bd", hairStyle: "bob",
    top: "#8fcf9a", topShade: "#6aad78", inner: "#ffffff", bottom: "#5a7a6a", skirt: true, shoes: "#6a4a3a",
    prop: null, elder: true, glasses: true,
  },
  kimura: {
    skin: SKIN2, hair: "#d0cacc", hairShade: "#a09a9c", hairStyle: "bald",
    top: "#bcd4ea", topShade: "#94b2cf", inner: "#ffffff", bottom: "#94b2cf", shoes: "#6a6a6a",
    prop: null, elder: true,
  },
  kimuraDaughter: {
    skin: SKIN, hair: "#5a3a2a", hairShade: "#3a2418", hairStyle: "ponytail",
    top: "#f2c65a", topShade: "#d4a236", inner: "#ffffff", bottom: "#4a5a7a", shoes: "#4a3a2a",
    prop: null,
  },
  storeStaff: {
    skin: SKIN2, hair: "#2e2622", hairShade: "#1a1412", hairStyle: "short",
    top: "#3fa37a", topShade: "#2d7d5c", inner: "#ffffff", bottom: "#2f4a3a", shoes: "#3a2a22",
    prop: "case", propColor: "#2bb3a8",
  },
  elder: {
    skin: SKIN2, hair: "#d8d4d6", hairShade: "#a8a0a4", hairStyle: "bald",
    top: "#a8764a", topShade: "#855733", inner: "#f0e6d0", bottom: "#6a6a5a", shoes: "#4a3a2a",
    prop: "cane", propColor: "#7a5230", elder: true,
  },
  neighbor: {
    skin: SKIN, hair: "#8a5a3a", hairShade: "#633c24", hairStyle: "bob",
    top: "#ffd45a", topShade: "#e0ad2e", inner: "#ffffff", bottom: "#5d8fcf", skirt: true, shoes: "#6a4a3a",
    prop: null, apron: "#ffffff",
  },
  massage: {
    skin: SKIN2, hair: "#3a2a22", hairShade: "#20160f", hairStyle: "short",
    top: "#5fc7b8", topShade: "#3a9e91", inner: "#ffffff", bottom: "#2f5f5a", shoes: "#ffffff",
    prop: "towel", propColor: "#ffffff",
  },
  mr: {
    skin: SKIN, hair: "#2a2226", hairShade: "#141013", hairStyle: "side",
    top: "#3b4a6b", topShade: "#2a3650", inner: "#ffffff", bottom: "#3b4a6b", shoes: "#1f1f1f",
    prop: "papers", propColor: "#ffffff", glasses: true,
  },
};

export const NAMES: Record<CharacterId, string> = {
  doctorA: "先生",
  doctorB: "先生",
  careManager: "ケアマネージャー",
  nurse: "訪問看護師",
  pharmacist: "薬剤師",
  liaison: "地域連携担当",
  ume: "春山ウメさん",
  tanaka: "田中シゲルさん",
  tanakaWife: "田中さんの奥さん",
  haru: "佐藤ハルさん",
  kimura: "木村タダシさん",
  kimuraDaughter: "木村さんの娘さん",
  storeStaff: "機器庫の担当さん",
  elder: "散歩中のおじいさん",
  neighbor: "近所の方",
  massage: "訪問マッサージ師",
  mr: "製薬会社の情報担当",
  cat: "ネコ",
};

export interface PartyInfo {
  id: PartyMemberId;
  name: string;
  ability: string;
  abilityText: string;
}

export const PARTY_INFO: Record<PartyMemberId, PartyInfo> = {
  careManager: {
    id: "careManager", name: "ケアマネージャー", ability: "暮らしを知る",
    abilityText: "ご本人が何に困り、何を望んでいるかを知り、支え方を一緒に考える力。",
  },
  nurse: {
    id: "nurse", name: "訪問看護師", ability: "変化を伝える",
    abilityText: "日々の小さな変化に気づき、医師や救急へつなぐ力。",
  },
  pharmacist: {
    id: "pharmacist", name: "薬剤師", ability: "薬を整える",
    abilityText: "治療を暮らしの中で続けられる形にする力。",
  },
  liaison: {
    id: "liaison", name: "地域連携担当", ability: "情報をつなぐ",
    abilityText: "病院、在宅、家族、地域の情報を結ぶ力。",
  },
};
