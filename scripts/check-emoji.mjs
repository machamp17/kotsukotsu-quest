// Fails if any emoji / pictographic character appears in sources or build output.
// Extended_Pictographic also covers symbols such as U+25B6 that iOS renders as emoji.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "dist"];
const pattern = /[\p{Extended_Pictographic}\u{FE0F}\u{20E3}\u{1F1E6}-\u{1F1FF}]/u;
let hits = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    readFileSync(p, "utf8").split("\n").forEach((line, i) => {
      const m = line.match(pattern);
      if (m) {
        hits++;
        console.log(`${p}:${i + 1}: U+${m[0].codePointAt(0).toString(16).toUpperCase()}`);
      }
    });
  }
}
roots.forEach(walk);
if (hits) { console.error(`${hits} pictographic character(s) found`); process.exit(1); }
console.log("no emoji found");
