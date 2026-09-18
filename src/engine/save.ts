import type { Avatar, GameState } from "../types";

const KEY = "kotsukotsu_clinic_quest_v2";
const LEGACY_KEY = "kotsukotsu_clinic_quest_save_v1";
const VERSION = 2;

export function newGame(playerName: string, avatar: Avatar, muted: boolean): GameState {
  return {
    version: VERSION,
    playerName,
    avatar,
    chapter: "prologue",
    questStep: "talkCareManager",
    party: [],
    inventory: ["medicalBag"],
    flags: {},
    position: { mapId: "town", x: 11, y: 7, facing: "down" },
    settings: { muted, volume: 0.6 },
  };
}

export function saveGame(state: GameState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function valid(s: unknown): s is GameState {
  if (!s || typeof s !== "object") return false;
  const g = s as GameState;
  return g.version === VERSION && typeof g.playerName === "string" && g.playerName.trim().length > 0
    && (g.avatar === "doctorA" || g.avatar === "doctorB")
    && !!g.position && typeof g.position.x === "number" && typeof g.position.mapId === "string"
    && Array.isArray(g.party) && Array.isArray(g.inventory) && !!g.flags && !!g.settings;
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return valid(s) ? s : null;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return loadGame() !== null;
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Sound preference survives even without a save file. */
export function loadMutedPref(): boolean {
  try {
    return localStorage.getItem(KEY + ":muted") !== "0";
  } catch {
    return true;
  }
}

export function saveMutedPref(muted: boolean): void {
  try {
    localStorage.setItem(KEY + ":muted", muted ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}
