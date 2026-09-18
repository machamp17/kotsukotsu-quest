// GameShell: screens, the world loop, interaction dispatch and the script host.
import { MAPS, type TriggerDef, type Warp } from "./data/maps";
import { chapterFor, currentStep, deriveFlags } from "./data/quests";
import { lockedScript, SCRIPTS, TALKS } from "./data/story";
import { audio } from "./engine/audio";
import { input } from "./engine/input";
import { clearSave, hasSave, loadGame, loadMutedPref, newGame, saveGame, saveMutedPref } from "./engine/save";
import { runScript, type ScriptHost } from "./engine/script";
import { checkCond, OPPOSITE, World } from "./engine/world";
import type { BgmId, CharacterId, EnemyId, GameState, ItemId, MinigameId, PartyMemberId, SfxId, Talk } from "./types";
import { runBoss } from "./ui/boss";
import { runEcg } from "./ui/ecg";
import { runEcho } from "./ui/echo";
import { runEnding } from "./ui/ending";
import { runEye } from "./ui/eye";
import { runMedicine } from "./ui/medicine";
import { confirmBox } from "./ui/confirm";
import { DialogueBox } from "./ui/dialogue";
import { card, chapterCard, fade, itemGet, joinEffect, lesson, phoneRing, wait } from "./ui/effects";
import { runEncounter } from "./ui/encounter";
import { Hud, openMenu } from "./ui/hud";
import { CharacterSetup } from "./ui/setup";
import { TitleScreen } from "./ui/title";
import { runXray } from "./ui/xray";

type ScreenId = "title" | "setup" | "game";

class GameShell implements ScriptHost {
  private state: GameState | null = null;
  private world: World;
  private dialogue: DialogueBox;
  private hud: Hud;
  private title = new TitleScreen();
  private setup = new CharacterSetup();
  private busy = 0;
  private loopId = 0;
  private popWorld: (() => void) | null = null;
  private steps = 0;

  constructor() {
    const canvas = document.getElementById("world") as HTMLCanvasElement;
    this.world = new World(canvas, {
      flags: () => this.state?.flags ?? {},
      canMove: () => this.busy === 0 && input.depth === 1,
      onWarp: (w) => void this.guard(() => this.useWarp(w)),
      onDoorLocked: (w) => void this.guard(() => this.play(lockedScript(w.lockedScript, this.checkTalk))),
      onTrigger: (t) => void this.guard(() => this.fireTrigger(t)),
      onStep: () => this.onStep(),
    });
    this.dialogue = new DialogueBox(document.getElementById("dialogue")!, () => ({
      name: this.state?.playerName ?? "コツコツ",
      avatar: this.state?.avatar ?? "doctorA",
    }));
    this.hud = new Hud(() => this.toggleSound());
    audio.muted = loadMutedPref();
    this.hud.setMuted(audio.muted);

    input.bind(document.getElementById("dpad")!, document.getElementById("btn-a")!);
    document.getElementById("viewport")!.addEventListener("pointerdown", (e) => {
      if ((e.target as HTMLElement).closest("#overlay, #dialogue, #choices")) return;
      this.dialogue.tap();
    });
    document.getElementById("btn-menu")!.addEventListener("click", () => void this.menu());
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("orientationchange", () => window.setTimeout(() => this.resize(), 200));
    document.addEventListener("visibilitychange", () => { if (document.hidden && this.state) this.save(); });
    window.addEventListener("pagehide", () => { if (this.state) this.save(); });
    this.showTitle();
  }

  // ------------------------------------------------------------------ screens

  private show(id: ScreenId): void {
    (["title", "setup", "game"] as ScreenId[]).forEach((s) => { document.getElementById(`screen-${s}`)!.hidden = s !== id; });
  }

  private showTitle(): void {
    this.loopId++;
    this.popWorld?.();
    this.popWorld = null;
    this.dialogue.hide();
    document.getElementById("overlay")!.innerHTML = "";
    this.state = null;
    this.show("title");
    this.title.start(hasSave(), () => void this.onNewGame(), () => this.onContinue());
  }

  private async onNewGame(): Promise<void> {
    if (hasSave()) {
      const ok = await confirmBox("保存データがあります。消して、はじめから始めますか？", "はじめから始める", "やめる");
      if (!ok) return;
    }
    this.title.stop();
    this.show("setup");
    this.setup.open((name, avatar) => {
      clearSave();
      this.state = newGame(name, avatar, audio.muted);
      saveGame(this.state);
      void this.enterGame(true);
    }, () => this.showTitle());
  }

  private onContinue(): void {
    const s = loadGame();
    if (!s) { this.showTitle(); return; }
    this.title.stop();
    this.state = s;
    void this.enterGame(false);
  }

