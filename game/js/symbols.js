// Aussie Bites — symbol definitions + virtual reel strips.
//
// Architecture: Aristocrat virtual-reel-stop model.
//   Each reel has a linear strip of ~64 symbol IDs.
//   On each spin, one random stop is chosen per reel.
//   The three visible cells for reel R are: stops[i], stops[i+1], stops[i+2]
//   (wrapping at the end). This mirrors real pokie hardware, enables stacked
//   wilds, and makes scatter frequency precisely controllable.
//
// WILD    = Golden Gaytime  — stacked 3 on reels 2 & 4 for dramatic reel fills.
// SCATTER = Argo Cone       — 3+ across any position triggers Canteen Frenzy.
//
// pays[n] = line-bet multiplier for n-of-a-kind, left-to-right.
//            Scatter pays on TOTAL BET.

// Paytable tuned for 94–96% total RTP (verified via tools/rtp-sim.js).
// Values are ~1.5× the initial strip to achieve the target with the
// virtual reel-stop model. Scatter pays on TOTAL BET.
const SYMBOLS = {
  GAYTIME: { label: 'Gaytime',     emoji: '🍫', color: '#e0a92e', role: 'wild',    pays: { 3: 40, 4: 150, 5: 750 } },
  ARGO:    { label: 'Argo Cone',   emoji: '🍨', color: '#f49ac1', role: 'scatter', pays: { 3: 6,  4:  22, 5: 100 } },
  BILL:    { label: "Bubble O'Bill", emoji: '🤠', color: '#e2703a', role: 'high',  pays: { 3: 25, 4:  90, 5: 375 } },
  TIMTAM:  { label: 'Tim Tam',     emoji: '🍫', color: '#4a2c1a', role: 'high',   pays: { 3: 15, 4:  52, 5: 225 } },
  VOVO:    { label: 'Iced VoVo',   emoji: '🍰', color: '#e87fa6', role: 'mid',    pays: { 3: 12, 4:  33, 5: 120 } },
  CONE:    { label: 'Soft Serve',  emoji: '🍦', color: '#e8c887', role: 'mid',    pays: { 3:  8, 4:  22, 5:  90 } },
  RAINBOW: { label: 'Rainbow Pop', emoji: '🌈', color: '#5bb6c4', role: 'mid',    pays: { 3:  6, 4:  18, 5:  60 } },
  NICE:    { label: 'Nice',        emoji: '🍘', color: '#d8b878', role: 'low',    pays: { 3:  5, 4:  12, 5:  38 } },
  SCOTCH:  { label: 'Scotch',      emoji: '🍪', color: '#c79350', role: 'low',    pays: { 3:  5, 4:  10, 5:  30 } },
  TEDDY:   { label: 'Tiny Teddy',  emoji: '🧸', color: '#a9763f', role: 'low',    pays: { 3:  3, 4:   8, 5:  22 } },
};

const WILD = 'GAYTIME';
const SCATTER = 'ARGO';

