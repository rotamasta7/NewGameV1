// Aussie Bites — Phase 1 game logic.
// A playable 5x3, 25-line slot with credits, bet, spinning reels and win
// detection. Placeholder symbols. No real money — fun credits only.

const REELS = 5;
const ROWS = 3;
const BET_STEPS = [25, 50, 75, 125, 250]; // total bet (25 lines x line bet)
const START_CREDITS = 1000;

const state = {
  credits: START_CREDITS,
  betIndex: 0,
  win: 0,
  spinning: false,
  grid: [], // grid[reel][row] = symbol id
};

// ---- DOM refs ----
const el = {
  reels: document.getElementById('reels'),
  credits: document.getElementById('credits'),
  bet: document.getElementById('bet'),
  win: document.getElementById('win'),
  banner: document.getElementById('banner'),
  spin: document.getElementById('spin'),
  betUp: document.getElementById('betUp'),
  betDown: document.getElementById('betDown'),
};

// Cell elements indexed [reel][row] for quick updates.
const cells = [];

// ---- Build the reel grid in the DOM ----
function buildGrid() {
  el.reels.innerHTML = '';
  for (let r = 0; r < REELS; r++) {
    const col = document.createElement('div');
    col.className = 'reel';
    cells[r] = [];
    state.grid[r] = [];
    for (let row = 0; row < ROWS; row++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      col.appendChild(cell);
      cells[r][row] = cell;
      const id = randomSymbol(r);
      state.grid[r][row] = id;
      paintCell(cell, id);
    }
    el.reels.appendChild(col);
  }
}

function paintCell(cell, id, dim = false) {
  const s = SYMBOLS[id];
  cell.style.background = s.color;
  cell.style.opacity = dim ? '0.35' : '1';
  cell.innerHTML = `<span class="sym-emoji">${s.emoji}</span><span class="sym-label">${s.label}</span>`;
}

function randomSymbol(reel) {
  const strip = REEL_STRIPS[reel];
  return strip[Math.floor(Math.random() * strip.length)];
}

// ---- Bet / credit display ----
function totalBet() { return BET_STEPS[state.betIndex]; }

function render() {
  el.credits.textContent = state.credits;
  el.bet.textContent = totalBet();
  el.win.textContent = state.win;
}

// ---- Spin ----
function spin() {
  if (state.spinning) return;
  const bet = totalBet();
  if (state.credits < bet) {
    flashBanner('Not enough credits');
    return;
  }
  state.spinning = true;
  state.win = 0;
  state.credits -= bet;
  render();
  setBanner('Good luck!');
  el.spin.disabled = true;

  // Pre-roll the final result, then animate reels stopping left to right.
  const result = [];
  for (let r = 0; r < REELS; r++) {
    result[r] = [];
    for (let row = 0; row < ROWS; row++) result[r][row] = randomSymbol(r);
  }

  const spinners = [];
  for (let r = 0; r < REELS; r++) {
    spinners[r] = setInterval(() => {
      for (let row = 0; row < ROWS; row++) {
        paintCell(cells[r][row], randomSymbol(r));
      }
    }, 60);
  }

  // Stagger the stops for that classic reel-by-reel settle.
  for (let r = 0; r < REELS; r++) {
    setTimeout(() => {
      clearInterval(spinners[r]);
      for (let row = 0; row < ROWS; row++) {
        state.grid[r][row] = result[r][row];
        paintCell(cells[r][row], result[r][row]);
      }
      if (r === REELS - 1) finishSpin();
    }, 500 + r * 280);
  }
}

function finishSpin() {
  const outcome = evaluate(state.grid, totalBet());
  state.win = outcome.total;
  state.credits += outcome.total;
  highlightWins(outcome.lines);
  render();

  if (outcome.scatterCount >= 3) {
    setBanner(`${outcome.scatterCount} Argo Cones! Canteen Frenzy coming soon`);
  } else if (outcome.total > 0) {
    setBanner(`WIN ${outcome.total}!`);
  } else {
    setBanner('No win — spin again');
  }

  state.spinning = false;
  el.spin.disabled = false;
}

// ---- Win evaluation ----
// Left-to-right line wins (3+ from reel 1), Gaytime wild substitutes any
// paying symbol. Argo scatter pays anywhere and is counted for the feature.
function evaluate(grid, bet) {
  const lineBet = bet / PAYLINES.length;
  let total = 0;
  const winningLines = [];

  PAYLINES.forEach((line, lineIndex) => {
    const first = grid[0][line[0]];
    // A line can't start on a scatter; if it starts on a wild, the paying
    // symbol is the first non-wild in the run.
    let baseSymbol = first;
    if (baseSymbol === 'ARGO') return;

    let count = 0;
    for (let r = 0; r < REELS; r++) {
      const sym = grid[r][line[r]];
      if (sym === baseSymbol || sym === 'GAYTIME') {
        count++;
      } else if (baseSymbol === 'GAYTIME' && sym !== 'ARGO') {
        // Run opened on wilds; lock to this first real paying symbol.
        baseSymbol = sym;
        count++;
      } else {
        break;
      }
    }

    const pays = SYMBOLS[baseSymbol].pays;
    if (count >= 3 && pays[count]) {
      const amount = pays[count] * lineBet;
      total += amount;
      winningLines.push({ lineIndex, count, symbol: baseSymbol, cells: line });
    }
  });

  // Scatter: count Argo anywhere, pay on total bet.
  let scatterCount = 0;
  for (let r = 0; r < REELS; r++)
    for (let row = 0; row < ROWS; row++)
      if (grid[r][row] === 'ARGO') scatterCount++;
  if (scatterCount >= 3 && SYMBOLS.ARGO.pays[scatterCount]) {
    total += SYMBOLS.ARGO.pays[scatterCount] * bet;
  }

  return { total: Math.round(total), lines: winningLines, scatterCount };
}

function highlightWins(lines) {
  if (!lines.length) return;
  // Dim everything, then light up winning cells.
  for (let r = 0; r < REELS; r++)
    for (let row = 0; row < ROWS; row++)
      paintCell(cells[r][row], state.grid[r][row], true);

  lines.forEach(({ count, cells: line }) => {
    for (let r = 0; r < count; r++) {
      const row = line[r];
      paintCell(cells[r][row], state.grid[r][row], false);
      cells[r][row].classList.add('hit');
    }
  });
  setTimeout(() => {
    document.querySelectorAll('.cell.hit').forEach(c => c.classList.remove('hit'));
    for (let r = 0; r < REELS; r++)
      for (let row = 0; row < ROWS; row++)
        paintCell(cells[r][row], state.grid[r][row], false);
  }, 1400);
}

// ---- Banner helpers ----
function setBanner(text) { el.banner.textContent = text; }
function flashBanner(text) {
  setBanner(text);
  el.banner.classList.add('flash');
  setTimeout(() => el.banner.classList.remove('flash'), 600);
}

// ---- Controls ----
el.spin.addEventListener('click', spin);
el.betUp.addEventListener('click', () => {
  if (state.spinning) return;
  state.betIndex = Math.min(BET_STEPS.length - 1, state.betIndex + 1);
  render();
});
el.betDown.addEventListener('click', () => {
  if (state.spinning) return;
  state.betIndex = Math.max(0, state.betIndex - 1);
  render();
});
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); spin(); }
});

// ---- Boot ----
buildGrid();
render();
