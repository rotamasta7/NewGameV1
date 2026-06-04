// Aussie Bites — symbol definitions + virtual reel strips.
//
// Architecture: Aristocrat virtual-reel-stop model.
//   Each reel has a linear strip of ~62 symbol IDs.
//   On each spin one random stop is chosen; the three visible cells are
//   strip[stop], strip[stop+1], strip[stop+2] (wrapping). Mirrors real hardware.
//
// WILD    = Golden Gaytime  — stacked ×3 on reels 3 & 5 for dramatic fills
// SCATTER = Bubble O'Bill   — 3+ anywhere triggers Canteen Frenzy
//
// 15 symbols total: 1 wild + 1 scatter + 13 payline symbols
// pays[n] = line-bet multiplier for n-of-a-kind, left-to-right.
// Scatter pays on TOTAL BET.

const SYMBOLS = {
  // ── Wild ──
  GAYTIME:  { label: 'Golden Gaytime',      emoji: '🍦', color: '#e0a92e', role: 'wild',    pays: { 3: 40,  4: 150, 5: 750 } },

  // ── Scatter ──
  BILL:     { label: "Bubble O'Bill",        emoji: '🤠', color: '#e2703a', role: 'scatter', pays: { 3: 6,   4: 22,  5: 100 } },

  // ── High ──
  CYCLONE:  { label: 'Cyclone',             emoji: '🌀', color: '#d32f2f', role: 'high',    pays: { 3: 30,  4: 100, 5: 400 } },
  SPLICE:   { label: 'Splice',              emoji: '🟢', color: '#388e3c', role: 'high',    pays: { 3: 25,  4: 90,  5: 350 } },
  TIMTAM:   { label: 'Tim Tam',             emoji: '🍫', color: '#4a2c1a', role: 'high',    pays: { 3: 20,  4: 75,  5: 280 } },

  // ── Mid-high ──
  VOVO:     { label: 'Iced VoVo',           emoji: '🍰', color: '#e87fa6', role: 'mid',     pays: { 3: 15,  4: 50,  5: 200 } },
  HUNDREDS: { label: 'Hundreds & Thousands', emoji: '🎊', color: '#f06292', role: 'mid',     pays: { 3: 12,  4: 35,  5: 150 } },

  // ── Mid-low ──
  RAINBOW:  { label: 'Rainbow Pop',         emoji: '🌈', color: '#5bb6c4', role: 'mid',     pays: { 3: 10,  4: 25,  5: 100 } },
  LIFESAVER: { label: 'Lifesaver',          emoji: '🍭', color: '#ff7043', role: 'mid',     pays: { 3: 8,   4: 20,  5: 80  } },

  // ── Low ──
  MAXIBON:  { label: 'Maxibon',             emoji: '🍪', color: '#5d4037', role: 'low',     pays: { 3: 6,   4: 15,  5: 55  } },
  CONE:     { label: 'Soft Serve',          emoji: '🍦', color: '#efbe6b', role: 'low',     pays: { 3: 5,   4: 12,  5: 45  } },
  NICE:     { label: 'Nice',                emoji: '🍘', color: '#d8b878', role: 'low',     pays: { 3: 5,   4: 10,  5: 38  } },
  SCOTCH:   { label: 'Scotch Finger',       emoji: '🍪', color: '#c79350', role: 'low',     pays: { 3: 4,   4: 8,   5: 30  } },

  // ── Very low ──
  ICYPOLE:  { label: 'Icy Pole',            emoji: '🧊', color: '#b3e5fc', role: 'low',     pays: { 3: 3,   4: 6,   5: 22  } },
  TEDDY:    { label: 'Tiny Teddy',          emoji: '🧸', color: '#a9763f', role: 'low',     pays: { 3: 3,   4: 5,   5: 18  } },
};

const WILD    = 'GAYTIME';
const SCATTER = 'BILL';

