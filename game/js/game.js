// ============================================================
// Aussie Bites — More Chilli-style engine
// Base game + "Canteen Frenzy" free games with collect-to-escalate
// bonus reel sets, expanding Golden Gaytime wilds, anticipation reels,
// autoplay, win-line drawing and big-win coin FX.
// Fun credits only.
// ============================================================

// ---- Config (faithful to the More Chilli model) ----
const REELS = 5;
const ROWS = 3;
const START_CREDITS = 5000;

const LINE_OPTIONS = [1, 5, 10, 15, 20, 25];
const BET_PER_LINE_OPTIONS = [1, 2, 3, 5, 8, 10, 15, 20, 25];

const FREE_GAMES_BY_SCATTER = { 3: 12, 4: 15, 5: 20 }; // initial award
const RETRIGGER_GAMES = 5;            // 3+ scatters during the feature
// No flat multiplier — the bonus comes from the forced-wild escalating reels.
// With a proper virtual-reel-stop model the maths lands in the 94–96% target
// without needing a multiplier boost.
const FEATURE_MULTIPLIER = 1;
const COLLECT_THRESHOLDS = [          // collected Argo Cones -> wild reels
  { at: 9,  wildReels: [4],       label: 'Collect 14 for more reels!' },
  { at: 14, wildReels: [3, 4],    label: 'Collect 30 for more reels!' },
  { at: 30, wildReels: [2, 3, 4], label: 'MAXIMUM REELS!' },
];

// distinct-ish colours for the 25 numbered payline balls
const LINE_COLORS = [
  '#3fae49','#f4a72c','#2c7cf4','#9b4df4','#e23c3c','#19b3a6','#f45fa0','#7ac043',
  '#f4d03f','#5c6bc0','#ff7043','#26c6da','#ec407a','#8d6e63','#66bb6a','#ab47bc',
  '#ffa726','#42a5f5','#d4e157','#ef5350','#26a69a','#ffca28','#5c6bc0','#78909c','#9ccc65',
];

// ---- State ----
const state = {
  credits: START_CREDITS,
  lineIndex: LINE_OPTIONS.length - 1,        // default 25 lines
  betIndex: 0,                               // default 1 / line
  win: 0,
  spinning: false,
  auto: false,
  mode: 'base',                              // 'base' | 'feature'
  // feature state
  freeGames: 0,
  collected: 0,
  wildReels: [],                             // reels forced fully wild
  featureWonTotal: 0,
  reachedThresholds: [],
  grid: [],                                  // grid[reel][row] = symbol id
  lastWins: [],                              // last 3 non-zero wins
};

// ---- DOM ----
const el = {};
function cacheDom() {
  [
    'stage','machine','reels','credits','lines','betPerLine','totalBet','win',
    'banner','play','auto','autoCount','linesUp','linesDown','betUp','betDown',
    'linesLeft','linesRight','lineOverlay','collect','collectCount','collectGoal',
    'overlay','overlayCard','overlayMascot','overlayTitle','overlaySub','overlayBtn','fx',
    'lastWins',
  ].forEach(id => el[id] = document.getElementById(id));
}

const cells = []; // cells[reel][row]

// ============================================================
// Build / layout
// ============================================================
function buildLineNumbers() {
  el.linesLeft.innerHTML = '';
  el.linesRight.innerHTML = '';
  // split 1..25 left/right roughly like the cabinet (odds left-ish)
  for (let i = 0; i < 25; i++) {
    const n = i + 1;
    const ball = document.createElement('div');
    ball.className = 'line-num';
    ball.dataset.line = i;
    ball.textContent = n;
    ball.style.background = LINE_COLORS[i];
    (i % 2 === 0 ? el.linesLeft : el.linesRight).appendChild(ball);
  }
}

function buildGrid() {
  el.reels.innerHTML = '';
  for (let r = 0; r < REELS; r++) {
    const col = document.createElement('div');
    col.className = 'reel';
    cells[r] = [];
    const window3 = spinReel(REEL_BASE[r]);
    state.grid[r] = window3.slice();
    for (let row = 0; row < ROWS; row++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      col.appendChild(cell);
      cells[r][row] = cell;
      paintCell(cell, window3[row]);
    }
    el.reels.appendChild(col);
  }
}