// ---------------------------------------------------------------
// Virtual reel strips — BASE GAME
// Each array is the ordered sequence of symbol IDs on that reel.
// The visible 3-row window = strip[stop], strip[stop+1], strip[stop+2].
//
// Design choices:
//  • ARGO isolated at 2 positions per reel → ~9% chance any cell shows ARGO
//    → P(3+ scatters anywhere on 5 reels) ≈ 1 in 130 spins (authentic)
//  • GAYTIME stacked 3-in-a-row on reels 2 & 4, solitary elsewhere →
//    single-cell wilds help line wins; stacked wilds create visual climax
//  • Low pays fill the bulk; high pays are rare but present
// ---------------------------------------------------------------
const REEL_BASE = [
  // Reel 1 (index 0) — no stacked wilds, 2 scatters
  [
    'TEDDY','SCOTCH','NICE','CONE','TEDDY','RAINBOW','SCOTCH','NICE',
    'ARGO',
    'TEDDY','VOVO','SCOTCH','NICE','RAINBOW','TEDDY','CONE','SCOTCH',
    'TIMTAM',
    'NICE','TEDDY','SCOTCH','RAINBOW','NICE','VOVO','TEDDY','SCOTCH',
    'GAYTIME',
    'NICE','TEDDY','RAINBOW','SCOTCH','NICE','CONE','TEDDY','SCOTCH',
    'BILL',
    'TEDDY','NICE','SCOTCH','RAINBOW','TEDDY','VOVO','SCOTCH','NICE',
    'ARGO',
    'TEDDY','SCOTCH','NICE','RAINBOW','TEDDY','CONE','SCOTCH','NICE',
    'TIMTAM',
    'TEDDY','RAINBOW','SCOTCH','NICE','TEDDY','VOVO','SCOTCH','GAYTIME',
    'NICE','TEDDY',
  ],

  // Reel 2 (index 1) — no stacked wilds, 2 scatters
  [
    'SCOTCH','NICE','TEDDY','RAINBOW','VOVO','SCOTCH','NICE','TEDDY',
    'ARGO',
    'SCOTCH','CONE','NICE','TEDDY','RAINBOW','SCOTCH','VOVO','NICE',
    'TIMTAM',
    'TEDDY','SCOTCH','NICE','RAINBOW','TEDDY','CONE','SCOTCH','NICE',
    'GAYTIME',
    'TEDDY','SCOTCH','RAINBOW','NICE','TEDDY','VOVO','SCOTCH','NICE',
    'BILL',
    'TEDDY','RAINBOW','SCOTCH','NICE','TEDDY','CONE','SCOTCH','VOVO',
    'ARGO',
    'TEDDY','NICE','SCOTCH','RAINBOW','TEDDY','VOVO','SCOTCH','NICE',
    'TIMTAM',
    'TEDDY','SCOTCH','NICE','RAINBOW','TEDDY','CONE','SCOTCH',
    'GAYTIME',
    'NICE','TEDDY','SCOTCH',
  ],

  // Reel 3 (index 2) — GAYTIME stacked ×3, 3 scatters (middle reel is juicy)
  [
    'NICE','TEDDY','SCOTCH','CONE','NICE','RAINBOW','TEDDY','SCOTCH',
    'ARGO',
    'NICE','TEDDY','SCOTCH','VOVO','NICE','RAINBOW','TEDDY','SCOTCH',
    'GAYTIME','GAYTIME','GAYTIME',
    'NICE','TEDDY','SCOTCH','RAINBOW','NICE','CONE','TEDDY','SCOTCH',
    'TIMTAM',
    'NICE','TEDDY','RAINBOW','SCOTCH','NICE','VOVO','TEDDY','SCOTCH',
    'ARGO',
    'NICE','TEDDY','SCOTCH','RAINBOW','NICE','CONE','TEDDY','SCOTCH',
    'ARGO',
    'NICE','TEDDY','SCOTCH','VOVO','NICE','RAINBOW','TEDDY',
    'GAYTIME',
    'SCOTCH','NICE','BILL','TEDDY',
  ],

  // Reel 4 (index 3) — no stacked wilds, 2 scatters
  [
    'RAINBOW','TEDDY','SCOTCH','NICE','VOVO','RAINBOW','TEDDY','SCOTCH',
    'ARGO',
    'NICE','RAINBOW','TEDDY','SCOTCH','CONE','NICE','TEDDY','RAINBOW',
    'TIMTAM',
    'SCOTCH','NICE','TEDDY','RAINBOW','VOVO','SCOTCH','NICE','TEDDY',
    'GAYTIME',
    'RAINBOW','SCOTCH','NICE','TEDDY','CONE','RAINBOW','SCOTCH','NICE',
    'BILL',
    'TEDDY','RAINBOW','SCOTCH','NICE','VOVO','TEDDY','RAINBOW','SCOTCH',
    'ARGO',
    'NICE','TEDDY','RAINBOW','SCOTCH','CONE','NICE','TEDDY','SCOTCH',
    'TIMTAM',
    'RAINBOW','NICE','TEDDY','SCOTCH','VOVO','RAINBOW',
    'GAYTIME',
    'NICE','TEDDY',
  ],

  // Reel 5 (index 4) — GAYTIME stacked ×3, 2 scatters
  [
    'SCOTCH','NICE','RAINBOW','TEDDY','VOVO','SCOTCH','NICE','RAINBOW',
    'ARGO',
    'TEDDY','SCOTCH','NICE','CONE','RAINBOW','TEDDY','SCOTCH','NICE',
    'GAYTIME','GAYTIME','GAYTIME',
    'RAINBOW','TEDDY','SCOTCH','VOVO','NICE','RAINBOW','TEDDY','SCOTCH',
    'TIMTAM',
    'NICE','RAINBOW','TEDDY','SCOTCH','CONE','NICE','RAINBOW','TEDDY',
    'BILL',
    'SCOTCH','NICE','VOVO','RAINBOW','TEDDY','SCOTCH','NICE','RAINBOW',
    'ARGO',
    'TEDDY','SCOTCH','NICE','CONE','RAINBOW','TEDDY','SCOTCH',
    'GAYTIME',
    'NICE','RAINBOW','TEDDY','VOVO','SCOTCH',
  ],
];

