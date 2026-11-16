/* DM's Table — NPC Generator tab.
   Species/lineages follow the 2024 Player's Handbook (10 core species).
   Saved NPCs persist in localStorage, with JSON export/import. */
(function () {
  "use strict";

  const ROSTER_KEY = "dmDash.npcRoster.v1";
  const DATA = window.DM_DATA;

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

  let current = null;

  const SEX_LABEL = { male: "Male", female: "Female", nonbinary: "Nonbinary" };

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

  function genFeatures(species) {
    if (Math.random() < 0.2) return [];
    const count = 1 + Math.floor(Math.random() * 3); // 1–3 features
    const generic = DATA.GENERIC_FEATURES.map((f) => ({ text: f, w: 3 }));
    const racial = species.features.map((f) => ({ text: f, w: 2 }));
    const bag = generic.concat(racial);
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

  function selectedSpecies() {
    return DATA.SPECIES.find((s) => s.id === $("npc-species").value) || DATA.SPECIES[0];
  }

  function selectedSex() {
    const v = $("npc-sex").value;
    return v === "random" ? pick(["male", "female", "nonbinary"]) : v;
  }

  function renderLineageOptions() {
    const sp = selectedSpecies();
    const wrap = $("lineage-wrap");
    const sel = $("npc-lineage");
    sel.innerHTML = "";
    if (sp.lineages && sp.lineages.length) {
      wrap.style.display = "";
      sp.lineages.forEach((l) => {
        const o = document.createElement("option");
        o.value = l;
        o.textContent = l;
        sel.appendChild(o);
      });
    } else {
      wrap.style.display = "none";
    }
  }

  function render() {
    if (!current) return;
    $("npc-name").textContent = current.name;
    $("npc-species-lineage").textContent =
      current.species + (current.lineage ? " · " + current.lineage : "");
    $("npc-sex-out").textContent = SEX_LABEL[current.sex] || current.sex;
    $("npc-height").textContent = fmtHeight(current.heightIn);
    $("npc-weight").textContent = fmtWeight(current.weightLb);
    const ul = $("npc-features");
    ul.innerHTML = "";
    if (current.features.length === 0) {
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
    $("npc-notes").value = current.notes || "";
    $("npc-save").disabled = false;
  }

  function generate() {
    const sp = selectedSpecies();
    const sex = selectedSex();
    const lineage = sp.lineages ? $("npc-lineage").value : null;
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
      notes: $("npc-notes").value
    };
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
        (npc.species + (npc.lineage ? " · " + npc.lineage : "")) + " · " +
        (SEX_LABEL[npc.sex] || npc.sex) + " · " + fmtHeight(npc.heightIn) + " · " + fmtWeight(npc.weightLb);
      item.appendChild(top);
      item.appendChild(meta);
      box.appendChild(item);
    });
  }

  function loadNPC(npc) {
    $("npc-species").value = npc.speciesId;
    renderLineageOptions();
    if (npc.lineage) $("npc-lineage").value = npc.lineage;
    $("npc-sex").value = npc.sex;
    current = { ...npc };
    render();
  }

  function saveCurrent() {
    if (!current) return;
    const roster = loadRoster();
    const entry = { id: Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), savedAt: new Date().toISOString(), ...current, notes: $("npc-notes").value };
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
        const existing = loadRoster();
        const byId = new Map(existing.map((x) => [x.id, x]));
        data.forEach((x) => { if (x && x.name && x.species) byId.set(x.id || (Date.now().toString(36) + Math.random().toString(36).slice(2)), x); });
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
    DATA.SPECIES.forEach((s) => {
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name + (s.lineages ? " (" + s.lineages.length + " options)" : "");
      spSel.appendChild(o);
    });
    spSel.addEventListener("change", renderLineageOptions);
    renderLineageOptions();

    $("npc-generate").addEventListener("click", generate);
    $("npc-reroll-name").addEventListener("click", () => {
      if (!current) return;
      current.name = genName(selectedSpecies(), current.sex);
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