// ---------------------------------------------------------------
// Virtual reel strips — BASE GAME
// BILL (scatter): 2 per reel (3 on reel 3 — middle reel juicy)
// GAYTIME: solitary on most reels, stacked ×3 on reels 3 & 5
// High symbols rare; low fills bulk of strip
// ---------------------------------------------------------------
const REEL_BASE = [
  // Reel 1
  [
    'TEDDY','SCOTCH','NICE','CONE','TEDDY','ICYPOLE','SCOTCH','NICE',
    'BILL',
    'TEDDY','VOVO','SCOTCH','NICE','RAINBOW','TEDDY','CONE','MAXIBON',
    'TIMTAM',
    'NICE','TEDDY','ICYPOLE','RAINBOW','NICE','VOVO','TEDDY','SCOTCH',
    'GAYTIME',
    'NICE','TEDDY','RAINBOW','SCOTCH','NICE','LIFESAVER','TEDDY','SCOTCH',
    'CYCLONE',
    'TEDDY','NICE','SCOTCH','HUNDREDS','TEDDY','VOVO','SCOTCH','NICE',
    'BILL',
    'TEDDY','SCOTCH','NICE','RAINBOW','TEDDY','CONE','MAXIBON','NICE',
    'TIMTAM',
    'TEDDY','ICYPOLE','SCOTCH','NICE','TEDDY','VOVO','SCOTCH','GAYTIME',
    'LIFESAVER','TEDDY',
  ],

  // Reel 2
  [
    'SCOTCH','NICE','TEDDY','RAINBOW','VOVO','MAXIBON','NICE','TEDDY',
    'BILL',
    'SCOTCH','CONE','NICE','TEDDY','HUNDREDS','SCOTCH','VOVO','NICE',
    'TIMTAM',
    'TEDDY','SCOTCH','ICYPOLE','RAINBOW','TEDDY','CONE','SCOTCH','NICE',
    'GAYTIME',
    'TEDDY','SCOTCH','RAINBOW','NICE','TEDDY','VOVO','LIFESAVER','NICE',
    'SPLICE',
    'TEDDY','RAINBOW','SCOTCH','NICE','TEDDY','MAXIBON','SCOTCH','VOVO',
    'BILL',
    'TEDDY','NICE','SCOTCH','RAINBOW','TEDDY','VOVO','HUNDREDS','NICE',
    'TIMTAM',
    'TEDDY','SCOTCH','ICYPOLE','NICE','TEDDY','CONE','SCOTCH',
    'GAYTIME',
    'LIFESAVER','TEDDY','SCOTCH',
  ],

  // Reel 3 — stacked wilds ×3, 3 scatters (middle reel is generous)
  [
    'NICE','TEDDY','SCOTCH','CONE','NICE','ICYPOLE','TEDDY','SCOTCH',
    'BILL',
    'NICE','TEDDY','SCOTCH','VOVO','NICE','RAINBOW','TEDDY','MAXIBON',
    'GAYTIME','GAYTIME','GAYTIME',
    'NICE','TEDDY','SCOTCH','RAINBOW','NICE','CONE','TEDDY','SCOTCH',
    'TIMTAM',
    'NICE','TEDDY','RAINBOW','HUNDREDS','NICE','VOVO','TEDDY','SCOTCH',
    'BILL',
    'NICE','TEDDY','SCOTCH','RAINBOW','LIFESAVER','CONE','TEDDY','SCOTCH',
    'BILL',
    'NICE','TEDDY','ICYPOLE','VOVO','NICE','RAINBOW','TEDDY',
    'GAYTIME',
    'SCOTCH','NICE','CYCLONE','TEDDY',
  ],

  // Reel 4
  [
    'RAINBOW','TEDDY','SCOTCH','NICE','VOVO','MAXIBON','TEDDY','SCOTCH',
    'BILL',
    'NICE','RAINBOW','TEDDY','SCOTCH','CONE','NICE','TEDDY','HUNDREDS',
    'TIMTAM',
    'SCOTCH','NICE','ICYPOLE','RAINBOW','VOVO','SCOTCH','NICE','TEDDY',
    'GAYTIME',
    'RAINBOW','SCOTCH','NICE','TEDDY','LIFESAVER','RAINBOW','SCOTCH','NICE',
    'SPLICE',
    'TEDDY','RAINBOW','SCOTCH','VOVO','NICE','TEDDY','MAXIBON','SCOTCH',
    'BILL',
    'NICE','TEDDY','RAINBOW','HUNDREDS','CONE','NICE','TEDDY','SCOTCH',
    'TIMTAM',
    'RAINBOW','NICE','ICYPOLE','SCOTCH','VOVO','RAINBOW',
    'GAYTIME',
    'LIFESAVER','TEDDY',
  ],

  // Reel 5 — stacked wilds ×3, 2 scatters
  [
    'SCOTCH','NICE','RAINBOW','TEDDY','VOVO','MAXIBON','NICE','RAINBOW',
    'BILL',
    'TEDDY','SCOTCH','NICE','CONE','RAINBOW','TEDDY','SCOTCH','HUNDREDS',
    'GAYTIME','GAYTIME','GAYTIME',
    'RAINBOW','TEDDY','SCOTCH','VOVO','NICE','ICYPOLE','TEDDY','SCOTCH',
    'TIMTAM',
    'NICE','RAINBOW','TEDDY','LIFESAVER','CONE','NICE','RAINBOW','TEDDY',
    'CYCLONE',
    'SCOTCH','NICE','VOVO','RAINBOW','MAXIBON','SCOTCH','NICE','RAINBOW',
    'BILL',
    'TEDDY','SCOTCH','NICE','CONE','RAINBOW','TEDDY','SCOTCH',
    'GAYTIME',
    'HUNDREDS','RAINBOW','TEDDY','VOVO','SCOTCH',
  ],
];

