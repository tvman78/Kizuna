'use strict';
/* Kizuna — audio engine: original synthesized music + click / keyboard sounds */

/* Each synth track is original and generated live. `bars` = length of one play-through (used by Repeat). */
const TRACKS = [
  { id: 'sakura', name: 'Sakura Rüzgarı', style: 'relax', mood: 'Rahatlatıcı', bpm: 70, bars: 32, prog: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 64]] },
  { id: 'yagmur', name: 'Gece Yağmuru', style: 'lofi', mood: 'Rahatlatıcı · Lo-fi', bpm: 80, bars: 32, prog: [[50, 53, 57, 60], [55, 58, 62, 65], [48, 52, 55, 59], [45, 48, 52, 55]] },
  { id: 'bulut', name: 'Bulutların Üstünde', style: 'relax', mood: 'Rahatlatıcı · Ambient', bpm: 62, bars: 28, prog: [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]] },
  { id: 'deniz', name: 'Sahil Esintisi', style: 'relax', mood: 'Rahatlatıcı · Dalga', bpm: 66, bars: 32, waves: true, prog: [[52, 59, 64, 68], [49, 56, 61, 64], [45, 52, 57, 61], [47, 54, 59, 63]] },
  { id: 'cay', name: 'Çay Bahçesi', style: 'koto', mood: 'Rahatlatıcı · Pentatonik', bpm: 76, bars: 32, prog: [[50, 57, 62], [48, 55, 60], [45, 52, 57], [47, 54, 59]], scale: [0, 2, 5, 7, 9] },
  { id: 'yildiz', name: 'Yıldız Tozu', style: 'lofi', mood: 'Rahatlatıcı · Chillhop', bpm: 74, bars: 32, prog: [[53, 57, 60, 64], [50, 53, 57, 60], [46, 50, 53, 57], [48, 52, 55, 58]] },
  { id: 'katana', name: 'Katana Fırtınası', style: 'rock', mood: 'Rock', bpm: 150, bars: 48, prog: [[40], [40], [36], [38]], riff: [0, 0, 3, 5, 0, 7, 5, 3] },
  { id: 'ronin', name: 'Ronin Hücumu', style: 'rock', mood: 'Rock · Hızlı', bpm: 172, bars: 56, prog: [[45], [43], [41], [40]], riff: [0, 0, 0, 3, 0, 5, 3, 0] },
  { id: 'celik', name: 'Çelik Yumruk', style: 'rock', mood: 'Rock · Ağır', bpm: 138, bars: 48, prog: [[38], [38], [41], [36]], riff: [0, 0, 1, 0, 3, 0, 1, 5] },
  { id: 'neon', name: 'Neon Kovalamaca', style: 'action', mood: 'Aksiyon · Synth', bpm: 128, bars: 48, prog: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]] },
  { id: 'boss', name: 'Son Boss', style: 'action', mood: 'Aksiyon · Epik', bpm: 140, bars: 48, prog: [[50, 53, 57], [50, 53, 57], [46, 50, 53], [48, 52, 55]] },
  { id: 'sokak', name: 'Sokak Kovalamacası', style: 'action', mood: 'Aksiyon · Hızlı', bpm: 134, bars: 48, prog: [[52, 55, 59], [48, 52, 55], [50, 53, 57], [47, 50, 54]] },
  { id: 'ejder', name: 'Ejderha Dağı', style: 'rock', mood: 'Rock · Epik', bpm: 146, bars: 48, prog: [[45], [41], [43], [40]], riff: [0, 7, 0, 5, 0, 3, 5, 7] },
  /* Drama — slow minor-key pieces led by a violin, in a dark noir mood */
  { id: 'kara', name: 'Kara Yağmur', style: 'drama', mood: 'Dram · Keman & yağmur', bpm: 66, bars: 24, rain: true, prog: [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 56]],
    mel: [[0, 3, 6], [6, 2, 2], [8, 1, 4], [12, 0, 4]] },
  { id: 'veda', name: 'Son Veda', style: 'drama', mood: 'Dram · Keman', bpm: 60, bars: 24, prog: [[50, 53, 57, 62], [46, 50, 53, 58], [48, 52, 55, 60], [45, 49, 52, 57]],
    mel: [[0, 2, 8], [8, 3, 4], [12, 1, 4]] },
  { id: 'gece', name: 'Gece Şehri', style: 'drama', mood: 'Dram · Piyano & keman', bpm: 72, bars: 28, piano: true, prog: [[52, 55, 59, 62], [48, 52, 55, 59], [45, 48, 52, 55], [47, 51, 54, 57]],
    mel: [[2, 3, 4], [6, 2, 2], [8, 3, 3], [11, 1, 5]] },
  { id: 'yalniz', name: 'Yalnız Dedektif', style: 'drama', mood: 'Dram · Noir caz-keman', bpm: 58, bars: 24, rain: true, piano: true, prog: [[43, 50, 53, 57], [41, 48, 51, 56], [39, 46, 50, 53], [38, 45, 50, 54]],
    mel: [[0, 3, 4], [4, 2, 4], [8, 1, 6], [14, 2, 2]] }
];
const MUSIC_GROUPS = [
  ['relax', '🌸 Rahatlatıcı', ['relax', 'lofi', 'koto']],
  ['rock', '🎸 Rock & Aksiyon', ['rock', 'action']],
  ['drama', '🎻 Dram', ['drama']]
];