function paintCell(cell, id, opts = {}) {
  const s = SYMBOLS[id];
  cell.style.background = opts.expand ? '' : s.color;
  cell.className = 'cell'
    + (s.role === 'scatter' ? ' scatter' : '')
    + (s.role === 'wild' ? ' wild' : '')
    + (opts.expand ? ' wild-expand' : '')
    + (opts.dim ? ' dim' : '');
  let tag = '';
  if (s.role === 'scatter') tag = '<span class="sym-tag">SCAT</span>';
  else if (s.role === 'wild') tag = '<span class="sym-tag">WILD</span>';
  cell.innerHTML = `${tag}<span class="sym-emoji">${s.emoji}</span><span class="sym-label">${s.label}</span>`;
}


function scaleMachine() {
  const m = el.machine;
  m.style.transform = 'scale(1)';
  const mw = m.offsetWidth, mh = m.offsetHeight;
  const scale = Math.min((window.innerWidth - 8) / mw, (window.innerHeight - 8) / mh, 1.5);
  m.style.transformOrigin = 'center center';
  m.style.transform = `scale(${scale})`;
}

// ============================================================
// Bet helpers
// ============================================================
function lineCount() { return LINE_OPTIONS[state.lineIndex]; }
function betPerLine() { return BET_PER_LINE_OPTIONS[state.betIndex]; }
function totalBet() { return lineCount() * betPerLine(); }
function activeLines() { return PAYLINES.slice(0, lineCount()); }

function render() {
  el.credits.textContent = state.credits.toLocaleString();
  el.lines.textContent = lineCount();
  el.betPerLine.textContent = betPerLine();
  el.totalBet.textContent = totalBet();
  el.win.textContent = state.win.toLocaleString();
  // light the active payline balls
  document.querySelectorAll('.line-num').forEach(b => {
    const idx = +b.dataset.line;
    b.classList.toggle('off', idx >= lineCount());
  });
}

// ============================================================
// Spin
// ============================================================
function pressPlay() {
  if (state.mode === 'feature') return;        // feature auto-runs
  if (state.spinning) return;
  const bet = totalBet();
  if (state.credits < bet) {
    if (state.credits <= 0) { topUp(); return; }
    flashBanner('Lower your bet — not enough credits');
    return;
  }
  state.credits -= bet;
  state.win = 0;
  render();
  doSpin({ reels: REEL_BASE, forcedWild: [], multiplier: 1, free: false });
}

function topUp() {
  state.credits += 1000;
  render();
  flashBanner('Have 1,000 credits on the house 🍦');
}

// Core spin animation. Pre-rolls the result, then stops reels left→right
// with an anticipation slow-down on the last reels when 2 scatters are in.
function doSpin({ reels, forcedWild, multiplier, free }) {
  state.spinning = true;
  el.play.disabled = true;
  clearWinLines();
  setBanner('Good luck!');

  // Pre-roll final grid
  const result = generateGrid(reels, forcedWild);

  // Decide anticipation: count scatters that will show in reels 0..2
  let earlyScatters = 0;
  for (let r = 0; r < 3; r++)
    for (let row = 0; row < ROWS; row++)
      if (result[r][row] === SCATTER) earlyScatters++;
  const anticipate = earlyScatters >= 2;

  // start all reels blurring — forced-wild reels stay static golden (no spinner)
  const spinners = [];
  for (let r = 0; r < REELS; r++) {
    if (forcedWild.includes(r)) {
      for (let row = 0; row < ROWS; row++) paintCell(cells[r][row], WILD, { expand: true });
      spinners[r] = null;
    } else {
      el.reels.children[r].classList.add('spinning');
      spinners[r] = setInterval(() => {
        const w = spinReel(reels[r]);
        for (let row = 0; row < ROWS; row++) paintCell(cells[r][row], w[row]);
      }, 55);
    }
  }

  // staggered stops
  let stopDelay = 0;
  for (let r = 0; r < REELS; r++) {
    let gap = 360 + r * 200;
    if (anticipate && r >= 3) gap += (r - 2) * 650; // drag out reels 4 & 5
    stopDelay = gap;
    ((reel, delay) => {
      setTimeout(() => {
        const isForced = forcedWild.includes(reel);
        if (!isForced) {
          if (anticipate && reel >= 3) el.reels.children[reel].classList.add('anticipating');
          clearInterval(spinners[reel]);
          el.reels.children[reel].classList.remove('spinning');
        }
        for (let row = 0; row < ROWS; row++) {
          state.grid[reel][row] = result[reel][row];
          paintCell(cells[reel][row], result[reel][row], isForced ? { expand: true } : {});
        }
        if (!isForced && reel >= 3) {
          setTimeout(() => el.reels.children[reel].classList.remove('anticipating'), 250);
        }
        if (reel === REELS - 1) {
          setTimeout(() => resolveSpin({ multiplier, free }), 260);
        }
      }, delay);
    })(r, stopDelay);
  }
}

