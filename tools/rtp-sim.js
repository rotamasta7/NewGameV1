// ============================================================
// Aussie Bites — RTP & feature simulation (virtual reel stop model)
// Mirrors the exact game logic: each reel picks ONE stop, shows 3 consecutive.
// Run: node tools/rtp-sim.js [spins]
// ============================================================
const fs = require('fs');
const path = require('path');
const jsDir = path.join(__dirname, '..', 'game', 'js');

// Load symbols.js — exports SYMBOLS, WILD, SCATTER, REEL_BASE, REEL_FEATURE, spinReel
const dataSrc =
  fs.readFileSync(path.join(jsDir, 'symbols.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(jsDir, 'paylines.js'), 'utf8') +
  '\n; return { SYMBOLS, PAYLINES, WILD, SCATTER, REEL_BASE, REEL_FEATURE, spinReel };';
const { SYMBOLS, PAYLINES, WILD, SCATTER, REEL_BASE, REEL_FEATURE, spinReel } =
  new Function(dataSrc)();

const REELS = 5, ROWS = 3;
const FREE_GAMES_BY_SCATTER = { 3: 12, 4: 15, 5: 20 };
const RETRIGGER_GAMES = 5;
const FEATURE_MULTIPLIER = 1;
const COLLECT_THRESHOLDS = [
  { at: 9,  wildReels: [4] },
  { at: 14, wildReels: [3, 4] },
  { at: 30, wildReels: [2, 3, 4] },
];

function generateGrid(reels, forcedWild) {
  const g = [];
  for (let r = 0; r < REELS; r++) {
    g[r] = forcedWild.includes(r) ? [WILD, WILD, WILD] : spinReel(reels[r]);
  }
  return g;
}
function applyExpandingWilds(grid, forcedWild) {
  for (let r = 0; r < REELS; r++) {
    if (forcedWild.includes(r)) continue;
    if (grid[r].some(s => s === WILD)) grid[r] = [WILD, WILD, WILD];
  }
}
function runLength(grid, line, sym) {
  let c = 0;
  for (let r = 0; r < REELS; r++) {
    const s = grid[r][line[r]];
    if (s === sym || s === WILD) c++; else break;
  }
  return c;
}
function firstNonWild(grid, line) {
  for (let r = 0; r < REELS; r++) {
    const s = grid[r][line[r]];
    if (s !== WILD && s !== SCATTER) return s;
  }
  return null;
}
function evaluate(grid, lineBet, nLines, totalBet) {
  let lineWin = 0;
  PAYLINES.slice(0, nLines).forEach(line => {
    const s0 = grid[0][line[0]];
    if (s0 === SCATTER) return;
    const cands = s0 === WILD ? [WILD, firstNonWild(grid, line)].filter(Boolean) : [s0];
    let best = 0;
    cands.forEach(sym => {
      const c = runLength(grid, line, sym);
      const p = (c >= 3 && SYMBOLS[sym].pays[c]) ? SYMBOLS[sym].pays[c] * lineBet : 0;
      if (p > best) best = p;
    });
    lineWin += best;
  });
  let scatterCount = 0;
  for (let r = 0; r < REELS; r++) for (let row = 0; row < ROWS; row++) if (grid[r][row] === SCATTER) scatterCount++;
  let scatterWin = 0;
  if (scatterCount >= 3 && SYMBOLS[SCATTER].pays[scatterCount]) scatterWin = SYMBOLS[SCATTER].pays[scatterCount] * totalBet;
  return { lineWin, scatterWin, scatterCount };
}
function simFeature(scatterCount, lineBet, nLines, totalBet) {
  let freeGames = FREE_GAMES_BY_SCATTER[scatterCount] || 12;
  let collected = 0, wildReels = [], reached = [], won = 0;
  while (freeGames > 0) {
    freeGames--;
    const grid = generateGrid(REEL_FEATURE, wildReels.slice());
    applyExpandingWilds(grid, wildReels);
    const o = evaluate(grid, lineBet, nLines, totalBet);
    won += Math.round(o.lineWin * FEATURE_MULTIPLIER) + o.scatterWin * FEATURE_MULTIPLIER;
    collected += o.scatterCount;
    COLLECT_THRESHOLDS.forEach(t => {
      if (collected >= t.at && !reached.includes(t.at)) { reached.push(t.at); wildReels = t.wildReels.slice(); }
    });
    if (o.scatterCount >= 3) freeGames += RETRIGGER_GAMES;
  }
  return won;
}

const SPINS = parseInt(process.argv[2] || '3000000', 10);
const nLines = 25, lineBet = 1, totalBet = 25;
let wagered = 0, baseReturn = 0, featureReturn = 0;
let hits = 0, featureTriggers = 0, featureWonSum = 0, biggestWin = 0;

// extra: scatter distribution
const scDist = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

for (let i = 0; i < SPINS; i++) {
  wagered += totalBet;
  const grid = generateGrid(REEL_BASE, []);
  const o = evaluate(grid, lineBet, nLines, totalBet);
  const spinWin = o.lineWin + o.scatterWin;
  baseReturn += spinWin;
  if (spinWin > 0) hits++;
  if (spinWin > biggestWin) biggestWin = spinWin;
  scDist[Math.min(5, o.scatterCount)]++;
  if (o.scatterCount >= 3) {
    featureTriggers++;
    const fw = simFeature(o.scatterCount, lineBet, nLines, totalBet);
    featureReturn += fw;
    featureWonSum += fw;
    if (fw > biggestWin) biggestWin = fw;
  }
}

const totalReturn = baseReturn + featureReturn;
const rtp = (totalReturn / wagered) * 100;
const baseRtp = (baseReturn / wagered) * 100;
const featRtp = (featureReturn / wagered) * 100;

console.log('================ Aussie Bites — RTP Simulation ================');
console.log(`Spins:                 ${SPINS.toLocaleString()}`);
console.log(`Bet config:            ${nLines} lines x ${lineBet} = ${totalBet}/spin`);
console.log('---------------------------------------------------------------');
console.log(`TOTAL RTP:             ${rtp.toFixed(2)}%   (target 94-96%)`);
console.log(`  base-game RTP:       ${baseRtp.toFixed(2)}%`);
console.log(`  feature RTP:         ${featRtp.toFixed(2)}%`);
console.log('---------------------------------------------------------------');
console.log(`Hit rate (base):       ${((hits / SPINS) * 100).toFixed(2)}%`);
console.log(`Feature triggers:      ${featureTriggers.toLocaleString()}`);
console.log(`Feature frequency:     1 in ${(SPINS / Math.max(1, featureTriggers)).toFixed(0)} spins`);
console.log(`Avg feature win:       ${(featureWonSum / Math.max(1, featureTriggers)).toFixed(0)} (${(featureWonSum / Math.max(1, featureTriggers) / totalBet).toFixed(1)}x bet)`);
console.log(`Biggest single win:    ${biggestWin.toLocaleString()} (${(biggestWin / totalBet).toFixed(0)}x bet)`);
console.log(`Scatter dist (0-5):    ${JSON.stringify(scDist)}`);
console.log('===============================================================');