  private async enterGame(fresh: boolean): Promise<void> {
    const s = this.state!;
    this.show("game");
    this.hud.reset();
    this.world.avatar = s.avatar;
    const p = s.position;
    const map = MAPS[p.mapId] ? p.mapId : "town";
    this.world.load(map, p.x, p.y, p.facing, this.followerIds());
    if (!this.world.walkable(p.x, p.y, true)) this.world.load("town", 11, 7, "down", this.followerIds());
    this.syncDerived();
    this.resize();
    this.popWorld = input.push({ a: () => void this.interact(), b: () => void this.menu() });
    audio.playBgm(this.bgmFor(this.world.map.id));
    this.startLoop();
    document.getElementById("fader")!.classList.add("is-on");
    await wait(60);
    await fade("in", 400);
    if (fresh || !s.flags.introSeen) {
      await this.guard(async () => {
        await this.play(SCRIPTS.intro);
        await card((el) => {
          el.innerHTML = `<p class="card-eyebrow">あそびかた</p><div class="howto">
            <p><span class="key-dpad" aria-hidden="true"></span>十字キーで歩く（キーボードは矢印・WASD）</p>
            <p><span class="key-a" aria-hidden="true">A</span>話す・調べる・次へ（Enter・Space・Z）</p>
            <p>画面上の「目的」を見ながら進もう。「メニュー」であらすじと持ち物を確認できます。</p></div>`;
        }, "is-howto", 500);
      });
    }
  }

