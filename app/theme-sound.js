'use strict';
/* Kizuna — ambient theme sounds | Made by: Tv Man & FKOAC
   Everything is synthesized live (no audio files, no game audio):
   hawaii = surf, palm breeze, gulls, ship horn, warm sunset synth
   noir   = rain, city hum, passing cars, far horns and sirens, thunder synced to the lightning
   wild   = desert wind, crackling embers, helicopter, coyote, distant western guitar */
const ThemeSound = (() => {
  let current = null, on = true, vol = 0.7, root = null, live = [], timers = [], session = 0, buffers = null, unlock = false;
  const holds = new Set();
  const paused = () => holds.size > 0;
  const MIX = { hawaii: .52, noir: 1.15, wild: 1.25 }; // evens out loudness between the themes
  const level = () => (on && current && !paused() ? vol * MIX[current] : 0);
  const R = (a, b) => a + Math.random() * (b - a);
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  /* Eight-second looping noise beds */
  function makeBuffers(ctx) {
    const sr = ctx.sampleRate, n = sr * 8, fade = Math.floor(sr * 0.4);
    const make = fill => {
      const b = ctx.createBuffer(2, n + fade, sr);
      for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); fill(d, n + fade); for (let i = 0; i < fade; i++) { const t = i / fade; d[i] = d[i] * t + d[n + i] * (1 - t); } }
      const out = ctx.createBuffer(2, n, sr);
      for (let ch = 0; ch < 2; ch++) out.copyToChannel(b.getChannelData(ch).subarray(0, n), ch);
      return out;
    };
    const pinkFill = d => { let a = 0, b = 0, c = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; a = .997 * a + w * .029; b = .985 * b + w * .032; c = .95 * c + w * .048; d[i] = (a + b + c + w * .05) * .9; } };
    return {
      white: make(d => { for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }),
      pink: make(pinkFill),
      brown: make(d => { let x = 0; for (let i = 0; i < d.length; i++) { x = (x + (Math.random() * 2 - 1) * .02) / 1.02; d[i] = x * 3.4; } }),
      rain: make(d => { // fine rain with thousands of single drops landing on the street
        pinkFill(d);
        for (let i = 0; i < d.length; i++) d[i] *= .42;
        for (let k = 0; k < 5200; k++) { const at = Math.floor(Math.random() * (d.length - 500)), len = 40 + Math.floor(Math.random() * 300), f = R(.12, .62), amp = R(.05, .38) * Math.pow(Math.random(), 2); for (let j = 0; j < len; j++) d[at + j] += Math.sin(j * f) * amp * Math.exp(-j / (len * .24)); }
      })
    };
  }

  function start(theme) {
    const a = AudioEngine.ambientBus(); if (!a) return;
    const ctx = a.ctx, id = ++session;
    if (!buffers) buffers = makeBuffers(ctx);
    root = ctx.createGain(); root.gain.value = 0.0001; root.connect(a.bus);
    root.gain.setTargetAtTime(level(), ctx.currentTime, 0.45);
    live = []; timers = [];
    const out = root;
    const bed = ({ buf = 'pink', type = 'lowpass', f = 1000, q = 0.7, gain = 0.1, pan = 0, type2 = null, f2 = 0, rate = 1 }) => {
      const s = ctx.createBufferSource(); s.buffer = buffers[buf]; s.loop = true; s.playbackRate.value = rate;
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const g = ctx.createGain(); g.gain.value = gain;
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      let n = s; n.connect(fl); n = fl;
      if (type2) { const fl2 = ctx.createBiquadFilter(); fl2.type = type2; fl2.frequency.value = f2; n.connect(fl2); n = fl2; }
      n.connect(g); g.connect(p); p.connect(out); s.start(ctx.currentTime, Math.random() * 7); live.push(s);
      return { s, fl, g, p };
    };
    const lfo = (param, rate, depth, type = 'sine') => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = rate; const g = ctx.createGain(); g.gain.value = depth; o.connect(g); g.connect(param); o.start(ctx.currentTime + Math.random()); live.push(o); };
    const every = (fn, min, max, first = null) => {
      const next = wait => { const t = setTimeout(() => { if (id !== session) return; if (!paused() && on && !document.hidden) { try { fn(); } catch {} } next(R(min, max)); }, wait * 1000); timers.push(t); if (timers.length > 40) timers.splice(0, 20); };
      next(first === null ? R(min * .4, max) : first);
    };
    const note = ({ f, f2 = 0, type = 'sine', t = ctx.currentTime, dur = 1, vol: v = 0.05, a: at = 0.02, lp = 0, pan = 0, vib = 0, vibRate = 5 }) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let n = o; if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; n.connect(fl); n = fl; }
      const p = ctx.createStereoPanner(); p.pan.value = pan; n.connect(g); g.connect(p); p.connect(out);
      let m = null; if (vib) { m = ctx.createOscillator(); m.frequency.value = vibRate; const mg = ctx.createGain(); mg.gain.value = vib; m.connect(mg); mg.connect(o.frequency); m.start(t); m.stop(t + dur + .05); }
      o.start(t); o.stop(t + dur + .05);
    };
    const burst = ({ buf = 'white', type = 'bandpass', f = 1000, f2 = 0, q = 1, t = ctx.currentTime, dur = .2, vol: v = .1, a: at = .003, pan = 0, pan2 = null, am = 0 }) => {
      const s = ctx.createBufferSource(); s.buffer = buffers[buf]; s.loop = true;
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const p = ctx.createStereoPanner(); p.pan.setValueAtTime(pan, t); if (pan2 !== null) p.pan.linearRampToValueAtTime(pan2, t + dur);
      let last = g;
      if (am) { const tr = ctx.createGain(); tr.gain.value = .55; const o = ctx.createOscillator(); o.frequency.value = am; const d = ctx.createGain(); d.gain.value = .45; o.connect(d); d.connect(tr.gain); o.start(t); o.stop(t + dur + .05); g.connect(tr); last = tr; }
      s.connect(fl); fl.connect(g); last.connect(p); p.connect(out); s.start(t, Math.random() * 7); s.stop(t + dur + .05);
    };
    SCAPES[theme]({ ctx, bed, lfo, every, note, burst });
    api_thunder = theme === 'noir' ? () => {
      const t = ctx.currentTime + R(.12, .9), big = R(.7, 1), pan = R(-.5, .5);
      burst({ buf: 'white', type: 'highpass', f: 1400, t, dur: .22, vol: .1 * big, pan });
      burst({ buf: 'pink', type: 'lowpass', f: 900, f2: 170, q: .5, t: t + .02, dur: 1.4, vol: .78 * big, a: .012, pan });
      burst({ buf: 'brown', type: 'lowpass', f: 210, f2: 58, q: .8, t: t + .08, dur: R(4.6, 7), vol: 1.7 * big, a: .1, pan: pan * .5, am: 5.5 });
      burst({ buf: 'brown', type: 'lowpass', f: 120, f2: 40, q: .8, t: t + .9, dur: R(3.5, 5), vol: 1.15 * big, a: .5, pan: -pan * .4, am: 3.2 });
    } : null;
  }
  let api_thunder = null;

  const SCAPES = {
    /* ---------- Vice Hawaii: sunset beach ---------- */
    hawaii({ ctx, bed, lfo, every, note, burst }) {
      const w1 = bed({ buf: 'pink', f: 1300, gain: .26, pan: -.45 }), w2 = bed({ buf: 'pink', f: 1000, gain: .24, pan: .45 });
      lfo(w1.g.gain, .105, .17); lfo(w1.fl.frequency, .105, 620); lfo(w2.g.gain, .142, .15); lfo(w2.fl.frequency, .142, 520);
      bed({ buf: 'brown', f: 170, gain: .17 });
      const breeze = bed({ buf: 'pink', type: 'bandpass', f: 1750, q: .7, gain: .07 }); lfo(breeze.g.gain, .23, .045); lfo(breeze.fl.frequency, .09, 520);
      const chords = [[53, 60, 64, 69], [50, 57, 60, 65], [46, 53, 57, 62], [48, 55, 59, 64]]; let bar = 0;
      const pad = () => { const ch = chords[bar++ % chords.length]; for (const m of ch) { note({ f: mtof(m), type: 'triangle', dur: 9.4, vol: .026, a: 2.6, lp: 1100, pan: R(-.4, .4) }); note({ f: mtof(m) * 1.004, type: 'sawtooth', dur: 9.4, vol: .0075, a: 3.2, lp: 780, pan: R(-.6, .6), vib: 1.2, vibRate: .5 }); } };
      pad(); every(pad, 8.4, 8.4, 8.4);
      const scale = [65, 67, 69, 72, 74, 77, 79];
      every(() => { let t = ctx.currentTime, i = Math.floor(R(0, 4)); const n = Math.round(R(3, 6)); for (let k = 0; k < n; k++) { const f = mtof(scale[Math.min(scale.length - 1, i)]); note({ f, t, dur: 1.5, vol: .034, a: .008, lp: 2600, pan: -.2 + k * .1 }); note({ f: f * 2, t, dur: .55, vol: .009, a: .006 }); t += R(.28, .5); i = Math.max(0, i + Math.round(R(-2, 2.4))); } }, 7, 15, 5);
      const gull = () => { let t = ctx.currentTime; const n = Math.round(R(2, 5)), pan = R(-.85, .85); for (let k = 0; k < n; k++) { const f = R(1500, 2100); note({ f, f2: f * R(.58, .72), type: 'sawtooth', t, dur: R(.2, .34), vol: .017, a: .025, lp: 3400, pan }); note({ f: f * 1.5, f2: f, t, dur: .16, vol: .005, a: .015, pan }); t += R(.26, .44); } };
      every(gull, 5, 13, 3);
      every(() => { const pan = R(-.7, .7); for (const f of [98, 147.5]) note({ f, type: 'sawtooth', dur: 3, vol: .05, a: .22, lp: 560, pan }); }, 26, 52);
      every(() => burst({ buf: 'pink', type: 'bandpass', f: R(600, 1300), q: .8, dur: R(.8, 1.7), vol: R(.05, .1), a: .25, pan: R(-.8, .8) }), 2.6, 6);
    },
    /* ---------- Kara Yağmur: rain over a night city ---------- */
    noir({ ctx, bed, lfo, every, note, burst }) {
      const rain = bed({ buf: 'rain', type: 'highpass', f: 420, gain: .46, type2: 'lowpass', f2: 10500 }); lfo(rain.g.gain, .07, .09);
      const hiss = bed({ buf: 'white', type: 'highpass', f: 5600, gain: .022 }); lfo(hiss.g.gain, .11, .009);
      bed({ buf: 'rain', type: 'bandpass', f: 1500, q: .6, gain: .16, pan: .5, rate: .86 });
      bed({ buf: 'rain', type: 'bandpass', f: 2300, q: .6, gain: .1, pan: -.5, rate: 1.14 });
      const city = bed({ buf: 'brown', f: 260, gain: .34 }); lfo(city.g.gain, .04, .07);
      const traffic = bed({ buf: 'pink', type: 'bandpass', f: 430, q: .9, gain: .05 }); lfo(traffic.g.gain, .083, .03); lfo(traffic.fl.frequency, .05, 120);
      every(() => { const d = R(3.6, 6.2), s = Math.random() < .5 ? -1 : 1, t = ctx.currentTime; burst({ buf: 'pink', type: 'bandpass', f: 520, f2: 880, q: .7, t, dur: d * .58, vol: .13, a: d * .44, pan: s * .92, pan2: 0 }); burst({ buf: 'pink', type: 'bandpass', f: 880, f2: 330, q: .7, t: t + d * .52, dur: d * .5, vol: .12, a: .06, pan: 0, pan2: -s * .92 }); burst({ buf: 'white', type: 'highpass', f: 3600, t: t + d * .36, dur: d * .42, vol: .018, a: d * .16, pan: s * .3, pan2: -s * .4 }); note({ f: 62, f2: 74, type: 'sawtooth', t, dur: d, vol: .018, a: d * .46, lp: 210 }); }, 6, 15, 4);
      every(() => { const pan = R(-.8, .8), t = ctx.currentTime, twice = Math.random() < .5; for (const [dt, d] of twice ? [[0, .22], [.34, .5]] : [[0, .62]]) for (const f of [349, 440]) note({ f, type: 'sawtooth', t: t + dt, dur: d, vol: .014, a: .015, lp: 1050, pan }); }, 17, 42);
      every(() => { const pan = R(-.8, .8), t = ctx.currentTime, d = R(7, 10); note({ f: 760, type: 'triangle', t, dur: d, vol: .022, a: 2.2, lp: 1500, pan, vib: 250, vibRate: .55 }); note({ f: 1140, type: 'sine', t, dur: d, vol: .006, a: 2.4, lp: 1800, pan, vib: 330, vibRate: .55 }); }, 42, 90);
      every(() => { let t = ctx.currentTime; const p = R(-.7, .7), f = R(1800, 3400); for (let k = 0; k < Math.round(R(2, 5)); k++) { note({ f: f * R(.95, 1.05), f2: f * .55, t, dur: .07, vol: .02, a: .002, pan: p }); t += R(.14, .44); } }, 2.4, 6.5);
    },
    /* ---------- Vahşi Saldırı: wind across the wild desert ---------- */
    wild({ ctx, bed, lfo, every, note, burst }) {
      const wind = bed({ buf: 'pink', type: 'bandpass', f: 460, q: 1.5, gain: .42 }); lfo(wind.fl.frequency, .071, 210); lfo(wind.g.gain, .11, .17);
      const howl = bed({ buf: 'pink', type: 'bandpass', f: 960, q: 9, gain: .34, pan: .25 }); lfo(howl.fl.frequency, .053, 330); lfo(howl.g.gain, .083, .2);
      const howl2 = bed({ buf: 'pink', type: 'bandpass', f: 1460, q: 12, gain: .15, pan: -.35 }); lfo(howl2.fl.frequency, .037, 420); lfo(howl2.g.gain, .061, .1);
      bed({ buf: 'brown', f: 130, gain: .24 });
      const sand = bed({ buf: 'white', type: 'highpass', f: 4600, gain: .014 }); lfo(sand.g.gain, .11, .009);
      every(() => { let t = ctx.currentTime; const pan = R(-.5, .5); for (let k = 0; k < Math.round(R(1, 5)); k++) { burst({ type: 'bandpass', f: R(1300, 5200), q: R(1, 4), t, dur: R(.012, .05), vol: R(.05, .18), a: .001, pan: pan + R(-.14, .14) }); t += R(.02, .13); } }, .28, 1.1);
      every(() => { let t = ctx.currentTime; const pan = R(.1, .8); for (let k = 0; k < Math.round(R(4, 9)); k++) { burst({ buf: 'pink', type: 'bandpass', f: R(420, 860), q: 1.1, t, dur: R(.06, .13), vol: R(.05, .11), a: .005, pan }); t += R(.09, .2); } }, 7, 17);
      every(() => { const f = R(170, 240), pan = R(-.6, .6); note({ f, f2: f * R(1.2, 1.5), type: 'sawtooth', dur: R(.8, 1.5), vol: .011, a: .1, lp: 900, pan, vib: 9, vibRate: 17 }); }, 13, 27);
      every(() => { const d = R(10, 14), s = Math.random() < .5 ? -1 : 1, t = ctx.currentTime; burst({ buf: 'brown', type: 'lowpass', f: 300, f2: 620, q: .6, t, dur: d * .56, vol: .5, a: d * .46, pan: s * .92, pan2: 0, am: 13.5 }); burst({ buf: 'brown', type: 'lowpass', f: 620, f2: 240, q: .6, t: t + d * .52, dur: d * .48, vol: .46, a: .08, pan: 0, pan2: -s * .92, am: 13.5 }); burst({ buf: 'white', type: 'bandpass', f: 1400, q: 1.1, t, dur: d, vol: .018, a: d * .48, pan: s * .7, pan2: -s * .7, am: 27 }); }, 28, 58, 11);
      every(() => { let t = ctx.currentTime; const pan = R(-.85, .85), yips = Math.round(R(1, 3)); for (let k = 0; k < yips; k++) { note({ f: R(540, 720), f2: R(900, 1060), type: 'sawtooth', t, dur: .22, vol: .009, a: .03, lp: 1700, pan }); t += .25; } const top = R(960, 1240); note({ f: 620, f2: top, type: 'triangle', t, dur: .68, vol: .034, a: .22, lp: 2300, pan }); note({ f: top, f2: top * .62, type: 'triangle', t: t + .62, dur: 2.2, vol: .036, a: .05, lp: 2200, pan, vib: 11, vibRate: 5.5 }); note({ f: top * 1.5, f2: top, type: 'sine', t: t + .64, dur: 1.5, vol: .007, a: .05, pan }); }, 21, 46, 9);
      const licks = [[52, 57, 60, 59, 57], [57, 60, 64, 62, 60, 57], [64, 62, 60, 59, 57], [45, 52, 57, 59, 60, 59, 57]];
      every(() => { let t = ctx.currentTime; const l = licks[Math.floor(R(0, licks.length))], pan = R(-.35, .35); l.forEach((m, k) => { const last = k === l.length - 1, f = mtof(m), d = last ? 3 : 1.05; note({ f, type: 'sawtooth', t, dur: d, vol: .029, a: .004, lp: 1650, pan, vib: last ? 3 : .7, vibRate: 6.2 }); note({ f: f * 2, type: 'triangle', t, dur: d * .55, vol: .011, a: .003, pan }); note({ f, type: 'sine', t: t + .3, dur: d, vol: .009, a: .006, pan: -pan }); t += last ? 0 : R(.36, .62); }); }, 24, 48, 14);
    }
  };

  function stop() {
    session++; api_thunder = null;
    timers.forEach(clearTimeout); timers = [];
    const r = root, nodes = live; root = null; live = [];
    if (!r) return;
    const a = AudioEngine.ambientBus();
    if (a) r.gain.setTargetAtTime(0.0001, a.ctx.currentTime, 0.22);
    setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch {} }); try { r.disconnect(); } catch {} }, 1200);
  }
  function apply() {
    const a = AudioEngine.ambientBus();
    if (a && root) root.gain.setTargetAtTime(Math.max(level(), 0.0001), a.ctx.currentTime, 0.28);
  }
  function kick() { if (current && on) { const a = AudioEngine.ambientBus(); if (a && a.ctx.state === 'suspended') a.ctx.resume().catch(() => {}); if (!root) { start(current); } apply(); } }

  document.addEventListener('visibilitychange', () => { if (document.hidden) holds.add('hidden'); else holds.delete('hidden'); apply(); });
  if (!unlock) { unlock = true; ['pointerdown', 'keydown'].forEach(e => addEventListener(e, kick, { passive: true })); }

  return {
    set(theme, enabled, volume) {
      on = !!enabled; vol = Math.max(0, Math.min(1, +volume));
      const want = theme && SCAPES[theme] ? theme : null;
      if (want !== current || !on) { if (root) stop(); current = want; }
      if (current && on && !root) start(current); else apply();
    },
    hold(reason, yes) { if (yes) holds.add(reason); else holds.delete(reason); apply(); },
    thunder() { if (api_thunder && on && !paused()) { try { api_thunder(); } catch {} } }
  };
})();
