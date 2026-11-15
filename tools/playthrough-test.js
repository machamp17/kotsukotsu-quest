// こつこつクリニック クエスト：最初からエンディングまでの自動通しプレイ（動作確認用）
// 使い方:  npm install playwright && npx playwright install chromium
//          node tools/playthrough-test.js [幅] [高さ] [名前] [noshots]
//   例:    node tools/playthrough-test.js 390 844 check noshots
// 結果は test-output/<名前>/ に保存（progress.txt / log.txt / texts.txt、noshots なしなら画面写真も）。
// 最後に「FINAL STEP: free」と出ればエンディングまで到達。PAGEERROR / CONSOLE の行があれば要確認。
// 別のファイルを試すときは GAME=パス を付けて実行（既定は docs/index.html）。
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const W = +(process.argv[2] || 390), H = +(process.argv[3] || 844), TAG = process.argv[4] || 'run';
const SHOTS = process.argv[5] !== 'noshots';
const GAME = path.resolve(process.env.GAME || path.join(__dirname, '..', 'docs', 'index.html'));
const OUT = path.join(process.cwd(), 'test-output', TAG) + path.sep;
fs.mkdirSync(OUT, { recursive: true });
const STEPS = [['talkCareManager','askedForXray'],['getXray','gotXray'],['returnCareManager','gotKey'],['goToPatient','enteredPatientHouse'],['examine','xrayExamDone'],['backToClinic','nurseCalled'],['ch2Start','ch2Started'],['rushToTanaka','enteredTanaka'],['ecg','ecgDone'],['nurseJoin','ch2Done'],['toPharmacy','ch3Asked'],['toHaru','enteredHaru'],['eyeExam','eyeExamDone'],['hazards','hazardsFound'],['medicine','ch3Done'],['leaveHaru','ch4Called'],['toCenter','infoHospital'],['gather','infoGathered'],['toKimura','enteredKimura'],['echo','echoDone'],['outside','bossIntro'],['boss','bossCleared'],['ending','gameClear']];
const log = [], issues = [], texts = [];
let shotN = 0, lastSig = '';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: false });
  p.on('pageerror', e => issues.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) issues.push('CONSOLE ' + m.text()); });
  await p.goto(pathToFileURL(GAME).href + '?debug'); await p.waitForTimeout(900);
  const shot = async (name) => { if (!SHOTS) return; shotN++; await p.screenshot({ path: OUT + String(shotN).padStart(3, '0') + '-' + name + '.png' }); };
  await shot('title');
  await p.click('[data-act="new"]'); await p.waitForTimeout(400); await shot('setup');
  await p.click('#setup-start'); await p.waitForTimeout(1500);
  const S = (fn, arg) => p.evaluate(fn, arg);
  const flags = () => S(() => window.__kq.shell.state.flags);
  const stepNow = async () => { const f = await flags(); for (const [id, u] of STEPS) if (!f[u]) return id; return 'free'; };
  const choiceTries = {};
  // ---------- overlay checks ----------
  const checkLayout = async (where) => {
    const r = await S(() => {
      const out = []; const vw = innerWidth, vh = innerHeight;
      document.querySelectorAll('#frame *').forEach(el => {
        if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return;
        const t = (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) ? el.textContent.trim().slice(0, 40) : null;
        if (!t) return;
        const rc = el.getBoundingClientRect(); if (!rc.width) return;
        if (rc.right > vw + 1 || rc.left < -1 || rc.bottom > vh + 1) out.push('OFFSCREEN "' + t + '" ' + Math.round(rc.left) + ',' + Math.round(rc.top) + ' ' + Math.round(rc.width) + 'x' + Math.round(rc.height));
        if (el.scrollHeight > el.clientHeight + 3 && cs.overflowY !== 'auto' && cs.overflowY !== 'scroll' && el.clientHeight > 0) out.push('CLIPPED-V "' + t + '" ' + el.scrollHeight + '>' + el.clientHeight);
        if (el.scrollWidth > el.clientWidth + 3 && cs.textOverflow !== 'ellipsis' && cs.overflowX !== 'auto' && el.clientWidth > 0 && cs.whiteSpace === 'nowrap') out.push('CLIPPED-H "' + t + '" ' + el.scrollWidth + '>' + el.clientWidth);
      });
      return out;
    });
    r.forEach(x => { const k = where + ' ' + x; if (!issues.includes(k)) issues.push(k); });
  };
  const sigShot = async (sig, name) => { if (sig !== lastSig) { lastSig = sig; await checkLayout(name); await shot(name); } };
  // ---------- one driver tick: returns 'idle' when nothing is on screen ----------
  const tick = async () => {
    const st = await S(() => {
      const q = s => document.querySelector(s), vis = s => { const e = q(s); return !!e && !e.hidden && e.offsetParent !== null; };
      return {
        roll: !!q('.ending-roll'), rollDone: !!q('.roll-hint.is-done'), ending: !!q('.ending'), endingText: (q('.ending-text p') || {}).textContent || '',
        kqb: !!q('.kqb'), meter: vis('.kqb-metering'), kqbCmds: vis('.kqb .battle-cmds.is-two'), kqbText: (q('.kqb .battle-text') || {}).textContent || '',
        boss: !!q('.battle.is-boss'), battle: !!q('.battle'), bCmds: vis('.battle .battle-cmds'), bText: (q('.battle .battle-msg p:last-child') || {}).textContent || '',
        bLabels: [...document.querySelectorAll('.battle .battle-cmds .choice')].map(b => b.textContent),
        mg: !!q('.minigame'), mgStep: (q('.mg-step') || {}).textContent || '', mgTitle: (q('.mg-title') || {}).textContent || '', mgText: (q('.mg-text') || {}).textContent || '', mgSpeaker: (q('.mg-speaker') || {}).textContent || '',
        mgBtns: [...document.querySelectorAll('.mg-actions .choice')].map(b => ({ t: b.textContent, dis: b.disabled, act: b.classList.contains('is-active') })), mgDone: !!q('.mg-talk.is-done'),
        card: !!q('.card-wrap'), cardText: (q('.card-wrap .card') || {}).innerText || '',
        menu: !!q('.menu-wrap'), choices: vis('#choices'), choiceLabels: [...document.querySelectorAll('#choices .choice')].map(b => b.textContent),
        dlg: vis('#dialogue'), dlgName: (q('#dialogue .dlg-name') || {}).textContent || '', dlgText: (q('#dialogue .dlg-text') || {}).textContent || '', dlgDone: !!q('#dialogue.is-done'),
        fader: !!q('#fader.is-on'), busy: window.__kq.shell.busy
      };
    });
    if (st.roll) { await sigShot('roll' + st.rollDone, 'roll'); if (st.rollDone) { await p.mouse.click(W / 2, H / 3); await p.waitForTimeout(700); } else { await p.mouse.move(W / 2, H / 3); await p.mouse.down(); await p.waitForTimeout(1500); await p.mouse.up(); await p.waitForTimeout(100); await shot('roll-mid'); } return 'busy'; }
    if (st.ending) { if (st.endingText) texts.push('[ENDING] ' + st.endingText); await sigShot('end' + st.endingText, 'ending'); await p.mouse.click(W / 2, H / 3); await p.waitForTimeout(650); return 'busy'; }
    if (st.kqb) {
      if (st.meter) {
        await sigShot('meter' + st.kqbText, 'battle-meter');
        const ok = await S(async () => { const segs = [...document.querySelectorAll('.kqb-seg')].map(s => parseFloat(s.style.width)); const lo = segs[0] + segs[1] + segs[2] + 2, hi = 99; for (let i = 0; i < 400; i++) { const m = document.querySelector('.kqb-meter-mark'); const cov = document.querySelector('.kqb-meter-cover'); if (!m) return 'gone'; const l = parseFloat(m.style.left); if (l >= lo && l <= hi && (!cov || cov.hidden)) return 'hit:' + l.toFixed(1); await new Promise(r => setTimeout(r, 8)); } return 'miss'; });
        await p.mouse.click(W / 2, H / 3); await p.waitForTimeout(500); log.push('meter ' + ok); return 'busy';
      }
      if (st.kqbCmds) { await sigShot('kqbcmd' + st.kqbText, 'battle-cmds'); await p.click('.kqb .battle-cmds .choice:nth-child(1)'); await p.waitForTimeout(250); return 'busy'; }
      texts.push('[BATTLE] ' + st.kqbText); await p.keyboard.press('Enter'); await p.waitForTimeout(260); return 'busy';
    }
    if (st.battle) {
      if (st.bCmds && st.bLabels.length) {
        const key = 'b:' + st.bText; choiceTries[key] = (choiceTries[key] || 0); const i = choiceTries[key]++ % st.bLabels.length;
        await sigShot('bcmd' + st.bLabels.join(), st.boss ? 'boss-cmds' : 'battle-cmds'); await p.click('.battle .battle-cmds .choice:nth-child(' + (i + 1) + ')'); await p.waitForTimeout(300); return 'busy';
      }
      if (st.bText) texts.push('[BOSS] ' + st.bText);
      await sigShot('b' + st.bText, st.boss ? 'boss' : 'battle'); await p.keyboard.press('Enter'); await p.waitForTimeout(280); return 'busy';
    }
    if (st.mg) {
      if (process.env.V) fs.appendFileSync(OUT + 'mg.txt', JSON.stringify({s:st.mgStep,t:st.mgText.slice(0,30),b:st.mgBtns,d:st.mgDone}) + '\n');
      await sigShot('mg' + st.mgStep + st.mgTitle, 'mg-' + st.mgTitle.slice(0, 10));
      const en = st.mgBtns.filter(b => !b.dis);
      if (st.mgBtns.length === 1 && st.mgBtns[0].act && !st.mgDone) {
        const t = st.mgText;
        if (/今だ|ぴったり|くっきり|安定した|映ってきた/.test(t)) { await p.click('.mg-actions .choice'); await p.waitForTimeout(400); return 'busy'; }
        if (/傾き/.test(t)) { await p.keyboard.press(/右に/.test(t) ? 'ArrowLeft' : 'ArrowRight'); await p.waitForTimeout(160); return 'busy'; }
        if (/タップ|十字キー|もう少し/.test(t)) {
          const found = await S(async () => { const c = document.querySelector('.mg-scene'), r = c.getBoundingClientRect(), w = c.width, h = c.height, sc = Math.min(r.width / w, r.height / h), ox = r.left + (r.width - w * sc) / 2, oy = r.top + (r.height - h * sc) / 2;
            for (let y = 4; y < h; y += 5) for (let x = 4; x < w; x += 5) { c.dispatchEvent(new PointerEvent('pointerdown', { clientX: ox + x * sc, clientY: oy + y * sc, bubbles: true })); await new Promise(r => setTimeout(r, 0)); const tt = document.querySelector('.mg-text').textContent; if (/ぴったり|映ってきた/.test(tt)) return x + ',' + y; } return null; });
          log.push('tap-search ' + found); await p.waitForTimeout(200); return 'busy';
        }
        if (/待/.test(t)) { await p.waitForTimeout(120); return 'busy'; }
        await p.click('.mg-actions .choice'); await p.waitForTimeout(400); return 'busy';
      }
      if (en.length >= 1 && !st.mgDone) {
        texts.push('[MG-Q] ' + st.mgText + ' :: ' + st.mgBtns.map(b => b.t).join(' / '));
        const key = 'mg:' + st.mgText + en.map(b => b.t).join(); choiceTries[key] = (choiceTries[key] || 0); const k = choiceTries[key]++;
        const idxs = st.mgBtns.map((b, i) => b.dis ? -1 : i).filter(i => i >= 0); const i = idxs[k % idxs.length];
        await p.click('.mg-actions .choice:nth-child(' + (i + 1) + ')'); await p.waitForTimeout(300); return 'busy';
      }
      texts.push('[MG] ' + (st.mgSpeaker ? st.mgSpeaker + '「' : '') + st.mgText); await p.keyboard.press('Enter'); await p.waitForTimeout(230); return 'busy';
    }
    if (st.card) { texts.push('[CARD] ' + st.cardText.replace(/\n+/g, ' / ')); await sigShot('card' + st.cardText, 'card'); await p.waitForTimeout(400); await p.keyboard.press('Enter'); await p.waitForTimeout(350); return 'busy'; }
    if (st.menu) { await p.keyboard.press('Escape'); await p.waitForTimeout(300); return 'busy'; }
    if (st.choices) {
      const key = 'c:' + st.dlgText + st.choiceLabels.join(); choiceTries[key] = (choiceTries[key] || 0); const k = choiceTries[key]++;
      texts.push('[CHOICE] ' + st.dlgText + ' :: ' + st.choiceLabels.join(' / ')); await sigShot('ch' + key, 'choice');
      await p.click('#choices .choice:nth-child(' + ((k % st.choiceLabels.length) + 1) + ')'); await p.waitForTimeout(300); return 'busy';
    }
    if (st.dlg) {
      if (!st.dlgDone) { await p.keyboard.press('Enter'); await p.waitForTimeout(120); return 'busy'; }
      texts.push((st.dlgName ? st.dlgName + '「' : '　') + st.dlgText); await sigShot('d' + st.dlgName + st.dlgText.slice(0, 6), 'dlg');
      await p.keyboard.press('Enter'); await p.waitForTimeout(220); return 'busy';
    }
    if (st.fader || st.busy) { await p.waitForTimeout(150); return 'busy'; }
    return 'idle';
  };
  const settle = async (max = 4000) => { let idle = 0; for (let i = 0; i < max; i++) { const r = await tick(); if (r === 'idle') { idle++; if (idle >= 3) return true; await p.waitForTimeout(120); } else idle = 0; } issues.push('SETTLE TIMEOUT at ' + await stepNow()); return false; };
  // ---------- world helpers ----------
  const tp = (map, x, y, dir) => S(([m, x, y, d]) => { const sh = window.__kq.shell; sh.world.load(m, x, y, d, sh.followerIds()); sh.syncDerived(); }, [map, x, y, dir]);
  const keyOf = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  const step = async (dir) => { await p.keyboard.down(keyOf[dir]); await p.waitForTimeout(70); await p.keyboard.up(keyOf[dir]); await p.waitForTimeout(420); };
  const mapId = () => S(() => window.__kq.shell.world.map.id);
  const interactAt = async (map, x, y, dir) => { await tp(map, x, y, dir); await p.waitForTimeout(250); await S(() => { window.__kq.shell.interact(); }); await p.waitForTimeout(350); await settle(); };
  const talkTo = async (id) => {
    const spot = await S((id) => { const w = window.__kq.shell.world, n = w.map.npcs.find(n => n.id === id) || w.map.objects.find(o => o.talk === id); if (!n) return null; const c = [[0, 1, 'up'], [0, -1, 'down'], [-1, 0, 'right'], [1, 0, 'left']]; for (const [dx, dy, d] of c) { const x = n.x + dx, y = n.y + dy; if (w.walkable(x, y) && !w.npcAt(x, y)) return [w.map.id, x, y, d]; } return null; }, id);
    if (!spot) { issues.push('no spot to talk to ' + id + ' on ' + await mapId()); return; }
    await interactAt(...spot);
  };
  const walkInto = async (map, x, y, dir) => { await tp(map, x, y, dir); await p.waitForTimeout(250); await step(dir); await p.waitForTimeout(300); await settle(); };
  // ---------- play ----------
  await settle();
  let guard = 0, prev = '';
  const startT = Date.now();
  const plog = (x) => fs.appendFileSync(OUT + 'progress.txt', x + '\n');
  while (guard++ < 80) {
    const s = await stepNow(); const m = await mapId();
    log.push(`step ${s} on ${m}`); plog(`${Math.round((Date.now()-startT)/1000)}s step ${s} on ${m}`);
    if (s === prev) { /* same step again: try alternates below */ }
    const seenN = (globalThis.__seen = globalThis.__seen || {}); const n = seenN[s] = (seenN[s] || 0) + 1; const again = n > 1; prev = s; if (n > 8) { issues.push('STUCK at step ' + s); break; }
    switch (s) {
      case 'talkCareManager': await talkTo('careManager'); break;
      case 'getXray': { const f = await flags(); if (m !== 'store') { await walkInto('town', 11, 7, 'up'); break; } if (!f.storeTalked) await talkTo('storeStaff'); await talkTo('xrayCase'); break; }
      case 'returnCareManager': if (m === 'store') { await walkInto('store', 4, 7, 'down'); } await talkTo('careManager'); break;
      case 'goToPatient': { const f = await flags(); if (!f.moyaCleared) { await walkInto('town', 8, 21, 'left'); break; } await walkInto('town', 4, 21, 'up'); break; }
      case 'examine': await talkTo('ume'); break;
      case 'backToClinic': if (m !== 'town') await walkInto(m, 5, 7, 'down'); await walkInto('town', 8, 21, 'up'); break;
      case 'ch2Start': await walkInto('town', 10, 12, 'down'); break;
      case 'rushToTanaka': await walkInto('town', 3, 7, 'up'); break;
      case 'ecg': await talkTo(n % 2 ? 'tanaka' : 'nurse'); break;
      case 'nurseJoin': if (m === 'tanakaHouse' && again) await walkInto(m, 5, 7, 'down'); await talkTo('nurse'); break;
      case 'toPharmacy': if (m !== 'town' && m !== 'pharmacy') await walkInto(m, 5, 7, 'down'); if ((await mapId()) !== 'pharmacy') await walkInto('town', 22, 20, 'up'); await talkTo('pharmacist'); break;
      case 'toHaru': if (m === 'pharmacy') await walkInto('pharmacy', 4, 6, 'down'); if (!(await flags()).batCleared) await walkInto('town', 9, 21, 'right'); await walkInto('town', 12, 21, 'up'); break;
      case 'eyeExam': await talkTo('haru'); break;
      case 'hazards': for (const o of ['haruMedicine', 'hazardRug', 'hazardCord']) await talkTo(o); break;
      case 'medicine': await talkTo('haru'); break;
      case 'leaveHaru': if (m === 'haruHouse') await walkInto('haruHouse', 5, 7, 'down'); await walkInto('town', 12, 21, 'left'); break;
      case 'toCenter': if (m !== 'center') await walkInto('town', 12, 29, 'up'); await talkTo('liaison'); break;
      case 'gather': if (m === 'center') await walkInto('center', 5, 7, 'down'); if (!(await flags()).tsutaCleared) await walkInto('town', 8, 22, 'down'); await talkTo('massage'); await talkTo('kimuraDaughter'); break;
      case 'toKimura': await walkInto('town', 4, 29, 'up'); break;
      case 'echo': await talkTo(n % 2 ? 'kimura' : 'kimuraDaughterIn'); break;
      case 'outside': if (m === 'kimuraHouse') await walkInto('kimuraHouse', 5, 7, 'down'); await walkInto('town', 5, 29, 'right'); break;
      case 'boss': await walkInto('town', 11, 15, 'up'); break;
      case 'ending': await settle(); break;
      case 'free': break;
    }
    await settle();
    if (s === 'free') break;
  }
  const fin = await stepNow();
  await shot('final');
  // reload & continue check
  await p.reload(); await p.waitForTimeout(1200); await shot('after-reload-title');
  const contEnabled = await S(() => { const b = document.querySelector('[data-act="continue"]'); return b && !b.disabled && !b.classList.contains('is-disabled'); });
  fs.writeFileSync(OUT + 'texts.txt', texts.join('\n'));
  fs.writeFileSync(OUT + 'log.txt', log.join('\n'));
  console.log('FINAL STEP:', fin, '| loops:', guard, '| seconds:', Math.round((Date.now() - startT) / 1000), '| shots:', shotN, '| continue enabled after clear:', contEnabled);
  console.log('ISSUES (' + issues.length + '):\n' + issues.join('\n'));
  await b.close();
})();
