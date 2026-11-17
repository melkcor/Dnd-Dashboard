/* DM's Table — Soundboard tab.
   Matt-Mercer-style mixing board. Channels play real audio loop files from sounds/
   (rendered by tools/render-sounds.js); if a file is missing, the built-in Web Audio
   synthesizer is used as a fallback. Vertical sliders mix everything; presets are
   saved in localStorage. */
(function () {
  "use strict";

  const PRESET_KEY = "dmDash.soundPresets.v1";

  /* ================= vertical slider component ================= */
  const snap25 = (v) => Math.max(0, Math.min(100, Math.round(v / 25) * 25));

  function createVSlider(el, initial, onChange) {
    let value = snap25(initial);
    const track = document.createElement("div");
    track.className = "vslider-track";
    const fill = document.createElement("div");
    fill.className = "vslider-fill";
    const thumb = document.createElement("div");
    thumb.className = "vslider-thumb";
    track.appendChild(fill);
    el.appendChild(track);
    el.appendChild(thumb);

    function render() {
      fill.style.height = value + "%";
      thumb.style.bottom = value + "%";
      el.setAttribute("aria-valuenow", String(Math.round(value)));
    }
    function setFromClientY(clientY) {
      const r = el.getBoundingClientRect();
      const v = 100 - ((clientY - r.top) / r.height) * 100;
      value = snap25(v);
      render();
      if (onChange) onChange(value);
    }
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      setFromClientY(e.clientY);
      const mv = (ev) => setFromClientY(ev.clientY);
      el.addEventListener("pointermove", mv);
      const up = () => el.removeEventListener("pointermove", mv);
      el.addEventListener("pointerup", up, { once: true });
      el.addEventListener("pointercancel", up, { once: true });
    });
    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      value = snap25(value - Math.sign(e.deltaY) * 25);
      render();
      if (onChange) onChange(value);
    }, { passive: false });
    el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowRight") value = snap25(value + 25);
      else if (e.key === "ArrowDown" || e.key === "ArrowLeft") value = snap25(value - 25);
      else return;
      e.preventDefault();
      render();
      if (onChange) onChange(value);
    });
    render();
    return {
      el,
      get: () => value,
      set: (v) => { value = snap25(v); render(); }
    };
  }

  /* ================= Web Audio synth (fallback engine) ================= */
  let ctx = null, masterGain = null;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      masterGain = ctx.createGain();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 6;
      masterGain.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function noiseBuffer(seconds, brown) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else d[i] = w;
    }
    return buf;
  }
  const whiteBuf = () => noiseBuffer(2, false);
  const brownBuf = () => noiseBuffer(3, true);

  function loopSrc(buf) {
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.start();
    return s;
  }
  function biquad(type, freq, q) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q !== undefined) f.Q.value = q;
    return f;
  }
  function gainNode(v) {
    const g = ctx.createGain();
    g.gain.value = v;
    return g;
  }
  function lfo(freq, depth, param) {
    const o = ctx.createOscillator();
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = depth;
    o.connect(g);
    g.connect(param);
    o.start();
    return o;
  }
  function burst(opts) {
    const t = ctx.currentTime + (opts.when || 0);
    const s = ctx.createBufferSource();
    s.buffer = opts.brown ? brownBuf() : whiteBuf();
    s.playbackRate.value = opts.rate || 1;
    const f = biquad(opts.filter || "bandpass", opts.freq || 1000, opts.q || 1);
    const g = ctx.createGain();
    const peak = opts.peak || 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (opts.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (opts.attack || 0.01) + (opts.decay || 0.2));
    s.connect(f); f.connect(g); g.connect(opts.out);
    s.start(t, Math.random() * 1.5);
    s.stop(t + (opts.attack || 0.01) + (opts.decay || 0.2) + 0.1);
  }
  function tone(opts) {
    const t = ctx.currentTime + (opts.when || 0);
    const o = ctx.createOscillator();
    o.type = opts.wave || "sine";
    o.frequency.setValueAtTime(opts.freq, t);
    if (opts.freqEnd) o.frequency.exponentialRampToValueAtTime(opts.freqEnd, t + (opts.slide || 0.2));
    const f = opts.filterFreq ? biquad("lowpass", opts.filterFreq, 1) : null;
    const g = ctx.createGain();
    const peak = opts.peak || 0.15;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (opts.attack || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (opts.attack || 0.02) + (opts.decay || 0.4));
    o.connect(f || g);
    if (f) f.connect(g);
    g.connect(opts.out);
    o.start(t);
    o.stop(t + (opts.attack || 0.02) + (opts.decay || 0.4) + 0.1);
  }
  function scheduler(minMs, maxMs, fn) {
    let cancelled = false;
    let timer = null;
    function tick() {
      if (cancelled) return;
      fn();
      timer = setTimeout(tick, minMs + Math.random() * (maxMs - minMs));
    }
    timer = setTimeout(tick, 200 + Math.random() * minMs);
    return () => { cancelled = true; clearTimeout(timer); };
  }

  /* ================= channels ================= */
  // file: real loop rendered by tools/render-sounds.js; start(): synth fallback recipe.
  const CHANNELS = [
    {
      id: "tavern", name: "Tavern Crowd", icon: "🍺", vol: 70, max: 0.9, file: "sounds/tavern.wav",
      start(out) {
        const bed = loopSrc(brownBuf());
        const bedF = biquad("lowpass", 380, 0.7);
        const bedG = gainNode(0.13);
        bed.connect(bedF); bedF.connect(bedG); bedG.connect(out);
        const c1 = scheduler(350, 1300, () => burst({ out, freq: 220 + Math.random() * 650, q: 3.5, peak: 0.10 + Math.random() * 0.16, attack: 0.03, decay: 0.12 + Math.random() * 0.25, rate: 0.7 + Math.random() * 0.6 }));
        const c2 = scheduler(2800, 9000, () => tone({ out, wave: "sine", freq: 2100 + Math.random() * 1100, peak: 0.07, attack: 0.005, decay: 0.3 }));
        const c3 = scheduler(4500, 12000, () => burst({ out, freq: 600 + Math.random() * 500, q: 5, peak: 0.09, attack: 0.005, decay: 0.07 }));
        return () => { bed.stop(); c1(); c2(); c3(); };
      }
    },
    {
      id: "town", name: "Town Center", icon: "🏘️", vol: 65, max: 0.9, file: "sounds/town.wav",
      start(out) {
        const bed = loopSrc(brownBuf());
        const bf = biquad("bandpass", 500, 0.7);
        const bg = gainNode(0.15);
        bed.connect(bf); bf.connect(bg); bg.connect(out);
        const c1 = scheduler(400, 1200, () => burst({ out, freq: 250 + Math.random() * 700, q: 3, peak: 0.08 + Math.random() * 0.12, attack: 0.03, decay: 0.15 + Math.random() * 0.3, rate: 0.7 + Math.random() * 0.6 }));
        const c2 = scheduler(4000, 10000, () => { const f = 900 + Math.random() * 1700; tone({ out, freq: f, peak: 0.09, attack: 0.004, decay: 0.35 }); tone({ out, freq: f * 1.5, peak: 0.06, attack: 0.004, decay: 0.25 }); });
        const c3 = scheduler(8000, 16000, () => { tone({ out, freq: 660, peak: 0.12, attack: 0.01, decay: 2.5 }); tone({ out, freq: 990, peak: 0.06, attack: 0.01, decay: 2 }); });
        const c4 = scheduler(10000, 25000, () => { tone({ out, wave: "square", freq: 300, filterFreq: 900, peak: 0.05, attack: 0.01, decay: 0.08 }); setTimeout(() => tone({ out, wave: "square", freq: 300, filterFreq: 900, peak: 0.045, attack: 0.01, decay: 0.08 }), 140); });
        return () => { bed.stop(); c1(); c2(); c3(); c4(); };
      }
    },
    {
      id: "rain", name: "Rain", icon: "🌧️", vol: 65, max: 0.8, file: "sounds/rain.wav",
      start(out) {
        const src = loopSrc(whiteBuf());
        const hp = biquad("highpass", 700, 0.5);
        const lp = biquad("lowpass", 7500, 0.5);
        const g = gainNode(0.4);
        src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out);
        const l = lfo(0.13, 0.06, g.gain);
        const hiss = loopSrc(whiteBuf());
        const hf = biquad("bandpass", 3200, 0.6);
        const hg = gainNode(0.10);
        hiss.connect(hf); hf.connect(hg); hg.connect(out);
        return () => { src.stop(); hiss.stop(); l.stop(); };
      }
    },
    {
      id: "thunder", name: "Thunder", icon: "⛈️", vol: 60, max: 0.85, file: "sounds/thunder.wav",
      start(out) {
        const bed = loopSrc(brownBuf());
        const bf = biquad("lowpass", 90, 0.8);
        const bg = gainNode(0.05);
        bed.connect(bf); bf.connect(bg); bg.connect(out);
        const c = scheduler(6000, 17000, () => {
          burst({ out, freq: 400 + Math.random() * 700, q: 1.2, peak: 0.5, attack: 0.01, decay: 0.25 + Math.random() * 0.3 });
          burst({ out, brown: true, filter: "lowpass", freq: 70 + Math.random() * 90, peak: 0.85, attack: 0.25 + Math.random() * 0.5, decay: 2.5 + Math.random() * 3 });
        });
        return () => { bed.stop(); c(); };
      }
    },
    {
      id: "wind", name: "Wind", icon: "🍃", vol: 55, max: 0.7, file: "sounds/wind.wav",
      start(out) {
        const src = loopSrc(whiteBuf());
        const f = biquad("bandpass", 350, 1.2);
        const g = gainNode(0.22);
        src.connect(f); f.connect(g); g.connect(out);
        const l1 = lfo(0.09 + Math.random() * 0.06, 220, f.frequency);
        const l2 = lfo(0.13, 0.09, g.gain);
        return () => { src.stop(); l1.stop(); l2.stop(); };
      }
    },
    {
      id: "fire", name: "Fireplace", icon: "🔥", vol: 60, max: 0.8, file: "sounds/fire.wav",
      start(out) {
        const bed = loopSrc(brownBuf());
        const bf = biquad("lowpass", 260, 0.8);
        const bg = gainNode(0.16);
        bed.connect(bf); bf.connect(bg); bg.connect(out);
        const c = scheduler(60, 340, () => burst({ out, freq: 1200 + Math.random() * 3800, q: 9, peak: 0.05 + Math.random() * 0.22, attack: 0.003, decay: 0.02 + Math.random() * 0.06 }));
        return () => { bed.stop(); c(); };
      }
    },
    {
      id: "forest", name: "Forest & Birds", icon: "🌲", vol: 60, max: 0.85, file: "sounds/forest.wav",
      start(out) {
        const bed = loopSrc(brownBuf());
        const bf = biquad("lowpass", 220, 0.8);
        const bg = gainNode(0.07);
        bed.connect(bf); bf.connect(bg); bg.connect(out);
        const leaves = loopSrc(whiteBuf());
        const lf = biquad("bandpass", 3400, 0.4);
        const lg = gainNode(0.018);
        leaves.connect(lf); lf.connect(lg); lg.connect(out);
        const c = scheduler(1400, 5000, () => {
          const n = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < n; i++) {
            const f0 = 2200 + Math.random() * 1400;
            tone({ out, wave: "sine", freq: f0, freqEnd: f0 * (1.3 + Math.random() * 0.3), slide: 0.06, peak: 0.09, attack: 0.01, decay: 0.09, when: i * 0.14 });
          }
        });
        return () => { bed.stop(); leaves.stop(); c(); };
      }
    },
    {
      id: "night", name: "Night Crickets", icon: "🦗", vol: 45, max: 0.8, file: "sounds/night.wav",
      start(out) {
        const o = ctx.createOscillator();
        o.type = "square";
        o.frequency.value = 4200;
        const g = gainNode(0.05);
        const l = lfo(13 + Math.random() * 4, 0.045, g.gain);
        o.connect(g); g.connect(out);
        o.start(); l.start();
        const bed = loopSrc(whiteBuf());
        const bf = biquad("bandpass", 300, 1);
        const bg = gainNode(0.03);
        bed.connect(bf); bf.connect(bg); bg.connect(out);
        const c = scheduler(3000, 9000, () => {
          tone({ out, wave: "sine", freq: 4600 + Math.random() * 900, peak: 0.05, attack: 0.01, decay: 0.15 });
        });
        return () => { o.stop(); l.stop(); bed.stop(); c(); };
      }
    },
    {
      id: "ocean", name: "Ocean Waves", icon: "🌊", vol: 65, max: 0.85, file: "sounds/ocean.wav",
      start(out) {
        const src = loopSrc(whiteBuf());
        const lp = biquad("lowpass", 420, 0.6);
        const g = gainNode(0.3);
        src.connect(lp); lp.connect(g); g.connect(out);
        const l = lfo(0.1, 0.22, g.gain);
        const foam = loopSrc(whiteBuf());
        const hp = biquad("highpass", 1600, 0.5);
        const fg = gainNode(0.05);
        foam.connect(hp); hp.connect(fg); fg.connect(out);
        const l2 = lfo(0.083, 0.04, fg.gain);
        return () => { src.stop(); foam.stop(); l.stop(); l2.stop(); };
      }
    },
    {
      id: "dungeon", name: "Dungeon Drone", icon: "🕯️", vol: 60, max: 0.8, file: "sounds/dungeon.wav",
      start(out) {
        const g = gainNode(0.16);
        const mix = gainNode(1);
        mix.connect(g); g.connect(out);
        const oscs = [55, 55.6, 110.3].map((fr, i) => {
          const o = ctx.createOscillator();
          o.type = i === 2 ? "triangle" : "sine";
          o.frequency.value = fr;
          o.connect(mix);
          o.start();
          return o;
        });
        const trem = lfo(0.08, 0.05, g.gain);
        const delay = ctx.createDelay(1);
        delay.delayTime.value = 0.31;
        const fb = gainNode(0.35);
        const wet = gainNode(0.5);
        g.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(out);
        const c = scheduler(4000, 11000, () => {
          tone({ out: delay, wave: "sine", freq: 850, freqEnd: 480, slide: 0.5, peak: 0.10, attack: 0.01, decay: 1.4 });
        });
        return () => { oscs.forEach(o => o.stop()); trem.stop(); c(); delay.disconnect(); };
      }
    },
    {
      id: "battle", name: "Battle", icon: "⚔️", vol: 75, max: 0.75, file: "sounds/battle.wav",
      start(out) {
        const bed = loopSrc(brownBuf());
        const bf = biquad("lowpass", 360, 0.8);
        const bg = gainNode(0.20);
        bed.connect(bf); bf.connect(bg); bg.connect(out);
        const c1 = scheduler(450, 2000, () => {
          const partials = 3 + Math.floor(Math.random() * 3);
          for (let i = 0; i < partials; i++) {
            tone({ out, wave: "sine", freq: 500 + Math.random() * 2600, peak: 0.06 + Math.random() * 0.14, attack: 0.004, decay: 0.2 + Math.random() * 0.5 });
          }
        });
        const c2 = scheduler(8000, 20000, () => {
          tone({ out, wave: "sawtooth", freq: 98, filterFreq: 750, peak: 0.16, attack: 0.4, decay: 1.6 });
        });
        return () => { bed.stop(); c1(); c2(); };
      }
    },
    {
      id: "crowd", name: "Crowd / Cheer", icon: "📣", vol: 65, max: 0.9, file: "sounds/crowd.wav",
      start(out) {
        const bed = loopSrc(brownBuf());
        const bf = biquad("bandpass", 500, 0.7);
        const bg = gainNode(0.16);
        bed.connect(bf); bf.connect(bg); bg.connect(out);
        const c1 = scheduler(600, 1600, () => burst({ out, freq: 300 + Math.random() * 800, q: 3, peak: 0.08 + Math.random() * 0.12, attack: 0.03, decay: 0.15 + Math.random() * 0.3, rate: 0.7 + Math.random() * 0.6 }));
        const c2 = scheduler(6000, 15000, () => {
          burst({ out, freq: 700, q: 1.4, peak: 0.22, attack: 0.4, decay: 1.4 });
          for (let i = 0; i < 6 + Math.floor(Math.random() * 6); i++) {
            burst({ out, freq: 1700 + Math.random() * 600, q: 6, peak: 0.07, attack: 0.002, decay: 0.04, when: 0.3 + i * 0.11 + Math.random() * 0.05 });
          }
        });
        return () => { bed.stop(); c1(); c2(); };
      }
    }
  ];

  /* ================= mixer / UI ================= */
  const state = {};      // id -> { vol, on }
  const running = {};    // id -> { kind: 'audio'|'synth', audio, gain, stop, failed }
  let masterSlider = null;
  let masterValLabel = null;
  const sliderRefs = {};
  const powerRefs = {};
  const cardRefs = {};
  const resetRefs = {};
  const hasCustom = {};

  /* ---------- custom sound files (user-supplied audio, persisted in IndexedDB) ---------- */
  const customDB = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      if (!window.indexedDB) return Promise.reject(new Error("no indexedDB"));
      return new Promise((res, rej) => {
        const r = indexedDB.open("dmDashSounds", 1);
        r.onupgradeneeded = () => { r.result.createObjectStore("files"); };
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => rej(r.error);
      });
    },
    get(id) {
      return this.open()
        .then((db) => new Promise((res, rej) => {
          const q = db.transaction("files", "readonly").objectStore("files").get(id);
          q.onsuccess = () => res(q.result || null);
          q.onerror = () => rej(q.error);
        }))
        .catch(() => null);
    },
    put(id, blob) {
      return this.open()
        .then((db) => new Promise((res, rej) => {
          const q = db.transaction("files", "readwrite").objectStore("files").put(blob, id);
          q.onsuccess = () => res();
          q.onerror = () => rej(q.error);
        }))
        .catch(() => {});
    },
    del(id) {
      return this.open()
        .then((db) => new Promise((res, rej) => {
          const q = db.transaction("files", "readwrite").objectStore("files").delete(id);
          q.onsuccess = () => res();
          q.onerror = () => rej(q.error);
        }))
        .catch(() => {});
    },
    keys() {
      return this.open()
        .then((db) => new Promise((res, rej) => {
          const q = db.transaction("files", "readonly").objectStore("files").getAllKeys();
          q.onsuccess = () => res(q.result || []);
          q.onerror = () => rej(q.error);
        }))
        .catch(() => []);
    }
  };

  const masterNorm = () => Math.pow(masterSlider ? masterSlider.get() / 100 : 0.8, 1.5);
  const channelTarget = (def) => Math.pow(state[def.id].vol / 100, 1.5) * def.max;

  function applyChannelVol(def) {
    const r = running[def.id];
    if (!r) return;
    if (r.kind === "audio" && r.audio) {
      r.audio.volume = Math.min(1, Math.max(0, channelTarget(def) * masterNorm()));
    } else if (r.kind === "synth" && r.gain && ctx) {
      r.gain.gain.setTargetAtTime(Math.pow(state[def.id].vol / 100, 1.6) * def.max, ctx.currentTime, 0.05);
    }
  }

  function startSynthOnly(def, entry) {
    ensureCtx();
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(masterGain);
    const stop = def.start(g);
    entry.kind = "synth";
    entry.gain = g;
    entry.stop = stop;
    g.gain.gain.setTargetAtTime(Math.pow(state[def.id].vol / 100, 1.6) * def.max, ctx.currentTime, 0.15);
  }

  function swapToSynth(def, entry) {
    if (entry.audio) { try { entry.audio.pause(); } catch (e) { /* noop */ } entry.audio = null; }
    startSynthOnly(def, entry);
  }

  function startChannel(def) {
    if (running[def.id]) return;
    const entry = { kind: "audio", audio: null, gain: null, stop: null, failed: false, custom: false };
    running[def.id] = entry;
    customDB.get(def.id).then((blob) => {
      if (!running[def.id]) return;
      const src = blob ? URL.createObjectURL(blob) : def.file;
      entry.custom = !!blob;
      startAudio(def, entry, src);
    });
  }

  function startAudio(def, entry, src) {
    if (!running[def.id]) return;
    if (src) {
      const a = new Audio();
      a.loop = true;
      a.preload = "auto";
      entry.audio = a;
      a.addEventListener("error", () => { if (!entry.failed) { entry.failed = true; swapToSynth(def, entry); } });
      a.src = src;
      const pr = a.play();
      if (pr && pr.catch) pr.catch(() => { if (!entry.failed) { entry.failed = true; swapToSynth(def, entry); } });
      applyChannelVol(def);
    } else {
      startSynthOnly(def, entry);
    }
  }

  function rampAudioTo(a, target, done) {
    const start = a.volume;
    const t0 = performance.now();
    const dur = 250;
    const iv = setInterval(() => {
      const t = (performance.now() - t0) / dur;
      if (t >= 1) {
        clearInterval(iv);
        a.volume = target;
        if (done) done();
      } else {
        a.volume = start + (target - start) * t;
      }
    }, 30);
  }

  function stopChannel(def) {
    const r = running[def.id];
    if (!r) return;
    delete running[def.id];
    if (r.kind === "audio" && r.audio) {
      const a = r.audio;
      rampAudioTo(a, 0, () => {
        try { a.pause(); a.currentTime = 0; } catch (e) { /* noop */ }
        if (r.custom && typeof a.src === "string" && a.src.startsWith("blob:")) {
          try { URL.revokeObjectURL(a.src); } catch (e) { /* noop */ }
        }
      });
    } else if (r.kind === "synth" && r.gain) {
      if (ctx) r.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
      setTimeout(() => {
        try { r.stop(); r.gain.disconnect(); } catch (e) { /* already stopped */ }
      }, 400);
    }
  }

  function refreshPowerUI(def) {
    const on = !!state[def.id].on;
    powerRefs[def.id].classList.toggle("on", on);
    powerRefs[def.id].textContent = on ? "ON" : "OFF";
    powerRefs[def.id].setAttribute("aria-pressed", String(on));
    cardRefs[def.id].classList.toggle("playing", on);
    sliderRefs[def.id].el.classList.toggle("on", on);
  }

  function toggleChannel(def) {
    state[def.id].on = !state[def.id].on;
    if (state[def.id].on) startChannel(def); else stopChannel(def);
    refreshPowerUI(def);
  }

  function buildGrid() {
    const grid = document.getElementById("channel-grid");
    CHANNELS.forEach((def) => {
      state[def.id] = { vol: snap25(def.vol), on: false };

      const card = document.createElement("div");
      card.className = "channel-card";
      cardRefs[def.id] = card;

      const icon = document.createElement("div");
      icon.className = "channel-icon";
      icon.textContent = def.icon;

      const name = document.createElement("div");
      name.className = "channel-name";
      name.textContent = def.name;

      const power = document.createElement("button");
      power.className = "channel-power";
      power.type = "button";
      power.textContent = "OFF";
      power.setAttribute("aria-pressed", "false");
      power.addEventListener("click", () => toggleChannel(def));
      powerRefs[def.id] = power;

      const sliderEl = document.createElement("div");
      sliderEl.className = "vslider";
      sliderEl.tabIndex = 0;
      sliderEl.setAttribute("role", "slider");
      sliderEl.setAttribute("aria-label", def.name + " volume");
      sliderEl.setAttribute("aria-valuemin", "0");
      sliderEl.setAttribute("aria-valuemax", "100");

      const volLabel = document.createElement("span");
      volLabel.className = "channel-vol";

      const slider = createVSlider(sliderEl, state[def.id].vol, (v) => {
        state[def.id].vol = v;
        volLabel.textContent = v + "%";
        applyChannelVol(def);
      });
      sliderRefs[def.id] = slider;
      volLabel.textContent = state[def.id].vol + "%";

      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(power);
      card.appendChild(sliderEl);
      card.appendChild(volLabel);

      const customRow = document.createElement("div");
      customRow.className = "channel-custom";
      const fileLabel = document.createElement("label");
      fileLabel.className = "custom-btn";
      fileLabel.title = "Use your own sound file for this channel (saved in this browser)";
      fileLabel.textContent = "📁";
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "audio/*";
      fileInput.hidden = true;
      fileInput.addEventListener("change", () => {
        const f = fileInput.files && fileInput.files[0];
        if (!f) return;
        customDB.put(def.id, f).then(() => {
          hasCustom[def.id] = true;
          refreshCustomUI();
          if (state[def.id].on) { stopChannel(def); startChannel(def); }
        });
        fileInput.value = "";
      });
      fileLabel.appendChild(fileInput);
      const reset = document.createElement("button");
      reset.className = "custom-btn custom-reset";
      reset.type = "button";
      reset.textContent = "↺";
      reset.title = "Remove custom file — use the built-in sound";
      reset.style.display = "none";
      reset.addEventListener("click", () => {
        customDB.del(def.id).then(() => {
          delete hasCustom[def.id];
          refreshCustomUI();
          if (state[def.id].on) { stopChannel(def); startChannel(def); }
        });
      });
      resetRefs[def.id] = reset;
      customRow.appendChild(fileLabel);
      customRow.appendChild(reset);
      card.appendChild(customRow);

      grid.appendChild(card);
    });
  }

  function refreshCustomUI() {
    CHANNELS.forEach((def) => {
      if (resetRefs[def.id]) resetRefs[def.id].style.display = hasCustom[def.id] ? "" : "none";
    });
  }

  /* ---------- presets ---------- */
  const BUILTIN_PRESETS = [
    { name: "Tavern Night", master: 80, channels: { tavern: { on: true, vol: 80 }, fire: { on: true, vol: 45 }, night: { on: true, vol: 15 } } },
    { name: "Town Square", master: 85, channels: { town: { on: true, vol: 75 }, crowd: { on: true, vol: 30 } } },
    { name: "Rainstorm", master: 85, channels: { rain: { on: true, vol: 75 }, thunder: { on: true, vol: 60 }, wind: { on: true, vol: 30 } } },
    { name: "Dungeon Delve", master: 80, channels: { dungeon: { on: true, vol: 80 }, fire: { on: true, vol: 18 } } },
    { name: "Battle", master: 90, channels: { battle: { on: true, vol: 85 }, thunder: { on: true, vol: 20 } } },
    { name: "Forest Calm", master: 75, channels: { forest: { on: true, vol: 70 }, night: { on: true, vol: 30 }, wind: { on: true, vol: 15 } } },
    { name: "Ocean Voyage", master: 80, channels: { ocean: { on: true, vol: 70 }, wind: { on: true, vol: 25 } } },
    { name: "Market Crowd", master: 85, channels: { crowd: { on: true, vol: 70 }, tavern: { on: true, vol: 40 } } },
    { name: "Silence", master: 80, channels: {} }
  ];

  function loadUserPresets() {
    try {
      return JSON.parse(localStorage.getItem(PRESET_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }
  function saveUserPresets(obj) {
    localStorage.setItem(PRESET_KEY, JSON.stringify(obj));
  }

  function captureState() {
    const channels = {};
    CHANNELS.forEach((def) => { channels[def.id] = { on: state[def.id].on, vol: state[def.id].vol }; });
    return { master: masterSlider.get(), channels };
  }

  function applyPreset(preset) {
    masterSlider.set(preset.master || 80);
    masterValLabel.textContent = masterSlider.get() + "%";
    if (ctx && masterGain) masterGain.gain.setTargetAtTime(masterNorm(), ctx.currentTime, 0.1);
    CHANNELS.forEach((def) => {
      const p = preset.channels && preset.channels[def.id];
      const on = !!(p && p.on);
      const vol = snap25(p && typeof p.vol === "number" ? p.vol : state[def.id].vol);
      state[def.id].on = on;
      state[def.id].vol = vol;
      sliderRefs[def.id].set(vol);
      const card = cardRefs[def.id];
      const volLabel = card.querySelector(".channel-vol");
      if (volLabel) volLabel.textContent = vol + "%";
      if (on && !running[def.id]) startChannel(def);
      if (!on && running[def.id]) stopChannel(def);
      if (running[def.id]) applyChannelVol(def);
      refreshPowerUI(def);
    });
  }

  function renderPresetList() {
    const list = document.getElementById("preset-list");
    list.innerHTML = "";
    const user = loadUserPresets();
    const all = BUILTIN_PRESETS.map((p) => ({ ...p, builtin: true }))
      .concat(Object.keys(user).map((name) => ({ name, builtin: false, ...user[name] })));

    all.forEach((preset) => {
      const chip = document.createElement("div");
      chip.className = "preset-chip" + (preset.builtin ? " builtin" : "");
      const load = document.createElement("button");
      load.className = "preset-load";
      load.type = "button";
      const nm = document.createElement("span");
      nm.className = "preset-name";
      nm.textContent = preset.name;
      load.appendChild(nm);
      load.addEventListener("click", () => applyPreset(preset));
      chip.appendChild(load);
      if (!preset.builtin) {
        const del = document.createElement("button");
        del.className = "preset-del";
        del.type = "button";
        del.title = "Delete preset";
        del.textContent = "✕";
        del.addEventListener("click", () => {
          const u = loadUserPresets();
          delete u[preset.name];
          saveUserPresets(u);
          renderPresetList();
        });
        chip.appendChild(del);
      }
      list.appendChild(chip);
    });
  }

  function init() {
    buildGrid();

    const masterEl = document.getElementById("master-slider");
    masterValLabel = document.getElementById("master-val");
    masterSlider = createVSlider(masterEl, 80, (v) => {
      masterValLabel.textContent = v + "%";
      if (ctx && masterGain) masterGain.gain.setTargetAtTime(masterNorm(), ctx.currentTime, 0.05);
      CHANNELS.forEach((def) => { if (running[def.id]) applyChannelVol(def); });
    });
    masterSlider.set(80);
    masterValLabel.textContent = masterSlider.get() + "%";

    document.getElementById("mute-all").addEventListener("click", () => {
      CHANNELS.forEach((def) => {
        state[def.id].on = false;
        if (running[def.id]) stopChannel(def);
        refreshPowerUI(def);
      });
    });

    document.getElementById("preset-save").addEventListener("click", () => {
      const input = document.getElementById("preset-name");
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      const user = loadUserPresets();
      user[name] = captureState();
      saveUserPresets(user);
      input.value = "";
      renderPresetList();
    });

    renderPresetList();
    customDB.keys().then((keys) => {
      keys.forEach((k) => { hasCustom[k] = true; });
      refreshCustomUI();
    });
  }

  window.Soundboard = { init };
})();
