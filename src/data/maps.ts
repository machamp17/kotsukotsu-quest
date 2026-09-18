import type { Building } from "../engine/tiles";
import type { BgmId, CharacterId, Cond, Direction } from "../types";

export interface Warp {
  x: number; y: number;
  to: string; tx: number; ty: number; facing: Direction;
  cond?: Cond;
  /** Script played when the warp is used (before the fade). */
  enterScript?: string;
  /** Script (or talk) played when the condition fails. */
  lockedScript: string;
}

export interface NpcDef {
  id: string;
  char: CharacterId;
  x: number; y: number;
  facing: Direction;
  talk: string; // key into TALKS
  visible?: Cond;
  /** Shows the "!" balloon while the condition holds. */
  balloon?: Cond;
  inBed?: boolean;
  /** Turns toward the player when spoken to. */
  turns?: boolean;
}

export interface ObjDef { x: number; y: number; talk: string; balloon?: Cond; }

export interface TriggerDef {
  x: number; y: number; w: number; h: number;
  cond: Cond;
  script: string;
}

export interface MapDef {
  id: string;
  name: string;
  indoor: boolean;
  rows: string[];
  buildings: Building[];
  warps: Warp[];
  npcs: NpcDef[];
  objects: ObjDef[];
  triggers: TriggerDef[];
  bgm: BgmId;
}

class Grid {
  g: string[][];
  constructor(public w: number, public h: number, fill: string) {
    this.g = Array.from({ length: h }, () => new Array(w).fill(fill));
  }
  rect(ch: string, x: number, y: number, w = 1, h = 1): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.g[j] && i >= 0 && i < this.w) this.g[j][i] = ch;
    return this;
  }
  at(list: [number, number][], ch: string): this {
    list.forEach(([x, y]) => this.rect(ch, x, y));
    return this;
  }
  rows(): string[] { return this.g.map((r) => r.join("")); }
}

// ------------------------------------------------------------------ town
export const TOWN_W = 26;
export const TOWN_H = 34;

function buildTown(): string[] {
  const W = TOWN_W, H = TOWN_H;
  const m = new Grid(W, H, ".");
  m.rect("T", 0, 0, W, 2).rect("T", 0, H - 2, W, 2).rect("T", 0, 0, 1, H).rect("T", W - 1, 0, 1, H);
  m.rect("~", 17, 0, 2, H);
  m.rect("#", 17, 12, 2, 2);          // north bridge
  m.rect("#", 17, 29, 2, 2);          // south bridge
  // paths
  m.rect("=", 10, 7, 3, 2);           // clinic doorstep
  m.rect("=", 3, 7, 1, 2);            // Tanaka house doorstep
  m.rect("=", 3, 9, 13, 6);           // central plaza
  m.rect("=", 15, 12, 2, 2);          // to the north bridge
  m.rect("=", 19, 12, 4, 2);          // east bank (storehouse)
  m.rect("=", 19, 14, 2, 17);         // east bank, running south
  m.rect("=", 21, 20, 3, 1);          // pharmacy doorstep
  m.rect("=", 8, 15, 2, 6);           // plaza -> south street
  m.rect("=", 3, 21, 13, 2);          // south street
  m.rect("=", 8, 23, 2, 6);           // south street -> riverside street
  m.rect("=", 3, 29, 14, 2);          // riverside street
  // plaza furniture
  m.rect("W", 9, 11).at([[5, 13], [13, 10]], "b").at([[9, 7], [13, 7], [6, 9], [3, 14]], "P");
  m.at([[15, 9], [3, 11], [16, 21], [2, 29]], "L");
  m.rect("S", 15, 6);
  // greenery
  m.at([[1, 2], [2, 2], [6, 2], [15, 3], [15, 2], [7, 8], [16, 10], [2, 16], [6, 16], [13, 16], [14, 17], [16, 20], [7, 22],
    [19, 2], [20, 3], [24, 10], [22, 15], [23, 21], [21, 23], [22, 28], [11, 24], [15, 24], [7, 28], [24, 18]], ",");
  m.at([[1, 11], [1, 12], [1, 13], [2, 12], [6, 15], [15, 15], [16, 16], [7, 17], [16, 18], [16, 2], [7, 2],
    [19, 3], [21, 2], [22, 2], [23, 2], [24, 2], [24, 4], [24, 7], [19, 6], [24, 12],
    [7, 24], [7, 26], [16, 23], [16, 25], [16, 27], [1, 26], [1, 28],
    [22, 22], [24, 23], [23, 25], [21, 26], [24, 27], [22, 30],
    [2, 31], [5, 31], [11, 31], [14, 31], [20, 31], [23, 31]], "T");
  m.at([[23, 14], [24, 15]], "R");
  m.rect("g", 2, 23, 4, 2).rect("F", 6, 23, 1, 2).rect("F", 1, 23, 1, 2);
  return m.rows();
}

