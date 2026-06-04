// ============================================================
// Aussie Bites — More Chilli-style engine  v3
// Features: base game, Canteen Frenzy free games, collect-to-
// escalate wilds, expanding wilds, anticipation, near-miss,
// slam stop, big-win sequence, paytable, max-bet, gamble,
// autoplay modes, credit tick, win-line cycling, admin API.
// Fun credits only.
// ============================================================

// ---- Config ----
const REELS = 5;
const ROWS  = 3;
const START_CREDITS = 5000;

const LINE_OPTIONS         = [1, 5, 10, 15, 20, 25];
const BET_PER_LINE_OPTIONS = [1, 2, 3, 5, 8, 10, 15, 20, 25];

const FREE_GAMES_BY_SCATTER = { 3: 12, 4: 15, 5: 20 };
const RETRIGGER_GAMES       = 5;
const FEATURE_MULTIPLIER    = 1;
const COLLECT_THRESHOLDS    = [
  { at:  9, wildReels: [4],       label: 'Collect 14 for more reels!' },
  { at: 14, wildReels: [3, 4],    label: 'Collect 30 for more reels!' },
  { at: 30, wildReels: [2, 3, 4], label: 'MAXIMUM REELS!' },
];

const MAX_GAMBLES    = 5;
const GAMBLE_TIMEOUT = 8000;

// Autoplay modes: { label, spins }  spins=-1 means infinite
const AUTO_MODES = [
  { label: 'OFF', spins: 0  },
  { label: '∞',   spins: -1 },
  { label: '10',  spins: 10 },
  { label: '25',  spins: 25 },
  { label: '50',  spins: 50 },
  { label: '100', spins: 100 },
];

const LINE_COLORS = [
  '#3fae49','#f4a72c','#2c7cf4','#9b4df4','#e23c3c','#19b3a6','#f45fa0','#7ac043',
  '#f4d03f','#5c6bc0','#ff7043','#26c6da','#ec407a','#8d6e63','#66bb6a','#ab47bc',
  '#ffa726','#42a5f5','#d4e157','#ef5350','#26a69a','#ffca28','#5c6bc0','#78909c','#9ccc65',
];

// ---- State ----
const state = {
  credits:   START_CREDITS,
  lineIndex: LINE_OPTIONS.length - 1,
  betIndex:  0,
  win:       0,
  spinning:  false,
  // autoplay
  autoMode:          0,      // index into AUTO_MODES
  autoLeft:          0,      // spins remaining (-1 = infinite)
  autoStopOnFeature: false,
  autoStopWinX:      0,      // stop if win >= X * bet  (0 = disabled)
  get auto() { return this.autoMode !== 0; },
  // feature
  mode:             'base',
  freeGames:         0,
  freeGamesTotal:    0,
  freeGamesPlayed:   0,
  collected:         0,
  wildReels:         [],
  featureWonTotal:   0,
  reachedThresholds: [],
  grid:              [],
  // gamble
  gambleWin:   0,
  gamblesLeft: 0,
  // history
  lastWins: [],
  // session stats
  session: {
    spins:      0,
    wagered:    0,
    won:        0,
    biggestWin: 0,
    features:   0,
  },
};

// ---- DOM ----
const el = {};
function cacheDom() {
  [
    'stage','machine','reels','credits','lines','betPerLine','totalBet','win',
    'banner','play','auto','autoCount','linesUp','linesDown','betUp','betDown',
    'linesLeft','linesRight','lineOverlay','freeBadge','spinCounter',
    'collect','collectCount','collectGoal',
    'overlay','overlayCard','overlayMascot','overlayTitle','overlaySub','overlayBtn','fx',
    'lastWins',
    'gambleBar','gambleOffer','gambleBtn','collectBtn',
    'gambleOverlay','gamblePrompt','gambleChoices','gambleResult',
    'cardFace','gambleOutcome','gambleContinue',
    'muteBtn','maxBetBtn','paytableBtn','paytableOverlay','paytableClose','paytableTable',
  ].forEach(id => { const e = document.getElementById(id); if (e) el[id] = e; });
}

const cells = [];

// ============================================================
// Build / layout
// ============================================================
function buildLineNumbers() {
  el.linesLeft.innerHTML = '';
  el.linesRight.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const ball = document.createElement('div');
    ball.className = 'line-num';
    ball.dataset.line = i;
    ball.textContent = i + 1;
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
    const w3 = spinReel(REEL_BASE[r]);
    state.grid[r] = w3.slice();
    for (let row = 0; row < ROWS; row++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      col.appendChild(cell);
      cells[r][row] = cell;
      paintCell(cell, w3[row]);
    }
    el.reels.appendChild(col);
  }
}

