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

  function boot() {
    initTabs();
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
