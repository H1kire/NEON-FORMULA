// FORMULA ASCENT — GLYPH access, converter and panel navigation
(() => {
  const tabs = ["converter", "inventory", "upgrades", "synthesis"];
  const panels = {
    converter: "glyphsConverterPanel",
    inventory: "glyphsInventoryPanel",
    upgrades: "glyphsUpgradesPanel",
    synthesis: "glyphsSynthesisPanel"
  };
  const CONVERSION_DURATION = 5000;
  const MIN_GP_CONVERSION = 1000;
  const $ = id => document.getElementById(id);
  const formatValue = value => typeof format === "function"
    ? format(value)
    : Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

  window.calculateGlyphShardReward = amount => {
    const gpAmount = Number(amount);
    if (!Number.isFinite(gpAmount) || gpAmount < MIN_GP_CONVERSION) return 0;
    const x = gpAmount / 1000;
    const result = 0.5 * ((1 + x) ** 2 - 1);
    return Number.isFinite(result) ? result : Number.MAX_VALUE;
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
    const nav = $("glyphsNav");
    const page = $("page-glyphs");
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

  function updateConverter() {
    const input = $("glyphGpInput");
    const button = $("glyphConvertButton");
    const maxButton = $("glyphGpMax");
    const preview = $("glyphGsPreview");
    const gpBalance = $("glyphGpBalance");
    const gsBalance = $("glyphGsBalance");
    const fill = $("glyphProgressFill");
    const percent = $("glyphProgressPercent");
    const track = $("glyphProgressTrack");
    const status = $("glyphProgressStatus");
    const time = $("glyphProgressTime");
    if (!input || !button) return;

    const balance = Math.max(0, Number(gp) || 0);
    const active = glyphOperationStartedAt > 0;
    const requested = Math.floor(Number(input.value));
    const valid = Number.isFinite(requested) && requested >= MIN_GP_CONVERSION && requested <= balance;
    const reward = valid ? window.calculateGlyphShardReward(requested) : 0;
    if (preview) preview.textContent = valid ? formatValue(reward) + " GS" : "— GS";
    if (gpBalance) gpBalance.textContent = formatValue(balance) + " GP";
    if (gsBalance) gsBalance.textContent = formatValue(glyphShards) + " GS";
    input.max = String(Math.floor(balance));
    input.disabled = active;
    button.disabled = active || !valid;
    maxButton.disabled = active || balance < MIN_GP_CONVERSION;

    let progress = 0;
    let remaining = CONVERSION_DURATION;
    if (active) {
      const elapsed = Math.max(0, Date.now() - glyphOperationStartedAt);
      progress = Math.min(1, elapsed / CONVERSION_DURATION);
      remaining = Math.max(0, CONVERSION_DURATION - elapsed);
    }
    if (fill) fill.style.width = (progress * 100).toFixed(2) + "%";
    if (percent) percent.textContent = Math.floor(progress * 100) + "%";
    if (track) track.setAttribute("aria-valuenow", String(Math.floor(progress * 100)));
    if (status) {
      const key = active ? "glyphsConverting" : balance >= MIN_GP_CONVERSION ? "glyphsReady" : "glyphsNeedMoreGp";
      status.textContent = typeof tr === "function" ? tr(key) : (active ? "CONVERTING" : "READY");
    }
    if (time) time.textContent = active ? (remaining / 1000).toFixed(1) + " s" : "5.0 s";
  }

  function finishConversion() {
    if (!(glyphOperationStartedAt > 0)) return;
    if (Date.now() - glyphOperationStartedAt < CONVERSION_DURATION) return;
    glyphShards = Math.min(Number.MAX_VALUE, glyphShards + glyphOperationReward);
    glyphOperationStartedAt = 0;
    glyphOperationAmount = 0;
    glyphOperationReward = 0;
    if (typeof savePrestige === "function") savePrestige();
    if (typeof updatePrestigeUI === "function") updatePrestigeUI();
    updateConverter();
  }

  function startConversion() {
    const input = $("glyphGpInput");
    if (!input || glyphOperationStartedAt > 0) return;
    const amount = Math.floor(Number(input.value));
    if (!Number.isFinite(amount) || amount < MIN_GP_CONVERSION || amount > gp) return;
    const reward = window.calculateGlyphShardReward(amount);
    if (!(reward > 0)) return;
    gp -= amount;
    glyphOperationAmount = amount;
    glyphOperationReward = reward;
    glyphOperationStartedAt = Date.now();
    if (typeof savePrestige === "function") savePrestige();
    if (typeof updatePrestigeUI === "function") updatePrestigeUI();
    updateConverter();
  }

  function initConverter() {
    const input = $("glyphGpInput");
    const button = $("glyphConvertButton");
    const maxButton = $("glyphGpMax");
    if (!input || !button || input.dataset.glyphReady === "1") return;
    input.dataset.glyphReady = "1";
    input.value = String(glyphGpInput || MIN_GP_CONVERSION);
    input.addEventListener("input", () => { glyphGpInput = Math.max(MIN_GP_CONVERSION, Math.floor(Number(input.value) || MIN_GP_CONVERSION)); updateConverter(); });
    input.addEventListener("change", () => {
      const amount = Math.floor(Number(input.value));
      if (Number.isFinite(amount) && amount >= MIN_GP_CONVERSION) { input.value = String(amount); glyphGpInput = amount; if (typeof savePrestige === "function") savePrestige(); }
      updateConverter();
    });
    button.addEventListener("click", startConversion);
    maxButton?.addEventListener("click", () => {
      input.value = String(Math.floor(Math.max(0, Number(gp) || 0)));
      glyphGpInput = Math.max(MIN_GP_CONVERSION, Math.floor(Number(input.value) || MIN_GP_CONVERSION));
      if (typeof savePrestige === "function") savePrestige();
      updateConverter();
    });
    updateConverter();
  }

  window.refreshGlyphConverter = () => {
    finishConversion();
    updateConverter();
  };

  window.refreshGlyphsAccess();
  initConverter();
  window.refreshGlyphConverter();
  setInterval(window.refreshGlyphConverter, 50);
})();