function buildPaytable() {
  if (!el.paytableTable) return;
  const order = ['GAYTIME','ARGO','BILL','TIMTAM','VOVO','CONE','RAINBOW','NICE','SCOTCH','TEDDY'];
  el.paytableTable.innerHTML = order.map(id => {
    const s = SYMBOLS[id];
    const p = s.pays;
    const note = s.role === 'wild'
      ? '<span class="pt-role pt-wild">WILD — substitutes + expands in free games</span>'
      : s.role === 'scatter'
      ? '<span class="pt-role pt-scat">3+ anywhere triggers Canteen Frenzy!</span>'
      : '';
    return `<tr>
      <td><span class="pt-em" style="background:${s.color}">${s.emoji}</span></td>
      <td class="pt-name">${s.label}${note}</td>
      <td class="pt-p">${p[3]||'—'}</td>
      <td class="pt-p">${p[4]||'—'}</td>
      <td class="pt-p">${p[5]||'—'}</td>
    </tr>`;
  }).join('');
}

function paintCell(cell, id, opts = {}) {
  const s = SYMBOLS[id];
  cell.style.background = opts.expand ? '' : s.color;
  cell.className = 'cell'
    + (s.role === 'scatter' ? ' scatter'    : '')
    + (s.role === 'wild'    ? ' wild'       : '')
    + (opts.expand          ? ' wild-expand': '')
    + (opts.dim             ? ' dim'        : '');
  let tag = '';
  if (s.role === 'scatter') tag = '<span class="sym-tag">BONUS</span>';
  else if (s.role === 'wild') tag = '<span class="sym-tag">WILD</span>';
  const imgSrc = `images/${id.toLowerCase()}.png`;
  cell.innerHTML = `${tag}<img class="sym-img" src="${imgSrc}" alt="${s.label}"
    onload="this.parentElement.classList.add('has-img')"
    onerror="this.parentElement.classList.add('no-img')"><span class="sym-emoji">${s.emoji}</span>`;
}

function scaleMachine() {
  const m = el.machine;
  m.style.transform = 'scale(1)';
  const scale = Math.min(
    (window.innerWidth  - 8) / m.offsetWidth,
    (window.innerHeight - 8) / m.offsetHeight, 1.5);
  m.style.transformOrigin = 'center center';
  m.style.transform = `scale(${scale})`;
}

// ============================================================
// Bet helpers
// ============================================================
function lineCount()  { return LINE_OPTIONS[state.lineIndex]; }
function betPerLine() { return BET_PER_LINE_OPTIONS[state.betIndex]; }
function totalBet()   { return lineCount() * betPerLine(); }

function setMaxBet() {
  if (state.spinning) return;
  state.lineIndex = LINE_OPTIONS.length - 1;
  state.betIndex  = BET_PER_LINE_OPTIONS.length - 1;
  render();
  flashBanner(`Max bet — ${totalBet()} per spin`);
}

function render() {
  el.credits.textContent    = state.credits.toLocaleString();
  el.lines.textContent      = lineCount();
  el.betPerLine.textContent = betPerLine();
  el.totalBet.textContent   = totalBet();
  el.win.textContent        = state.win.toLocaleString();
  document.querySelectorAll('.line-num').forEach(b => {
    b.classList.toggle('off', +b.dataset.line >= lineCount());
  });
}

// ============================================================
// Autoplay
// ============================================================
function cycleAutoMode() {
  if (state.spinning) return;
  state.autoMode = (state.autoMode + 1) % AUTO_MODES.length;
  const m = AUTO_MODES[state.autoMode];
  state.autoLeft = m.spins;
  updateAutoBtn();
  if (state.auto && state.mode === 'base') pressPlay();
}

function updateAutoBtn() {
  const m = AUTO_MODES[state.autoMode];
  el.auto.classList.toggle('on', state.auto);
  if (state.autoLeft > 0) el.autoCount.textContent = state.autoLeft;
  else el.autoCount.textContent = m.label;
}

// Returns true if autoplay should continue. Call once per spin.
function tickAuto() {
  if (!state.auto) return false;
  if (state.autoLeft < 0) return true;  // infinite
  state.autoLeft--;
  if (state.autoLeft <= 0) {
    state.autoMode = 0;
    updateAutoBtn();
    return false;
  }
  updateAutoBtn();
  return true;
}

function stopAuto(reason) {
  state.autoMode = 0;
  updateAutoBtn();
  if (reason) flashBanner(reason);
}

// ============================================================
// Win line cycling
// ============================================================
let winCycleId = null;