const AudioEngine = (() => {
  let ctx = null, master, sfx, music, analyser, delay, noiseBuf, distCurve;
  let timer = null, track = null, step = 0, nextTime = 0, userEl = null, userSrc = null, onTrackEnd = null, sinkId = '';

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
    if (sinkId && ctx.setSinkId) ctx.setSinkId(sinkId).catch(() => {});
    return ctx;
  }
  /* Output device (speaker / headphones). '' = system default */
  async function setSink(id) {
    sinkId = id || '';
    if (ctx && ctx.setSinkId) { try { await ctx.setSinkId(sinkId); } catch { return false; } }
    return true;
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

  /* ---- UI sounds ---- */
  function click(kind) {
    if (!kind || kind === 'off' || !ensure()) return;
    const t = ctx.currentTime;
    if (kind === 'soft') { tone({ f: 660, f2: 520, t, dur: 0.09, vol: 0.2, dest: sfx }); tone({ f: 1320, t, dur: 0.05, vol: 0.04, dest: sfx }); }
    else if (kind === 'thin') { tone({ f: 3200, f2: 2400, t, dur: 0.025, type: 'triangle', vol: 0.13, dest: sfx }); noise({ t, dur: 0.015, vol: 0.1, dest: sfx, f: 6000 }); }
    else if (kind === 'pop') { tone({ f: 950, f2: 260, t, dur: 0.06, vol: 0.3, dest: sfx }); }
    else if (kind === 'glass') { tone({ f: 2637, t, dur: 0.28, vol: 0.09, dest: sfx }); tone({ f: 3951, t, dur: 0.22, vol: 0.05, dest: sfx }); tone({ f: 5274, t, dur: 0.12, vol: 0.025, dest: sfx }); }
    else if (kind === 'retro') { tone({ f: 880, t, dur: 0.035, type: 'square', vol: 0.07, dest: sfx }); tone({ f: 1320, t: t + 0.035, dur: 0.04, type: 'square', vol: 0.06, dest: sfx }); }
    else if (kind === 'wood') { noise({ t, dur: 0.04, vol: 0.3, dest: sfx, type: 'bandpass', f: 900, q: 4 }); tone({ f: 320, f2: 240, t, dur: 0.05, type: 'triangle', vol: 0.18, dest: sfx }); }
    else if (kind === 'laser') { tone({ f: 2400, f2: 180, t, dur: 0.13, type: 'sawtooth', vol: 0.06, dest: sfx, filter: { type: 'lowpass', f: 4000 } }); }
    else { tone({ f: 180, f2: 60, t, dur: 0.12, vol: 0.45, dest: sfx }); noise({ t, dur: 0.05, vol: 0.22, dest: sfx, type: 'lowpass', f: 1200 }); }
  }
  function key(kind) {
    if (!kind || kind === 'off' || !ensure()) return;
    const t = ctx.currentTime, r = 0.9 + Math.random() * 0.2;
    if (kind === 'soft') { noise({ t, dur: 0.035, vol: 0.12, dest: sfx, type: 'bandpass', f: 1800 * r, q: 1.2 }); tone({ f: 400 * r, t, dur: 0.03, vol: 0.04, dest: sfx }); }
    else if (kind === 'thin') { noise({ t, dur: 0.018, vol: 0.13, dest: sfx, f: 5000 * r }); tone({ f: 3600 * r, t, dur: 0.012, type: 'square', vol: 0.025, dest: sfx }); }
    else if (kind === 'mech') { noise({ t, dur: 0.012, vol: 0.22, dest: sfx, f: 4200 * r }); noise({ t: t + 0.022, dur: 0.05, vol: 0.2, dest: sfx, type: 'lowpass', f: 1100 * r, q: 1.5 }); tone({ f: 150 * r, f2: 90, t: t + 0.022, dur: 0.04, vol: 0.12, dest: sfx }); }
    else if (kind === 'typewriter') { noise({ t, dur: 0.03, vol: 0.32, dest: sfx, type: 'bandpass', f: 2600 * r, q: 2.5 }); tone({ f: 420 * r, t, dur: 0.02, type: 'square', vol: 0.03, dest: sfx }); if (Math.random() < 0.04) tone({ f: 2093, t: t + 0.05, dur: 0.5, vol: 0.06, dest: sfx }); }
    else if (kind === 'bubble') { tone({ f: 480 * r, f2: 980 * r, t, dur: 0.05, vol: 0.14, dest: sfx }); }
    else if (kind === 'retro') { tone({ f: 523 * r, t, dur: 0.025, type: 'square', vol: 0.05, dest: sfx }); }
    else if (kind === 'rain') { tone({ f: 1900 * r, f2: 900 * r, t, dur: 0.045, vol: 0.09, dest: sfx }); noise({ t, dur: 0.01, vol: 0.04, dest: sfx, f: 6000 }); }
    else { noise({ t, dur: 0.06, vol: 0.3, dest: sfx, type: 'lowpass', f: 800 * r, q: 2 }); tone({ f: 110 * r, f2: 70, t, dur: 0.06, vol: 0.22, dest: sfx }); }
  }
  function notify() { if (!ensure()) return; const t = ctx.currentTime; tone({ f: 880, t, dur: 0.12, vol: 0.14, dest: sfx }); tone({ f: 1320, t: t + 0.09, dur: 0.18, vol: 0.11, dest: sfx }); }
  function alarm() { if (!ensure()) return; const t = ctx.currentTime; tone({ f: 440, t, dur: 0.2, type: 'square', vol: 0.1, dest: sfx, filter: { type: 'lowpass', f: 1500 } }); }

  /* ---- Music instruments ---- */
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
  /* Violin: two detuned saws, slow bow attack, delayed vibrato, body resonance filters */
  function violin(m, t, dur, vol = 0.045) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.22, dur * 0.35));
    g.gain.setValueAtTime(vol, t + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 2800; body.Q.value = 1.2; body.gain.value = 6;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 5.6;
    lfoG.gain.setValueAtTime(0, t); lfoG.gain.linearRampToValueAtTime(mtof(m) * 0.006, t + 0.35);
    lfo.connect(lfoG);
    [-6, 5].forEach(det => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det;
      lfoG.connect(o.frequency); o.connect(hp); o.start(t); o.stop(t + dur + 0.35);
    });
    hp.connect(body); body.connect(lp); lp.connect(g); g.connect(music); g.connect(delay);
    lfo.start(t); lfo.stop(t + dur + 0.35);
  }
  /* Low strings (cello section) */
  function strings(notes, t, dur, vol = 0.03) {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.9);
    g.gain.setValueAtTime(vol, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4);
    lp.connect(g); g.connect(music);
    notes.forEach(m => [-8, 8].forEach(det => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m - 12); o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 0.5); }));
  }
  const piano = (m, t, vol = 0.06) => { tone({ f: mtof(m), t, dur: 1.4, type: 'triangle', vol, dest: music, a: 0.004 }); tone({ f: mtof(m) * 2, t, dur: 0.6, vol: vol * 0.25, dest: music }); };

  function playStep(s, t) {
    const T = track, sd = 60 / T.bpm / 4, bar = Math.floor(s / 16), i = s % 16, ch = T.prog[bar % T.prog.length];
    if (T.style === 'drama') {
      if (i === 0) strings(ch.slice(0, 3), t, sd * 16);
      if (T.rain && i % 4 === 0) noise({ t, dur: sd * 4.2, vol: 0.018, dest: music, type: 'bandpass', f: 5200, q: 0.4, a: 0.3 });
      if (T.piano && (i === 0 || i === 4 || i === 8 || i === 12)) piano(ch[(i / 4 + bar) % ch.length] + 12, t, 0.045);
      else if (!T.piano && i % 8 === 4) pluck(ch[1] + 12, t, 1.6, 0.03, 'sine');
      if (bar % 8 !== 7 || i < 8) {
        const ph = T.mel.find(p => p[0] === i);
        if (ph) { const shift = bar % 4 === 2 ? 1 : 0; const idx = (ph[1] + shift) % ch.length; violin(ch[idx] + 12 + (bar % 8 >= 4 && idx < 2 ? 12 : 0), t, sd * ph[2]); }
      }
      if (i === 0 && bar % 4 === 0) tone({ f: mtof(ch[0] - 24), t, dur: sd * 14, vol: 0.06, dest: music, a: 0.6 });
    } else if (T.style === 'koto') {
      if (i === 0) pad(ch, t, sd * 16, 0.022);
      const sc = T.scale, root = ch[0] + 12;
      if ([0, 3, 6, 8, 11, 14].includes(i)) { const deg = sc[(i * 3 + bar * 2) % sc.length]; pluck(root + deg + (i > 8 ? 12 : 0), t, 0.9, 0.06, 'triangle'); }
      if (i === 0 || i === 8) bass(ch[0] - 12, t, sd * 6, 0.07, 'sine');
    } else if (T.style === 'relax') {
      if (i === 0) pad(ch, t, sd * 16 * 1.02);
      if (i % 4 === 0) pluck(ch[(i / 4 + bar) % ch.length] + 12, t, 1.2, 0.05, 'sine');
      if (i === 10 && bar % 2) pluck(ch[2] + 24, t, 0.8, 0.03, 'sine');
      if (T.waves && i === 0) noise({ t, dur: sd * 14, vol: 0.03, dest: music, type: 'lowpass', f: 700, q: 0.3, a: sd * 6 });
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
    const total = (track.bars || 32) * 16;
    while (nextTime < ctx.currentTime + 0.12) {
      if (step >= total) { // one play-through finished → let the player decide (repeat one / next / stop)
        const cb = onTrackEnd, endAt = nextTime;
        clearInterval(timer); timer = null; track = null;
        setTimeout(() => cb && cb(), Math.max(0, (endAt - ctx.currentTime) * 1000) + 900);
        return;
      }
      playStep(step, nextTime); nextTime += 60 / track.bpm / 4; step++;
    }
  }
  function stopAll() {
    if (timer) { clearInterval(timer); timer = null; }
    track = null; onTrackEnd = null;
    if (userEl) { userEl.onended = null; userEl.pause(); }
  }
  function playSynth(tr, onEnd) {
    if (!ensure()) return; stopAll();
    track = tr; step = 0; nextTime = ctx.currentTime + 0.08; onTrackEnd = onEnd || null;
    timer = setInterval(scheduler, 25);
  }
  function playUser(url, onEnd) {
    if (!ensure()) return; stopAll();
    if (!userEl) { userEl = new Audio(); userSrc = ctx.createMediaElementSource(userEl); userSrc.connect(music); }
    userEl.src = url; userEl.onended = onEnd; userEl.play().catch(() => {});
  }
  const progress = () => {
    if (track) return Math.min(1, step / ((track.bars || 32) * 16));
    if (userEl && userEl.duration && !userEl.paused) return userEl.currentTime / userEl.duration;
    return 0;
  };
  /* Position in seconds { cur, dur } and seeking (0..1) — synth tracks jump to a step, user files to a time */
  function time() {
    if (track) { const sd = 60 / track.bpm / 4, total = (track.bars || 32) * 16; return { cur: Math.min(step, total) * sd, dur: total * sd }; }
    if (userEl && userEl.src && isFinite(userEl.duration)) return { cur: userEl.currentTime, dur: userEl.duration };
    return { cur: 0, dur: 0 };
  }
  function seek(frac) {
    frac = Math.min(0.999, Math.max(0, +frac || 0));
    if (track && ctx) {
      const total = (track.bars || 32) * 16;
      step = Math.floor(frac * total); // jump straight to that step of the piece
      nextTime = ctx.currentTime + 0.04;
      return true;
    }
    if (userEl && isFinite(userEl.duration)) { userEl.currentTime = frac * userEl.duration; return true; }
    return false;
  }
  function setMusicVol(v) { if (ensure()) music.gain.setTargetAtTime(v, ctx.currentTime, 0.05); }
  function setSfxVol(v) { if (ensure()) sfx.gain.setTargetAtTime(v, ctx.currentTime, 0.05); }

  return {
    ensure, click, key, notify, alarm, playSynth, playUser, stopAll, setMusicVol, setSfxVol, setSink, progress, time, seek,
    get analyser() { return analyser; }, get context() { return ensure(); }
  };
})();