// Build a result grid from reel strips, forcing some reels fully wild.
function generateGrid(reels, forcedWild) {
  const g = [];
  for (let r = 0; r < REELS; r++) {
    if (forcedWild.includes(r)) {
      g[r] = [WILD, WILD, WILD];
    } else {
      g[r] = spinReel(reels[r]);
    }
  }
  return g;
}

// In the feature, a Golden Gaytime landing anywhere on a reel expands to fill
// that whole reel. Returns the list of reels that expanded (for animation).
function applyExpandingWilds(forcedWild) {
  const expanded = [];
  for (let r = 0; r < REELS; r++) {
    if (forcedWild.includes(r)) continue;
    let hasWild = false;
    for (let row = 0; row < ROWS; row++) if (state.grid[r][row] === WILD) hasWild = true;
    if (hasWild) {
      for (let row = 0; row < ROWS; row++) { state.grid[r][row] = WILD; }
      expanded.push(r);
    }
  }
  return expanded;
}

// ============================================================
// Resolve a completed spin
// ============================================================
function resolveSpin({ multiplier, free }) {
  // feature: expand wilds before evaluating
  let expandedReels = [];
  if (state.mode === 'feature') {
    expandedReels = applyExpandingWilds(state.wildReels);
    expandedReels.forEach(r => {
      for (let row = 0; row < ROWS; row++) paintCell(cells[r][row], WILD, { expand: true });
    });
    // keep the threshold-forced reels visibly wild too
    state.wildReels.forEach(r => {
      for (let row = 0; row < ROWS; row++) paintCell(cells[r][row], WILD, { expand: true });
    });
  }

  const outcome = evaluate(state.grid, betPerLine(), lineCount());
  const win = Math.round(outcome.lineWin * multiplier) + outcome.scatterWin * multiplier;

  // count + flag scatters
  highlightScatters(outcome.scatterCells);

  if (win > 0) {
    state.win = win;
    state.credits += win;
    if (state.mode === 'feature') state.featureWonTotal += win;
    drawWinLines(outcome.lines);
    highlightLineCells(outcome.lines);
    announceWin(win);
    coinBurst(win);
    recordWin(win);
  } else {
    state.win = 0;
    if (state.mode === 'base') setBanner(outcome.scatterCount === 2 ? 'So close!' : 'Spin to play');
  }
  render();

  // Scatter handling
  if (outcome.scatterCount >= 3) {
    if (state.mode === 'base') {
      finishSpinFlag();
      setTimeout(() => triggerFeature(outcome.scatterCount), 700);
      return;
    } else {
      // retrigger
      state.freeGames += RETRIGGER_GAMES;
      flashBanner(`Retrigger! +${RETRIGGER_GAMES} free games`);
    }
  }

  if (state.mode === 'feature') {
    const before = state.collected;
    state.collected += outcome.scatterCount;
    if (outcome.scatterCount > 0) bumpCollect();
    finishSpinFlag();
    // checkThresholds returns true if an overlay was shown; nextFreeGame fires from onClose
    const thresholdFired = checkThresholds(before, nextFreeGame);
    if (!thresholdFired) setTimeout(nextFreeGame, win > 0 ? 1300 : 750);
    return;
  }

  finishSpinFlag();
  // autoplay continues
  if (state.auto && state.mode === 'base') {
    setTimeout(() => { if (state.auto) pressPlay(); }, win > 0 ? 1300 : 650);
  }
}

function finishSpinFlag() {
  state.spinning = false;
  if (state.mode === 'base') el.play.disabled = false;
}

