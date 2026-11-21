/* DM's Table — Monsters tab.
   Mirrors the NPC tab, but for monsters: browse/search/filter the 2024 compendium bestiary
   (js/monsters-data.js), random-monster generator, full stat block card with clickable
   trait/action names (modal), and a saved-monster roster (localStorage + JSON export/import). */
(function () {
  "use strict";

  const MONSTERS = window.DM_MONSTERS || [];
  const ROSTER_KEY = "dmDash.monsterRoster.v1";

  const CR_XP = { "0": 10, "1/8": 25, "1/4": 50, "1/2": 100, "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800, "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900, "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000, "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000, "21": 33000, "22": 41000, "23": 50000, "24": 62000, "25": 75000, "26": 90000, "27": 105000, "28": 120000, "29": 135000, "30": 155000 };
  const ABIL_ORDER = ["str", "dex", "con", "int", "wis", "cha"];
  const ABIL_NAME = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };

  const $ = (id) => document.getElementById(id);
  const crVal = (cr) => {
    if (cr.includes("/")) { const [a, b] = cr.split("/"); return parseInt(a, 10) / parseInt(b, 10); }
    return parseFloat(cr);
  };
  const mod = (s) => Math.floor((parseInt(s, 10) - 10) / 2);
  const fmtMod = (m) => (m >= 0 ? "+" : "") + m;

  let current = null;

  /* ---------- filtering / list ---------- */
  function filtered() {
    const q = $("mon-search").value.trim().toLowerCase();
    const crSel = $("mon-cr").value;
    const type = $("mon-type").value;
    return MONSTERS.filter((mo) => {
      if (q && !mo.name.toLowerCase().includes(q) && !mo.type.toLowerCase().includes(q)) return false;
      if (type && mo.type !== type) return false;
      if (crSel) {
        const v = crVal(mo.cr);
        if (crSel === "0") { if (v !== 0) return false; }
        else if (crSel === "0.125-1") { if (!(v > 0 && v <= 1)) return false; }
        else if (crSel === "17+") { if (!(v >= 17)) return false; }
        else {
          const [lo, hi] = crSel.split("-").map(Number);
          if (!(v >= lo && v <= hi)) return false;
        }
      }
      return true;
    });
  }

  function renderList() {
    const list = $("mon-list");
    list.innerHTML = "";
    const items = filtered();
    const cap = 200;
    items.slice(0, cap).forEach((mo) => {
      const item = document.createElement("div");
      item.className = "roster-item";
      const top = document.createElement("div");
      top.className = "roster-top";
      const btn = document.createElement("button");
      btn.className = "roster-name";
      btn.type = "button";
      btn.textContent = mo.name;
      btn.addEventListener("click", () => loadMonster(mo));
      const meta = document.createElement("div");
      meta.className = "roster-meta";
      meta.textContent = "CR " + mo.cr + " · " + mo.type;
      top.appendChild(btn);
      item.appendChild(top);
      item.appendChild(meta);
      list.appendChild(item);
    });
    if (items.length > cap) {
      const p = document.createElement("p");
      p.className = "roster-empty";
      p.textContent = "…and " + (items.length - cap) + " more — refine the search.";
      list.appendChild(p);
    }
    if (!items.length) {
      const p = document.createElement("p");
      p.className = "roster-empty";
      p.textContent = "No monsters match.";
      list.appendChild(p);
    }
  }

  /* ---------- card ---------- */
  function line(parent, label, value) {
    if (!value) return;
    const d = document.createElement("div");
    d.className = "sb-line";
    const b = document.createElement("strong");
    b.textContent = label + " ";
    d.appendChild(b);
    d.appendChild(document.createTextNode(value));
    parent.appendChild(d);
  }

  function blockSection(parent, title, blocks) {
    if (!blocks || !blocks.length) return;
    const det = document.createElement("details");
    det.className = "sb-features";
    const sum = document.createElement("summary");
    sum.className = "sb-features-summary";
    sum.textContent = title + " (" + blocks.length + ") — click to expand";
    det.appendChild(sum);
    const ul = document.createElement("ul");
    blocks.forEach((blk) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "linklike";
      btn.textContent = blk.name;
      btn.addEventListener("click", () => {
        const nodes = [];
        if (blk.text) { const p = document.createElement("p"); p.textContent = blk.text; nodes.push(p); }
        (blk.attacks || []).forEach((a) => { const p = document.createElement("p"); p.className = "spell-rolls"; p.textContent = a; nodes.push(p); });
        window.openModal(blk.name, nodes);
      });
      li.appendChild(btn);
      ul.appendChild(li);
    });
    det.appendChild(ul);
    parent.appendChild(det);
  }

  function renderCard(mo) {
    $("mon-name").textContent = mo.name;
    const xp = CR_XP[mo.cr];
    $("mon-cr-pill").textContent = "CR " + mo.cr + (xp ? " · " + xp.toLocaleString("en-US") + " XP" : "");
    const sizeName = { T: "Tiny", S: "Small", M: "Medium", L: "Large", H: "Huge", G: "Gargantuan" }[mo.size] || mo.size;
    $("mon-sub").textContent = sizeName + " " + mo.type + (mo.alignment ? " · " + mo.alignment : "");
    $("mon-ac").textContent = mo.ac;
    $("mon-hp").textContent = mo.hp;
    $("mon-speed").textContent = mo.speed || "—";
    $("mon-passive").textContent = mo.passive || "—";

    const ab = $("mon-abilities");
    ab.innerHTML = "";
    ABIL_ORDER.forEach((k) => {
      const cell = document.createElement("div");
      cell.className = "sb-ab";
      const s = parseInt(mo[k], 10) || 10;
      const l1 = document.createElement("span");
      l1.className = "sb-ab-name";
      l1.textContent = ABIL_NAME[k];
      const l2 = document.createElement("span");
      l2.className = "sb-ab-val";
      l2.textContent = s + " (" + fmtMod(mod(s)) + ")";
      cell.appendChild(l1);
      cell.appendChild(l2);
      ab.appendChild(cell);
    });

    const lines = $("mon-lines");
    lines.innerHTML = "";
    line(lines, "Saving Throws", mo.saves);
    line(lines, "Skills", mo.skills);
    line(lines, "Damage Vulnerabilities", mo.vulnerable);
    line(lines, "Damage Resistances", mo.resist);
    line(lines, "Damage Immunities", mo.immune);
    line(lines, "Condition Immunities", mo.conditionImmune);
    line(lines, "Senses", mo.senses);
    line(lines, "Languages", mo.languages);

    const blocks = $("mon-blocks");
    blocks.innerHTML = "";
    blockSection(blocks, "Traits", mo.traits);
    blockSection(blocks, "Actions", mo.actions);
    blockSection(blocks, "Reactions", mo.reactions);
    blockSection(blocks, "Legendary Actions", mo.legendary);

    $("mon-notes").value = current && current.name === mo.name ? (current.notes || "") : "";
    $("mon-save").disabled = false;
  }

  function loadMonster(mo) {
    current = { ...mo, notes: $("mon-notes").value };
    renderCard(mo);
  }

  /* ---------- roster ---------- */
  function loadRoster() {
    try {
      const r = JSON.parse(localStorage.getItem(ROSTER_KEY) || "[]");
      return Array.isArray(r) ? r : [];
    } catch (e) { return []; }
  }
  function saveRoster(r) { localStorage.setItem(ROSTER_KEY, JSON.stringify(r)); }

  function renderRoster() {
    const roster = loadRoster();
    const box = $("mon-roster");
    box.innerHTML = "";
    $("mon-count").textContent = String(roster.length);
    if (!roster.length) {
      const p = document.createElement("p");
      p.className = "roster-empty";
      p.textContent = "No saved monsters yet.";
      box.appendChild(p);
      return;
    }
    roster.slice().reverse().forEach((mo) => {
      const item = document.createElement("div");
      item.className = "roster-item";
      const top = document.createElement("div");
      top.className = "roster-top";
      const btn = document.createElement("button");
      btn.className = "roster-name";
      btn.type = "button";
      btn.textContent = mo.name;
      btn.addEventListener("click", () => loadMonster(mo));
      const del = document.createElement("button");
      del.className = "roster-del";
      del.type = "button";
      del.textContent = "✕";
      del.addEventListener("click", () => {
        saveRoster(loadRoster().filter((x) => x.id !== mo.id));
        renderRoster();
      });
      top.appendChild(btn);
      top.appendChild(del);
      const meta = document.createElement("div");
      meta.className = "roster-meta";
      meta.textContent = "CR " + mo.cr + " · " + mo.type;
      item.appendChild(top);
      item.appendChild(meta);
      box.appendChild(item);
    });
  }

  function saveCurrent() {
    if (!current) return;
    const roster = loadRoster();
    roster.push({
      id: Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      savedAt: new Date().toISOString(),
      ...current,
      notes: $("mon-notes").value
    });
    saveRoster(roster);
    renderRoster();
  }

  function exportRoster() {
    const blob = new Blob([JSON.stringify(loadRoster(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "monster-roster.json";
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
        data.forEach((x) => { if (x && x.name && x.cr !== undefined) byId.set(x.id || (Date.now().toString(36) + Math.random().toString(36).slice(2)), x); });
        saveRoster(Array.from(byId.values()));
        renderRoster();
      } catch (e) {
        alert("Could not import: file must be a JSON array of saved monsters.");
      }
    };
    reader.readAsText(file);
  }

  function init() {
    const typeSel = $("mon-type");
    const types = [...new Set(MONSTERS.map((m) => m.type).filter(Boolean))].sort();
    types.forEach((t) => {
      const o = document.createElement("option");
      o.value = t;
      o.textContent = t;
      typeSel.appendChild(o);
    });

    $("mon-random").addEventListener("click", () => {
      const items = filtered();
      const pool = items.length ? items : MONSTERS;
      loadMonster(pool[Math.floor(Math.random() * pool.length)]);
    });
    ["mon-search", "mon-cr", "mon-type"].forEach((id) => {
      $(id).addEventListener("input", renderList);
      $(id).addEventListener("change", renderList);
    });
    $("mon-save").addEventListener("click", saveCurrent);
    $("mon-save").disabled = true;
    $("mon-export").addEventListener("click", exportRoster);
    $("mon-import").addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) importRoster(e.target.files[0]);
      e.target.value = "";
    });
    $("mon-notes").addEventListener("input", () => { if (current) current.notes = $("mon-notes").value; });

    renderList();
    renderRoster();
    loadMonster(MONSTERS[Math.floor(Math.random() * MONSTERS.length)]);
  }

  window.Monsters = { init };
})();
