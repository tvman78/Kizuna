'use strict';
/* Kizuna — ambient theme sounds | Made by: Tv Man & FKOAC
   Everything is synthesized live (no audio files, no game audio):
   japan  = garden stream, bamboo breeze, birds, shishi-odoshi, wind chime, far temple bell
   hawaii = surf, palm breeze, gulls, ship horn, warm sunset synth
   noir   = rain, city hum, passing cars, far horns and sirens, thunder synced to the lightning
   wild   = desert wind, crackling embers, helicopters, distant gunfire, coyote, western guitar */
const ThemeSound = (() => {
  let current = null, on = true, vol = 0.7, root = null, live = [], timers = [], session = 0, buffers = null, unlock = false;
  const holds = new Set();
  const paused = () => holds.size > 0;
  const MIX = { japan: 2.6, hawaii: .52, noir: 1.15, wild: 1.25 }; // evens out loudness between the themes
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
      const next = wait => { const t = setTimeout(() => { if (id !== session) return; if (!paused() && on && !document.hidden) { try { fn(); } catch (e) { console.error('ThemeSound', e); } } next(R(min, max)); }, wait * 1000); timers.push(t); if (timers.length > 40) timers.splice(0, 20); };
      next(first === null ? R(min * .4, max) : first);
    };
    const note = ({ f, f2 = 0, type = 'sine', t = ctx.currentTime, dur = 1, vol: v = 0.05, a: at = 0.02, lp = 0, pan = 0, pan2 = null, vib = 0, vibRate = 5 }) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let n = o; if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; n.connect(fl); n = fl; }
      const p = ctx.createStereoPanner(); p.pan.setValueAtTime(pan, t); if (pan2 !== null) p.pan.linearRampToValueAtTime(pan2, t + dur); n.connect(g); g.connect(p); p.connect(out);
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
    /* A real police siren: a harsh horn-speaker tone that wails and yelps, with Doppler and echoes off the buildings */
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; curve[i] = Math.tanh(x * 3.4); }
    const police = ({ t = ctx.currentTime, d = 15, pan = -.8, pan2 = .7, v = .1, low = 640, high = 1490 }) => {
      const a = ctx.createOscillator(), b = ctx.createOscillator(), mix = ctx.createGain(), ws = ctx.createWaveShaper(); ws.curve = curve; ws.oversample = '2x';
      a.type = 'sawtooth'; b.type = 'square'; b.detune.value = 7; mix.gain.value = .34;
      const yelpAt = d * R(.38, .5), yelpEnd = yelpAt + d * R(.16, .26); let at = t, up = true;
      for (const o of [a, b]) o.frequency.setValueAtTime(low, t);
      while (at < t + d) {
        const yelp = at - t >= yelpAt && at - t < yelpEnd, step = yelp ? .15 : 1.42; at += step;
        for (const o of [a, b]) o.frequency.linearRampToValueAtTime(up ? high : low, at);
        up = !up;
      }
      for (const o of [a, b]) { o.detune.setValueAtTime(o === b ? 47 : 40, t); o.detune.setValueAtTime(o === b ? 47 : 40, t + d * .42); o.detune.linearRampToValueAtTime(o === b ? -53 : -60, t + d * .58); }
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 430;
      const horn = ctx.createBiquadFilter(); horn.type = 'peaking'; horn.frequency.value = 1320; horn.Q.value = .9; horn.gain.value = 9;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = .5; lp.frequency.setValueAtTime(1500, t); lp.frequency.linearRampToValueAtTime(3500, t + d * .5); lp.frequency.linearRampToValueAtTime(1300, t + d);
      const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v * .28, t + d * .18); g.gain.exponentialRampToValueAtTime(v, t + d * .46); g.gain.setValueAtTime(v, t + d * .54); g.gain.exponentialRampToValueAtTime(v * .22, t + d * .84); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      const p = ctx.createStereoPanner(); p.pan.setValueAtTime(pan, t); p.pan.linearRampToValueAtTime(pan2, t + d);
      const eLp = ctx.createBiquadFilter(); eLp.type = 'lowpass'; eLp.frequency.value = 1500;
      const d1 = ctx.createDelay(1), d2 = ctx.createDelay(1), e1 = ctx.createGain(), e2 = ctx.createGain(), eP = ctx.createStereoPanner();
      d1.delayTime.value = .19; d2.delayTime.value = .41; e1.gain.value = .3; e2.gain.value = .16; eP.pan.value = -((pan + pan2) / 2) - .25;
      a.connect(mix); b.connect(mix); mix.connect(ws); ws.connect(hp); hp.connect(horn); horn.connect(lp); lp.connect(g); g.connect(p); p.connect(out);
      g.connect(eLp); eLp.connect(d1); eLp.connect(d2); d1.connect(e1); d2.connect(e2); e1.connect(eP); e2.connect(eP); eP.connect(out);
      a.start(t); b.start(t); a.stop(t + d + .05); b.stop(t + d + .05);
      a.onended = () => setTimeout(() => { for (const n of [mix, ws, hp, horn, lp, g, p, eLp, d1, d2, e1, e2, eP]) { try { n.disconnect(); } catch {} } }, 900);
    };
    SCAPES[theme]({ ctx, bed, lfo, every, note, burst, police });
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
    /* ---------- Sakura Vadisi: a quiet Japanese garden by the lake ---------- */
    japan({ ctx, bed, lfo, every, note, burst }) {
      const stream = bed({ buf: 'pink', type: 'bandpass', f: 1050, q: .6, gain: .17, pan: -.35 }); lfo(stream.g.gain, .13, .045); lfo(stream.fl.frequency, .09, 240);
      const trickle = bed({ buf: 'rain', type: 'bandpass', f: 2500, q: 1.1, gain: .13, pan: -.2, rate: .68 }); lfo(trickle.g.gain, .19, .035);
      bed({ buf: 'brown', f: 190, gain: .1, pan: .25 });
      const breeze = bed({ buf: 'pink', type: 'bandpass', f: 2300, q: .6, gain: .045, pan: .35 }); lfo(breeze.g.gain, .12, .032); lfo(breeze.fl.frequency, .07, 620);
      every(() => { const d = R(2.2, 4.6), s = Math.random() < .5 ? -1 : 1; burst({ buf: 'white', type: 'bandpass', f: R(3000, 4700), f2: R(2100, 3000), q: .9, dur: d, vol: R(.012, .026), a: d * .42, pan: s * .75, pan2: -s * .25, am: R(7, 13) }); }, 6, 13, 4);
      const warbler = () => { // bush warbler: a long held whistle, then a quick rising call
        let t = ctx.currentTime; const pan = R(-.75, .75), k = R(.94, 1.08);
        note({ f: 1240 * k, f2: 1290 * k, t, dur: R(.8, 1.2), vol: .018, a: .16, pan }); t += 1.08;
        for (const [a, b, d] of [[2150, 3050, .12], [3050, 1980, .15], [1980, 2620, .28]]) { note({ f: a * k, f2: b * k, t, dur: d, vol: .021, a: .012, pan }); t += d * .92; }
      };
      every(warbler, 11, 24, 5);
      every(() => { let t = ctx.currentTime; const pan = R(-.9, .9), f = R(2800, 4600); for (let i = 0; i < Math.round(R(2, 6)); i++) { note({ f: f * R(.92, 1.08), f2: f * R(.72, 1.16), t, dur: R(.05, .12), vol: .0085, a: .006, pan }); t += R(.09, .24); } }, 3, 8);
      every(() => { // shishi-odoshi: water tips the bamboo, which knocks on stone
        const t = ctx.currentTime + 1.1, pan = R(-.25, .35);
        burst({ buf: 'pink', type: 'bandpass', f: 1500, f2: 900, q: 1.4, t: ctx.currentTime, dur: 1.2, vol: .035, a: .55, pan });
        note({ f: 690, f2: 450, type: 'triangle', t, dur: .13, vol: .12, a: .002, pan }); note({ f: 1520, f2: 1080, type: 'sine', t, dur: .05, vol: .035, a: .001, pan });
        burst({ type: 'bandpass', f: 1250, q: 5, t, dur: .04, vol: .12, a: .001, pan }); note({ f: 590, f2: 410, type: 'triangle', t: t + .34, dur: .08, vol: .028, a: .002, pan });
      }, 15, 29, 7);
      every(() => { // furin: a small glass wind chime
        let t = ctx.currentTime; const pan = R(.1, .75), f = R(2250, 2600);
        for (let i = 0; i < Math.round(R(1, 4)); i++) { const v = R(.012, .023); note({ f, t, dur: 1.9, vol: v, a: .002, pan }); note({ f: f * 2.71, t, dur: .75, vol: v * .36, a: .001, pan }); note({ f: f * 4.1, t, dur: .3, vol: v * .13, a: .001, pan }); t += R(.28, .85); }
      }, 8, 18, 10);
      every(() => { const f = 138, pan = R(-.4, .4); [[1, .07, 10], [2.01, .034, 7], [2.76, .02, 5], [5.4, .006, 2.6]].forEach(([h, v, d]) => note({ f: f * h, dur: d, vol: v, a: .006, pan })); }, 36, 68, 18);
    },
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
    noir({ ctx, bed, lfo, every, note, burst, police }) {
      const rain = bed({ buf: 'rain', type: 'highpass', f: 420, gain: .38, type2: 'lowpass', f2: 10500 }); lfo(rain.g.gain, .07, .08);
      const hiss = bed({ buf: 'white', type: 'highpass', f: 5600, gain: .022 }); lfo(hiss.g.gain, .11, .009);
      bed({ buf: 'rain', type: 'bandpass', f: 1500, q: .6, gain: .16, pan: .5, rate: .86 });
      bed({ buf: 'rain', type: 'bandpass', f: 2300, q: .6, gain: .1, pan: -.5, rate: 1.14 });
      const city = bed({ buf: 'brown', f: 300, gain: .5 }); lfo(city.g.gain, .04, .1);
      const traffic = bed({ buf: 'pink', type: 'bandpass', f: 430, q: .9, gain: .12 }); lfo(traffic.g.gain, .083, .05); lfo(traffic.fl.frequency, .05, 120);
      const street = bed({ buf: 'pink', type: 'bandpass', f: 820, q: 1.2, gain: .045, pan: -.3, rate: .8 }); lfo(street.g.gain, .061, .022);
      every(() => { const d = R(3.6, 6.2), s = Math.random() < .5 ? -1 : 1, t = ctx.currentTime; burst({ buf: 'pink', type: 'bandpass', f: 520, f2: 880, q: .7, t, dur: d * .58, vol: .13, a: d * .44, pan: s * .92, pan2: 0 }); burst({ buf: 'pink', type: 'bandpass', f: 880, f2: 330, q: .7, t: t + d * .52, dur: d * .5, vol: .12, a: .06, pan: 0, pan2: -s * .92 }); burst({ buf: 'white', type: 'highpass', f: 3600, t: t + d * .36, dur: d * .42, vol: .018, a: d * .16, pan: s * .3, pan2: -s * .4 }); note({ f: 62, f2: 74, type: 'sawtooth', t, dur: d, vol: .018, a: d * .46, lp: 210 }); }, 6, 15, 4);
      // Distant car horns: different cars and honking patterns, with an echo off the buildings
      const HORNS = [[349, 440], [392, 494], [311, 415], [165, 208]], HONKS = [[[0, .62]], [[0, .22], [.32, .55]], [[0, .17], [.25, .17], [.5, .72]], [[0, 1.1]]];
      const horn = () => {
        const t = ctx.currentTime, pan = R(-.88, .88), near = R(.6, 1), tones = HORNS[Math.floor(R(0, HORNS.length))], pat = HONKS[Math.floor(R(0, HONKS.length))];
        for (const [dt, d] of pat) for (const f of tones) {
          note({ f, type: 'sawtooth', t: t + dt, dur: d + .28, vol: .052 * near, a: .014, lp: 1300, pan });
          note({ f, type: 'sawtooth', t: t + dt + .21, dur: d + .34, vol: .016 * near, a: .02, lp: 780, pan: -pan * .6 });
        }
      };
      every(horn, 5, 13, 3);
      // Police sirens far away: they approach, pass across the city and fade out
      const siren = (delay = 0, shift = 1) => { const s = Math.random() < .5 ? -1 : 1; police({ t: ctx.currentTime + delay, d: R(13, 19), pan: s * .88, pan2: -s * .74, v: R(.085, .115), low: 640 * shift, high: 1490 * shift }); };
      every(() => { siren(); if (Math.random() < .4) siren(R(1.1, 2.6), R(.91, .96)); }, 18, 36, 6);
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
      // Helicopters passing in the distance: rotor chop that swells and fades across the stereo field
      every(() => { const d = R(11, 16), s = Math.random() < .5 ? -1 : 1, t = ctx.currentTime, chop = R(12.5, 15.5); burst({ buf: 'brown', type: 'lowpass', f: 300, f2: 660, q: .7, t, dur: d * .56, vol: .78, a: d * .46, pan: s * .92, pan2: 0, am: chop }); burst({ buf: 'brown', type: 'lowpass', f: 660, f2: 240, q: .7, t: t + d * .52, dur: d * .48, vol: .72, a: .08, pan: 0, pan2: -s * .92, am: chop }); burst({ buf: 'pink', type: 'bandpass', f: 720, q: 1.3, t, dur: d, vol: .1, a: d * .47, pan: s * .8, pan2: -s * .8, am: chop }); burst({ buf: 'white', type: 'bandpass', f: 1500, q: 1.1, t, dur: d, vol: .026, a: d * .48, pan: s * .7, pan2: -s * .7, am: chop * 2 }); }, 15, 31, 5);
      // Distant gunfire: single shots and short automatic bursts, each with a canyon echo
      const shot = (t, pan, v) => {
        burst({ buf: 'white', type: 'bandpass', f: R(1000, 1700), q: .8, t, dur: .055, vol: .13 * v, a: .001, pan });
        burst({ buf: 'pink', type: 'lowpass', f: 720, f2: 95, q: .7, t, dur: .26, vol: .62 * v, a: .002, pan });
        burst({ buf: 'pink', type: 'lowpass', f: 430, f2: 90, q: .6, t: t + R(.27, .4), dur: .46, vol: .17 * v, a: .018, pan: -pan * .7 });
      };
      every(() => {
        let t = ctx.currentTime; const pan = R(-.9, .9), v = R(.55, 1), kind = Math.random();
        if (kind < .3) { const n = Math.round(R(1, 3)); for (let i = 0; i < n; i++) { shot(t, pan, v); t += R(.55, 1.2); } }
        else { const groups = kind < .72 ? 1 : 2; for (let g = 0; g < groups; g++) { const n = Math.round(R(4, 11)), gap = R(.085, .125); for (let i = 0; i < n; i++) { shot(t, pan, v * R(.82, 1)); t += gap * R(.92, 1.08); } t += R(.45, 1); } }
      }, 5, 14, 3);
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
