/* DM's Table — Spells tab.
   Expandable list of core 2024 spells (from js/spells-data.js, built from the compendium XML).
   Each expanded spell has a level selector: the levels the spell is available at (from the
   compendium's per-level <roll> data); selecting one rewrites the scaling text for that level. */
(function () {
  "use strict";

  const SPELLS = window.DM_SPELLS || [];
  const CLASSES = window.DM_CLASSES || [];

  const SCHOOL = { A: "Abjuration", C: "Conjuration", D: "Divination", E: "Enchantment", EV: "Evocation", I: "Illusion", N: "Necromancy", T: "Transmutation" };
  const ORDINAL = ["0th", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
  const SCALING_RE = /higher-level spell slot|higher levels|higher spell slot|cantrip upgrade/i;

  const $ = (id) => document.getElementById(id);
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function levelOptions(spell) {
    const levels = [...new Set(spell.rolls.map((r) => r.level))].sort((a, b) => a - b);
    return levels.length ? levels : [spell.level];
  }

  function buildSpellCard(spell) {
    const det = el("details", "spell-card table-card");
    det.dataset.search = (spell.name + " " + (SCHOOL[spell.school] || "") + " " + spell.classes.join(" ") + " " + spell.paras.join(" ")).toLowerCase();
    det.dataset.level = String(spell.level);
    det.dataset.classes = spell.classes.join(",").toLowerCase();

    const sum = el("summary", "table-summary spell-summary");
    sum.appendChild(el("h3", "spell-name", spell.name));
    sum.appendChild(el("span", "pill spell-badge", spell.level === 0 ? "Cantrip" : ORDINAL[spell.level] + " level"));
    sum.appendChild(el("span", "pill spell-school", SCHOOL[spell.school] || spell.school));
    det.appendChild(sum);

    const body = el("div", "spell-body");

    const meta = el("p", "spell-meta", [spell.time, spell.range, spell.components, spell.duration].filter(Boolean).join(" · "));
    body.appendChild(meta);
    body.appendChild(el("p", "spell-classes", "Classes: " + spell.classes.join(", ")));

    const levels = levelOptions(spell);
    const selLabel = el("label", "spell-level-label", spell.level === 0 ? "Character level: " : "Spell slot level: ");
    const sel = el("select", "spell-level-select");
    levels.forEach((l) => {
      const o = el("option", null, spell.level === 0 ? "Char. level " + l : ORDINAL[l] + " level");
      o.value = String(l);
      sel.appendChild(o);
    });
    sel.value = String(levels[0]);
    selLabel.appendChild(sel);
    body.appendChild(selLabel);

    const rollsLine = el("p", "spell-rolls");
    if (spell.rolls.length) {
      rollsLine.textContent = "Scaling: " + spell.rolls.map((r) => (spell.level === 0 ? "lvl " : "slot ") + (r.level === 0 ? "0" : ORDINAL[r.level]) + " → " + r.dice + " " + r.description).join("  ·  ");
      body.appendChild(rollsLine);
    }

    const desc = el("div", "spell-desc");
    body.appendChild(desc);

    function renderDesc(lvl) {
      const rollsAt = spell.rolls.filter((r) => r.level === lvl);
      desc.innerHTML = "";
      spell.paras.forEach((p) => {
        const pe = el("p");
        if (SCALING_RE.test(p)) {
          if (lvl === levels[0] || !rollsAt.length) {
            pe.textContent = p;
          } else {
            const what = spell.level === 0 ? "At character level " + lvl : "Cast with a " + ORDINAL[lvl] + "-level slot";
            pe.textContent = what + ": " + rollsAt.map((r) => r.dice + " " + r.description).join(", ") + ".";
            pe.classList.add("spell-scaled");
          }
        } else {
          pe.textContent = p;
        }
        desc.appendChild(pe);
      });
    }
    sel.addEventListener("change", () => renderDesc(parseInt(sel.value, 10)));
    renderDesc(levels[0]);

    det.appendChild(body);
    return det;
  }

  function applyFilters() {
    const q = $("spells-filter").value.trim().toLowerCase();
    const lvl = $("spells-level-filter").value;
    const cls = $("spells-class-filter").value.toLowerCase();
    let shown = 0;
    const list = $("spells-list");
    list.querySelectorAll(".spell-card").forEach((card) => {
      const ok = (!q || card.dataset.search.includes(q)) &&
        (lvl === "" || card.dataset.level === lvl) &&
        (!cls || card.dataset.classes.split(",").includes(cls));
      card.style.display = ok ? "" : "none";
      if (ok) shown++;
    });
    $("spells-count").textContent = shown + " / " + SPELLS.length + " spells";
  }

  function init() {
    const list = $("spells-list");
    SPELLS.forEach((s) => list.appendChild(buildSpellCard(s)));

    const clsSel = $("spells-class-filter");
    CLASSES.forEach((c) => {
      const o = el("option", null, c.name);
      o.value = c.id;
      clsSel.appendChild(o);
    });

    ["spells-filter", "spells-level-filter", "spells-class-filter"].forEach((id) => {
      $(id).addEventListener("input", applyFilters);
      $(id).addEventListener("change", applyFilters);
    });
    applyFilters();
  }

  window.Spellbook = { init };
})();