// ============================================================
// Win evaluation
// ============================================================
function evaluate(grid, lineBet, nLines) {
  const lines = [];
  let lineWin = 0;
  const usedLines = PAYLINES.slice(0, nLines);

  usedLines.forEach((line, lineIndex) => {
    const s0 = grid[0][line[0]];
    if (s0 === SCATTER) return;                 // scatter never starts a line win

    // candidate base symbols to try
    const candidates = [];
    if (s0 === WILD) {
      candidates.push(WILD);
      const firstReal = firstNonWild(grid, line);
      if (firstReal) candidates.push(firstReal);
    } else {
      candidates.push(s0);
    }

    let best = { amount: 0, count: 0, sym: s0 };
    candidates.forEach(sym => {
      const count = runLength(grid, line, sym);
      const pay = (count >= 3 && SYMBOLS[sym].pays[count]) ? SYMBOLS[sym].pays[count] * lineBet : 0;
      if (pay > best.amount) best = { amount: pay, count, sym };
    });

    if (best.amount > 0) {
      lineWin += best.amount;
      lines.push({ lineIndex, count: best.count, sym: best.sym, line });
    }
  });

  // scatters anywhere
  const scatterCells = [];
  for (let r = 0; r < REELS; r++)
    for (let row = 0; row < ROWS; row++)
      if (grid[r][row] === SCATTER) scatterCells.push([r, row]);
  const scatterCount = scatterCells.length;
  let scatterWin = 0;
  if (scatterCount >= 3 && SYMBOLS[SCATTER].pays[scatterCount]) {
    scatterWin = SYMBOLS[SCATTER].pays[scatterCount] * totalBet();
  }

  return { lineWin, scatterWin, lines, scatterCount, scatterCells };
}

function runLength(grid, line, sym) {
  let count = 0;
  for (let r = 0; r < REELS; r++) {
    const s = grid[r][line[r]];
    if (s === sym || s === WILD) count++;
    else break;
  }
  return count;
}

function firstNonWild(grid, line) {
  for (let r = 0; r < REELS; r++) {
    const s = grid[r][line[r]];
    if (s !== WILD && s !== SCATTER) return s;
  }
  return null;
}

// ============================================================
// Win presentation
// ============================================================
function highlightLineCells(lines) {
  // dim everything first
  for (let r = 0; r < REELS; r++)
    for (let row = 0; row < ROWS; row++)
      cells[r][row].classList.add('dim');
  lines.forEach(({ count, line }) => {
    for (let r = 0; r < count; r++) {
      const c = cells[r][line[r]];
      c.classList.remove('dim');
      c.classList.add('hit');
    }
  });
  setTimeout(() => {
    document.querySelectorAll('.cell.hit').forEach(c => c.classList.remove('hit'));
    document.querySelectorAll('.cell.dim').forEach(c => c.classList.remove('dim'));
  }, 1500);
}

function highlightScatters(scatterCells) {
  if (scatterCells.length < 2) return;
  scatterCells.forEach(([r, row]) => cells[r][row].classList.add('scatter-hit'));
  setTimeout(() => document.querySelectorAll('.scatter-hit').forEach(c => c.classList.remove('scatter-hit')), 1500);
}

function drawWinLines(lines) {
  const svg = el.lineOverlay;
  svg.innerHTML = '';
  lines.forEach(({ count, line, lineIndex }) => {
    const pts = [];
    for (let r = 0; r < count; r++) {
      const x = ((r + 0.5) / REELS) * 1000;
      const y = ((line[r] + 0.5) / ROWS) * 600;
      pts.push(`${x},${y}`);
    }
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', pts.join(' '));
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', LINE_COLORS[lineIndex % LINE_COLORS.length]);
    poly.setAttribute('stroke-width', '6');
    poly.setAttribute('stroke-linejoin', 'round');
    poly.setAttribute('stroke-linecap', 'round');
    poly.setAttribute('opacity', '0.9');
    svg.appendChild(poly);
  });
  setTimeout(clearWinLines, 1500);
}
function clearWinLines() { el.lineOverlay.innerHTML = ''; }

function announceWin(win) {
  const bet = totalBet();
  const x = win / bet;
  let msg;
  if (x >= 100) msg = `MEGA WIN! ${win.toLocaleString()}`;
  else if (x >= 50) msg = `SUPER WIN! ${win.toLocaleString()}`;
  else if (x >= 20) msg = `BIG WIN! ${win.toLocaleString()}`;
  else if (x >= 5) msg = `NICE WIN ${win.toLocaleString()}`;
  else msg = `WIN ${win.toLocaleString()}`;
  flashBanner(msg);
}