// ---------------------------------------------------------------
// Virtual reel strips — FEATURE (Canteen Frenzy)
// More GAYTIME wilds, more BILL for collecting, fewer lows.
// 3 BILL per reel for higher collect rate.
// ---------------------------------------------------------------
const REEL_FEATURE = [
  // Reel 1
  [
    'TEDDY','SCOTCH','NICE','CONE','VOVO','MAXIBON','SCOTCH',
    'BILL',
    'TEDDY','VOVO','SCOTCH','NICE','RAINBOW','TEDDY','CONE','HUNDREDS',
    'GAYTIME','GAYTIME',
    'NICE','TEDDY','SCOTCH','RAINBOW','VOVO','TEDDY','SCOTCH',
    'BILL',
    'TEDDY','NICE','RAINBOW','SCOTCH','LIFESAVER','TEDDY','SCOTCH',
    'CYCLONE',
    'TEDDY','NICE','VOVO','RAINBOW','TEDDY','SCOTCH','NICE',
    'BILL',
    'TEDDY','SCOTCH','NICE','HUNDREDS','VOVO','CONE','SCOTCH',
    'TIMTAM',
    'TEDDY','RAINBOW','SCOTCH','NICE','GAYTIME','VOVO','SCOTCH',
    'GAYTIME',
    'NICE',
  ],

  // Reel 2
  [
    'SCOTCH','NICE','VOVO','RAINBOW','MAXIBON','SCOTCH','NICE',
    'BILL',
    'SCOTCH','CONE','NICE','TEDDY','VOVO','HUNDREDS','SCOTCH',
    'GAYTIME','GAYTIME',
    'TEDDY','SCOTCH','NICE','RAINBOW','VOVO','SCOTCH','NICE',
    'BILL',
    'TEDDY','RAINBOW','SCOTCH','NICE','VOVO','LIFESAVER','SCOTCH',
    'SPLICE',
    'TEDDY','RAINBOW','SCOTCH','CONE','VOVO','TEDDY','SCOTCH',
    'BILL',
    'TEDDY','NICE','RAINBOW','SCOTCH','VOVO','HUNDREDS','SCOTCH',
    'TIMTAM',
    'TEDDY','SCOTCH','NICE','VOVO','GAYTIME','SCOTCH',
    'GAYTIME',
    'NICE','TEDDY','SCOTCH','RAINBOW',
  ],

  // Reel 3 — double stacked wilds
  [
    'NICE','TEDDY','CONE','NICE','RAINBOW','MAXIBON',
    'BILL',
    'NICE','TEDDY','VOVO','NICE','HUNDREDS','SCOTCH',
    'GAYTIME','GAYTIME','GAYTIME',
    'NICE','TEDDY','SCOTCH','RAINBOW','CONE','VOVO',
    'TIMTAM',
    'NICE','TEDDY','RAINBOW','VOVO','LIFESAVER','SCOTCH',
    'BILL',
    'NICE','TEDDY','SCOTCH','RAINBOW','CONE','HUNDREDS',
    'BILL',
    'NICE','TEDDY','VOVO','RAINBOW','SCOTCH',
    'GAYTIME','GAYTIME',
    'NICE','CYCLONE','TEDDY','SCOTCH',
  ],

  // Reel 4
  [
    'RAINBOW','VOVO','SCOTCH','NICE','MAXIBON','RAINBOW',
    'BILL',
    'NICE','RAINBOW','VOVO','HUNDREDS','CONE','NICE','RAINBOW',
    'GAYTIME','GAYTIME',
    'SCOTCH','NICE','VOVO','RAINBOW','LIFESAVER','NICE',
    'TIMTAM',
    'RAINBOW','SCOTCH','NICE','VOVO','RAINBOW','SCOTCH',
    'BILL',
    'NICE','RAINBOW','VOVO','HUNDREDS','CONE','NICE','RAINBOW',
    'SPLICE',
    'SCOTCH','NICE','RAINBOW','VOVO','SCOTCH',
    'BILL',
    'NICE','RAINBOW','VOVO','SCOTCH',
    'GAYTIME','GAYTIME',
    'NICE','RAINBOW',
  ],

  // Reel 5 — stacked wilds
  [
    'SCOTCH','VOVO','RAINBOW','NICE','MAXIBON','RAINBOW',
    'BILL',
    'VOVO','SCOTCH','NICE','CONE','HUNDREDS','SCOTCH','NICE',
    'GAYTIME','GAYTIME','GAYTIME',
    'RAINBOW','VOVO','SCOTCH','NICE','LIFESAVER','SCOTCH',
    'TIMTAM',
    'NICE','RAINBOW','VOVO','SCOTCH','CONE','NICE','RAINBOW',
    'BILL',
    'SCOTCH','NICE','VOVO','HUNDREDS','SCOTCH',
    'CYCLONE',
    'NICE','RAINBOW','VOVO','SCOTCH',
    'BILL',
    'NICE','RAINBOW',
    'GAYTIME','GAYTIME',
    'VOVO','SCOTCH',
  ],
];

// Helper: sample a stop and return the 3-cell window (wrapping).
function spinReel(strip) {
  const stop = (Math.random() * strip.length) | 0;
  const len  = strip.length;
  return [strip[stop], strip[(stop + 1) % len], strip[(stop + 2) % len]];
}