function startWinCycle(lines, durationMs) {
  stopWinCycle();
  if (!lines.length) return;
  let idx = 0;
  function show() {
    clearAllHighlights();
    const l = lines[idx % lines.length];
    for (let r = 0; r < REELS; r++)
      for (let row = 0; row < ROWS; row++)
        cells[r][row].classList.add('dim');
    for (let r = 0; r < l.count; r++) {
      cells[r][l.line[r]].classList.remove('dim');
      cells[r][l.line[r]].classList.add('hit');
    }
    drawSingleWinLine(l);
    SFX.lineCycle();
    // Show line detail in banner
    const sym = SYMBOLS[l.sym] ? SYMBOLS[l.sym].label.toUpperCase() : l.sym;
    setBanner(`LINE ${l.lineIndex + 1}  ·  ${sym} ×${l.count}  =  ${l.amount}`);
    idx++;
  }
  show();
  winCycleId = setInterval(show, 650);
  setTimeout(stopWinCycle, durationMs);
}

function stopWinCycle() {
  if (winCycleId) { clearInterval(winCycleId); winCycleId = null; }
  clearAllHighlights();
  clearWinLines();
}

function clearAllHighlights() {
  document.querySelectorAll('.cell.hit,.cell.dim').forEach(c => c.classList.remove('hit','dim'));
}

function drawSingleWinLine({ count, line, lineIndex }) {
  el.lineOverlay.innerHTML = '';
  const pts = [];
  for (let r = 0; r < count; r++)
    pts.push(`${((r+.5)/REELS)*1000},${((line[r]+.5)/ROWS)*600}`);
  const poly = document.createElementNS('http://www.w3.org/2000/svg','polyline');
  poly.setAttribute('points', pts.join(' '));
  poly.setAttribute('fill','none');
  poly.setAttribute('stroke', LINE_COLORS[lineIndex % LINE_COLORS.length]);
  poly.setAttribute('stroke-width','8');
  poly.setAttribute('stroke-linejoin','round');
  poly.setAttribute('stroke-linecap','round');
  poly.setAttribute('opacity','0.95');
  el.lineOverlay.appendChild(poly);
}

// ============================================================
// Credit tick animation
// ============================================================
let creditTickId = null;
function animateCredits(from, to, ms) {
  if (creditTickId) { clearInterval(creditTickId); creditTickId = null; }
  const steps = Math.max(1, Math.round(ms / 40));
  const inc   = (to - from) / steps;
  let i = 0, cur = from;
  creditTickId = setInterval(() => {
    i++;
    cur += inc;
    if (i >= steps) {
      clearInterval(creditTickId); creditTickId = null;
      el.credits.textContent = to.toLocaleString();
    } else {
      el.credits.textContent = Math.round(cur).toLocaleString();
      if (i % 2 === 0) SFX.creditTick();
    }
  }, 40);
}

// ============================================================
// Big Win Sequence
// ============================================================
function showBigWinSequence(win, x, onDone) {
  let tier, col;
  if      (x >= 100) { tier = 'MEGA WIN';  col = '#ff5500'; }
  else if (x >=  50) { tier = 'SUPER WIN'; col = '#cc44ff'; }
  else               { tier = 'BIG WIN';   col = '#ffcc00'; }

  const screen = document.createElement('div');
  screen.id = 'bigWinScreen';
  screen.innerHTML = `
    <div class="bw-bg"></div>
    <div class="bw-content">
      <div class="bw-tier" style="color:${col}">${tier}</div>
      <div class="bw-amount">${win.toLocaleString()}</div>
      <div class="bw-tap">Tap to continue</div>
    </div>`;
  document.body.appendChild(screen);

  if (x >= 100) SFX.megaWin();
  else if (x >= 50) SFX.megaWin();
  else SFX.bigWin();

  let done = false;
  function finish() {
    if (done) return; done = true;
    screen.classList.add('bw-fade');
    setTimeout(() => { screen.remove(); if (onDone) onDone(); }, 350);
  }
  screen.addEventListener('click', finish);
  setTimeout(finish, 3500);
}

// ============================================================
// Slam stop
// ============================================================
let slamData = null;  // { spinners, timeouts, result, forcedWild, multiplier, free }

function slamStop() {
  if (!slamData) return;
  const { spinners, timeouts, result, forcedWild, multiplier, free } = slamData;
  slamData = null;
  timeouts.forEach(id => clearTimeout(id));
  spinners.forEach((id, r) => { if (id !== null) clearInterval(id); });
  for (let r = 0; r < REELS; r++) {
    el.reels.children[r].classList.remove('spinning','anticipating','super-anticipating');
    const isForced = forcedWild.includes(r);
    for (let row = 0; row < ROWS; row++) {
      state.grid[r][row] = result[r][row];
      paintCell(cells[r][row], result[r][row], isForced ? { expand: true } : {});
    }
  }
  el.play.querySelector('.round-top').textContent = 'PLAY';
  setTimeout(() => resolveSpin({ multiplier, free }), 80);
}

