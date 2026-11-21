/* DM's Table — NPC Generator tab.
   Species/lineages follow the 2024 Player's Handbook (10 core species).
   Optional leveled characters: class data comes from js/classes.js, generated from the
   Complete Compendium 5.5e XML via tools/build-classes.js.
   Saved NPCs persist in localStorage, with JSON export/import. */
(function () {
  "use strict";

  const ROSTER_KEY = "dmDash.npcRoster.v1";
  const DATA = window.DM_DATA;
  const CLASSES = window.DM_CLASSES;

  const $ = (id) => document.getElementById(id);

  const dice = (n, sides) => {
    let t = 0;
    for (let i = 0; i < n; i++) t += 1 + Math.floor(Math.random() * sides);
    return t;
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const sample = (arr, n) => {
    const copy = arr.slice();
    const out = [];
    while (out.length < n && copy.length) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
    return out;
  };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const mod = (s) => Math.floor((s - 10) / 2);
  const fmtMod = (m) => (m >= 0 ? "+" : "") + m;

  let current = null;

  const SEX_LABEL = { male: "Male", female: "Female", nonbinary: "Nonbinary" };
  const ABIL_SHORT = { Strength: "STR", Dexterity: "DEX", Constitution: "CON", Intelligence: "INT", Wisdom: "WIS", Charisma: "CHA" };
  const ORDINAL = ["0th", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];

  function fmtHeight(inches) {
    const ft = Math.floor(inches / 12);
    const inch = Math.round(inches % 12);
    const cm = Math.round(inches * 2.54);
    return ft + "'" + inch + '" (' + cm + " cm)";
  }
  function fmtWeight(lbs) {
    return Math.round(lbs) + " lb (" + Math.round(lbs * 0.453592) + " kg)";
  }

  function genName(species, sex) {
    let pool;
    if (sex === "male") pool = species.names.m;
    else if (sex === "female") pool = species.names.f;
    else pool = species.names.u.length >= 4 ? species.names.u : species.names.m.concat(species.names.f);
    return pick(pool) + " " + pick(species.surnames);
  }

  function genVoice(species) {
    const V = DATA.VOICES;
    return cap(pick(V.pitch)) + ", " + pick(V.quality) + " voice — " + pick(V.pace) + ".";
  }

  function genFeatures(species) {
    if (Math.random() < 0.2) return [];
    const count = Math.random() < 0.35 ? 2 : 1;
    const bag = DATA.GENERIC_FEATURES.map((f) => ({ text: f, w: 3 }))
      .concat(species.features.map((f) => ({ text: f, w: 2 })));
    const out = [];
    for (let i = 0; i < count; i++) {
      const total = bag.reduce((s, b) => s + b.w, 0);
      let r = Math.random() * total;
      let chosen = bag[0];
      for (const b of bag) { r -= b.w; if (r <= 0) { chosen = b; break; } }
      if (!out.includes(chosen.text)) out.push(chosen.text);
    }
    return out;
  }

  /* ---------- leveled character stat block ---------- */
  const ABIL_FULL = { Str: "Strength", Dex: "Dexterity", Con: "Constitution", Int: "Intelligence", Wis: "Wisdom", Cha: "Charisma" };

  function rollScores(order) {
    const rolls = [];
    for (let i = 0; i < 6; i++) {
      const d = [dice(1, 6), dice(1, 6), dice(1, 6), dice(1, 6)].sort((a, b) => a - b);
      rolls.push(d[1] + d[2] + d[3]);
    }
    rolls.sort((a, b) => b - a);
    const scores = {};
    order.forEach((ab, i) => { scores[ABIL_FULL[ab] || ab] = rolls[i]; });
    return scores;
  }

  function speciesTraitsText(speciesId, lineage) {
    let t = DATA.SPECIES_TRAITS[speciesId] || "";
    if (t.includes("%LINEAGE%")) t = t.split("%LINEAGE%").join(lineage || "—");
    if (t.includes("%RES%")) t = t.split("%RES%").join((DATA.TIEFLING_RES[lineage] || "special") );
    return t;
  }

  function buildStatBlock(speciesId, lineage, level, cls) {
    const cc = DATA.CLASS_COMBAT[cls.id];
    const scores = rollScores(cc.order);
    // Level-driven ability increases: each "Ability Score Improvement" the class gains at or
    // below this level adds +2 to the primary ability (cap 20); 19th level adds an Epic Boon (+1).
    const primaryFull = cls.primary;
    cls.features
      .filter((f) => f.level <= level && /Ability Score Improvement/i.test(f.name))
      .forEach(() => { scores[primaryFull] = Math.min(20, scores[primaryFull] + 2); });
    if (level >= 19) scores[primaryFull] = Math.min(20, scores[primaryFull] + 1);
    const conMod = mod(scores.Constitution);
    const dexMod = mod(scores.Dexterity);
    const wisMod = mod(scores.Wisdom);
    const prof = DATA.LEVELS.find((l) => l.level === level).prof;

    const hp = cls.hd + conMod + (level - 1) * (Math.floor(cls.hd / 2) + 1 + conMod);

    let ac;
    if (cc.ac === "unarmoredBarb") ac = 10 + dexMod + conMod;
    else if (cc.ac === "unarmoredMonk") ac = 10 + dexMod + wisMod;
    else if (cc.ac === "light") ac = 11 + dexMod;
    else ac = cc.ac;

    const skills = sample(cls.skills, Math.min(cls.numSkills, cls.skills.length));
    const saves = cls.saves.map((s) => s + " " + fmtMod(mod(scores[s]) + prof));

    const statOf = (w) => mod(scores[w.stat === "Str" ? "Strength" : w.stat === "Dex" ? "Dexterity" : w.stat === "Cha" ? "Charisma" : w.stat === "Int" ? "Intelligence" : w.stat === "Wis" ? "Wisdom" : "Constitution"]);

    const actions = [];
    const w = cc.weapon;
    const wMod = statOf(w);
    actions.push(w.name + " " + fmtMod(wMod + prof) + " to hit, reach 5 ft, one target. Hit: " + w.dice + "d" + w.sides + fmtMod(wMod) + " " + w.type + " damage.");
    if (cc.cantrip) {
      const c = cc.cantrip;
      const cMod = statOf(c);
      const dc = 1 + (level >= 5 ? 1 : 0) + (level >= 11 ? 1 : 0) + (level >= 17 ? 1 : 0);
      actions.push(c.name + " (cantrip) " + fmtMod(cMod + prof) + " to hit, range 60 ft. Hit: " + dc + "d" + c.sides + fmtMod(cMod) + " " + c.type + " damage.");
    }
    if (cc.extraAttackAt && level >= cc.extraAttackAt) {
      actions.push("Extra Attack: can make 2 attacks when taking the Attack action.");
    }
    if (cc.sneak) {
      const nd6 = 1 + Math.floor((level - 1) / 2);
      actions.push("Sneak Attack: once per turn, +" + nd6 + "d6 damage on a hit with advantage or vs a distracted target.");
    }

    const features = cls.features.filter((f) => f.level <= level);

    const classSpells = (window.DM_SPELLS || []).filter((s) => s.classes.includes(cls.name));
    const cantrips = classSpells.filter((s) => s.level === 0);
    const maxSlot = Math.min(9, Math.ceil(level / 2));
    const leveledSpells = classSpells.filter((s) => s.level >= 1 && s.level <= maxSlot);
    const spellObjs = sample(cantrips, Math.min(4, cantrips.length))
      .concat(sample(leveledSpells, Math.min(6, leveledSpells.length)));

    const casterType = DATA.SPELL_SLOTS.casterType[cls.id];
    let slots = null;
    if (casterType === "full" || casterType === "half") {
      const row = DATA.SPELL_SLOTS[casterType][level - 1] || [];
      slots = [];
      row.forEach((count, i) => { if (count) slots.push({ level: i + 1, count }); });
    } else if (casterType === "pact") {
      slots = [{ level: DATA.SPELL_SLOTS.pactLevel[level - 1], count: DATA.SPELL_SLOTS.pactCount[level - 1], pact: true }];
    }

    return {
      level, classId: cls.id, className: cls.name, hd: cls.hd,
      scores, hp, ac, speed: 30, prof,
      passivePerception: 10 + wisMod + (skills.includes("Perception") ? prof : 0),
      saves, skills, actions, features, spells: spellObjs, slots,
      traits: speciesTraitsText(speciesId, lineage)
    };
  }

  /* ---------- selection helpers ---------- */
  function selectedSpecies() {
    const v = $("npc-species").value;
    if (v === "random") return pick(DATA.SPECIES);
    return DATA.SPECIES.find((s) => s.id === v) || DATA.SPECIES[0];
  }
  function selectedSex() {
    const v = $("npc-sex").value;
    return v === "random" ? pick(["male", "female", "nonbinary"]) : v;
  }

  /* ---------- render ---------- */
  function render() {
    if (!current) return;
    $("npc-name").textContent = current.name;
    $("npc-species-lineage").textContent = current.species;
    $("npc-sex-out").textContent = SEX_LABEL[current.sex] || current.sex;
    $("npc-height").textContent = fmtHeight(current.heightIn);
    $("npc-weight").textContent = fmtWeight(current.weightLb);
    $("npc-voice").textContent = current.voice || "—";

    const ul = $("npc-features");
    ul.innerHTML = "";
    if (!current.features || current.features.length === 0) {
      const li = document.createElement("li");
      li.className = "muted";
      li.textContent = "None — strikingly ordinary.";
      ul.appendChild(li);
    } else {
      current.features.forEach((f) => {
        const li = document.createElement("li");
        li.textContent = f;
        ul.appendChild(li);
      });
    }

    renderStatBlock(current.statblock);

    $("npc-notes").value = current.notes || "";
    $("npc-save").disabled = false;
  }

  function renderStatBlock(sb) {
    const box = $("npc-statblock");
    box.innerHTML = "";
    if (!sb) { box.hidden = true; return; }
    box.hidden = false;

    const h = document.createElement("h3");
    h.textContent = "Stat block — Level " + sb.level + " " + sb.className + " (HD d" + sb.hd + ")";
    box.appendChild(h);

    const ab = document.createElement("div");
    ab.className = "sb-abilities";
    for (const abName of ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]) {
      const cell = document.createElement("div");
      cell.className = "sb-ab";
      const s = sb.scores[abName];
      cell.innerHTML = "";
      const l1 = document.createElement("span");
      l1.className = "sb-ab-name";
      l1.textContent = ABIL_SHORT[abName];
      const l2 = document.createElement("span");
      l2.className = "sb-ab-val";
      l2.textContent = s + " (" + fmtMod(mod(s)) + ")";
      cell.appendChild(l1);
      cell.appendChild(l2);
      ab.appendChild(cell);
    }
    box.appendChild(ab);

    const core = document.createElement("div");
    core.className = "sb-core";
    core.textContent = "HP " + sb.hp + " · AC " + sb.ac + " · Speed " + sb.speed + " ft · Prof " + fmtMod(sb.prof) + " · Passive Perception " + sb.passivePerception + " · Hit Dice " + sb.level + "d" + sb.hd;
    box.appendChild(core);

    const line = (label, value) => {
      const d = document.createElement("div");
      d.className = "sb-line";
      const b = document.createElement("strong");
      b.textContent = label + " ";
      d.appendChild(b);
      d.appendChild(document.createTextNode(value));
      box.appendChild(d);
    };
    line("Saving Throws", sb.saves.join(", "));
    line("Skills", sb.skills.join(", "));
    line("Resistances & Species Traits", sb.traits);

    if (sb.showSlots && sb.slots && sb.slots.length) {
      line("Spell Slots", sb.slots.map((s) => ORDINAL[s.level] + " ×" + s.count + (s.pact ? " (pact, short rest)" : "")).join(", "));
    }

    const act = document.createElement("div");
    act.className = "sb-line";
    const ab2 = document.createElement("strong");
    ab2.textContent = "Actions ";
    act.appendChild(ab2);
    const ul = document.createElement("ul");
    sb.actions.forEach((a) => {
      const li = document.createElement("li");
      li.textContent = a;
      ul.appendChild(li);
    });
    act.appendChild(ul);
    box.appendChild(act);

    // spells: bullet list grouped by spell level, names clickable -> modal with description
    const spDiv = document.createElement("div");
    spDiv.className = "sb-line sb-spells";
    const spB = document.createElement("strong");
    spB.textContent = "Spells ";
    spDiv.appendChild(spB);
    if (!sb.spells || !sb.spells.length) {
      spDiv.appendChild(document.createTextNode("None — this class has no spells on its list"));
    } else {
      const byLevel = new Map();
      sb.spells.forEach((s) => {
        if (!byLevel.has(s.level)) byLevel.set(s.level, []);
        byLevel.get(s.level).push(s);
      });
      [...byLevel.keys()].sort((a, b) => a - b).forEach((lvl) => {
        const g = document.createElement("div");
        g.className = "sb-spell-group";
        const gh = document.createElement("strong");
        gh.textContent = lvl === 0 ? "Cantrips" : ORDINAL[lvl] + "-level";
        g.appendChild(gh);
        const ul = document.createElement("ul");
        byLevel.get(lvl).forEach((sp) => {
          const li = document.createElement("li");
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "linklike";
          btn.textContent = sp.name;
          btn.addEventListener("click", () => openSpellModal(sp));
          li.appendChild(btn);
          ul.appendChild(li);
        });
        g.appendChild(ul);
        spDiv.appendChild(g);
      });
    }
    box.appendChild(spDiv);

    // abilities: collapsed list of clickable feature names -> modal with full text
    const fwrap = document.createElement("details");
    fwrap.className = "sb-features";
    const fsum = document.createElement("summary");
    fsum.className = "sb-features-summary";
    fsum.textContent = "Class Features (level " + sb.level + ") — " + sb.features.length + " total — click to expand";
    fwrap.appendChild(fsum);
    const ful = document.createElement("ul");
    sb.features.forEach((f) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "linklike";
      btn.textContent = f.name + " (lv " + f.level + ")";
      btn.addEventListener("click", () => {
        const p = document.createElement("p");
        p.textContent = f.text;
        window.openModal(f.name + " — level " + f.level, [p]);
      });
      li.appendChild(btn);
      ful.appendChild(li);
    });
    fwrap.appendChild(ful);
    box.appendChild(fwrap);
  }

  const SPELL_SCHOOL = { A: "Abjuration", C: "Conjuration", D: "Divination", E: "Enchantment", EV: "Evocation", I: "Illusion", N: "Necromancy", T: "Transmutation" };

  function openSpellModal(sp) {
    const nodes = [];
    const meta = document.createElement("p");
    meta.className = "spell-meta";
    meta.textContent = [sp.time, sp.range, sp.components, sp.duration].filter(Boolean).join(" · ");
    nodes.push(meta);
    const cl = document.createElement("p");
    cl.className = "spell-classes";
    cl.textContent = (sp.level === 0 ? "Cantrip" : ORDINAL[sp.level] + "-level") +
      (SPELL_SCHOOL[sp.school] ? " · " + SPELL_SCHOOL[sp.school] : "") + " · Classes: " + sp.classes.join(", ");
    nodes.push(cl);
    const desc = document.createElement("div");
    desc.className = "spell-desc";
    sp.paras.forEach((p) => {
      const pe = document.createElement("p");
      pe.textContent = p;
      desc.appendChild(pe);
    });
    nodes.push(desc);
    if (sp.rolls && sp.rolls.length) {
      const r = document.createElement("p");
      r.className = "spell-rolls";
      r.textContent = "Scaling: " + sp.rolls.map((x) => (sp.level === 0 ? "lvl " : "slot ") + (x.level === 0 ? "0" : ORDINAL[x.level]) + " → " + x.dice + " " + x.description).join("  ·  ");
      nodes.push(r);
    }
    window.openModal(sp.name, nodes);
  }

  /* ---------- generate ---------- */
  function generate() {
    const sp = selectedSpecies();
    const sex = selectedSex();
    const lineage = sp.lineages ? pick(sp.lineages) : null; // internal only (drives traits)
    const heightIn = sp.height.base + dice(sp.height.count, sp.height.dice);
    const weightLb = Math.max(15, Math.round(sp.weight.base + (heightIn - 60) * sp.weight.perInch + dice(2, 6)));

    current = {
      name: genName(sp, sex),
      species: sp.name,
      speciesId: sp.id,
      lineage,
      sex,
      heightIn,
      weightLb,
      features: genFeatures(sp),
      voice: genVoice(sp),
      notes: $("npc-notes").value,
      statblock: null
    };

    if ($("npc-leveled").checked) {
      const level = parseInt($("npc-level").value, 10) || 1;
      const cls = CLASSES.find((c) => c.id === $("npc-class").value) || CLASSES[0];
      current.statblock = buildStatBlock(sp.id, lineage, level, cls);
      current.statblock.showSlots = $("npc-slots").checked;
    }

    render();
  }

  /* ---------- roster ---------- */
  function loadRoster() {
    try {
      const r = JSON.parse(localStorage.getItem(ROSTER_KEY) || "[]");
      return Array.isArray(r) ? r : [];
    } catch (e) {
      return [];
    }
  }
  function saveRoster(r) {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(r));
  }

  function renderRoster() {
    const roster = loadRoster();
    const box = $("npc-roster");
    box.innerHTML = "";
    $("npc-count").textContent = String(roster.length);
    if (!roster.length) {
      const p = document.createElement("p");
      p.className = "roster-empty";
      p.textContent = "No saved NPCs yet — generate one and hit Save NPC.";
      box.appendChild(p);
      return;
    }
    roster.slice().reverse().forEach((npc) => {
      const item = document.createElement("div");
      item.className = "roster-item";
      const top = document.createElement("div");
      top.className = "roster-top";
      const nameBtn = document.createElement("button");
      nameBtn.className = "roster-name";
      nameBtn.type = "button";
      nameBtn.textContent = npc.name;
      nameBtn.title = "Load into generator";
      nameBtn.addEventListener("click", () => loadNPC(npc));
      const del = document.createElement("button");
      del.className = "roster-del";
      del.type = "button";
      del.title = "Delete";
      del.textContent = "✕";
      del.addEventListener("click", () => {
        saveRoster(loadRoster().filter((x) => x.id !== npc.id));
        renderRoster();
      });
      top.appendChild(nameBtn);
      top.appendChild(del);
      const meta = document.createElement("div");
      meta.className = "roster-meta";
      meta.textContent =
        npc.species + " · " +
        (SEX_LABEL[npc.sex] || npc.sex) + " · " + fmtHeight(npc.heightIn) + " · " + fmtWeight(npc.weightLb) +
        (npc.statblock ? " · Lv" + npc.statblock.level + " " + npc.statblock.className : "");
      item.appendChild(top);
      item.appendChild(meta);
      box.appendChild(item);
    });
  }

  function loadNPC(npc) {
    $("npc-species").value = npc.speciesId;
    $("npc-sex").value = npc.sex;
    if (npc.statblock) {
      $("npc-leveled").checked = true;
      $("leveled-wrap").style.display = "";
      $("npc-level").value = String(npc.statblock.level);
      $("npc-class").value = npc.statblock.classId;
      $("npc-slots").checked = !!npc.statblock.showSlots;
    } else {
      $("npc-leveled").checked = false;
      $("leveled-wrap").style.display = "none";
    }
    current = { ...npc };
    render();
  }

  function saveCurrent() {
    if (!current) return;
    const roster = loadRoster();
    const entry = {
      id: Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      savedAt: new Date().toISOString(),
      ...current,
      notes: $("npc-notes").value
    };
    roster.push(entry);
    saveRoster(roster);
    renderRoster();
  }

  function exportRoster() {
    const blob = new Blob([JSON.stringify(loadRoster(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "npc-roster.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importRoster(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("not an array");
        const byId = new Map(loadRoster().map((x) => [x.id, x]));
        data.forEach((x) => {
          if (x && x.name && x.species) byId.set(x.id || (Date.now().toString(36) + Math.random().toString(36).slice(2)), x);
        });
        saveRoster(Array.from(byId.values()));
        renderRoster();
      } catch (e) {
        alert("Could not import: file must be a JSON array of saved NPCs.");
      }
    };
    reader.readAsText(file);
  }

  function init() {
    const spSel = $("npc-species");
    const randomOpt = document.createElement("option");
    randomOpt.value = "random";
    randomOpt.textContent = "🎲 Random";
    spSel.appendChild(randomOpt);
    DATA.SPECIES.forEach((s) => {
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name;
      spSel.appendChild(o);
    });

    const lvlSel = $("npc-level");
    for (let i = 1; i <= 20; i++) {
      const o = document.createElement("option");
      o.value = String(i);
      o.textContent = "Level " + i;
      lvlSel.appendChild(o);
    }
    const clsSel = $("npc-class");
    CLASSES.forEach((c) => {
      const o = document.createElement("option");
      o.value = c.id;
      o.textContent = c.name + " (d" + c.hd + ")";
      clsSel.appendChild(o);
    });
    $("npc-leveled").addEventListener("change", (e) => {
      $("leveled-wrap").style.display = e.target.checked ? "" : "none";
    });

    $("npc-generate").addEventListener("click", generate);
    $("npc-reroll-name").addEventListener("click", () => {
      if (!current) return;
      current.name = genName(DATA.SPECIES.find((s) => s.id === current.speciesId), current.sex);
      render();
    });
    $("npc-save").addEventListener("click", saveCurrent);
    $("npc-save").disabled = true;
    $("npc-export").addEventListener("click", exportRoster);
    $("npc-import").addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) importRoster(e.target.files[0]);
      e.target.value = "";
    });
    $("npc-notes").addEventListener("input", () => { if (current) current.notes = $("npc-notes").value; });

    renderRoster();
    generate();
  }

  window.NPCGen = { init };
})();
