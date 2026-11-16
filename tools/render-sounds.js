#!/usr/bin/env node
/* Renders the soundboard ambience loops to real WAV files in sounds/.
   No dependencies: pure PCM synthesis, mono 22050 Hz 16-bit, ~12-20 s seamless loops.
   Usage: node tools/render-sounds.js [outDir] */
"use strict";
const fs = require("fs");
const path = require("path");

const SR = 22050;
const OUT = process.argv[2] || path.join(__dirname, "..", "sounds");

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- primitives ---------- */
function white() { return () => Math.random() * 2 - 1; }
function brown() { let last = 0; return () => { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; return last * 3.5; }; }
function osc(type, freq) {
  let phase = 0;
  const inc = (2 * Math.PI * freq) / SR;
  return () => {
    const p = phase;
    phase += inc;
    if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
    switch (type) {
      case "sine": return Math.sin(p);
      case "square": return Math.sin(p) >= 0 ? 1 : -1;
      case "saw": return (p / Math.PI) - 1;
      case "triangle": return 2 * Math.abs(p / Math.PI - 1) - 1;
      default: return Math.sin(p);
    }
  };
}
function lowpass(fc) { const a = 1 - Math.exp((-2 * Math.PI * fc) / SR); let y = 0; return (x) => { y += a * (x - y); return y; }; }
function highpass(fc) { const lp = lowpass(fc); return (x) => x - lp(x); }
function bandpass(lo, hi) { const hp = highpass(lo), lp = lowpass(hi); return (x) => lp(hp(x)); }
function lfo(freq, depth, base) { const w = 2 * Math.PI * freq / SR; let ph = Math.random() * 2 * Math.PI; return () => { ph += w; if (ph > 2 * Math.PI) ph -= 2 * Math.PI; return base + depth * Math.sin(ph); }; }

/* mix a continuous source into buf with (possibly modulated) gain */
function mix(buf, src, gainFn) {
  for (let i = 0; i < buf.length; i++) buf[i] += src() * gainFn(i / SR);
}
/* one-shot burst with attack/decay envelope; env in seconds */
function burst(buf, startSec, src, peak, attack, decay, whenEnd) {
  const s = Math.floor(startSec * SR);
  const a = Math.max(1, Math.floor(attack * SR));
  const d = Math.max(1, Math.floor(decay * SR));
  const end = Math.min(buf.length, s + a + Math.floor(d * 6));
  for (let i = s; i < end; i++) {
    const t = i - s;
    const env = Math.min(1, t / a) * Math.exp(-t / (d * 0.35));
    buf[i] += src() * peak * env;
  }
  return whenEnd || 0;
}
/* tone with optional pitch slide */
function tone(buf, startSec, type, f0, f1, slideSec, peak, attack, decay) {
  const o = osc(type, f0);
  const s = Math.floor(startSec * SR);
  const a = Math.max(1, Math.floor(attack * SR));
  const d = Math.max(1, Math.floor(decay * SR));
  const end = Math.min(buf.length, s + a + Math.floor(d * 6));
  const slide = Math.floor(slideSec * SR);
  for (let i = s; i < end; i++) {
    const t = i - s;
    const env = Math.min(1, t / a) * Math.exp(-t / (d * 0.35));
    buf[i] += o() * peak * env;
  }
}
/* seamless loop: render extra xf seconds, crossfade tail into head */
function loopify(rendered, n, xf) {
  const x = Math.floor(xf * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n - x; i++) out[i] = rendered[i];
  for (let i = 0; i < x; i++) {
    const t = i / x;
    out[n - x + i] = rendered[n - x + i] * (1 - t) + rendered[i] * t;
  }
  return out;
}
function renderLoop(seconds, xfSec, fn) {
  const n = Math.floor(seconds * SR);
  const x = Math.floor((xfSec || 1) * SR);
  const buf = new Float32Array(n + x);
  fn(buf, n);
  return loopify(buf, n, xfSec || 1);
}
function periodic(freq, n) { return Math.round((freq * n) / SR) * SR / n; }

