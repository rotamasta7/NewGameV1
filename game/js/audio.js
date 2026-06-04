// ============================================================
// Aussie Bites — Synthesised SFX (Web Audio API, no files needed)
// Reel stops are hard mechanical clunks; bonus tiles escalate
// in pitch + volume (DUN → DUNN → DUNNNNNN) as each one lands.
// ============================================================
const SFX = (() => {
  let ctx = null;
  let _muted = false;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Pure oscillator tone with attack/decay envelope
  function tone(freq, type, gain, dur, when = 0) {
    if (_muted) return;
    const c = ac(), t = c.currentTime + when;
    const osc = c.createOscillator(), env = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.008);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(env); env.connect(c.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  // Pitched noise burst (for mechanical transients)
  function thud(cutoffHz, gain, dur, when = 0) {
    if (_muted) return;
    const c = ac(), t = c.currentTime + when;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d   = buf.getChannelData(0);
    // Shape: sharp attack, fast exponential decay
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const src  = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = cutoffHz;
    const filt2 = c.createBiquadFilter(); filt2.type = 'peaking';
    filt2.frequency.value = cutoffHz * 0.4; filt2.gain.value = 10; filt2.Q.value = 1;
    const env  = c.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filt); filt.connect(filt2); filt2.connect(env); env.connect(c.destination);
    src.start(t); src.stop(t + dur);
  }

  return {
    get muted() { return _muted; },
    toggle()    { _muted = !_muted; return _muted; },

    // ---- Reel spin whoosh ----
    spin() {
      thud(700, 0.18, 0.12);
    },

    // ---- Reel stop — hard mechanical CLUNK ----
    // Each reel: 3-layer hit: low body thud + sharp click + brief resonance
    reelStop(i) {
      const bodyFreq = 160 - i * 18;   // lower body for reels further right
      // 1: low body thud
      thud(bodyFreq, 0.9, 0.11);
      // 2: sharp high click (the pawl catching)
      thud(2400, 0.6, 0.025);
      // 3: short tonal resonance of the reel frame
      tone(bodyFreq * 1.8, 'sine', 0.18, 0.09, 0.01);
    },

    // ---- Rising anticipation hum (2 scatters showing, last reels slowing) ----
    anticipate() {
      if (_muted) return;
      const c = ac(), t = c.currentTime;
      const osc = c.createOscillator(), env = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, t);
      osc.frequency.linearRampToValueAtTime(170, t + 1.4);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.15, t + 0.25);
      env.gain.setValueAtTime(0.15, t + 1.1);
      env.gain.linearRampToValueAtTime(0, t + 1.55);
      osc.connect(env); env.connect(c.destination);
      osc.start(t); osc.stop(t + 1.6);
    },

    // ---- Bonus tile lands — escalating DUN → DUNN → DUNNNNNN ----
    // n = 1 (first scatter), 2 (second), 3 (third)...
    scatterLand(n) {
      // Each successive hit: higher pitch, longer sustain, more harmonics
      const pitches = [130, 196, 294, 440, 660];
      const gains   = [0.5, 0.65, 0.80, 0.90, 0.95];
      const durs    = [0.35, 0.50, 0.70, 0.90, 1.10];
      const idx = Math.min(n - 1, pitches.length - 1);
      const f   = pitches[idx];
      const g   = gains[idx];
      const dur = durs[idx];

      // Root note — sine with long tail
      tone(f,       'sine',     g,       dur);
      // Fifth — adds richness
      tone(f * 1.5, 'sine',     g * 0.5, dur * 0.85, 0.01);
      // Octave — sparkle on higher hits
      if (n >= 2) tone(f * 2, 'triangle', g * 0.3, dur * 0.6, 0.02);
      // Sub bass punch on 3rd+ hit
      if (n >= 3) tone(f * 0.5, 'sine', g * 0.4, 0.18);
      // Sharp transient click at start
      thud(1200, 0.4 + n * 0.08, 0.04);
    },

    // ---- Win sounds ----
    smallWin() {
      tone(523, 'triangle', 0.2, 0.2);
      tone(659, 'triangle', 0.2, 0.2, 0.1);
    },
    bigWin() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 'triangle', 0.28, 0.45, i * 0.1));
    },
    megaWin() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 'sawtooth', 0.22, 0.55, i * 0.08));
    },

    // ---- Credit counter tick ----
    creditTick() { tone(1200, 'sine', 0.06, 0.03); },

    // ---- Line cycle click ----
    lineCycle() { tone(700, 'sine', 0.08, 0.06); },

    // ---- Collect ding (per-cone, rising pitch) ----
    collectDing(n) {
      const f = 440 + Math.min(n, 30) * 13;
      tone(f,       'sine', 0.22, 0.14);
      tone(f * 1.5, 'sine', 0.10, 0.10, 0.04);
    },

    // ---- Feature siren sweep on trigger ----
    featureStart() {
      if (_muted) return;
      const c = ac(), t = c.currentTime;
      const osc = c.createOscillator(), env = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(720, t + 1.1);
      env.gain.setValueAtTime(0.2, t);
      env.gain.setValueAtTime(0.2, t + 0.9);
      env.gain.linearRampToValueAtTime(0, t + 1.35);
      osc.connect(env); env.connect(c.destination);
      osc.start(t); osc.stop(t + 1.4);
    },

    // ---- Wild reel unlock power-up sweep ----
    wildUnlock() {
      if (_muted) return;
      const c = ac(), t = c.currentTime;
      [1, 2].forEach(m => {
        const o = c.createOscillator(), e = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(300 * m, t);
        o.frequency.exponentialRampToValueAtTime(1200 * m, t + 0.55);
        e.gain.setValueAtTime(0.22 / m, t);
        e.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
        o.connect(e); e.connect(c.destination); o.start(t); o.stop(t + 0.7);
      });
    },

    // ---- Gamble results ----
    gambleWin()  { [440, 554, 659, 880].forEach((f, i) => tone(f, 'sine', 0.28, 0.3, i * 0.07)); },
    gambleLose() { tone(220, 'sawtooth', 0.22, 0.6); tone(180, 'sawtooth', 0.14, 0.5, 0.08); },
  };
})();
