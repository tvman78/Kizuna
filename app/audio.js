'use strict';
/* Kizuna — ses motoru: özgün sentez müzikler + tıklama / klavye sesleri */

const TRACKS = [
  { id: 'sakura', name: 'Sakura Rüzgarı', style: 'relax', mood: 'Rahatlatıcı', bpm: 70, prog: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 64]] },
  { id: 'yagmur', name: 'Gece Yağmuru', style: 'lofi', mood: 'Rahatlatıcı · Lo-fi', bpm: 80, prog: [[50, 53, 57, 60], [55, 58, 62, 65], [48, 52, 55, 59], [45, 48, 52, 55]] },
  { id: 'bulut', name: 'Bulutların Üstünde', style: 'relax', mood: 'Rahatlatıcı · Ambient', bpm: 62, prog: [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]] },
  { id: 'katana', name: 'Katana Fırtınası', style: 'rock', mood: 'Rock', bpm: 150, prog: [[40], [40], [36], [38]], riff: [0, 0, 3, 5, 0, 7, 5, 3] },
  { id: 'ronin', name: 'Ronin Hücumu', style: 'rock', mood: 'Rock · Hızlı', bpm: 172, prog: [[45], [43], [41], [40]], riff: [0, 0, 0, 3, 0, 5, 3, 0] },
  { id: 'neon', name: 'Neon Kovalamaca', style: 'action', mood: 'Aksiyon · Synth', bpm: 128, prog: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]] },
  { id: 'boss', name: 'Son Boss', style: 'action', mood: 'Aksiyon · Epik', bpm: 140, prog: [[50, 53, 57], [50, 53, 57], [46, 50, 53], [48, 52, 55]] }
];

