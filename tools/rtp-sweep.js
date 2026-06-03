// Quick sweep of reel-strip configs to find one that lands 94–96% total RTP.
// Each config varies: strip total size, GAYTIME weight, ARGO weight, feature mult.
// Run: node tools/rtp-sweep.js
const fs = require('fs'), path = require('path');
const jsDir = path.join(__dirname, '..', 'game', 'js');
const pls = fs.readFileSync(path.join(jsDir, 'paylines.js'), 'utf8');
const PAYLINES = new Function(pls + '; return PAYLINES;')();

// Paytable stays constant — only strip weights change.
const PAYS = {
  GAYTIME: { pays: { 3: 30, 4: 125, 5: 400 }, role: 'wild' },
  ARGO:    { pays: { 3:  2, 4:   8, 5:  40 }, role: 'scatter' },
  BILL:    { pays: { 3: 15, 4:  60, 5: 250 }, role: 'pay' },
  TIMTAM:  { pays: { 3: 12, 4:  40, 5: 175 }, role: 'pay' },
  VOVO:    { pays: { 3:  8, 4:  28, 5: 100 }, role: 'pay' },
  CONE:    { pays: { 3:  6, 4:  20, 5:  80 }, role: 'pay' },
  RAINBOW: { pays: { 3:  5, 4:  15, 5:  60 }, role: 'pay' },
  NICE:    { pays: { 3:  4, 4:  12, 5:  40 }, role: 'pay' },
  SCOTCH:  { pays: { 3:  3, 4:   8, 5:  30 }, role: 'pay' },
  TEDDY:   { pays: { 3:  3, 4:   7, 5:  25 }, role: 'pay' },
};
const WILD = 'GAYTIME', SCATTER = 'ARGO';
const REELS = 5, ROWS = 3;
const COLLECT_THRESHOLDS = [
  { at: 9,  wildReels: [4] },
  { at: 14, wildReels: [3, 4] },
  { at: 30, wildReels: [2, 3, 4] },
];
const FREE_GAMES_BY_SCATTER = { 3: 12, 4: 15, 5: 20 };
const RETRIGGER = 5;
const SPINS = 800000;

function buildStrip(weights) {
  const s = [];
  for (const [k, v] of Object.entries(weights)) for (let i = 0; i < v; i++) s.push(k);
  return s;
}
function rng(strip) { return strip[(Math.random() * strip.length) | 0]; }
function runLen(grid, line, sym) {
  let c = 0;
  for (let r = 0; r < REELS; r++) {
    const s = grid[r][line[r]];
    if (s === sym || s === WILD) c++; else break;
  }
  return c;
}
function fnw(grid, line) {
  for (let r = 0; r < REELS; r++) { const s = grid[r][line[r]]; if (s !== WILD && s !== SCATTER) return s; }
  return null;
}
function genGrid(strips, forced) {
  const g = [];
  for (let r = 0; r < REELS; r++) {
    g[r] = [];
    if (forced.includes(r)) { for (let row = 0; row < ROWS; row++) g[r][row] = WILD; }
    else for (let row = 0; row < ROWS; row++) g[r][row] = rng(strips[r]);
  }
  return g;
}
function expandWilds(g, forced) {
  for (let r = 0; r < REELS; r++) {
    if (forced.includes(r)) continue;
    if (g[r].some(s => s === WILD)) for (let row = 0; row < ROWS; row++) g[r][row] = WILD;
  }
}
function evalGrid(g, lineBet, nLines, totalBet) {
  let lw = 0;
  PAYLINES.slice(0, nLines).forEach(line => {
    const s0 = g[0][line[0]];
    if (s0 === SCATTER) return;
    const cands = s0 === WILD ? [WILD, fnw(g, line)].filter(Boolean) : [s0];
    let best = 0;
    cands.forEach(sym => {
      const c = runLen(g, line, sym);
      const p = (c >= 3 && PAYS[sym].pays[c]) ? PAYS[sym].pays[c] * lineBet : 0;
      if (p > best) best = p;
    });
    lw += best;
  });
  let sc = 0;
  for (let r = 0; r < REELS; r++) for (let row = 0; row < ROWS; row++) if (g[r][row] === SCATTER) sc++;
  const sw = sc >= 3 && PAYS.ARGO.pays[sc] ? PAYS.ARGO.pays[sc] * totalBet : 0;
  return { lw, sw, sc };
}
function simFeature(sc, baseStrips, featStrips, lineBet, nLines, totalBet, mult) {
  let fg = FREE_GAMES_BY_SCATTER[sc] || 12, col = 0, wr = [], reached = [], won = 0;
  while (fg > 0) {
    fg--;
    const g = genGrid(featStrips, wr.slice());
    expandWilds(g, wr);
    const o = evalGrid(g, lineBet, nLines, totalBet);
    won += Math.round(o.lw * mult) + o.sw * mult;
    col += o.sc;
    COLLECT_THRESHOLDS.forEach(t => {
      if (col >= t.at && !reached.includes(t.at)) { reached.push(t.at); wr = t.wildReels.slice(); }
    });
    if (o.sc >= 3) fg += RETRIGGER;
  }
  return won;
}

