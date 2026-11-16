// FORMULA ASCENT — GLYPH access and panel navigation (visual stage)
(() => {
  const tabs = ["converter", "inventory", "upgrades", "synthesis"];
  const panels = {
    converter: "glyphsConverterPanel",
    inventory: "glyphsInventoryPanel",
    upgrades: "glyphsUpgradesPanel",
    synthesis: "glyphsSynthesisPanel"
  };

  window.showGlyphTab = tab => {
    if (!tabs.includes(tab) || !(typeof window.isGlyphsUnlocked === "function" && window.isGlyphsUnlocked())) return;
    document.querySelectorAll("[data-glyph-tab]").forEach(button => {
      button.classList.toggle("active", button.dataset.glyphTab === tab);
      button.setAttribute("aria-selected", button.dataset.glyphTab === tab ? "true" : "false");
    });
    document.querySelectorAll("[data-glyph-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.glyphPanel === tab);
      panel.hidden = panel.dataset.glyphPanel !== tab;
    });
  };

  window.refreshGlyphsAccess = () => {
    const unlocked = typeof window.isGlyphsUnlocked === "function" && window.isGlyphsUnlocked();
    const nav = document.getElementById("glyphsNav");
    const page = document.getElementById("page-glyphs");
    if (nav) {
      nav.hidden = !unlocked;
      nav.disabled = !unlocked;
      nav.classList.toggle("locked-nav", !unlocked);
    }
    if (!unlocked && page?.classList.contains("active") && typeof window.navigate === "function") {
      window.navigate("tree");
    }
    return unlocked;
  };

  window.refreshGlyphsAccess();
})();
