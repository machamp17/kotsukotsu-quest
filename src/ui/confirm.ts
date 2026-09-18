import { audio } from "../engine/audio";
import { input } from "../engine/input";

/** A small yes/no window over the whole frame. The safe choice starts selected. */
export function confirmBox(message: string, yes: string, no: string): Promise<boolean> {
  const root = document.getElementById("modal")!;
  const wrap = document.createElement("div");
  wrap.className = "modal-wrap";
  wrap.innerHTML = `<div class="window confirm" role="alertdialog" aria-modal="true"><p></p><div class="confirm-actions"><button type="button" class="choice" data-v="1"></button><button type="button" class="choice" data-v="0"></button></div></div>`;
  wrap.querySelector("p")!.textContent = message;
  const [bYes, bNo] = Array.from(wrap.querySelectorAll<HTMLButtonElement>("button"));
  bYes.textContent = yes;
  bNo.textContent = no;
  root.appendChild(wrap);
  const buttons = [bYes, bNo];
  let cursor = 1;
  const setCur = (i: number) => { cursor = (i + 2) % 2; buttons.forEach((b, k) => b.classList.toggle("is-active", k === cursor)); };
  setCur(1);
  return new Promise((resolve) => {
    const done = (v: boolean) => { pop(); audio.sfx("select"); wrap.remove(); resolve(v); };
    bYes.onclick = () => done(true);
    bNo.onclick = () => done(false);
    buttons.forEach((b, i) => { b.onpointerenter = () => setCur(i); });
    const pop = input.push({
      repeat: true,
      dir: () => { setCur(cursor + 1); audio.sfx("cursor"); },
      a: () => done(cursor === 0),
      b: () => done(false),
    });
  });
}