// ============================================================
// Feature — Canteen Frenzy
// ============================================================
function triggerFeature(scatterCount) {
  const games = FREE_GAMES_BY_SCATTER[scatterCount] || 12;
  state.mode = 'feature';
  state.freeGames = games;
  state.collected = 0;
  state.wildReels = [];
  state.featureWonTotal = 0;
  state.reachedThresholds = [];
  el.machine.classList.remove('base-mode');
  el.machine.classList.add('feature-mode');
  updateCollectUI();
  showOverlay({
    mascot: '🤠',
    title: 'CANTEEN FRENZY!',
    sub: `${games} Free Games — collect Argo Cones to unlock wild reels!`,
    button: 'START',
    onClose: () => {
      // swap to the richer feature reel set
      setBanner(`${state.freeGames} free games`);
        nextFreeGame();
    },
  });
}

function nextFreeGame() {
  if (state.freeGames <= 0) { endFeature(); return; }
  state.freeGames--;
  setBanner(`${state.freeGames + 1} free games left · ${state.featureWonTotal.toLocaleString()} won`);
  doSpin({ reels: REEL_FEATURE, forcedWild: state.wildReels.slice(), multiplier: FEATURE_MULTIPLIER, free: true });
}

function checkThresholds(before, onDone) {
  let fired = false;
  COLLECT_THRESHOLDS.forEach(t => {
    if (state.collected >= t.at && before < t.at && !state.reachedThresholds.includes(t.at)) {
      state.reachedThresholds.push(t.at);
      state.wildReels = t.wildReels.slice();
      fired = true;
      // immediately paint newly-unlocked reels golden so the player sees the unlock
      state.wildReels.forEach(r => {
        for (let row = 0; row < ROWS; row++) paintCell(cells[r][row], WILD, { expand: true });
      });
      showOverlay({
        mascot: '🍦',
        title: `${t.at} COLLECTED!`,
        sub: t.at >= 30 ? 'Reels 3-5 are WILD!' : `Reel${t.wildReels.length > 1 ? 's' : ''} ${t.wildReels.map(r => r + 1).join(' & ')} now WILD!`,
        button: 'KEEP GOING',
        auto: 2200,
        onClose: () => { if (onDone) onDone(); },
      });
    }
  });
  return fired;
}

function endFeature() {
  const won = state.featureWonTotal;
  showOverlay({
    mascot: '🏆',
    title: 'FRENZY COMPLETE',
    sub: `You won ${won.toLocaleString()} credits!`,
    button: 'COLLECT',
    onClose: () => {
      state.mode = 'base';
      state.wildReels = [];
      el.machine.classList.remove('feature-mode');
      el.machine.classList.add('base-mode');
      setBanner('Spin to play');
      render();
      el.play.disabled = false;
      if (state.auto) setTimeout(() => { if (state.auto) pressPlay(); }, 600);
    },
  });
}

// ---- collect meter UI ----
function updateCollectUI() {
  el.collectCount.textContent = state.collected;
  const next = COLLECT_THRESHOLDS.find(t => state.collected < t.at);
  el.collectGoal.textContent = next ? `Collect ${next.at} for more reels!` : 'MAXIMUM REELS!';
}
function bumpCollect() {
  updateCollectUI();
  el.collect.classList.add('pop');
  setTimeout(() => el.collect.classList.remove('pop'), 400);
}

// ---- last 3 wins ----
function recordWin(win) {
  state.lastWins.unshift(win);
  if (state.lastWins.length > 3) state.lastWins.pop();
  updateLastWins();
}
function updateLastWins() {
  const items = [];
  for (let i = 0; i < 3; i++) {
    const w = state.lastWins[i];
    items.push(w != null
      ? `<span class="lw-val${i === 0 ? ' lw-new' : ''}">${w.toLocaleString()}</span>`
      : '<span class="lw-val lw-empty">—</span>');
  }
  el.lastWins.innerHTML = items.join('<span class="lw-sep">·</span>');
}