// ============================================================
// Spin
// ============================================================
function pressPlay() {
  if (state.mode === 'feature') return;
  if (state.spinning) { slamStop(); return; }   // slam stop
  dismissGamble(false);
  stopWinCycle();
  const bet = totalBet();
  if (state.credits < bet) {
    if (state.credits <= 0) { topUp(); return; }
    flashBanner('Lower your bet — not enough credits');
    return;
  }
  state.credits -= bet;
  state.win = 0;
  state.session.spins++;
  state.session.wagered += bet;
  render();
  SFX.spin();
  doSpin({ reels: REEL_BASE, forcedWild: [], multiplier: 1, free: false });
}

function topUp() {
  state.credits += 1000;
  render();
  flashBanner('Have 1,000 credits on the house 🍦');
}

function doSpin({ reels, forcedWild, multiplier, free }) {
  state.spinning = true;
  stopWinCycle();
  clearWinLines();
  setBanner('Good luck!');
  el.play.querySelector('.round-top').textContent = 'STOP';

  const result = generateGrid(reels, forcedWild);

  // ---- Anticipation analysis ----
  // earlyAnticipate: 2+ scatters in first 2 reels → anticipate from reel 2
  // normalAnticipate: 2+ scatters in first 3 reels → anticipate from reel 3
  // superAnticipate: 3+ scatters in first 4 reels → reel 4 gets extra intensity
  const hasScatter = result.map(col => col.some(s => s === SCATTER));
  const cumScatter = hasScatter.reduce((acc, h) => { acc.push((acc[acc.length-1]||0)+(h?1:0)); return acc; }, []);
  const earlyAnticipate  = cumScatter[1] >= 2;
  const normalAnticipate = !earlyAnticipate && cumScatter[2] >= 2;
  const anticipate       = earlyAnticipate || normalAnticipate;
  const anticipateFrom   = earlyAnticipate ? 2 : 3;
  const superAnticipate  = anticipate && (cumScatter[3] || 0) >= 3;

  // ---- Start spinners ----
  const spinners  = [];
  const timeouts  = [];
  let scatterLandCount  = 0;
  let anticipatePlayed  = false;

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

  slamData = { spinners, timeouts, result, forcedWild, multiplier, free };

  // ---- Staggered stops ----
  let stopDelay = 0;
  for (let r = 0; r < REELS; r++) {
    let gap = 360 + r * 200;
    if (anticipate && r >= anticipateFrom)          gap += (r - anticipateFrom + 1) * 680;
    if (superAnticipate && r === REELS - 1)         gap += 900;
    stopDelay = gap;

    ((reel, delay) => {
      const tid = setTimeout(() => {
        const isForced = forcedWild.includes(reel);
        if (!isForced) {
          const isAnticipating = anticipate && reel >= anticipateFrom;
          const isSuper        = superAnticipate && reel === REELS - 1;
          if (isSuper) {
            el.reels.children[reel].classList.add('super-anticipating');
            if (!anticipatePlayed) { SFX.anticipate(); anticipatePlayed = true; }
          } else if (isAnticipating) {
            el.reels.children[reel].classList.add('anticipating');
            if (!anticipatePlayed) { SFX.anticipate(); anticipatePlayed = true; }
          }
          clearInterval(spinners[reel]);
          el.reels.children[reel].classList.remove('spinning');
          // snap
          el.reels.children[reel].classList.add('snap');
          setTimeout(() => el.reels.children[reel].classList.remove('snap'), 200);
          SFX.reelStop(reel);
        }
        for (let row = 0; row < ROWS; row++) {
          state.grid[reel][row] = result[reel][row];
          paintCell(cells[reel][row], result[reel][row], isForced ? { expand: true } : {});
        }
        // Escalating scatter sound as each lands
        if (!isForced && hasScatter[reel]) {
          scatterLandCount++;
          SFX.scatterLand(scatterLandCount);
        }
        if (!isForced && reel >= anticipateFrom)
          setTimeout(() => {
            el.reels.children[reel].classList.remove('anticipating','super-anticipating');
          }, 250);
        if (reel === REELS - 1) {
          slamData = null;
          el.play.querySelector('.round-top').textContent = 'PLAY';
          setTimeout(() => resolveSpin({ multiplier, free }), 260);
        }
      }, delay);
      timeouts.push(tid);
    })(r, stopDelay);
  }
}

function generateGrid(reels, forcedWild) {
  const g = [];
  for (let r = 0; r < REELS; r++)
    g[r] = forcedWild.includes(r) ? [WILD, WILD, WILD] : spinReel(reels[r]);
  return g;
}