const TOWN_BUILDINGS: Building[] = [
  { id: "clinic", x: 8, y: 2, w: 7, h: 5, doorX: 11, kind: "clinic", roof: "#2bb3a8", roofD: "#1a7f79", roofL: "#7fe0d4" },
  { id: "tanakaHouse", x: 1, y: 3, w: 5, h: 4, doorX: 3, kind: "house", roof: "#3fb8c9", roofD: "#2a8a9a", roofL: "#8fe0ea", chimney: true },
  { id: "store", x: 20, y: 8, w: 4, h: 4, doorX: 21, kind: "store", roof: "#5a8fa8", roofD: "#3d6a80", roofL: "#9cc8da" },
  { id: "umeHouse", x: 2, y: 17, w: 5, h: 4, doorX: 4, kind: "house", roof: "#e07a4f", roofD: "#b55a36", roofL: "#f4a57c", chimney: true },
  { id: "haruHouse", x: 10, y: 17, w: 5, h: 4, doorX: 12, kind: "house", roof: "#2bb3a8", roofD: "#1a7f79", roofL: "#7fe0d4" },
  { id: "pharmacy", x: 21, y: 16, w: 4, h: 4, doorX: 22, kind: "pharmacy", roof: "#6fbf5a", roofD: "#4a9a3a", roofL: "#a6e08f" },
  { id: "kimuraHouse", x: 2, y: 25, w: 5, h: 4, doorX: 4, kind: "house", roof: "#e8b64a", roofD: "#c08e2a", roofL: "#f6d68a", chimney: true },
  { id: "center", x: 10, y: 25, w: 6, h: 4, doorX: 12, kind: "office", roof: "#4f7fd0", roofD: "#3a5fa8", roofL: "#8fb0ea" },
];

// ------------------------------------------------------------------ interiors
function buildInterior(w: number, h: number, doorX: number, decorate: (m: Grid) => void): string[] {
  const m = new Grid(w, h, "_");
  m.rect("|", 0, 0, 1, h).rect("|", w - 1, 0, 1, h).rect("|", 0, h - 1, w, 1);
  m.rect("X", 1, 0, w - 2, 2);
  m.rect("M", doorX, h - 1);
  decorate(m);
  return m.rows();
}

const STORE_ROWS = buildInterior(10, 9, 4, (m) => {
  m.at([[3, 1], [6, 1]], "w");
  m.at([[1, 2], [2, 2], [3, 2]], "E").at([[7, 2], [8, 2], [8, 3]], "B").rect("C", 5, 2).rect("V", 7, 5).rect("p", 1, 7).rect("B", 1, 5);
});

const UME_ROWS = buildInterior(11, 9, 5, (m) => {
  m.at([[3, 1], [7, 1]], "w").rect("Q", 5, 1);
  m.rect("s", 1, 2).rect("k", 2, 2).rect("k", 3, 2).rect("r", 3, 4, 4, 3).rect("t", 4, 5).rect("c", 4, 4).rect("p", 9, 7).rect("p", 1, 7);
  m.rect("D", 8, 2, 1, 2).rect("V", 9, 5);
});

const TANAKA_ROWS = buildInterior(11, 9, 5, (m) => {
  m.at([[2, 1], [8, 1]], "w").rect("Q", 5, 1);
  m.rect("D", 2, 2, 1, 2).rect("s", 9, 2).rect("k", 7, 2).rect("k", 8, 2).rect("l", 1, 5);
  m.rect("r", 4, 4, 3, 2).rect("t", 5, 4).rect("p", 9, 7).rect("c", 9, 5);
});