// configs to test: [gaytime_base, argo_base, low_scale, feature_mult, label]
const configs = [
  // vary GAYTIME and strip density
  [3, 2, 1.0, 2, 'G3 A2 lowx1.0 m2'],
  [4, 2, 1.0, 2, 'G4 A2 lowx1.0 m2'],
  [5, 2, 1.0, 2, 'G5 A2 lowx1.0 m2'],
  [4, 2, 0.7, 2, 'G4 A2 lowx0.7 m2'],
  [4, 2, 0.7, 3, 'G4 A2 lowx0.7 m3'],
  [5, 2, 0.7, 2, 'G5 A2 lowx0.7 m2'],
  [5, 2, 0.7, 3, 'G5 A2 lowx0.7 m3'],
  [4, 2, 0.5, 2, 'G4 A2 lowx0.5 m2'],
  [5, 2, 0.5, 2, 'G5 A2 lowx0.5 m2'],
  [5, 2, 0.5, 3, 'G5 A2 lowx0.5 m3'],
  [6, 2, 0.7, 2, 'G6 A2 lowx0.7 m2'],
  [6, 2, 0.5, 2, 'G6 A2 lowx0.5 m2'],
];

console.log('Config                   | Total RTP | Base RTP | Feat RTP | Trig 1in | AvgFeat×');
console.log('-------------------------|-----------|----------|----------|----------|--------');
for (const [gw, aw, ls, fm, label] of configs) {
  // build strips using scaled low weights
  const lowBase = { TEDDY: 9, SCOTCH: 8, NICE: 7, RAINBOW: 6, CONE: 5, VOVO: 5, TIMTAM: 3, BILL: 2 };
  const bw = {};
  for (const [k, v] of Object.entries(lowBase)) bw[k] = Math.max(1, Math.round(v * ls));
  bw.GAYTIME = gw; bw.ARGO = aw;
  const bs = [buildStrip(bw), buildStrip(bw), buildStrip(bw), buildStrip(bw), buildStrip(bw)];

  const fw = {};
  for (const [k, v] of Object.entries(lowBase)) fw[k] = Math.max(1, Math.round(v * ls * 0.75));
  fw.GAYTIME = gw + 2; fw.ARGO = aw + 2;
  const fs_ = [buildStrip(fw), buildStrip(fw), buildStrip(fw), buildStrip(fw), buildStrip(fw)];

  const nLines = 25, lineBet = 1, totalBet = 25;
  let wagered = 0, baseRet = 0, featRet = 0, hits = 0, ftrig = 0, fwonSum = 0;
  for (let i = 0; i < SPINS; i++) {
    wagered += totalBet;
    const g = genGrid(bs, []);
    const o = evalGrid(g, lineBet, nLines, totalBet);
    baseRet += o.lw + o.sw;
    if (o.lw + o.sw > 0) hits++;
    if (o.sc >= 3) { ftrig++; const fw2 = simFeature(o.sc, bs, fs_, lineBet, nLines, totalBet, fm); featRet += fw2; fwonSum += fw2; }
  }
  const tot = (baseRet + featRet) / wagered * 100;
  const br = baseRet / wagered * 100;
  const fr = featRet / wagered * 100;
  const trig1in = ftrig > 0 ? Math.round(SPINS / ftrig) : 9999;
  const avgFx = ftrig > 0 ? ((fwonSum / ftrig / totalBet).toFixed(1)) : '-';
  const flag = (tot >= 90 && tot <= 100) ? ' <--' : '';
  console.log(`${label.padEnd(25)}| ${tot.toFixed(1).padStart(9)}%| ${br.toFixed(1).padStart(8)}%| ${fr.toFixed(1).padStart(8)}%| ${String(trig1in).padStart(8)} | ${String(avgFx).padStart(6)}${flag}`);
}