function applyExpandingWilds(forcedWild) {
  const expanded = [];
  for (let r = 0; r < REELS; r++) {
    if (forcedWild.includes(r)) continue;
    if (state.grid[r].some(s => s === WILD)) {
      for (let row = 0; row < ROWS; row++) state.grid[r][row] = WILD;
      expanded.push(r);
    }
  }
  return expanded;
}

// ============================================================
// Resolve
// ============================================================
function resolveSpin({ multiplier, free }) {
  if (state.mode === 'feature') {
    applyExpandingWilds(state.wildReels).forEach(r => {
      for (let row = 0; row < ROWS; row++) paintCell(cells[r][row], WILD, { expand: true });
    });
    state.wildReels.forEach(r => {
      for (let row = 0; row < ROWS; row++) paintCell(cells[r][row], WILD, { expand: true });
    });
  }

  const outcome = evaluate(state.grid, betPerLine(), lineCount());
  const win    = Math.round(outcome.lineWin * multiplier) + outcome.scatterWin * multiplier;
  const x      = win > 0 ? win / totalBet() : 0;
  const tickMs = win > 0 ? Math.min(3500, Math.max(900, x * 420)) : 0;

  highlightScatters(outcome.scatterCells);

  if (win > 0) {
    const prevCredits = state.credits;
    state.win = win;
    state.credits += win;
    state.session.won += win;
    if (win > state.session.biggestWin) state.session.biggestWin = win;
    if (state.mode === 'feature') state.featureWonTotal += win;

    animateCredits(prevCredits, state.credits, tickMs);
    startWinCycle(outcome.lines, tickMs);
    recordWin(win);

    if (x >= 20) {
      // Big/Super/Mega — show full-screen sequence (non-blocking)
      showBigWinSequence(win, x, null);
    } else {
      announceWin(win);
      if (x >= 5) SFX.bigWin(); else SFX.smallWin();
    }
    coinBurst(win);
  } else {
    state.win = 0;
    render();
    if (state.mode === 'base') setBanner(outcome.scatterCount === 2 ? 'So close!' : 'Spin to play');
  }

  // Scatter trigger / retrigger
  if (outcome.scatterCount >= 3) {
    if (state.mode === 'base') {
      state.session.features++;
      finishSpinFlag();
      SFX.featureStart();
      if (state.auto && state.autoStopOnFeature) stopAuto('Auto stopped — feature triggered');
      setTimeout(() => triggerFeature(outcome.scatterCount), 700);
      return;
    } else {
      state.freeGames      += RETRIGGER_GAMES;
      state.freeGamesTotal += RETRIGGER_GAMES;
      flashBanner(`Retrigger! +${RETRIGGER_GAMES} free games`);
    }
  }

  if (state.mode === 'feature') {
    const before = state.collected;
    state.collected += outcome.scatterCount;
    if (outcome.scatterCount > 0) bumpCollect();
    finishSpinFlag();
    const thresholdFired = checkThresholds(before, nextFreeGame);
    if (!thresholdFired) {
      const delay = win > 0 ? Math.min(4000, 900 + x * 450) : 750;
      setTimeout(nextFreeGame, delay);
    }
    return;
  }

  // Base game finish
  finishSpinFlag();
  if (win > 0 && state.auto && state.autoStopWinX > 0 && x >= state.autoStopWinX) {
    stopAuto(`Auto stopped — big win (${Math.round(x)}× bet)`);
    offerGamble(win);
    return;
  }
  if (win > 0 && !state.auto) {
    offerGamble(win);
  } else if (state.auto) {
    if (tickAuto()) {
      setTimeout(pressPlay, win > 0 ? Math.max(1400, Math.min(4500, tickMs)) : 650);
    }
  }
}

// Need to reference tickMs from the outer block above — restructure slightly
// (This is handled by closure via the local variable created in each call)

function finishSpinFlag() {
  state.spinning = false;
  // play button text already reverted in doSpin stop handler; ensure it here too
  el.play.querySelector('.round-top').textContent = 'PLAY';
}

