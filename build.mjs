// Bundles src/ into a single self-contained HTML file (dist/index.html).
// The Artifact host wraps the page in its own <html>/<head>/<body>, so the
// output is written as a fragment: <title>, <style>, markup, then <script>.
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const result = await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "iife",
  target: "es2019",
  minify: true,
  write: false,
  legalComments: "none",
  charset: "ascii", // keeps the inlined script free of raw control / non-ASCII bytes
});

const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const template = readFileSync("src/template.html", "utf8");
const css = readFileSync("src/style.css", "utf8");
const html = template
  .replace("/*__STYLE__*/", () => css)
  .replace("/*__SCRIPT__*/", () => js);

mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", html);
// A standalone copy with a full document wrapper for local preview.
writeFileSync(
  "dist/preview.html",
  `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"></head><body>${html}</body></html>`
);
// A proper standalone document for GitHub Pages: head (title, fonts, style) + body.
const cut = html.indexOf("</style>") + "</style>".length;
const pageHead = html.slice(0, cut);
const pageBody = html.slice(cut);
mkdirSync("docs", { recursive: true });
writeFileSync(
  "docs/index.html",
  `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="description" content="訪問診療医になって、町の専門職とつながりながら患者さんを支えるレトロRPG。生きる事を嬉しく。こつこつクリニック">
<meta name="theme-color" content="#1d8b83">
${pageHead}
</head>
<body>${pageBody}</body>
</html>
`
);
writeFileSync("docs/.nojekyll", "");
console.log(`dist/index.html ${(html.length / 1024).toFixed(1)} KB, docs/index.html written`);
