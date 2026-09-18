// Executes ScriptCmd lists from the story data. The host (GameShell) supplies the effects.
import type { BgmId, EnemyId, ItemId, MinigameId, PartyMemberId, ScriptCmd, SfxId } from "../types";

export interface ScriptHost {
  say(speaker: string | null, text: string, think?: boolean): Promise<void>;
  choose(speaker: string | null, prompt: string, labels: string[]): Promise<number>;
  setFlag(flag: string): void;
  give(item: ItemId): Promise<void>;
  join(member: PartyMemberId): Promise<void>;
  sfx(id: SfxId): void;
  bgm(id: BgmId | null): void;
  balloon(target: string): Promise<void>;
  wait(ms: number): Promise<void>;
  battle(id: EnemyId): Promise<void>;
  boss(): Promise<void>;
  ending(): Promise<void>;
  minigame(id: MinigameId): Promise<void>;
  lesson(text: string): Promise<void>;
  chapterCard(title: string, sub: string, foot?: string): Promise<void>;
  phone(caller: string): Promise<void>;
  save(): void;
  hideDialogue(): void;
}

export async function runScript(host: ScriptHost, cmds: ScriptCmd[]): Promise<void> {
  for (const c of cmds) {
    if ("say" in c) await host.say(c.say, c.text);
    else if ("narrate" in c) await host.say(null, c.narrate);
    else if ("think" in c) await host.say(null, c.think, true);
    else if ("choice" in c) {
      const i = await host.choose(c.speaker ?? null, c.choice, c.options.map((o) => o.label));
      await runScript(host, c.options[i].then);
    } else if ("setFlag" in c) host.setFlag(c.setFlag);
    else if ("give" in c) { host.hideDialogue(); await host.give(c.give); }
    else if ("join" in c) { host.hideDialogue(); await host.join(c.join); }
    else if ("sfx" in c) host.sfx(c.sfx);
    else if ("bgm" in c) host.bgm(c.bgm);
    else if ("balloon" in c) { host.hideDialogue(); await host.balloon(c.balloon); }
    else if ("wait" in c) await host.wait(c.wait);
    else if ("battle" in c) { host.hideDialogue(); await host.battle(c.battle); }
    else if ("boss" in c) { host.hideDialogue(); await host.boss(); }
    else if ("ending" in c) { host.hideDialogue(); await host.ending(); }
    else if ("minigame" in c) { host.hideDialogue(); await host.minigame(c.minigame); }
    else if ("lesson" in c) { host.hideDialogue(); await host.lesson(c.lesson); }
    else if ("chapterCard" in c) { host.hideDialogue(); await host.chapterCard(c.chapterCard.title, c.chapterCard.sub, c.chapterCard.foot); }
    else if ("phone" in c) { host.hideDialogue(); await host.phone(c.phone); }
    else if ("save" in c) host.save();
  }
}
