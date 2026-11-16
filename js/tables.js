/* DM's Table — DM Tables tab: renders the 5.5e (2024) reference cards from DM_DATA.TABLES. */
(function () {
  "use strict";

  const TABLES = window.DM_DATA.TABLES;
  const $ = (id) => document.getElementById(id);

  const isNum = (s) => /^[+\-\d][\d,]*$/.test(String(s).trim());

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function buildTable(card, t) {
    const table = el("table");
    const thead = el("thead");
    const hr = el("tr");
    t.columns.forEach((c) => {
      const th = el("th", null, c);
      const numeric = t.rows.length > 0 && t.rows.every((r) => isNum(r[t.columns.indexOf(c)]));
      if (numeric) th.classList.add("num");
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = el("tbody");
    t.rows.forEach((row) => {
      const tr = el("tr");
      row.forEach((cell, i) => {
        const td = el("td", isNum(cell) ? "num" : null, String(cell));
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
  }

  // key/value pairs laid out in N columns of pairs
  function buildGrid(card, t, pairsPerRow) {
    const rows = t.rows;
    const colCount = pairsPerRow;
    const colLen = Math.ceil(rows.length / colCount);
    const table = el("table");
    const thead = el("thead");
    const hr = el("tr");
    for (let c = 0; c < colCount; c++) {
      hr.appendChild(el("th", null, "Score"));
      hr.appendChild(el("th", "num", "Mod"));
    }
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = el("tbody");
    for (let r = 0; r < colLen; r++) {
      const tr = el("tr");
      for (let c = 0; c < colCount; c++) {
        const idx = c * colLen + r;
        const pair = rows[idx];
        if (pair) {
          tr.appendChild(el("td", null, String(pair[0])));
          tr.appendChild(el("td", "num", String(pair[1])));
        } else {
          tr.appendChild(el("td"));
          tr.appendChild(el("td"));
        }
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    card.appendChild(table);
  }

  function buildGrid2(card, t) {
    const table = el("table");
    const tbody = el("tbody");
    t.rows.forEach((pair) => {
      const tr = el("tr");
      tr.appendChild(el("td", null, String(pair[0])));
      tr.appendChild(el("td", null, String(pair[1])));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
  }

  function buildConditions(card, t) {
    const table = el("table");
    const tbody = el("tbody");
    t.rows.forEach((pair) => {
      const tr = el("tr");
      tr.appendChild(el("td", "cond-name", pair[0]));
      tr.appendChild(el("td", null, pair[1]));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
  }

  function buildList(card, t) {
    const ul = el("ul");
    t.rows.forEach((line) => ul.appendChild(el("li", null, line)));
    card.appendChild(ul);
  }

  function buildTags(card, t) {
    const wrap = el("div");
    wrap.style.display = "flex";
    wrap.style.flexWrap = "wrap";
    wrap.style.gap = "6px";
    t.rows.forEach((tag) => wrap.appendChild(el("span", "pill", tag)));
    card.appendChild(wrap);
  }

  function buildCard(t) {
    const card = el("article", "table-card");
    card.dataset.search = (t.title + " " + t.note + " " + t.rows.map((r) => Array.isArray(r) ? r.join(" ") : String(r)).join(" ")).toLowerCase();
    card.appendChild(el("h3", null, t.title));
    if (t.note) card.appendChild(el("p", "card-note", t.note));
    switch (t.type) {
      case "table": buildTable(card, t); break;
      case "grid2": buildGrid2(card, t); break;
      case "grid3": buildGrid(card, t, 3); break;
      case "condition-list": buildConditions(card, t); break;
      case "list": buildList(card, t); break;
      case "tags": buildTags(card, t); break;
    }
    return card;
  }

  function init() {
    const grid = $("tables-grid");
    TABLES.forEach((t) => grid.appendChild(buildCard(t)));
    $("tables-filter").addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      grid.querySelectorAll(".table-card").forEach((card) => {
        card.style.display = !q || card.dataset.search.includes(q) ? "" : "none";
      });
    });
  }

  window.Tables = { init };
})();