const AudioEngine = (() => {
  let ctx = null, master, sfx, music, analyser, delay, noiseBuf, distCurve;
  let timer = null, track = null, step = 0, nextTime = 0, userEl = null, userSrc = null;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = 0.6; sfx.connect(master);
    music = ctx.createGain(); music.gain.value = 0.45;
    analyser = ctx.createAnalyser(); analyser.fftSize = 256;
    music.connect(analyser); analyser.connect(master);
    delay = ctx.createDelay(1); delay.delayTime.value = 0.33;
    const fb = ctx.createGain(); fb.gain.value = 0.35;
    const wet = ctx.createGain(); wet.gain.value = 0.45;
    delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(music);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.005));
  }
  function tone({ f, t, dur = 0.1, type = 'sine', vol = 0.2, dest, a = 0.003, f2 = null, filter = null }) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ctx.createGain(); env(g, t, a, vol, dur);
    let n = o;
    if (filter) { const fl = ctx.createBiquadFilter(); fl.type = filter.type; fl.frequency.value = filter.f; o.connect(fl); n = fl; }
    n.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise({ t, dur = 0.05, vol = 0.2, dest, type = 'highpass', f = 1000, q = 0.7, a = 0.001 }) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain(); env(g, t, a, vol, dur);
    s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  /* ---- Arayüz sesleri ---- */
  function click(kind) {
    if (!kind || kind === 'off' || !ensure()) return;
    const t = ctx.currentTime;
    if (kind === 'soft') { tone({ f: 660, f2: 520, t, dur: 0.09, vol: 0.2, dest: sfx }); tone({ f: 1320, t, dur: 0.05, vol: 0.04, dest: sfx }); }
    else if (kind === 'thin') { tone({ f: 3200, f2: 2400, t, dur: 0.025, type: 'triangle', vol: 0.13, dest: sfx }); noise({ t, dur: 0.015, vol: 0.1, dest: sfx, f: 6000 }); }
    else { tone({ f: 180, f2: 60, t, dur: 0.12, vol: 0.45, dest: sfx }); noise({ t, dur: 0.05, vol: 0.22, dest: sfx, type: 'lowpass', f: 1200 }); }
  }
  function key(kind) {
    if (!kind || kind === 'off' || !ensure()) return;
    const t = ctx.currentTime, r = 0.9 + Math.random() * 0.2;
    if (kind === 'soft') { noise({ t, dur: 0.035, vol: 0.12, dest: sfx, type: 'bandpass', f: 1800 * r, q: 1.2 }); tone({ f: 400 * r, t, dur: 0.03, vol: 0.04, dest: sfx }); }
    else if (kind === 'thin') { noise({ t, dur: 0.018, vol: 0.13, dest: sfx, f: 5000 * r }); tone({ f: 3600 * r, t, dur: 0.012, type: 'square', vol: 0.025, dest: sfx }); }
    else { noise({ t, dur: 0.06, vol: 0.3, dest: sfx, type: 'lowpass', f: 800 * r, q: 2 }); tone({ f: 110 * r, f2: 70, t, dur: 0.06, vol: 0.22, dest: sfx }); }
  }
  function notify() { if (!ensure()) return; const t = ctx.currentTime; tone({ f: 880, t, dur: 0.12, vol: 0.14, dest: sfx }); tone({ f: 1320, t: t + 0.09, dur: 0.18, vol: 0.11, dest: sfx }); }
  function alarm() { if (!ensure()) return; const t = ctx.currentTime; tone({ f: 440, t, dur: 0.2, type: 'square', vol: 0.1, dest: sfx, filter: { type: 'lowpass', f: 1500 } }); }

  /* ---- Müzik enstrümanları ---- */
  const drums = {
    kick(t, v = 0.85) { tone({ f: 150, f2: 45, t, dur: 0.28, vol: v, dest: music }); },
    snare(t, v = 0.38) { noise({ t, dur: 0.16, vol: v, dest: music, f: 1200 }); tone({ f: 200, f2: 150, t, dur: 0.08, type: 'triangle', vol: v * 0.5, dest: music }); },
    hat(t, v = 0.09) { noise({ t, dur: 0.035, vol: v, dest: music, f: 7500 }); },
    crash(t) { noise({ t, dur: 1.2, vol: 0.1, dest: music, f: 5000, a: 0.002 }); }
  };
  function getDist() {
    if (distCurve) return distCurve;
    const n = 1024, k = 60; distCurve = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; distCurve[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
    return distCurve;
  }
  function guitar(notes, t, dur, vol = 0.05) {
    const ws = ctx.createWaveShaper(); ws.curve = getDist(); ws.oversample = '2x';
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800;
    const g = ctx.createGain(); env(g, t, 0.004, vol, dur);
    ws.connect(lp); lp.connect(g); g.connect(music);
    notes.forEach(m => [0, -9].forEach(det => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det;
      o.connect(ws); o.start(t); o.stop(t + dur + 0.05);
    }));
  }
  function pad(notes, t, dur, vol = 0.035) {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(1.2, dur * 0.4));
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(g); g.connect(music);
    notes.forEach(m => ['sine', 'triangle'].forEach((ty, i) => {
      const o = ctx.createOscillator(); o.type = ty; o.frequency.value = mtof(m); o.detune.value = i ? 7 : -7;
      o.connect(lp); o.start(t); o.stop(t + dur + 0.1);
    }));
  }
  function pluck(m, t, dur = 0.5, vol = 0.07, type = 'triangle') {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(m);
    const g = ctx.createGain(); env(g, t, 0.005, vol, dur);
    o.connect(g); g.connect(music); g.connect(delay); o.start(t); o.stop(t + dur + 0.05);
  }
  const bass = (m, t, dur, vol = 0.12, type = 'square') => tone({ f: mtof(m), t, dur, type, vol, dest: music, filter: { type: 'lowpass', f: 500 } });

  function playStep(s, t) {
    const T = track, sd = 60 / T.bpm / 4, bar = Math.floor(s / 16), i = s % 16, ch = T.prog[bar % T.prog.length];
    if (T.style === 'relax') {
      if (i === 0) pad(ch, t, sd * 16 * 1.02);
      if (i % 4 === 0) pluck(ch[(i / 4 + bar) % ch.length] + 12, t, 1.2, 0.05, 'sine');
      if (i === 10 && bar % 2) pluck(ch[2] + 24, t, 0.8, 0.03, 'sine');
    } else if (T.style === 'lofi') {
      if (i === 0) pad(ch, t, sd * 16, 0.03);
      if (i === 0 || i === 7 || i === 10) drums.kick(t, 0.42);
      if (i === 4 || i === 12) noise({ t, dur: 0.12, vol: 0.11, dest: music, type: 'bandpass', f: 1800 });
      if (i % 2 === 0) { drums.hat(t + (i % 4 === 2 ? sd * 0.15 : 0), 0.035); pluck(ch[(i / 2) % ch.length] + 12, t, 0.35, 0.04); }
      if (Math.random() < 0.15) noise({ t, dur: 0.01, vol: 0.025, dest: music, f: 3000 });
    } else if (T.style === 'rock') {
      const root = ch[0];
      if (i === 0 && bar % 4 === 0) drums.crash(t);
      if (i === 0 || i === 3 || i === 8 || i === 11) drums.kick(t);
      if (i === 4 || i === 12) drums.snare(t);
      if (i % 2 === 0) {
        drums.hat(t);
        const r = root + (T.riff ? T.riff[(i / 2) % T.riff.length] : 0);
        guitar([r, r + 7, r + 12], t, sd * 1.6);
        bass(root - 12, t, sd * 1.8);
      }
    } else {
      if (i % 4 === 0) drums.kick(t);
      if (i === 4 || i === 12) drums.snare(t, 0.32);
      if (i % 2 === 1) drums.hat(t, 0.07);
      pluck(ch[i % ch.length] + 12 + (i >= 8 ? 12 : 0), t, sd * 0.9, 0.035, 'sawtooth');
      if (i % 4 === 2) bass(ch[0] - 12, t, sd * 1.5, 0.13, 'sawtooth');
      if (i === 0) pad(ch, t, sd * 16, 0.018);
    }
  }
  function scheduler() {
    if (!track) return;
    while (nextTime < ctx.currentTime + 0.12) { playStep(step, nextTime); nextTime += 60 / track.bpm / 4; step++; }
  }
  function stopAll() {
    if (timer) { clearInterval(timer); timer = null; }
    track = null;
    if (userEl) userEl.pause();
  }
  function playSynth(tr) {
    if (!ensure()) return; stopAll();
    track = tr; step = 0; nextTime = ctx.currentTime + 0.08;
    timer = setInterval(scheduler, 25);
  }
  function playUser(url, onEnd) {
    if (!ensure()) return; stopAll();
    if (!userEl) { userEl = new Audio(); userSrc = ctx.createMediaElementSource(userEl); userSrc.connect(music); }
    userEl.src = url; userEl.onended = onEnd; userEl.play().catch(() => {});
  }
  function setMusicVol(v) { if (ensure()) music.gain.setTargetAtTime(v, ctx.currentTime, 0.05); }
  function setSfxVol(v) { if (ensure()) sfx.gain.setTargetAtTime(v, ctx.currentTime, 0.05); }

  return {
    ensure, click, key, notify, alarm, playSynth, playUser, stopAll, setMusicVol, setSfxVol,
    get analyser() { return analyser; }, get context() { return ensure(); }
  };
})();
