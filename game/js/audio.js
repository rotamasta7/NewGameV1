// ============================================================
// Aussie Bites — Synthesised SFX  (Web Audio API, no files needed)
// ============================================================
const SFX = (() => {
  let ctx = null;
  let _muted = false;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, type, gain, dur, when = 0) {
    if (_muted) return;
    const c = ac(), t = c.currentTime + when;
    const osc = c.createOscillator(), env = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(env); env.connect(c.destination);
    osc.start(t); osc.stop(t + dur + 0.06);
  }

  function snap(cutoff, gain, dur, when = 0) {
    if (_muted) return;
    const c = ac(), t = c.currentTime + when;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.5);
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = cutoff;
    const env = c.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filt); filt.connect(env); env.connect(c.destination);
    src.start(t); src.stop(t + dur);
  }

  return {
    get muted() { return _muted; },
    toggle()    { _muted = !_muted; return _muted; },

    // reel spinning starts
    spin() { snap(700, 0.22, 0.13); },

    // each reel lands — pitch drops with reel index (deeper = further right)
    reelStop(i) { snap(200 - i * 18, 0.55, 0.08); },

    // scatter symbol chime
    scatter() {
      [880, 1100, 1320].forEach((f, i) => tone(f, 'sine', 0.26, 0.22, i * 0.09));
    },

    // rising tension hum when 2 scatters are in before reel 4/5
    anticipate() {
      if (_muted) return;
      const c = ac(), t = c.currentTime;
      const osc = c.createOscillator(), env = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.linearRampToValueAtTime(175, t + 1.4);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.13, t + 0.25);
      env.gain.setValueAtTime(0.13, t + 1.1);
      env.gain.linearRampToValueAtTime(0, t + 1.55);
      osc.connect(env); env.connect(c.destination);
      osc.start(t); osc.stop(t + 1.6);
    },

    // win sound tiers
    smallWin() {
      tone(523, 'triangle', 0.18, 0.18);
      tone(659, 'triangle', 0.18, 0.18, 0.1);
    },
    bigWin() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 'triangle', 0.26, 0.4, i * 0.1));
    },
    megaWin() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 'sawtooth', 0.2, 0.5, i * 0.08));
    },

    // single click for credit tick
    creditTick() { tone(1200, 'sine', 0.055, 0.03); },

    // collect ding — pitch rises with collected count
    collectDing(n) {
      const f = 440 + Math.min(n, 30) * 13;
      tone(f, 'sine', 0.22, 0.14);
      tone(f * 1.5, 'sine', 0.1, 0.1, 0.04);
    },

    // short click per win-line during cycling
    lineCycle() { tone(700, 'sine', 0.08, 0.06); },

    // feature trigger siren sweep
    featureStart() {
      if (_muted) return;
      const c = ac(), t = c.currentTime;
      const osc = c.createOscillator(), env = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(720, t + 1.1);
      env.gain.setValueAtTime(0.18, t);
      env.gain.setValueAtTime(0.18, t + 0.9);
      env.gain.linearRampToValueAtTime(0, t + 1.3);
      osc.connect(env); env.connect(c.destination);
      osc.start(t); osc.stop(t + 1.4);
    },

    // wild reel unlock power-up sweep
    wildUnlock() {
      if (_muted) return;
      const c = ac(), t = c.currentTime;
      [1, 2].forEach(m => {
        const o = c.createOscillator(), e = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(300 * m, t);
        o.frequency.exponentialRampToValueAtTime(1200 * m, t + 0.55);
        e.gain.setValueAtTime(0.2 / m, t);
        e.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
        o.connect(e); e.connect(c.destination); o.start(t); o.stop(t + 0.7);
      });
    },

    // gamble results
    gambleWin()  { [440, 554, 659, 880].forEach((f, i) => tone(f, 'sine', 0.26, 0.3, i * 0.07)); },
    gambleLose() { tone(220, 'sawtooth', 0.2, 0.55); tone(185, 'sawtooth', 0.13, 0.45, 0.08); },
  };
})();