  private startLoop(): void {
    const id = ++this.loopId;
    const frame = (t: number) => {
      if (id !== this.loopId) return;
      const worldActive = this.busy === 0 && input.depth === 1;
      // only read (and consume) a new step once the current step has finished
      const dir = !worldActive ? null : this.world.player.moving ? input.holdDir(t) : input.walkDir(t);
      this.world.update(t, dir);
      this.world.render(t);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  private resize(): void {
    const vp = document.getElementById("viewport")!;
    if (!document.getElementById("screen-game")!.hidden) this.world.resize(vp.clientWidth, vp.clientHeight);
    if (!document.getElementById("screen-title")!.hidden) this.title.resize();
  }

  // ------------------------------------------------------------------ state helpers

  /** Party members, then anyone guiding us who has not formally joined yet. */
  private followerIds(): CharacterId[] {
    const s = this.state;
    if (!s) return [];
    const ids: CharacterId[] = [...s.party];
    const f = s.flags;
    if (f.gotKey && !s.party.includes("careManager")) ids.push("careManager");
    if (f.ch3Asked && !s.party.includes("pharmacist")) ids.push("pharmacist");
    if (f.infoHospital && !s.party.includes("liaison")) ids.push("liaison");
    return ids;
  }

  private syncDerived(): void {
    const s = this.state!;
    deriveFlags(s.flags);
    s.chapter = chapterFor(s.flags);
    s.questStep = currentStep(s.flags).id;
    const bossWaits = this.world.map?.id === "town" && s.flags.bossIntro && !s.flags.bossCleared;
    this.world.bossAt = bossWaits ? { x: 11, y: 11 } : null;
    this.hud.refresh(s);
  }

  /** A house that was tense during an emergency becomes calm afterwards. */
  private bgmFor(mapId: string): BgmId {
    const map = MAPS[mapId];
    if (mapId === "tanakaHouse" && this.state?.flags.ecgDone) return "house";
    return map.bgm;
  }

  private checkTalk = (c: Talk["when"]) => checkCond(c, this.state?.flags ?? {});

  save(): void {
    const s = this.state;
    if (!s) return;
    const p = this.world.player;
    s.position = { mapId: this.world.map.id, x: p.x, y: p.y, facing: p.dir };
    s.settings.muted = audio.muted;
    this.syncDerived();
    saveGame(s);
  }

  private onStep(): void {
    if (++this.steps % 6 === 0) this.save();
  }

  private toggleSound(): void {
    audio.setMuted(!audio.muted);
    saveMutedPref(audio.muted);
    this.hud.setMuted(audio.muted);
    if (!audio.muted) audio.sfx("select");
    if (this.state) this.state.settings.muted = audio.muted;
  }

  /** Runs an async block with world input locked; never lets an error freeze the game. */
  private async guard(fn: () => Promise<void>): Promise<void> {
    if (this.busy > 0) return;
    this.busy++;
    try {
      await fn();
    } catch (err) {
      console.error(err);
    } finally {
      this.dialogue.hide();
      this.busy--;
      if (this.state) this.syncDerived();
    }
  }

  private play(cmds: Talk["script"]): Promise<void> {
    return runScript(this, cmds);
  }

  // ------------------------------------------------------------------ world events

  private async interact(): Promise<void> {
    if (!this.state || this.busy > 0 || this.world.player.moving) return;
    const { x, y } = this.world.facingTile();
    const npc = this.world.npcAt(x, y);
    if (npc) {
      await this.guard(async () => {
        if (npc.turns) this.world.faceNpc(npc.id, OPPOSITE[this.world.player.dir]);
        const talks = TALKS[npc.talk] ?? [];
        const talk = talks.find((t) => checkCond(t.when, this.state!.flags));
        if (talk) await this.play(talk.script);
      });
      return;
    }
    const obj = this.world.map.objects.find((o) => o.x === x && o.y === y);
    if (obj) {
      await this.guard(async () => {
        const talk = (TALKS[obj.talk] ?? []).find((t) => checkCond(t.when, this.state!.flags));
        if (talk) await this.play(talk.script);
      });
      return;
    }
    const warp = this.world.map.warps.find((w) => w.x === x && w.y === y);
    if (warp && this.world.buildingAt(x, y)) {
      await this.guard(async () => {
        if (checkCond(warp.cond, this.state!.flags)) await this.useWarp(warp);
        else await this.play(lockedScript(warp.lockedScript, this.checkTalk));
      });
    }
  }

  private async useWarp(w: Warp): Promise<void> {
    if (!w.to) return;
    if (w.enterScript) await this.play(SCRIPTS[w.enterScript] ?? []);
    this.dialogue.hide();
    audio.sfx("door");
    await fade("out");
    this.world.load(w.to, w.tx, w.ty, w.facing, this.followerIds());
    this.syncDerived();
    audio.playBgm(this.bgmFor(w.to));
    this.save();
    await fade("in");
    // an event waiting right outside the door starts at once
    const trig = this.world.triggerAt(w.tx, w.ty);
    if (trig) await this.fireTrigger(trig);
  }

  private async fireTrigger(t: TriggerDef): Promise<void> {
    await this.play(SCRIPTS[t.script] ?? []);
  }

  private async menu(): Promise<void> {
    if (!this.state || this.busy > 0) return;
    this.busy++;
    let result: "close" | "title" = "close";
    try {
      result = await openMenu(this.state, () => this.toggleSound());
    } finally {
      this.busy--;
    }
    if (result === "title") {
      this.save();
      await fade("out");
      this.showTitle();
      await fade("in");
    }
  }

  // ------------------------------------------------------------------ ScriptHost

  say(speaker: string | null, text: string, think = false): Promise<void> {
    return this.dialogue.say(speaker, text, think);
  }

  choose(speaker: string | null, prompt: string, labels: string[]): Promise<number> {
    return this.dialogue.choose(speaker, prompt, labels);
  }

  setFlag(flag: string): void {
    const s = this.state!;
    s.flags[flag] = true;
    // someone starts walking with us
    if (flag === "gotKey" || flag === "ch3Asked" || flag === "infoHospital") this.world.placeFollowers(this.followerIds());
    this.syncDerived();
  }

  async give(item: ItemId): Promise<void> {
    const s = this.state!;
    if (!s.inventory.includes(item)) s.inventory.push(item);
    this.syncDerived();
    await itemGet(item);
  }

  async join(member: PartyMemberId): Promise<void> {
    const s = this.state!;
    if (!s.party.includes(member)) s.party.push(member);
    s.flags[`${member}Joined`] = true;
    this.world.placeFollowers(this.followerIds());
    this.syncDerived();
    await joinEffect(member, this.bgmFor(this.world.map.id));
  }

  sfx(id: SfxId): void { audio.sfx(id); }

  bgm(id: BgmId | null): void { audio.playBgm(id); }

  async balloon(target: string): Promise<void> {
    this.world.showBalloon(target, 900, performance.now());
    await wait(800);
  }

  wait(ms: number): Promise<void> { return wait(ms); }

  async battle(id: EnemyId): Promise<void> {
    const s = this.state!;
    const f = this.world.facingTile();
    this.world.enemyAt = this.world.walkable(f.x, f.y) ? { ...f, id } : null;
    await wait(500);
    await fade("out", 250);
    await fade("in", 10);
    try {
      await runEncounter(id, s.playerName, s.avatar, s.party, this.bgmFor(this.world.map.id));
    } finally {
      this.world.enemyAt = null;
    }
  }

  async boss(): Promise<void> {
    await fade("out", 300);
    await fade("in", 10);
    await runBoss(this.state!.playerName, this.state!.avatar);
    this.world.bossAt = null;
  }

  async ending(): Promise<void> {
    await runEnding(this.state!.avatar);
    // back in town, in front of the clinic
    this.world.load("town", 11, 8, "down", this.followerIds());
    this.syncDerived();
    audio.playBgm("town");
  }

  async minigame(id: MinigameId): Promise<void> {
    const { playerName: n, avatar: a } = this.state!;
    if (id === "xray") await runXray(n, a);
    else if (id === "ecg") await runEcg(n, a);
    else if (id === "eye") await runEye(n, a);
    else if (id === "echo") await runEcho(n, a);
    else await runMedicine(n);
  }

  lesson(text: string): Promise<void> { return lesson(text); }

  chapterCard(title: string, sub: string, foot?: string): Promise<void> { return chapterCard(title, sub, foot); }

  phone(caller: string): Promise<void> { return phoneRing(caller); }

  hideDialogue(): void { this.dialogue.hide(); }
}

function boot(): void {
  try {
    const shell = new GameShell();
    // inspection hook for automated play-testing; only exposed when the URL contains ?debug
    if (location.search.includes("debug")) (window as unknown as { __kq: unknown }).__kq = { shell, input };
  } catch (err) {
    console.error(err);
    const el = document.getElementById("boot-error");
    if (el) el.hidden = false;
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
