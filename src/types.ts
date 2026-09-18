export type Direction = "up" | "down" | "left" | "right";

export type Chapter =
  | "prologue"
  | "xray"
  | "ecg"
  | "eye"
  | "ultrasound"
  | "isolationBoss"
  | "ending";

export type Avatar = "doctorA" | "doctorB";

export type PartyMemberId = "careManager" | "nurse" | "pharmacist" | "liaison";

export type ItemId = "xray" | "patientKey" | "medicalBag" | "ecg" | "eyeKit" | "echo" | "dischargeNote";

export type CharacterId =
  | Avatar
  | PartyMemberId
  | "ume"
  | "tanaka"
  | "tanakaWife"
  | "haru"
  | "kimura"
  | "kimuraDaughter"
  | "storeStaff"
  | "elder"
  | "neighbor"
  | "massage"
  | "mr"
  | "cat";

export type EnemyId = "moya" | "bat" | "tsutawaran";
export type MinigameId = "xray" | "ecg" | "eye" | "echo" | "medicine";

export interface Position {
  mapId: string;
  x: number;
  y: number;
  facing: Direction;
}

export interface GameState {
  version: number;
  playerName: string;
  avatar: Avatar;
  chapter: Chapter;
  questStep: string;
  party: PartyMemberId[];
  inventory: ItemId[];
  flags: Record<string, boolean>;
  position: Position;
  settings: { muted: boolean; volume: number };
}

/** Condition evaluated against flags. All listed flags must match. */
export interface Cond {
  all?: string[];
  none?: string[];
}

export type ScriptCmd =
  | { say: string; text: string }
  | { narrate: string }
  | { think: string }
  | { choice: string; options: { label: string; then: ScriptCmd[] }[]; speaker?: string }
  | { setFlag: string }
  | { give: ItemId }
  | { join: PartyMemberId }
  | { sfx: SfxId }
  | { bgm: BgmId | null }
  | { balloon: string }
  | { wait: number }
  | { battle: EnemyId }
  | { boss: true }
  | { ending: true }
  | { minigame: MinigameId }
  | { lesson: string }
  | { chapterCard: { title: string; sub: string; foot?: string } }
  | { phone: string }
  | { save: true };

export type SfxId = "select" | "cursor" | "item" | "door" | "bump" | "phone" | "shutter" | "clear" | "talk" | "beep";
export type BgmId = "town" | "house" | "battle" | "title" | "join" | "emergency" | "boss" | "ending";

export interface Talk {
  when?: Cond;
  script: ScriptCmd[];
}