const HARU_ROWS = buildInterior(11, 9, 5, (m) => {
  m.at([[3, 1], [7, 1]], "w").rect("Q", 5, 1);
  m.rect("t", 3, 3).rect("s", 1, 2).rect("k", 8, 2).rect("k", 9, 2).rect("c", 2, 3);
  m.rect("r", 3, 5, 4, 2).rect("u", 6, 6).rect("z", 8, 5).rect("l", 9, 4).rect("p", 1, 7);
});

const KIMURA_ROWS = buildInterior(11, 9, 5, (m) => {
  m.at([[3, 1], [7, 1]], "w").rect("Q", 5, 1);
  m.rect("D", 8, 2, 1, 2).rect("s", 1, 2).rect("k", 2, 2).rect("l", 9, 5).rect("r", 3, 4, 3, 3).rect("t", 4, 5).rect("p", 1, 7).rect("c", 3, 3);
});

const PHARMACY_ROWS = buildInterior(10, 8, 4, (m) => {
  m.at([[2, 1], [7, 1]], "w");
  m.at([[1, 2], [2, 2], [3, 2], [6, 2], [7, 2], [8, 2]], "m").rect("K", 1, 3, 8, 1).rect("p", 1, 6).rect("c", 7, 5).rect("c", 8, 5);
});

const CENTER_ROWS = buildInterior(12, 9, 5, (m) => {
  m.at([[3, 1], [8, 1]], "w").rect("Q", 6, 1);
  m.rect("s", 1, 2).rect("s", 10, 2).rect("V", 2, 3).rect("V", 9, 3).rect("K", 3, 4, 6, 1);
  m.rect("c", 2, 6).rect("c", 9, 6).rect("p", 1, 7).rect("p", 10, 7).rect("l", 4, 2);
});

const DOOR_BACK = (x: number, y: number) => ({ to: "town", tx: x, ty: y, facing: "down" as Direction, lockedScript: "" });

