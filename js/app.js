/* DM's Table — tab switching + module boot. */
(function () {
  "use strict";

  function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    const panels = document.querySelectorAll(".tab-panel");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
        panels.forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        const panel = document.getElementById("tab-" + tab.dataset.tab);
        if (panel) panel.classList.add("active");
      });
    });
  }

  function initModal() {
    const modal = document.getElementById("modal");
    const body = document.getElementById("modal-body");
    function close() { modal.hidden = true; body.innerHTML = ""; }
    document.getElementById("modal-close").addEventListener("click", close);
    document.getElementById("modal-backdrop").addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });
    window.openModal = function (title, nodes) {
      body.innerHTML = "";
      const h = document.createElement("h3");
      h.className = "modal-title";
      h.textContent = title;
      body.appendChild(h);
      (Array.isArray(nodes) ? nodes : [nodes]).forEach((n) => body.appendChild(n));
      modal.hidden = false;
    };
  }

  function boot() {
    initTabs();
    initModal();
    window.Soundboard.init();
    window.NPCGen.init();
    window.Spellbook.init();
    window.Tables.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