// ---------------------------------------------------------------
// Virtual reel strips — FEATURE (Canteen Frenzy)
// More GAYTIME wilds, more ARGO for collection, fewer lows.
// ARGO still at only 3 per reel to avoid retrigger cascade.
// Forced-wild reels are applied on top in game.js.
// ---------------------------------------------------------------
const REEL_FEATURE = [
  // Reel 1
  [
    'TEDDY','SCOTCH','NICE','CONE','VOVO','SCOTCH','NICE',
    'ARGO',
    'TEDDY','VOVO','SCOTCH','NICE','RAINBOW','TEDDY','CONE','SCOTCH',
    'GAYTIME','GAYTIME',
    'NICE','TEDDY','SCOTCH','RAINBOW','VOVO','TEDDY','SCOTCH',
    'ARGO',
    'TEDDY','NICE','RAINBOW','SCOTCH','CONE','TEDDY','SCOTCH',
    'BILL',
    'TEDDY','NICE','VOVO','RAINBOW','TEDDY','SCOTCH','NICE',
    'ARGO',
    'TEDDY','SCOTCH','NICE','RAINBOW','VOVO','CONE','SCOTCH',
    'TIMTAM',
    'TEDDY','RAINBOW','SCOTCH','NICE','GAYTIME','VOVO','SCOTCH',
    'GAYTIME',
    'NICE',
  ],

  // Reel 2
  [
    'SCOTCH','NICE','VOVO','RAINBOW','SCOTCH','NICE','TEDDY',
    'ARGO',
    'SCOTCH','CONE','NICE','TEDDY','VOVO','SCOTCH','NICE',
    'GAYTIME','GAYTIME',
    'TEDDY','SCOTCH','NICE','RAINBOW','VOVO','SCOTCH','NICE',
    'ARGO',
    'TEDDY','RAINBOW','SCOTCH','NICE','VOVO','SCOTCH','NICE',
    'BILL',
    'TEDDY','RAINBOW','SCOTCH','CONE','TEDDY','VOVO','SCOTCH',
    'ARGO',
    'TEDDY','NICE','RAINBOW','SCOTCH','VOVO','SCOTCH',
    'TIMTAM',
    'TEDDY','SCOTCH','NICE','VOVO','GAYTIME','SCOTCH',
    'GAYTIME',
    'NICE','TEDDY','SCOTCH','RAINBOW',
  ],

  // Reel 3 — double-stacked wilds
  [
    'NICE','TEDDY','CONE','NICE','RAINBOW','SCOTCH',
    'ARGO',
    'NICE','TEDDY','VOVO','NICE','RAINBOW','SCOTCH',
    'GAYTIME','GAYTIME','GAYTIME',
    'NICE','TEDDY','SCOTCH','RAINBOW','CONE','SCOTCH',
    'TIMTAM',
    'NICE','TEDDY','RAINBOW','VOVO','NICE','SCOTCH',
    'ARGO',
    'NICE','TEDDY','SCOTCH','RAINBOW','CONE','SCOTCH',
    'ARGO',
    'NICE','TEDDY','VOVO','RAINBOW','SCOTCH',
    'GAYTIME','GAYTIME',
    'NICE','BILL','TEDDY','SCOTCH',
  ],

  // Reel 4
  [
    'RAINBOW','VOVO','SCOTCH','NICE','RAINBOW','SCOTCH',
    'ARGO',
    'NICE','RAINBOW','VOVO','SCOTCH','CONE','NICE','RAINBOW',
    'GAYTIME','GAYTIME',
    'SCOTCH','NICE','VOVO','RAINBOW','SCOTCH','NICE',
    'TIMTAM',
    'RAINBOW','SCOTCH','NICE','VOVO','RAINBOW','SCOTCH',
    'ARGO',
    'NICE','RAINBOW','VOVO','SCOTCH','CONE','NICE','RAINBOW',
    'BILL',
    'SCOTCH','NICE','RAINBOW','VOVO','SCOTCH',
    'ARGO',
    'NICE','RAINBOW','VOVO','SCOTCH',
    'GAYTIME','GAYTIME',
    'NICE','RAINBOW',
  ],

  // Reel 5 — stacked wilds
  [
    'SCOTCH','VOVO','RAINBOW','NICE','SCOTCH','RAINBOW',
    'ARGO',
    'VOVO','SCOTCH','NICE','CONE','RAINBOW','SCOTCH','NICE',
    'GAYTIME','GAYTIME','GAYTIME',
    'RAINBOW','VOVO','SCOTCH','NICE','RAINBOW','SCOTCH',
    'TIMTAM',
    'NICE','RAINBOW','VOVO','SCOTCH','CONE','NICE','RAINBOW',
    'ARGO',
    'SCOTCH','NICE','VOVO','RAINBOW','SCOTCH',
    'BILL',
    'NICE','RAINBOW','VOVO','SCOTCH',
    'ARGO',
    'NICE','RAINBOW',
    'GAYTIME','GAYTIME',
    'VOVO','SCOTCH',
  ],
];

// Helper: sample a stop and return the 3-cell window (wrapping).
function spinReel(strip) {
  const stop = (Math.random() * strip.length) | 0;
  const len = strip.length;
  return [strip[stop], strip[(stop + 1) % len], strip[(stop + 2) % len]];
}
