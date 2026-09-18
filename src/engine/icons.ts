// 16x16 pixel icons for equipment and key items.
import type { ItemId } from "../types";
import { Pix } from "./pixel";

const pal: Record<string, string> = {
  w: "#ffffff", g: "#c9d6da", d: "#6a7a86", k: "#2e2a3a", t: "#2bb3a8", T: "#1a7f79",
  y: "#ffd45a", Y: "#d9a520", r: "#e0574a", b: "#6b3f2a", B: "#8a5a3a", l: "#9fdcf2",
};

const ART: Record<ItemId, string[]> = {
  // Portable X-ray: a wheeled unit, a folding arm and the tube head, plus a detector panel.
  xray: [
    "      dddd      ",
    "     dgggggd    ",
    "     dgwwwgd    ",
    "      dggd d    ",
    "        d   d   ",
    "        d    d  ",
    "  lll   d   ttt ",
    "  lwl   d  twwwt",
    "  lll   d  twrwt",
    "  lwl  ddd twwwt",
    "  lll  dgd  ttt ",
    "      dgggd  d  ",
    "      dtttd  d  ",
    "      dgggd  d  ",
    "     k  k  kdddk",
    "                ",
  ],
  patientKey: [
    "                ",
    "   yyyy         ",
    "  yY  Yy        ",
    "  y    y        ",
    "  y    y        ",
    "  yY  Yy        ",
    "   yyyyy        ",
    "      yyy       ",
    "       yyy      ",
    "        yyy  tt ",
    "        yyyyTTt ",
    "         y y tt ",
    "         yyy t  ",
    "               t",
    "                ",
    "                ",
  ],
  // Portable ECG: a small monitor with a trace, and coloured limb clips.
  ecg: [
    "                ",
    "  kkkkkkkkkkkk  ",
    "  kTTTTTTTTTTk  ",
    "  kTTTTTyTTTTk  ",
    "  kTTTTyTyTTTk  ",
    "  kyyyyTTTyyyk  ",
    "  kTTTTTTTTTTk  ",
    "  kkkkkkkkkkkk  ",
    "     dd  dd     ",
    "    d  dd  d    ",
    "   d   dd   d   ",
    "  d    dd    d  ",
    " rr   yy  tt  kk",
    " rr   yy  tt  kk",
    "                ",
    "                ",
  ],
  // Eye exam kit: handheld slit lamp, fundus camera and tonometer.
  eyeKit: [
    "                ",
    "   ggg          ",
    "  gwwwg    ddd  ",
    "  gwlwg   dgggd ",
    "  gwwwg   dglgd ",
    "   gdg    dgggd ",
    "   gdg     ddd  ",
    "   gdg     tdt  ",
    "   tdt     tdt  ",
    "   tdt     tdt  ",
    "   ttt     ttt  ",
    "                ",
    "   kkkkkkkkkk   ",
    "   klwwwwwwlk   ",
    "   kkkkkkkkkk   ",
    "                ",
  ],
  // Portable ultrasound: a tablet with an image, and the probe.
  echo: [
    "                ",
    " kkkkkkkkkk     ",
    " kddddddddk     ",
    " kddgggdddk     ",
    " kdgdddgddk     ",
    " kddgggdddk     ",
    " kddddddddk     ",
    " kkkkkkkkkk     ",
    "          d  ww ",
    "           d wgw",
    "            dwgw",
    "             ttt",
    "             ttt",
    "             tTt",
    "              t ",
    "                ",
  ],
  dischargeNote: [
    "                ",
    "   wwwwwwwww    ",
    "   wgggggggw    ",
    "   wwwwwwwww    ",
    "   wgggggwww    ",
    "   wwwwwwwww    ",
    "   wgggggggw    ",
    "   wwwwwwwww    ",
    "   wggggwwww    ",
    "   wwwwwwwtt    ",
    "   wwwwwwtTTt   ",
    "   wwwwwwwtt    ",
    "   wwwwwwwww    ",
    "                ",
    "                ",
    "                ",
  ],
  medicalBag: [
    "                ",
    "     bbbbbb     ",
    "    b      b    ",
    "   bbbbbbbbbbb  ",
    "  bBBBBBBBBBBBb ",
    "  bBBBBwwBBBBBb ",
    "  bBBBBwwBBBBBb ",
    "  bBBwwwwwwBBBb ",
    "  bBBwwwwwwBBBb ",
    "  bBBBBwwBBBBBb ",
    "  bBBBBwwBBBBBb ",
    "  bBBBBBBBBBBBb ",
    "  bbbbbbbbbbbbb ",
    "                ",
    "                ",
    "                ",
  ],
};

const cache = new Map<ItemId, HTMLCanvasElement>();

export function itemIcon(id: ItemId): HTMLCanvasElement {
  const hit = cache.get(id);
  if (hit) return hit;
  const p = new Pix(16, 16);
  p.art(0, 0, ART[id], pal);
  if (id === "dischargeNote" || id === "eyeKit") p.outline("#6a7a86");
  const c = p.toCanvas();
  cache.set(id, c);
  return c;
}