/* ---------- channel recipes ---------- */
const CHANNELS = {
  rain: { secs: 12, fn(buf, n) {
    const src = white(); const hp = highpass(700); const lp = lowpass(7500);
    const g = lfo(0.13, 0.06, 0.4);
    mix(buf, () => lp(hp(src())), (t) => g(t));
    const hiss = white(); const bp = bandpass(2600, 4200);
    mix(buf, () => bp(hiss()), () => 0.10);
  } },
  thunder: { secs: 20, fn(buf, n) {
    const bed = brown(); const blp = lowpass(90);
    mix(buf, () => blp(bed()), () => 0.05);
    let t = 2;
    while (t < (n / SR) - 6) {
      const c = white(); const cbp = bandpass(rnd(400, 1100), rnd(900, 1600));
      burst(buf, t, () => cbp(c()), 0.5, 0.01, rnd(0.25, 0.55));
      const r = brown(); const rlp = lowpass(rnd(70, 160));
      burst(buf, t + rnd(0.05, 0.3), () => rlp(r()), 0.85, rnd(0.25, 0.7), rnd(2.5, 5));
      t += rnd(6, 17);
    }
  } },
  wind: { secs: 12, fn(buf, n) {
    const src = white(); const bp = bandpass(150, 600);
    const g1 = lfo(0.09, 0.10, 0.22); const g2 = lfo(0.13, 0.06, 1);
    mix(buf, () => bp(src()), (t) => g1(t) * g2(t));
  } },
  fire: { secs: 12, fn(buf, n) {
    const bed = brown(); const blp = lowpass(260);
    mix(buf, () => blp(bed()), () => 0.16);
    let t = 0.1;
    while (t < (n / SR) - 0.2) {
      const c = white(); const bp = bandpass(rnd(1200, 3000), rnd(3500, 5500));
      burst(buf, t, () => bp(c()), rnd(0.05, 0.27), 0.003, rnd(0.02, 0.08));
      t += rnd(0.06, 0.34);
    }
  } },
  tavern: { secs: 14, fn(buf, n) {
    const bed = brown(); const blp = lowpass(380);
    mix(buf, () => blp(bed()), () => 0.13);
    let t = 0.2;
    while (t < (n / SR) - 0.5) { // voice blips
      const v = white(); const bp = bandpass(rnd(220, 600), rnd(700, 900));
      burst(buf, t, () => bp(v()), rnd(0.10, 0.26), 0.03, rnd(0.12, 0.37));
      t += rnd(0.35, 1.3);
    }
    t = 1;
    while (t < (n / SR) - 1) { // glass clinks
      tone(buf, t, "sine", rnd(2100, 3200), 0, 0, 0.07, 0.005, 0.3);
      t += rnd(2.8, 9);
    }
    t = 2;
    while (t < (n / SR) - 0.5) { // chair scrapes
      const s = white(); const bp = bandpass(600, 1100);
      burst(buf, t, () => bp(s()), 0.09, 0.005, 0.07);
      t += rnd(4.5, 12);
    }
  } },
  town: { secs: 14, fn(buf, n) { // Town Center: crowd + carts + bell + dog
    const bed = brown(); const bp = bandpass(380, 700);
    mix(buf, () => bp(bed()), () => 0.15);
    let t = 0.2;
    while (t < (n / SR) - 0.5) {
      const v = white(); const vbp = bandpass(rnd(250, 700), rnd(800, 1100));
      burst(buf, t, () => vbp(v()), rnd(0.08, 0.2), 0.03, rnd(0.15, 0.4));
      t += rnd(0.4, 1.2);
    }
    t = 1.5; // cart / metal clinks
    while (t < (n / SR) - 1) {
      const f = rnd(900, 2600);
      tone(buf, t, "sine", f, 0, 0, rnd(0.06, 0.12), 0.004, rnd(0.2, 0.4));
      tone(buf, t, "sine", f * 1.5, 0, 0, rnd(0.04, 0.09), 0.004, rnd(0.15, 0.3));
      t += rnd(4, 10);
    }
    t = 3; // town bell
    while (t < (n / SR) - 3) {
      tone(buf, t, "sine", 660, 0, 0, 0.12, 0.01, 2.5);
      tone(buf, t, "sine", 990, 0, 0, 0.06, 0.01, 2.0);
      t += rnd(8, 16);
    }
    t = 5; // dog bark
    while (t < (n / SR) - 1) {
      const b = osc("square", 300);
      burst(buf, t, () => b() * 0.5, 0.10, 0.01, 0.08);
      burst(buf, t + 0.14, () => b() * 0.5, 0.09, 0.01, 0.08);
      t += rnd(10, 25);
    }
  } },
  forest: { secs: 14, fn(buf, n) {
    const bed = brown(); const blp = lowpass(220);
    mix(buf, () => blp(bed()), () => 0.07);
    const leaves = white(); const lbp = bandpass(3000, 4200);
    mix(buf, () => lbp(leaves()), () => 0.018);
    let t = 0.5;
    while (t < (n / SR) - 1) {
      const count = 1 + Math.floor(Math.random() * 3);
      for (let k = 0; k < count; k++) {
        const f0 = rnd(2200, 3600);
        const o = osc("sine", f0);
        burst(buf, t + k * 0.14, () => o(), 0.09, 0.01, 0.09);
      }
      t += rnd(1.4, 5);
    }
  } },
  night: { secs: 12, fn(buf, n) {
    const f = periodic(4200, n);
    const o = osc("square", f);
    const g = lfo(periodic(15, n), 0.045, 0.05);
    mix(buf, o, (t) => g(t));
    const bed = white(); const bp = bandpass(250, 400);
    mix(buf, () => bp(bed()), () => 0.03);
    let t = 1;
    while (t < (n / SR) - 0.5) {
      tone(buf, t, "sine", rnd(4600, 5500), 0, 0, 0.05, 0.01, 0.15);
      t += rnd(3, 9);
    }
  } },
  ocean: { secs: 16, fn(buf, n) {
    const src = white(); const lp = lowpass(420);
    const g = lfo(0.1, 0.22, 0.3);
    mix(buf, () => lp(src()), (t) => g(t));
    const foam = white(); const hp = highpass(1600);
    const g2 = lfo(0.083, 0.04, 0.05);
    mix(buf, () => hp(foam()), (t) => g2(t));
  } },
  dungeon: { secs: 16, fn(buf, n) {
    const f1 = periodic(55, n), f2 = periodic(55.5, n), f3 = periodic(110, n);
    const a = osc("sine", f1), b = osc("sine", f2), c = osc("triangle", f3);
    const g = lfo(0.08, 0.05, 0.16);
    const dry = new Float32Array(buf.length);
    for (let i = 0; i < buf.length; i++) dry[i] = (a() * 0.5 + b() * 0.5 + c() * 0.3) * g(i / SR);
    let t = 2;
    while (t < (n / SR) - 3) {
      const o = osc("sine", 850);
      burst(dry, t, () => o(), 0.10, 0.01, 1.4);
      t += rnd(4, 11);
    }
    const dSamp = Math.floor(0.31 * SR), fb = 0.35;
    for (let i = 0; i < buf.length; i++) buf[i] += dry[i];
    for (let k = 1; k <= 3; k++) {
      const off = k * dSamp, gk = Math.pow(fb, k);
      for (let i = off; i < buf.length; i++) buf[i] += dry[i - off] * gk;
    }
  } },
  battle: { secs: 12, fn(buf, n) {
    const bed = brown(); const blp = lowpass(360);
    mix(buf, () => blp(bed()), () => 0.20);
    let t = 0.3;
    while (t < (n / SR) - 1) {
      const parts = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < parts; k++) {
        tone(buf, t, "sine", rnd(500, 3100), 0, 0, rnd(0.06, 0.20), 0.004, rnd(0.2, 0.7));
      }
      t += rnd(0.45, 2);
    }
    t = 2;
    while (t < (n / SR) - 3) {
      const h = osc("saw", 98); const lp = lowpass(750);
      burst(buf, t, () => lp(h()), 0.16, 0.4, 1.6);
      t += rnd(8, 20);
    }
  } },
  crowd: { secs: 14, fn(buf, n) {
    const bed = brown(); const bp = bandpass(400, 700);
    mix(buf, () => bp(bed()), () => 0.16);
    let t = 0.2;
    while (t < (n / SR) - 0.5) {
      const v = white(); const vbp = bandpass(rnd(300, 800), rnd(900, 1300));
      burst(buf, t, () => vbp(v()), rnd(0.08, 0.2), 0.03, rnd(0.15, 0.45));
      t += rnd(0.6, 1.6);
    }
    t = 2;
    while (t < (n / SR) - 3) {
      const c = white(); const cbp = bandpass(600, 900);
      burst(buf, t, () => cbp(c()), 0.22, 0.4, 1.4);
      const claps = 6 + Math.floor(Math.random() * 6);
      for (let k = 0; k < claps; k++) {
        const cl = white(); const clbp = bandpass(rnd(1700, 2300), rnd(2300, 2800));
        burst(buf, t + 0.3 + k * 0.11 + Math.random() * 0.05, () => clbp(cl()), 0.07, 0.002, 0.04);
      }
      t += rnd(6, 15);
    }
  } }
};

/* ---------- WAV writer ---------- */
function writeWav(file, data) {
  const n = data.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    let s = Math.max(-1, Math.min(1, data[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(file, buf);
  return buf.length;
}

fs.mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [id, ch] of Object.entries(CHANNELS)) {
  const data = renderLoop(ch.secs, 1, ch.fn);
  let peak = 0, sum = 0;
  for (let i = 0; i < data.length; i++) { const v = Math.abs(data[i]); if (v > peak) peak = v; sum += v; }
  const file = path.join(OUT, id + ".wav");
  const bytes = writeWav(file, data);
  total += bytes;
  console.log(id.padEnd(8), ch.secs + "s", (bytes / 1024).toFixed(0) + " KB", "peak=" + peak.toFixed(3), "rms=" + (Math.sqrt(sum / data.length)).toFixed(4));
}
console.log("total:", (total / 1048576).toFixed(1), "MB ->", OUT);
