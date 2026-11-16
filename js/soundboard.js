/* DM's Table — Soundboard tab.
   Matt-Mercer-style mixing board: every channel is synthesized live with the Web Audio API
   (no audio files), mixed through vertical sliders, with saveable presets in localStorage. */
(function () {
  "use strict";

  const PRESET_KEY = "dmDash.soundPresets.v1";

  /* ================= vertical slider component ================= */
  function createVSlider(el, initial, onChange) {
    let value = initial;
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
      let v = 100 - ((clientY - r.top) / r.height) * 100;
      value = Math.max(0, Math.min(100, Math.round(v)));
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
      value = Math.max(0, Math.min(100, value - Math.sign(e.deltaY) * 3));
      render();
      if (onChange) onChange(value);
    }, { passive: false });
    el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowRight") value = Math.min(100, value + 5);
      else if (e.key === "ArrowDown" || e.key === "ArrowLeft") value = Math.max(0, value - 5);
      else return;
      e.preventDefault();
      render();
      if (onChange) onChange(value);
    });
    render();
    return {
      el,
      get: () => value,
      set: (v) => { value = Math.max(0, Math.min(100, Math.round(v))); render(); }
    };
  }

  /* ================= audio helpers ================= */
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

  // simple LFO modulating a param
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

  // one-shot enveloped noise burst through a filter
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

  // one-shot enveloped tone
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
    if (f) { f.connect(g); }
    g.connect(opts.out);
    o.start(t);
    o.stop(t + (opts.attack || 0.02) + (opts.decay || 0.4) + 0.1);
  }

  // repeating scheduler; returns a cancel function
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

  /* ================= channel generators ================= */
  // Each start(ctx, out) builds its graph and returns a stop() that silences & tears down.

  const CHANNELS = [
    {
      id: "tavern", name: "Tavern Crowd", icon: "🍺", vol: 70, max: 0.5,
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
      id: "rain", name: "Rain", icon: "🌧️", vol: 65, max: 0.55,
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
      id: "thunder", name: "Thunder", icon: "⛈️", vol: 60, max: 0.9,
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
      id: "wind", name: "Wind", icon: "🍃", vol: 55, max: 0.5,
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
      id: "fire", name: "Fireplace", icon: "🔥", vol: 60, max: 0.55,
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
      id: "forest", name: "Forest & Birds", icon: "🌲", vol: 60, max: 0.5,
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
      id: "night", name: "Night Crickets", icon: "🦗", vol: 45, max: 0.35,
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
      id: "ocean", name: "Ocean Waves", icon: "🌊", vol: 65, max: 0.55,
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
      id: "dungeon", name: "Dungeon Drone", icon: "🕯️", vol: 60, max: 0.5,
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
      id: "battle", name: "Battle", icon: "⚔️", vol: 75, max: 0.8,
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
      id: "crowd", name: "Crowd / Cheer", icon: "📣", vol: 65, max: 0.6,
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
    },
    {
      id: "ship", name: "Ship at Sea", icon: "⛵", vol: 55, max: 0.45,
      start(out) {
        const waves = loopSrc(whiteBuf());
        const lp = biquad("lowpass", 320, 0.6);
        const wg = gainNode(0.16);
        waves.connect(lp); lp.connect(wg); wg.connect(out);
        const l = lfo(0.09, 0.12, wg.gain);
        const c1 = scheduler(3000, 8000, () => {
          const f = 130 + Math.random() * 140;
          tone({ out, wave: "sine", freq: f, freqEnd: f * (0.7 + Math.random() * 0.5), slide: 0.5 + Math.random() * 0.6, peak: 0.12, attack: 0.15, decay: 0.9 });
        });
        const c2 = scheduler(5000, 13000, () => burst({ out, freq: 850 + Math.random() * 400, q: 4, peak: 0.06, attack: 0.004, decay: 0.06 }));
        return () => { waves.stop(); l.stop(); c1(); c2(); };
      }
    }
  ];

  /* ================= mixer / UI ================= */
  const state = {};      // id -> { vol, on }
  const running = {};    // id -> { gain, stop }
  let masterSlider = null;
  let masterValLabel = null;
  const sliderRefs = {}; // id -> slider
  const powerRefs = {};
  const cardRefs = {};

  function gainFor(def, v) {
    return Math.pow(v / 100, 1.6) * def.max;
  }

  function startChannel(def) {
    ensureCtx();
    if (running[def.id]) return;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(masterGain);
    const stop = def.start(g);
    running[def.id] = { gain: g, stop };
    const target = gainFor(def, state[def.id].vol);
    g.gain.setTargetAtTime(target, ctx.currentTime, 0.15);
  }

  function stopChannel(def) {
    const r = running[def.id];
    if (!r) return;
    delete running[def.id];
    if (ctx) {
      r.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
      setTimeout(() => { try { r.stop(); r.gain.disconnect(); } catch (e) { /* already stopped */ } }, 400);
    } else {
      try { r.stop(); } catch (e) { /* noop */ }
    }
  }

  function refreshPowerUI(def) {
    const on = !!state[def.id].on;
    powerRefs[def.id].classList.toggle("on", on);
    powerRefs[def.id].textContent = on ? "ON" : "OFF";
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
      state[def.id] = { vol: def.vol, on: false };

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
      power.addEventListener("click", () => { toggleChannel(def); power.setAttribute("aria-pressed", String(state[def.id].on)); });
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

      const slider = createVSlider(sliderEl, def.vol, (v) => {
        state[def.id].vol = v;
        volLabel.textContent = v + "%";
        const r = running[def.id];
        if (r && ctx) r.gain.gain.setTargetAtTime(gainFor(def, v), ctx.currentTime, 0.05);
      });
      sliderRefs[def.id] = slider;
      volLabel.textContent = def.vol + "%";

      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(power);
      card.appendChild(sliderEl);
      card.appendChild(volLabel);
      grid.appendChild(card);
    });
  }

  /* ---------- presets ---------- */
  const BUILTIN_PRESETS = [
    { name: "Tavern Night", master: 80, channels: { tavern: { on: true, vol: 80 }, fire: { on: true, vol: 45 }, night: { on: true, vol: 15 } } },
    { name: "Rainstorm", master: 85, channels: { rain: { on: true, vol: 75 }, thunder: { on: true, vol: 60 }, wind: { on: true, vol: 30 } } },
    { name: "Dungeon Delve", master: 80, channels: { dungeon: { on: true, vol: 80 }, fire: { on: true, vol: 18 } } },
    { name: "Battle", master: 90, channels: { battle: { on: true, vol: 85 }, thunder: { on: true, vol: 20 } } },
    { name: "Forest Calm", master: 75, channels: { forest: { on: true, vol: 70 }, night: { on: true, vol: 30 }, wind: { on: true, vol: 15 } } },
    { name: "Ocean Voyage", master: 80, channels: { ocean: { on: true, vol: 70 }, ship: { on: true, vol: 55 }, wind: { on: true, vol: 20 } } },
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
    ensureCtx();
    masterSlider.set(preset.master || 80);
    masterValLabel.textContent = Math.round(preset.master || 80) + "%";
    if (masterGain) masterGain.gain.setTargetAtTime(Math.pow((preset.master || 80) / 100, 1.5) * 0.9, ctx.currentTime, 0.1);
    CHANNELS.forEach((def) => {
      const p = preset.channels && preset.channels[def.id];
      const on = !!(p && p.on);
      const vol = p && typeof p.vol === "number" ? p.vol : def.vol;
      state[def.id].on = on;
      state[def.id].vol = vol;
      sliderRefs[def.id].set(vol);
      const card = cardRefs[def.id];
      const volLabel = card.querySelector(".channel-vol");
      if (volLabel) volLabel.textContent = vol + "%";
      if (on && !running[def.id]) startChannel(def);
      if (!on && running[def.id]) stopChannel(def);
      refreshPowerUI(def);
    });
  }

  function renderPresetList() {
    const list = document.getElementById("preset-list");
    list.innerHTML = "";
    const user = loadUserPresets();
    const all = BUILTIN_PRESETS.map(p => ({ ...p, builtin: true }))
      .concat(Object.keys(user).map(name => ({ name, builtin: false, ...user[name] })));

    all.forEach((preset) => {
      const chip = document.createElement("div");
      chip.className = "preset-chip" + (preset.builtin ? " builtin" : "");
      const load = document.createElement("button");
      load.className = "preset-load";
      load.type = "button";
      load.innerHTML = "";
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
      if (ctx && masterGain) masterGain.gain.setTargetAtTime(Math.pow(v / 100, 1.5) * 0.9, ctx.currentTime, 0.05);
    });
    masterSlider.set(80);
    masterValLabel.textContent = "80%";

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
  }

  window.Soundboard = { init };
})();
