// ============================================================
// Aussie Bites — Synthesised SFX (Web Audio API, no files needed)
// Heavy mechanical slot machine sounds — Aristocrat style.
// Hard metal reel stops, bold escalating scatter hits,
// dramatic feature trigger.
// ============================================================
const SFX = (() => {
  let ctx = null;
  let _muted = false;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ---- Helper: pure oscillator tone with attack/decay envelope ----
  // type: OscillatorType, attack: seconds, decayShape: 'exp'|'lin'
  function tone(freq, type, gain, dur, when = 0, attack = 0.006, decayShape = 'exp') {
    if (_muted) return;
    const c = ac(), t = c.currentTime + when;
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain, t + attack);
    if (decayShape === 'lin') {
      env.gain.linearRampToValueAtTime(0.0001, t + dur);
    } else {
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    osc.connect(env);
    env.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // ---- Helper: tone with a frequency sweep ----
  function toneSwoop(freqStart, freqEnd, type, gain, dur, when = 0, attack = 0.006, sweepType = 'lin') {
    if (_muted) return;
    const c = ac(), t = c.currentTime + when;
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t);
    if (sweepType === 'exp') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 0.001), t + dur);
    } else {
      osc.frequency.linearRampToValueAtTime(freqEnd, t + dur);
    }
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env);
    env.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // ---- Helper: shaped noise burst through one or more biquad filters ----
  // filterDefs: array of { type, freq, gain (for peaking), Q }
  function noiseBurst(filterDefs, gain, dur, when = 0, shapePow = 3) {
    if (_muted) return;
    const c = ac(), t = c.currentTime + when;
    const n = Math.ceil(c.sampleRate * (dur + 0.02));
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(Math.max(1 - i / n, 0), shapePow);
    }
    const src = c.createBufferSource();
    src.buffer = buf;

    // Chain filters
    let node = src;
    for (const fd of filterDefs) {
      const f = c.createBiquadFilter();
      f.type = fd.type;
      f.frequency.value = fd.freq;
      if (fd.Q !== undefined) f.Q.value = fd.Q;
      if (fd.gain !== undefined) f.gain.value = fd.gain;
      node.connect(f);
      node = f;
    }

    const env = c.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(env);
    env.connect(c.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // ---- Legacy thud helper (kept for backward-compat internal use) ----
  function thud(cutoffHz, gain, dur, when = 0) {
    noiseBurst(
      [
        { type: 'lowpass', freq: cutoffHz },
        { type: 'peaking', freq: cutoffHz * 0.4, gain: 12, Q: 1 }
      ],
      gain, dur, when, 3
    );
  }

  return {
    get muted() { return _muted; },
    toggle()    { _muted = !_muted; return _muted; },

    // ---- Reel spin — mechanical whoosh ----
    // Two overlapping noise bursts simulating air/mechanism rush
    spin() {
      noiseBurst([{ type: 'lowpass', freq: 200 }], 0.3, 0.15, 0);
      noiseBurst([{ type: 'lowpass', freq: 800 }, { type: 'highpass', freq: 120 }], 0.3, 0.15, 0.04);
    },

    // ---- Reel stop — four-layer heavy metal CLUNK ----
    // i = reel index (0..4), each reel gets a slightly lower body freq
    reelStop(i) {
      const bodyFreq = 110 - i * 12;   // 110, 98, 86, 74, 62 Hz

      // Layer 1: Instant sharp CLACK — highpass noise burst (metal pawl on ratchet)
      noiseBurst(
        [{ type: 'highpass', freq: 2500 }],
        3.0, 0.025, 0, 2
      );

      // Layer 2: Heavy low THUNK — lowpass + peaking noise (reel mass settling)
      noiseBurst(
        [
          { type: 'lowpass',  freq: bodyFreq * 3 },
          { type: 'peaking',  freq: bodyFreq, gain: 18, Q: 1.2 }
        ],
        2.8, 0.20, 0.005, 4
      );

      // Layer 3: Metallic RING — sine at bodyFreq*3.8, decaying (metal frame resonance)
      tone(bodyFreq * 3.8, 'sine', 0.5, 0.18, 0.01, 0.003);

      // Layer 4: Sub bass PUNCH — sine sweeping 75→30Hz (physical impact thump)
      toneSwoop(75, 30, 'sine', 0.9, 0.11, 0, 0.004, 'lin');
    },

    // ---- Rising anticipation hum (reels slowing, scatter building) ----
    anticipate() {
      if (_muted) return;
      const c = ac(), t = c.currentTime;
      const osc = c.createOscillator();
      const env = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, t);
      osc.frequency.linearRampToValueAtTime(180, t + 1.5);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.18, t + 0.3);
      env.gain.setValueAtTime(0.18, t + 1.2);
      env.gain.linearRampToValueAtTime(0, t + 1.6);
      osc.connect(env);
      env.connect(c.destination);
      osc.start(t);
      osc.stop(t + 1.65);
    },

    // ---- Scatter land — escalating DUN → DUNN → DUNNNNN ----
    // n = 1 (first scatter), 2 (second), 3+... increasingly dramatic
    scatterLand(n) {
      const pitches = [140, 210, 315, 472, 708];
      const gains   = [0.60, 0.75, 0.88, 0.94, 1.00];
      const durs    = [0.38, 0.55, 0.78, 1.00, 1.25];
      const idx = Math.min(n - 1, pitches.length - 1);
      const f   = pitches[idx];
      const g   = gains[idx];
      const dur = durs[idx];

      // Sharp metallic transient at start (thud ~1800Hz)
      noiseBurst(
        [
          { type: 'bandpass', freq: 1800, Q: 1.5 },
          { type: 'highpass', freq: 900 }
        ],
        0.5 + idx * 0.12, 0.035, 0, 2
      );

      // Root note — sine with long tail
      tone(f, 'sine', g, dur, 0.005, 0.008);

      // Fifth — adds weight and richness
      tone(f * 1.5, 'sine', g * 0.55, dur * 0.85, 0.008, 0.008);

      // Octave — sparkle on second hit and above
      if (n >= 2) {
        tone(f * 2, 'triangle', g * 0.35, dur * 0.65, 0.012, 0.006);
      }

      // Third harmonic — extra brilliance on 3+
      if (n >= 3) {
        tone(f * 3, 'triangle', g * 0.18, dur * 0.45, 0.015, 0.005);
      }

      // Sub bass punch on 3rd+ hit
      if (n >= 3) {
        toneSwoop(f * 0.5, f * 0.3, 'sine', g * 0.55, 0.22, 0, 0.005, 'lin');
      }

      // Extra sub rumble slam on 4th+ hit
      if (n >= 4) {
        noiseBurst(
          [{ type: 'lowpass', freq: 80 }, { type: 'peaking', freq: 55, gain: 16, Q: 1.5 }],
          1.2, 0.18, 0.002, 4
        );
      }
    },

    // ---- Feature trigger — bold dramatic brass-like fanfare ----
    featureStart() {
      if (_muted) return;
      const c = ac(), t = c.currentTime;

      // Opening noise burst transient — big punch
      noiseBurst(
        [{ type: 'bandpass', freq: 600, Q: 0.8 }, { type: 'lowpass', freq: 1200 }],
        2.5, 0.06, 0, 2
      );

      // Oscillator 1 — fast sweep, sawtooth (lead brass)
      const o1 = c.createOscillator(), e1 = c.createGain();
      o1.type = 'sawtooth';
      o1.frequency.setValueAtTime(180, t);
      o1.frequency.linearRampToValueAtTime(540, t + 0.4);
      o1.frequency.setValueAtTime(540, t + 0.4);
      o1.frequency.linearRampToValueAtTime(720, t + 0.9);
      o1.frequency.setValueAtTime(720, t + 0.9);
      o1.frequency.linearRampToValueAtTime(900, t + 1.6);
      e1.gain.setValueAtTime(0, t);
      e1.gain.linearRampToValueAtTime(0.45, t + 0.02);
      e1.gain.setValueAtTime(0.45, t + 1.3);
      e1.gain.linearRampToValueAtTime(0, t + 1.7);
      o1.connect(e1); e1.connect(c.destination);
      o1.start(t); o1.stop(t + 1.75);

      // Oscillator 2 — slower sweep, sawtooth (harmony, fifth above)
      const o2 = c.createOscillator(), e2 = c.createGain();
      o2.type = 'sawtooth';
      o2.frequency.setValueAtTime(270, t + 0.05);
      o2.frequency.linearRampToValueAtTime(810, t + 0.6);
      o2.frequency.setValueAtTime(810, t + 0.6);
      o2.frequency.linearRampToValueAtTime(1080, t + 1.6);
      e2.gain.setValueAtTime(0, t + 0.05);
      e2.gain.linearRampToValueAtTime(0.30, t + 0.10);
      e2.gain.setValueAtTime(0.30, t + 1.35);
      e2.gain.linearRampToValueAtTime(0, t + 1.7);
      o2.connect(e2); e2.connect(c.destination);
      o2.start(t + 0.05); o2.stop(t + 1.75);

      // Oscillator 3 — octave bass, square wave (body/punch)
      const o3 = c.createOscillator(), e3 = c.createGain();
      o3.type = 'square';
      o3.frequency.setValueAtTime(90, t);
      o3.frequency.linearRampToValueAtTime(270, t + 0.5);
      o3.frequency.setValueAtTime(270, t + 0.5);
      o3.frequency.linearRampToValueAtTime(360, t + 1.4);
      e3.gain.setValueAtTime(0, t);
      e3.gain.linearRampToValueAtTime(0.22, t + 0.025);
      e3.gain.setValueAtTime(0.22, t + 1.1);
      e3.gain.linearRampToValueAtTime(0, t + 1.6);
      o3.connect(e3); e3.connect(c.destination);
      o3.start(t); o3.stop(t + 1.65);

      // Trailing noise burst for extra impact at t+0.02
      noiseBurst(
        [{ type: 'highpass', freq: 2000 }],
        1.8, 0.04, 0.02, 2
      );
    },

    // ---- Wild reel unlock — power-up exponential sweep ----
    wildUnlock() {
      if (_muted) return;
      const c = ac(), t = c.currentTime;

      // Two oscillators exponentially rising, with strong gain
      [
        { fStart: 220,  fEnd: 1760, gainPeak: 0.50, type: 'sawtooth' },
        { fStart: 330,  fEnd: 2640, gainPeak: 0.32, type: 'sine'     }
      ].forEach(({ fStart, fEnd, gainPeak, type }) => {
        const o = c.createOscillator(), e = c.createGain();
        o.type = type;
        o.frequency.setValueAtTime(fStart, t);
        o.frequency.exponentialRampToValueAtTime(fEnd, t + 0.7);
        e.gain.setValueAtTime(0.0001, t);
        e.gain.linearRampToValueAtTime(gainPeak, t + 0.05);
        e.gain.setValueAtTime(gainPeak, t + 0.5);
        e.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
        o.connect(e); e.connect(c.destination);
        o.start(t); o.stop(t + 0.85);
      });

      // Opening clack for the "unlock" feel
      noiseBurst(
        [{ type: 'highpass', freq: 3000 }],
        2.0, 0.022, 0, 1.5
      );
    },

    // ---- Win sounds ----
    smallWin() {
      tone(523, 'triangle', 0.28, 0.25, 0.00);
      tone(659, 'triangle', 0.28, 0.25, 0.10);
    },

    bigWin() {
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(f, 'triangle', 0.35, 0.50, i * 0.10)
      );
    },

    megaWin() {
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        tone(f, 'sawtooth', 0.35, 0.60, i * 0.08)
      );
      // Extra sub punch for mega
      toneSwoop(80, 40, 'sine', 0.6, 0.25, 0, 0.005, 'lin');
    },

    // ---- Credit counter tick ----
    creditTick() {
      tone(1400, 'sine', 0.08, 0.03);
    },

    // ---- Line cycle click ----
    lineCycle() {
      noiseBurst([{ type: 'bandpass', freq: 900, Q: 2 }], 0.10, 0.04, 0, 2);
    },

    // ---- Collect ding (per-collect, rising pitch) ----
    collectDing(n) {
      const f = 440 + Math.min(n, 30) * 13;
      tone(f,       'sine', 0.28, 0.16, 0.00);
      tone(f * 1.5, 'sine', 0.14, 0.12, 0.04);
    },

    // ---- Gamble results ----
    gambleWin() {
      [440, 554, 659, 880].forEach((f, i) =>
        tone(f, 'sine', 0.32, 0.32, i * 0.07)
      );
    },

    gambleLose() {
      tone(220, 'sawtooth', 0.26, 0.65, 0.00);
      tone(180, 'sawtooth', 0.18, 0.55, 0.08);
    },
  };
})();