// ============================================================
// Overlay
// ============================================================
let overlayTimer = null;
function showOverlay({ mascot, title, sub, button, onClose, auto }) {
  el.overlayMascot.textContent = mascot;
  el.overlayTitle.textContent = title;
  el.overlaySub.textContent = sub;
  el.overlayBtn.textContent = button;
  el.overlay.classList.remove('hidden');
  const close = () => {
    if (overlayTimer) { clearTimeout(overlayTimer); overlayTimer = null; }
    el.overlay.classList.add('hidden');
    el.overlayBtn.onclick = null;
    if (onClose) onClose();
  };
  el.overlayBtn.onclick = close;
  if (auto) overlayTimer = setTimeout(close, auto);
}

// ============================================================
// Banner
// ============================================================
function setBanner(t) { el.banner.textContent = t; }
function flashBanner(t) {
  setBanner(t);
  el.banner.classList.remove('flash');
  void el.banner.offsetWidth; // restart animation
  el.banner.classList.add('flash');
}

// ============================================================
// Coin burst FX (canvas)
// ============================================================
let fxCtx, fxParticles = [], fxRunning = false;
function setupFx() {
  el.fx.width = window.innerWidth;
  el.fx.height = window.innerHeight;
  fxCtx = el.fx.getContext('2d');
}
function coinBurst(win) {
  const bet = totalBet();
  if (win < bet * 5) return;                 // only celebrate decent wins
  const n = Math.min(120, 20 + Math.floor(win / bet));
  for (let i = 0; i < n; i++) {
    fxParticles.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 8,
      vy: -6 - Math.random() * 8,
      r: 6 + Math.random() * 6,
      hue: 45 + Math.random() * 10,
      life: 1,
    });
  }
  if (!fxRunning) { fxRunning = true; requestAnimationFrame(fxTick); }
}
function fxTick() {
  fxCtx.clearRect(0, 0, el.fx.width, el.fx.height);
  fxParticles.forEach(p => {
    p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.life -= 0.008;
    fxCtx.globalAlpha = Math.max(0, p.life);
    fxCtx.fillStyle = `hsl(${p.hue},90%,55%)`;
    fxCtx.beginPath(); fxCtx.ellipse(p.x, p.y, p.r, p.r * 0.7, 0, 0, Math.PI * 2); fxCtx.fill();
    fxCtx.fillStyle = `hsl(${p.hue},90%,75%)`;
    fxCtx.beginPath(); fxCtx.ellipse(p.x - p.r * 0.3, p.y - p.r * 0.2, p.r * 0.4, p.r * 0.3, 0, 0, Math.PI * 2); fxCtx.fill();
  });
  fxCtx.globalAlpha = 1;
  fxParticles = fxParticles.filter(p => p.life > 0 && p.y < el.fx.height + 40);
  if (fxParticles.length) requestAnimationFrame(fxTick);
  else { fxRunning = false; fxCtx.clearRect(0, 0, el.fx.width, el.fx.height); }
}

// ============================================================
// Controls
// ============================================================
function wireControls() {
  el.play.addEventListener('click', pressPlay);
  el.auto.addEventListener('click', () => {
    state.auto = !state.auto;
    el.auto.classList.toggle('on', state.auto);
    el.autoCount.textContent = state.auto ? 'ON' : 'OFF';
    if (state.auto && !state.spinning && state.mode === 'base') pressPlay();
  });
  el.linesUp.addEventListener('click', () => { if (!state.spinning) { state.lineIndex = Math.min(LINE_OPTIONS.length - 1, state.lineIndex + 1); render(); } });
  el.linesDown.addEventListener('click', () => { if (!state.spinning) { state.lineIndex = Math.max(0, state.lineIndex - 1); render(); } });
  el.betUp.addEventListener('click', () => { if (!state.spinning) { state.betIndex = Math.min(BET_PER_LINE_OPTIONS.length - 1, state.betIndex + 1); render(); } });
  el.betDown.addEventListener('click', () => { if (!state.spinning) { state.betIndex = Math.max(0, state.betIndex - 1); render(); } });
  document.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); pressPlay(); }
  });
  window.addEventListener('resize', () => { scaleMachine(); setupFx(); });
}

// ============================================================
// Boot
// ============================================================
function init() {
  cacheDom();
  buildLineNumbers();
  buildGrid();
  wireControls();
  render();
  scaleMachine();
  setupFx();
  setBanner('SPIN TO PLAY');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