// ============================================================
// Win evaluation
// ============================================================
function evaluate(grid, lineBet, nLines) {
  const lines = [];
  let lineWin = 0;
  PAYLINES.slice(0, nLines).forEach((line, lineIndex) => {
    const s0 = grid[0][line[0]];
    if (s0 === SCATTER) return;
    const cands = s0 === WILD ? [WILD, firstNonWild(grid, line)].filter(Boolean) : [s0];
    let best = { amount: 0, count: 0, sym: s0 };
    cands.forEach(sym => {
      const count = runLength(grid, line, sym);
      const pay   = (count >= 3 && SYMBOLS[sym].pays[count]) ? SYMBOLS[sym].pays[count] * lineBet : 0;
      if (pay > best.amount) best = { amount: pay, count, sym };
    });
    if (best.amount > 0) {
      lineWin += best.amount;
      lines.push({ lineIndex, count: best.count, sym: best.sym, line, amount: best.amount });
    }
  });
  const scatterCells = [];
  for (let r = 0; r < REELS; r++)
    for (let row = 0; row < ROWS; row++)
      if (grid[r][row] === SCATTER) scatterCells.push([r, row]);
  const scatterCount = scatterCells.length;
  const scatterWin   = (scatterCount >= 3 && SYMBOLS[SCATTER].pays[scatterCount])
    ? SYMBOLS[SCATTER].pays[scatterCount] * totalBet() : 0;
  return { lineWin, scatterWin, lines, scatterCount, scatterCells };
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

// ============================================================
// Win presentation
// ============================================================
function highlightScatters(scatterCells) {
  if (scatterCells.length < 2) return;
  scatterCells.forEach(([r, row]) => cells[r][row].classList.add('scatter-hit'));
  setTimeout(() => document.querySelectorAll('.scatter-hit').forEach(c => c.classList.remove('scatter-hit')), 1500);
}

function announceWin(win) {
  const x = win / totalBet();
  let msg;
  if      (x >= 100) msg = `MEGA WIN! ${win.toLocaleString()}`;
  else if (x >= 50)  msg = `SUPER WIN! ${win.toLocaleString()}`;
  else if (x >= 20)  msg = `BIG WIN! ${win.toLocaleString()}`;
  else if (x >= 5)   msg = `NICE WIN ${win.toLocaleString()}`;
  else               msg = `WIN ${win.toLocaleString()}`;
  flashBanner(msg);
}

function clearWinLines() { if (el.lineOverlay) el.lineOverlay.innerHTML = ''; }

// ============================================================
// Paytable
// ============================================================
function openPaytable() {
  el.paytableOverlay.classList.remove('hidden');
}
function closePaytable() {
  el.paytableOverlay.classList.add('hidden');
}

// ============================================================
// Gamble feature
// ============================================================
let gambleTimer = null;

function offerGamble(win) {
  state.gambleWin   = win;
  state.gamblesLeft = MAX_GAMBLES;
  el.gambleOffer.textContent = `Double ${win.toLocaleString()}?`;
  el.gambleBar.classList.remove('hidden');
  gambleTimer = setTimeout(() => dismissGamble(false), GAMBLE_TIMEOUT);
}

function dismissGamble(startAuto = true) {
  if (gambleTimer) { clearTimeout(gambleTimer); gambleTimer = null; }
  el.gambleBar.classList.add('hidden');
  state.gambleWin = 0;
  if (startAuto && state.auto) {
    if (tickAuto()) setTimeout(pressPlay, 400);
  }
}

function openGambleOverlay() {
  if (gambleTimer) { clearTimeout(gambleTimer); gambleTimer = null; }
  el.gambleBar.classList.add('hidden');
  el.gambleResult.classList.add('hidden');
  el.gambleChoices.classList.remove('hidden');
  el.gamblePrompt.textContent = `Gamble ${state.gambleWin.toLocaleString()} — pick Red or Black`;
  el.gambleOverlay.classList.remove('hidden');
}

function resolveGamble(choice) {
  el.gambleChoices.classList.add('hidden');
  const result = Math.random() < 0.5 ? 'red' : 'black';
  const won    = result === choice;
  const cards  = { red: ['A♥','K♥','Q♥','J♦','10♥','9♦'], black: ['A♠','K♣','Q♠','J♣','10♠','9♣'] };
  const pick   = cards[result];
  el.cardFace.textContent = pick[Math.floor(Math.random() * pick.length)];
  el.cardFace.className   = result === 'red' ? 'card card-red' : 'card card-black';
  el.cardFace.classList.add('flip');
  setTimeout(() => el.cardFace.classList.remove('flip'), 500);
  if (won) {
    state.credits   += state.gambleWin;
    state.gambleWin *= 2;
    state.gamblesLeft--;
    el.gambleOutcome.textContent = `WIN!  ${state.gambleWin.toLocaleString()}`;
    el.gambleOutcome.className   = 'gamble-win-text';
    SFX.gambleWin();
    render();
    el.gambleContinue.textContent = state.gamblesLeft > 0 ? 'GAMBLE AGAIN' : 'COLLECT';
  } else {
    state.credits   -= state.gambleWin;
    el.gambleOutcome.textContent = `LOSE  —  ${state.gambleWin.toLocaleString()} gone`;
    el.gambleOutcome.className   = 'gamble-lose-text';
    SFX.gambleLose();
    state.gambleWin = 0;
    render();
    el.gambleContinue.textContent = 'CONTINUE';
  }
  el.gambleResult.classList.remove('hidden');
}

function onGambleContinue() {
  if (state.gambleWin > 0 && state.gamblesLeft > 0) {
    el.gambleResult.classList.add('hidden');
    el.gambleChoices.classList.remove('hidden');
    el.gamblePrompt.textContent = `Gamble ${state.gambleWin.toLocaleString()} — Red or Black?`;
  } else {
    el.gambleOverlay.classList.add('hidden');
    state.gambleWin = 0;
    if (state.auto) { if (tickAuto()) setTimeout(pressPlay, 400); }
  }
}

// ============================================================
// Feature — Canteen Frenzy
// ============================================================
function triggerFeature(scatterCount) {
  const games = FREE_GAMES_BY_SCATTER[scatterCount] || 12;
  state.mode              = 'feature';
  state.freeGames         = games;
  state.freeGamesTotal    = games;
  state.freeGamesPlayed   = 0;
  state.collected         = 0;
  state.wildReels         = [];
  state.featureWonTotal   = 0;
  state.reachedThresholds = [];
  el.machine.classList.remove('base-mode');
  el.machine.classList.add('feature-mode');
  updateCollectUI();
  showOverlay({
    mascot: '🤠',
    title:  'CANTEEN FRENZY!',
    sub:    `${games} Free Games — collect Argo Cones to unlock wild reels!`,
    button: 'START',
    onClose: () => {
      setBanner(`${state.freeGames} free games`);
      nextFreeGame();
    },
  });
}

function nextFreeGame() {
  if (state.freeGames <= 0) { endFeature(); return; }
  state.freeGames--;
  state.freeGamesPlayed++;
  updateSpinCounter();
  setBanner(`${state.featureWonTotal.toLocaleString()} won`);
  SFX.spin();
  doSpin({ reels: REEL_FEATURE, forcedWild: state.wildReels.slice(), multiplier: FEATURE_MULTIPLIER, free: true });
}

function updateSpinCounter() {
  if (el.spinCounter) el.spinCounter.textContent =
    `SPIN ${state.freeGamesPlayed} / ${state.freeGamesTotal}  ·  ${state.freeGames} remaining`;
  if (el.freeBadge) el.freeBadge.textContent =
    `SPIN ${state.freeGamesPlayed} / ${state.freeGamesTotal}`;
}

function checkThresholds(before, onDone) {
  let fired = false;
  COLLECT_THRESHOLDS.forEach(t => {
    if (state.collected >= t.at && before < t.at && !state.reachedThresholds.includes(t.at)) {
      state.reachedThresholds.push(t.at);
      state.wildReels = t.wildReels.slice();
      fired = true;
      state.wildReels.forEach(r => {
        for (let row = 0; row < ROWS; row++) paintCell(cells[r][row], WILD, { expand: true });
      });
      SFX.wildUnlock();
      showOverlay({
        mascot: '🍦',
        title:  `${t.at} COLLECTED!`,
        sub:    t.at >= 30
          ? 'Reels 3-5 are WILD!'
          : `Reel${t.wildReels.length > 1 ? 's' : ''} ${t.wildReels.map(r => r+1).join(' & ')} now WILD!`,
        button: 'KEEP GOING',
        auto:   2200,
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
    title:  'FRENZY COMPLETE',
    sub:    `You won ${won.toLocaleString()} credits!`,
    button: 'COLLECT',
    onClose: () => {
      state.mode = 'base';
      state.wildReels = [];
      if (el.spinCounter) el.spinCounter.textContent = '';
      el.machine.classList.remove('feature-mode');
      el.machine.classList.add('base-mode');
      setBanner('Spin to play');
      render();
      el.play.disabled = false;
      if (state.auto) { if (tickAuto()) setTimeout(pressPlay, 600); }
    },
  });
}

// ---- Collect meter UI ----
function updateCollectUI() {
  el.collectCount.textContent = state.collected;
  const next = COLLECT_THRESHOLDS.find(t => state.collected < t.at);
  el.collectGoal.textContent = next ? `Collect ${next.at} for more reels!` : 'MAXIMUM REELS!';
}
function bumpCollect() {
  updateCollectUI();
  SFX.collectDing(state.collected);
  el.collect.classList.add('pop');
  setTimeout(() => el.collect.classList.remove('pop'), 400);
}

// ---- Last 3 wins ----
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
  if (el.lastWins) el.lastWins.innerHTML = items.join('<span class="lw-sep">·</span>');
}

// ============================================================
// Overlay
// ============================================================
let overlayTimer = null;
function showOverlay({ mascot, title, sub, button, onClose, auto }) {
  el.overlayMascot.textContent = mascot || '';
  el.overlayTitle.textContent  = title;
  el.overlaySub.textContent    = sub;
  el.overlayBtn.textContent    = button;
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
function setBanner(t)   { if (el.banner) el.banner.textContent = t; }
function flashBanner(t) {
  setBanner(t);
  el.banner.classList.remove('flash');
  void el.banner.offsetWidth;
  el.banner.classList.add('flash');
}

// ============================================================
// Coin burst FX
// ============================================================
let fxCtx, fxParticles = [], fxRunning = false;
function setupFx() {
  el.fx.width  = window.innerWidth;
  el.fx.height = window.innerHeight;
  fxCtx = el.fx.getContext('2d');
}
function coinBurst(win) {
  if (win < totalBet() * 5) return;
  const n = Math.min(120, 20 + Math.floor(win / totalBet()));
  for (let i = 0; i < n; i++) {
    fxParticles.push({
      x: window.innerWidth/2 + (Math.random()-.5)*120,
      y: window.innerHeight/2,
      vx: (Math.random()-.5)*8, vy: -6-Math.random()*8,
      r: 6+Math.random()*6, hue: 45+Math.random()*10, life: 1,
    });
  }
  if (!fxRunning) { fxRunning = true; requestAnimationFrame(fxTick); }
}
function fxTick() {
  fxCtx.clearRect(0,0,el.fx.width,el.fx.height);
  fxParticles.forEach(p => {
    p.vy+=.35; p.x+=p.vx; p.y+=p.vy; p.life-=.008;
    fxCtx.globalAlpha = Math.max(0,p.life);
    fxCtx.fillStyle = `hsl(${p.hue},90%,55%)`;
    fxCtx.beginPath(); fxCtx.ellipse(p.x,p.y,p.r,p.r*.7,0,0,Math.PI*2); fxCtx.fill();
    fxCtx.fillStyle = `hsl(${p.hue},90%,75%)`;
    fxCtx.beginPath(); fxCtx.ellipse(p.x-p.r*.3,p.y-p.r*.2,p.r*.4,p.r*.3,0,0,Math.PI*2); fxCtx.fill();
  });
  fxCtx.globalAlpha = 1;
  fxParticles = fxParticles.filter(p => p.life>0 && p.y<el.fx.height+40);
  if (fxParticles.length) requestAnimationFrame(fxTick);
  else { fxRunning=false; fxCtx.clearRect(0,0,el.fx.width,el.fx.height); }
}

// ============================================================
// Controls
// ============================================================
function wireControls() {
  el.play.addEventListener('click', pressPlay);

  el.auto.addEventListener('click', cycleAutoMode);

  el.linesUp.addEventListener('click',   () => { if (!state.spinning) { state.lineIndex = Math.min(LINE_OPTIONS.length-1, state.lineIndex+1); render(); } });
  el.linesDown.addEventListener('click', () => { if (!state.spinning) { state.lineIndex = Math.max(0, state.lineIndex-1); render(); } });
  el.betUp.addEventListener('click',     () => { if (!state.spinning) { state.betIndex  = Math.min(BET_PER_LINE_OPTIONS.length-1, state.betIndex+1); render(); } });
  el.betDown.addEventListener('click',   () => { if (!state.spinning) { state.betIndex  = Math.max(0, state.betIndex-1); render(); } });

  if (el.maxBetBtn) el.maxBetBtn.addEventListener('click', setMaxBet);

  // Paytable
  if (el.paytableBtn)   el.paytableBtn.addEventListener('click', openPaytable);
  if (el.paytableClose) el.paytableClose.addEventListener('click', closePaytable);
  if (el.paytableOverlay) el.paytableOverlay.addEventListener('click', e => {
    if (e.target === el.paytableOverlay) closePaytable();
  });

  // Gamble
  el.gambleBtn.addEventListener('click', openGambleOverlay);
  el.collectBtn.addEventListener('click', () => dismissGamble(true));
  el.gambleChoices.querySelectorAll('.gamble-colour').forEach(btn => {
    btn.addEventListener('click', () => resolveGamble(btn.dataset.colour));
  });
  el.gambleContinue.addEventListener('click', onGambleContinue);

  // Mute
  if (el.muteBtn) el.muteBtn.addEventListener('click', () => {
    const m = SFX.toggle();
    el.muteBtn.textContent = m ? '🔇' : '🔊';
    el.muteBtn.title = m ? 'Unmute' : 'Mute';
  });

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
  buildPaytable();
  wireControls();
  render();
  scaleMachine();
  setupFx();
  setBanner('SPIN TO PLAY');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