export const MAPS: Record<string, MapDef> = {
  town: {
    id: "town", name: "こつこつ町", indoor: false, bgm: "town",
    rows: buildTown(),
    buildings: TOWN_BUILDINGS,
    warps: [
      { x: 21, y: 11, to: "store", tx: 4, ty: 7, facing: "up", cond: { all: ["askedForXray"] }, lockedScript: "storeLocked" },
      { x: 4, y: 20, to: "umeHouse", tx: 5, ty: 7, facing: "up", cond: { all: ["gotKey"] }, enterScript: "umeHouseEnter", lockedScript: "umeHouseLocked" },
      { x: 11, y: 6, to: "", tx: 0, ty: 0, facing: "down", cond: { all: ["__never"] }, lockedScript: "clinicDoor" },
      { x: 3, y: 6, to: "tanakaHouse", tx: 5, ty: 7, facing: "up", cond: { all: ["ch2Started"] }, enterScript: "tanakaEnter", lockedScript: "tanakaDoor" },
      { x: 12, y: 20, to: "haruHouse", tx: 5, ty: 7, facing: "up", cond: { all: ["ch3Asked"] }, enterScript: "haruEnter", lockedScript: "haruDoor" },
      { x: 22, y: 19, to: "pharmacy", tx: 4, ty: 6, facing: "up", cond: { all: ["nurseJoined"] }, lockedScript: "pharmacyDoor" },
      { x: 12, y: 28, to: "center", tx: 5, ty: 7, facing: "up", cond: { all: ["ch4Called"] }, lockedScript: "centerDoor" },
      { x: 4, y: 28, to: "kimuraHouse", tx: 5, ty: 7, facing: "up", cond: { all: ["infoHospital", "infoMassage", "infoFamily"] }, enterScript: "kimuraEnter", lockedScript: "kimuraDoor" },
    ],
    npcs: [
      { id: "careManager", char: "careManager", x: 13, y: 8, facing: "left", talk: "careManager", visible: { none: ["gotKey"] }, balloon: { none: ["askedForXray"] }, turns: true },
      { id: "elder", char: "elder", x: 6, y: 11, facing: "right", talk: "elder", turns: true },
      { id: "neighbor", char: "neighbor", x: 6, y: 22, facing: "up", talk: "neighbor", turns: true },
      { id: "massage", char: "massage", x: 14, y: 15, facing: "left", talk: "massage", turns: true, balloon: { all: ["infoHospital"], none: ["infoMassage"] } },
      { id: "mr", char: "mr", x: 5, y: 8, facing: "down", talk: "mr", turns: true },
      { id: "cat", char: "cat", x: 2, y: 14, facing: "right", talk: "cat" },
      { id: "kimuraDaughter", char: "kimuraDaughter", x: 6, y: 29, facing: "up", talk: "kimuraDaughter", turns: true, visible: { none: ["enteredKimura"] }, balloon: { all: ["infoHospital"], none: ["infoFamily"] } },
    ],
    objects: [
      { x: 15, y: 6, talk: "clinicSign" },
      { x: 9, y: 11, talk: "well" },
      { x: 2, y: 23, talk: "garden" }, { x: 3, y: 23, talk: "garden" }, { x: 4, y: 23, talk: "garden" }, { x: 5, y: 23, talk: "garden" },
    ],
    triggers: [
      { x: 15, y: 12, w: 4, h: 2, cond: { all: ["askedForXray"], none: ["moyaCleared"] }, script: "moyaEncounter" },
      { x: 3, y: 9, w: 13, h: 12, cond: { all: ["careManagerJoined"], none: ["nurseCalled"] }, script: "nurseCall" },
      { x: 0, y: 0, w: TOWN_W, h: TOWN_H, cond: { all: ["chapter1Clear"], none: ["ch2Started"] }, script: "ch2Start" },
      { x: 10, y: 21, w: 6, h: 2, cond: { all: ["ch3Asked"], none: ["batCleared"] }, script: "batEncounter" },
      { x: 3, y: 21, w: 13, h: 2, cond: { all: ["pharmacistJoined"], none: ["ch4Called"] }, script: "liaisonCall" },
      { x: 8, y: 23, w: 2, h: 6, cond: { all: ["infoHospital"], none: ["tsutaCleared"] }, script: "tsutaEncounter" },
      { x: 3, y: 29, w: 14, h: 2, cond: { all: ["liaisonJoined"], none: ["bossIntro"] }, script: "bossIntro" },
      { x: 3, y: 9, w: 13, h: 6, cond: { all: ["bossIntro"], none: ["bossCleared"] }, script: "bossBattle" },
    ],
  },
  store: {
    id: "store", name: "機器庫", indoor: true, bgm: "house",
    rows: STORE_ROWS,
    buildings: [],
    warps: [{ x: 4, y: 8, ...DOOR_BACK(21, 12) }],
    npcs: [{ id: "storeStaff", char: "storeStaff", x: 4, y: 4, facing: "down", talk: "storeStaff", turns: true, balloon: { all: ["askedForXray"], none: ["storeTalked"] } }],
    objects: [
      { x: 5, y: 2, talk: "xrayCase" },
      { x: 1, y: 2, talk: "rack" }, { x: 2, y: 2, talk: "rack" }, { x: 3, y: 2, talk: "rack" },
      { x: 7, y: 5, talk: "storeDesk" },
    ],
    triggers: [],
  },
  umeHouse: {
    id: "umeHouse", name: "春山さんの家", indoor: true, bgm: "house",
    rows: UME_ROWS,
    buildings: [],
    warps: [{ x: 5, y: 8, ...DOOR_BACK(4, 21) }],
    npcs: [{ id: "ume", char: "ume", x: 8, y: 2, facing: "down", talk: "ume", inBed: true, balloon: { none: ["xrayExamDone"] } }],
    objects: [
      { x: 5, y: 1, talk: "calendar" }, { x: 1, y: 2, talk: "umeShelf" }, { x: 2, y: 2, talk: "kitchen" }, { x: 3, y: 2, talk: "kitchen" },
      { x: 4, y: 5, talk: "umeTable" }, { x: 9, y: 5, talk: "umeDesk" },
    ],
    triggers: [],
  },
  tanakaHouse: {
    id: "tanakaHouse", name: "田中さんの家", indoor: true, bgm: "emergency",
    rows: TANAKA_ROWS,
    buildings: [],
    warps: [{ x: 5, y: 8, ...DOOR_BACK(3, 7) }],
    npcs: [
      { id: "tanaka", char: "tanaka", x: 2, y: 2, facing: "down", talk: "tanaka", inBed: true, visible: { none: ["ecgDone"] } },
      { id: "nurse", char: "nurse", x: 3, y: 3, facing: "left", talk: "nurse", turns: true, visible: { none: ["nurseJoined"] }, balloon: { none: ["ecgDone"] } },
      { id: "tanakaWife", char: "tanakaWife", x: 7, y: 5, facing: "left", talk: "tanakaWife", turns: true },
    ],
    objects: [{ x: 1, y: 5, talk: "tanakaPhone" }, { x: 9, y: 2, talk: "tanakaShelf" }],
    triggers: [],
  },
  haruHouse: {
    id: "haruHouse", name: "佐藤さんの家", indoor: true, bgm: "house",
    rows: HARU_ROWS,
    buildings: [],
    warps: [{ x: 5, y: 8, ...DOOR_BACK(12, 21) }],
    npcs: [{ id: "haru", char: "haru", x: 5, y: 3, facing: "down", talk: "haru", turns: true, balloon: { none: ["eyeExamDone"] } }],
    objects: [
      { x: 3, y: 3, talk: "haruMedicine", balloon: { all: ["eyeExamDone"], none: ["foundMedicine"] } },
      { x: 6, y: 6, talk: "hazardRug", balloon: { all: ["eyeExamDone"], none: ["foundRug"] } },
      { x: 8, y: 5, talk: "hazardCord", balloon: { all: ["eyeExamDone"], none: ["foundCord"] } },
      { x: 5, y: 1, talk: "haruCalendar" },
    ],
    triggers: [],
  },
  kimuraHouse: {
    id: "kimuraHouse", name: "木村さんの家", indoor: true, bgm: "house",
    rows: KIMURA_ROWS,
    buildings: [],
    warps: [{ x: 5, y: 8, ...DOOR_BACK(4, 29) }],
    npcs: [
      { id: "kimura", char: "kimura", x: 8, y: 2, facing: "down", talk: "kimura", inBed: true, balloon: { none: ["echoDone"] } },
      { id: "kimuraDaughterIn", char: "kimuraDaughter", x: 7, y: 5, facing: "up", talk: "kimuraDaughterIn", turns: true },
    ],
    objects: [{ x: 9, y: 5, talk: "kimuraNotes" }, { x: 5, y: 1, talk: "kimuraCalendar" }],
    triggers: [],
  },
  pharmacy: {
    id: "pharmacy", name: "こつこつ薬局", indoor: true, bgm: "house",
    rows: PHARMACY_ROWS,
    buildings: [],
    warps: [{ x: 4, y: 7, ...DOOR_BACK(22, 20) }],
    npcs: [{ id: "pharmacist", char: "pharmacist", x: 4, y: 2, facing: "down", talk: "pharmacist", visible: { none: ["ch3Asked"] }, balloon: { none: ["ch3Asked"] } }],
    objects: [
      { x: 4, y: 3, talk: "pharmacist" },
      { x: 1, y: 2, talk: "medShelf" }, { x: 2, y: 2, talk: "medShelf" }, { x: 3, y: 2, talk: "medShelf" },
      { x: 6, y: 2, talk: "medShelf" }, { x: 7, y: 2, talk: "medShelf" }, { x: 8, y: 2, talk: "medShelf" },
    ],
    triggers: [],
  },
  center: {
    id: "center", name: "地域連携センター", indoor: true, bgm: "house",
    rows: CENTER_ROWS,
    buildings: [],
    warps: [{ x: 5, y: 8, ...DOOR_BACK(12, 29) }],
    npcs: [{ id: "liaison", char: "liaison", x: 6, y: 3, facing: "down", talk: "liaison", visible: { none: ["infoHospital"] }, balloon: { none: ["infoHospital"] } }],
    objects: [
      { x: 6, y: 4, talk: "liaison" },
      { x: 2, y: 3, talk: "centerDesk" }, { x: 9, y: 3, talk: "centerDesk" }, { x: 6, y: 1, talk: "centerBoard" },
    ],
    triggers: [],
  },
};
