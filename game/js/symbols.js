// Aussie Bites — symbol definitions (Phase 1 placeholders).
// Real cut-out PNG art drops in later; for now each symbol is a coloured
// tile with a short label + emoji stand-in so the game reads correctly.
//
// Roles:
//   WILD    = Golden Gaytime (substitutes all paying symbols)
//   SCATTER = Argo Cone (pays anywhere, triggers the feature later)
//
// pays[n] = coin multiplier for n-of-a-kind on a payline, left to right.
//   index 3 = three of a kind, index 4 = four, index 5 = five.

const SYMBOLS = {
  GAYTIME:  { id: 'GAYTIME',  label: 'Gaytime',   emoji: '🍫', color: '#caa24a', role: 'wild',    pays: { 3: 10, 4: 50, 5: 200 } },
  ARGO:     { id: 'ARGO',     label: 'Argo',      emoji: '🍦', color: '#f29ac0', role: 'scatter', pays: { 3:  2, 4:  5, 5:  20 } },
  BILL:     { id: 'BILL',     label: "Bubble Bill", emoji: '🤠', color: '#e2703a', role: 'pay',  pays: { 3:  8, 4: 25, 5: 100 } },
  TIMTAM:   { id: 'TIMTAM',   label: 'Tim Tam',   emoji: '🍫', color: '#5a3a26', role: 'pay',    pays: { 3:  6, 4: 20, 5:  80 } },
  VOVO:     { id: 'VOVO',     label: 'Iced VoVo', emoji: '🍰', color: '#e88aa8', role: 'pay',    pays: { 3:  4, 4: 12, 5:  50 } },
  CONE:     { id: 'CONE',     label: 'Soft Serve',emoji: '🍦', color: '#e6c48a', role: 'pay',    pays: { 3:  3, 4: 10, 5:  40 } },
  RAINBOW:  { id: 'RAINBOW',  label: 'Rainbow',   emoji: '🍧', color: '#7ec4cf', role: 'pay',    pays: { 3:  3, 4:  8, 5:  30 } },
  NICE:     { id: 'NICE',     label: 'Nice',      emoji: '🍪', color: '#d8b878', role: 'pay',    pays: { 3:  2, 4:  6, 5:  20 } },
  SCOTCH:   { id: 'SCOTCH',   label: 'Scotch',    emoji: '🍪', color: '#c79a5b', role: 'pay',    pays: { 3:  2, 4:  5, 5:  15 } },
  TEDDY:    { id: 'TEDDY',    label: 'Tiny Teddy',emoji: '🧸', color: '#a9763f', role: 'pay',    pays: { 3:  2, 4:  5, 5:  15 } },
};

// Per-reel symbol strips. The spinner picks visible symbols from these.
// Weighting is rough for Phase 1 (RTP tuning happens in Phase 4): high-value
// and special symbols appear less often than low-value ones.
const REEL_STRIPS = (() => {
  // Build one weighted strip and reuse it across all five reels for now.
  const weights = {
    SCOTCH: 6, NICE: 6, TEDDY: 6, RAINBOW: 5, CONE: 5,
    VOVO: 4, TIMTAM: 3, BILL: 3, GAYTIME: 2, ARGO: 2,
  };
  const strip = [];
  for (const [id, w] of Object.entries(weights)) {
    for (let i = 0; i < w; i++) strip.push(id);
  }
  return [strip, strip, strip, strip, strip];
})();
