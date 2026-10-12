/* FRAGMENTS — sons générés (WebAudio), aucun fichier audio.
 * Drone d'ambiance par thème + petits signaux (succès, échec, indice, tic final).
 */
(function (root) {
  'use strict';
  let ctx = null, master = null, drone = null, enabled = true;
  const THEME = { bunker: [55, 82.4, 0.08], train: [61.7, 92.5, 0.11], manoir: [49, 73.4, 0.06] };

  function ensure() {
    if (ctx) return ctx;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    return ctx;
  }
  function unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); }

  function startDrone(theme) {
    if (!enabled) return;
    const c = ensure(); if (!c) return;
    stopDrone();
    const [f1, f2, lfoRate] = THEME[theme] || THEME.bunker;
    const g = c.createGain(); g.gain.value = 0; g.connect(master);
    const filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 340; filt.Q.value = 6; filt.connect(g);
    const oscs = [f1, f1 * 1.006, f2].map((f, i) => { const o = c.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.connect(filt); o.start(); return o; });
    // souffle : bruit filtré
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource(); noise.buffer = buf; noise.loop = true;
    const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 500; nf.Q.value = 0.7;
    const ng = c.createGain(); ng.gain.value = 0.05; noise.connect(nf); nf.connect(ng); ng.connect(g); noise.start();
    const lfo = c.createOscillator(); lfo.frequency.value = lfoRate; const lg = c.createGain(); lg.gain.value = 140; lfo.connect(lg); lg.connect(filt.frequency); lfo.start();
    g.gain.linearRampToValueAtTime(0.11, c.currentTime + 3);
    drone = { g, nodes: oscs.concat([noise, lfo]) };
  }
  function stopDrone() {
    if (!drone || !ctx) return;
    const d = drone; drone = null;
    d.g.gain.cancelScheduledValues(ctx.currentTime);
    d.g.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    setTimeout(() => d.nodes.forEach((n) => { try { n.stop(); } catch (e) { /* déjà arrêté */ } }), 2000);
  }
  function tone(freq, start, dur, type, vol, glide) {
    const c = ensure(); if (!c || !enabled) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, c.currentTime + start);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, c.currentTime + start + dur);
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(vol || 0.2, c.currentTime + start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(master); o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
  }
  function rustle(start, dur, vol) {
    const c = ensure(); if (!c || !enabled) return;
    const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * i / len), 2);
    const src = c.createBufferSource(); src.buffer = buf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800 + Math.random() * 1500; bp.Q.value = 0.9;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(bp); bp.connect(g); g.connect(master); src.start(c.currentTime + start);
  }
  const sfx = {
    search() { rustle(0, 0.18, 0.5); rustle(0.22, 0.14, 0.4); rustle(0.42, 0.2, 0.45); },
    click() { tone(1800, 0, 0.03, 'square', 0.04); },
    success() { [392, 523.3, 659.3, 784].forEach((f, i) => tone(f, i * 0.09, 0.6, 'triangle', 0.16)); tone(98, 0, 1.2, 'sine', 0.25); },
    fail() { tone(110, 0, 0.35, 'sawtooth', 0.18, 70); tone(116, 0.02, 0.35, 'square', 0.08, 74); },
    hint() { tone(880, 0, 0.25, 'sine', 0.12); tone(1320, 0.12, 0.35, 'sine', 0.08); },
    tick() { tone(1000, 0, 0.05, 'square', 0.05); },
    win() { [261.6, 329.6, 392, 523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(f, i * 0.11, 1.4, 'triangle', 0.12)); },
    lose() { [220, 207.7, 196, 174.6].forEach((f, i) => tone(f, i * 0.35, 0.9, 'sawtooth', 0.09)); }
  };
  root.FragAudio = {
    unlock, startDrone, stopDrone,
    play(name) { if (enabled && sfx[name]) { ensure(); sfx[name](); } },
    setEnabled(v) { enabled = !!v; if (!enabled) stopDrone(); }
  };
})(typeof self !== 'undefined' ? self : this);
