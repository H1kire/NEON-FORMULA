// FORMULA ASCENT — GLYPH access, conversion and panel navigation
(() => {
  const tabs = ["converter", "inventory", "upgrades", "synthesis"];
  const CONVERSION_DURATION = 5000;
  const MIN_GP_CONVERSION = 1000;
  const MIN_GS_CONVERSION = 1000;
  const MIN_CONVERSION = 1000;
  const $ = id => document.getElementById(id);
  const formatValue = value => typeof format === "function"
    ? format(value)
    : Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const formatConversionValue = value => {
    const formatted = formatValue(value);
    if (Number.isInteger(value)) {
      return formatted.replace(/([.,]\d)0+(?=[A-Za-z]|$)/, "$1").replace(/[.,]0(?=[A-Za-z]|$)/, "");
    }
    if (value < 1e6) {
      const locale = typeof FA_META !== "undefined" && FA_META.language === "ru" ? "ru-RU" : "en-US";
      return value.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    return formatted.replace(/([.,]\d)\d+(?=[A-Za-z]|$)/, "$1");
  };

  const renderConversionFormula = () => {
    if (typeof FAFormula !== "object" || typeof FAFormula.render !== "function") return;
    FAFormula.render("glyphConversionFormula", String.raw`\mathrm{GS}=\frac{1}{2}\left[\left(1+\frac{\mathrm{GP}}{1000}\right)^2-1\right]`);
    FAFormula.render("glyphConversionParameters", String.raw`i=1\quad\cdot\quad v=1\quad\cdot\quad k=1`);
    FAFormula.render("glyphFragmentConversionFormula", String.raw`\mathrm{GF}=\frac{1}{2}\left[\left(1+\frac{\mathrm{GS}}{1000}\right)^2-1\right]`);
    FAFormula.render("glyphFragmentConversionParameters", String.raw`i=1\quad\cdot\quad v=1\quad\cdot\quad k=1`);
  };

  window.calculateGlyphShardReward = amount => {
    const input = Number(amount);
    if (!Number.isFinite(input) || input < MIN_GP_CONVERSION) return 0;
    const x = input / 1000;
    const result = 0.5 * ((1 + x) ** 2 - 1);
    return Number.isFinite(result) ? result : Number.MAX_VALUE;
  };

  window.calculateGlyphFragmentReward = amount => {
    const input = Number(amount);
    if (!Number.isFinite(input) || input < MIN_GS_CONVERSION) return 0;
    const x = input / 1000;
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

  function updateGpToGsConverter() {
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
    const valid = Number.isFinite(requested) && requested >= MIN_CONVERSION && requested <= balance;
    const reward = valid ? window.calculateGlyphShardReward(requested) : 0;
    if (preview) preview.textContent = valid ? formatConversionValue(reward) + " GS" : "— GS";
    if (gpBalance) gpBalance.textContent = formatValue(balance) + " GP";
    if (gsBalance) gsBalance.textContent = formatValue(glyphShards) + " GS";
    const headerGsBalance = $("glyphHeaderGsBalance");
    if (headerGsBalance) headerGsBalance.textContent = formatValue(glyphShards);
    input.max = String(Math.floor(balance));
    input.disabled = active;
    button.disabled = active || !valid;
    if (maxButton) maxButton.disabled = active || balance < MIN_CONVERSION;

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
      const key = active ? "glyphsConverting" : balance >= MIN_CONVERSION ? "glyphsReady" : "glyphsNeedMoreGp";
      status.textContent = typeof tr === "function" ? tr(key) : (active ? "CONVERTING" : "READY");
    }
    if (time) time.textContent = active ? (remaining / 1000).toFixed(1) + " s" : "5.0 s";
  }

  function updateGsToGfConverter() {
    const input = $("glyphGsInput");
    const button = $("glyphGsConvertButton");
    const maxButton = $("glyphGsMax");
    const preview = $("glyphGfPreview");
    const gsBalance = $("glyphGsAvailableBalance");
    const gfBalance = $("glyphGfBalance");
    const fill = $("glyphGsProgressFill");
    const percent = $("glyphGsProgressPercent");
    const track = $("glyphGsProgressTrack");
    const status = $("glyphGsProgressStatus");
    const time = $("glyphGsProgressTime");
    if (!input || !button) return;

    const balance = Math.max(0, Number(glyphShards) || 0);
    const active = glyphGsOperationStartedAt > 0;
    const requested = Math.floor(Number(input.value));
    const valid = Number.isFinite(requested) && requested >= MIN_CONVERSION && requested <= balance;
    const reward = valid ? window.calculateGlyphFragmentReward(requested) : 0;
    if (preview) preview.textContent = valid ? formatConversionValue(reward) + " GF" : "— GF";
    if (gsBalance) gsBalance.textContent = formatValue(balance) + " GS";
    if (gfBalance) gfBalance.textContent = formatValue(glyphFragments) + " GF";
    const headerGfBalance = $("glyphHeaderGfBalance");
    if (headerGfBalance) headerGfBalance.textContent = formatValue(glyphFragments);
    input.max = String(Math.floor(balance));
    input.disabled = active;
    button.disabled = active || !valid;
    if (maxButton) maxButton.disabled = active || balance < MIN_CONVERSION;

    let progress = 0;
    let remaining = CONVERSION_DURATION;
    if (active) {
      const elapsed = Math.max(0, Date.now() - glyphGsOperationStartedAt);
      progress = Math.min(1, elapsed / CONVERSION_DURATION);
      remaining = Math.max(0, CONVERSION_DURATION - elapsed);
    }
    if (fill) fill.style.width = (progress * 100).toFixed(2) + "%";
    if (percent) percent.textContent = Math.floor(progress * 100) + "%";
    if (track) track.setAttribute("aria-valuenow", String(Math.floor(progress * 100)));
    if (status) {
      const key = active ? "glyphsConverting" : balance >= MIN_CONVERSION ? "glyphsReady" : "glyphsNeedMoreGs";
      status.textContent = typeof tr === "function" ? tr(key) : (active ? "CONVERTING" : "READY");
    }
    if (time) time.textContent = active ? (remaining / 1000).toFixed(1) + " s" : "5.0 s";
  }

  function finishGpToGsConversion() {
    if (!(glyphOperationStartedAt > 0) || Date.now() - glyphOperationStartedAt < CONVERSION_DURATION) return;
    glyphShards = Math.min(Number.MAX_VALUE, glyphShards + glyphOperationReward);
    glyphOperationStartedAt = 0;
    glyphOperationAmount = 0;
    glyphOperationReward = 0;
    if (typeof savePrestige === "function") savePrestige();
    if (typeof updatePrestigeUI === "function") updatePrestigeUI();
    updateGpToGsConverter();
    updateGsToGfConverter();
  }

  function finishGsToGfConversion() {
    if (!(glyphGsOperationStartedAt > 0) || Date.now() - glyphGsOperationStartedAt < CONVERSION_DURATION) return;
    glyphFragments = Math.min(Number.MAX_VALUE, glyphFragments + glyphGsOperationReward);
    glyphGsOperationStartedAt = 0;
    glyphGsOperationAmount = 0;
    glyphGsOperationReward = 0;
    if (typeof savePrestige === "function") savePrestige();
    updateGsToGfConverter();
  }

  function startGpToGsConversion() {
    const input = $("glyphGpInput");
    if (!input || glyphOperationStartedAt > 0) return;
    const amount = Math.floor(Number(input.value));
    if (!Number.isFinite(amount) || amount < MIN_CONVERSION || amount > gp) return;
    const reward = window.calculateGlyphShardReward(amount);
    if (!(reward > 0)) return;
    gp -= amount;
    glyphOperationAmount = amount;
    glyphOperationReward = reward;
    glyphOperationStartedAt = Date.now();
    if (typeof savePrestige === "function") savePrestige();
    if (typeof updatePrestigeUI === "function") updatePrestigeUI();
    updateGpToGsConverter();
  }

  function startGsToGfConversion() {
    const input = $("glyphGsInput");
    if (!input || glyphGsOperationStartedAt > 0) return;
    const amount = Math.floor(Number(input.value));
    if (!Number.isFinite(amount) || amount < MIN_CONVERSION || amount > glyphShards) return;
    const reward = window.calculateGlyphFragmentReward(amount);
    if (!(reward > 0)) return;
    glyphShards -= amount;
    glyphGsOperationAmount = amount;
    glyphGsOperationReward = reward;
    glyphGsOperationStartedAt = Date.now();
    if (typeof savePrestige === "function") savePrestige();
    updateGpToGsConverter();
    updateGsToGfConverter();
  }

  function bindConverterInput(inputId, buttonId, maxButtonId, getSavedInput, setSavedInput, getBalance, minAmount, start) {
    const input = $(inputId);
    const button = $(buttonId);
    const maxButton = $(maxButtonId);
    if (!input || !button || input.dataset.glyphReady === "1") return;
    input.dataset.glyphReady = "1";
    input.value = String(getSavedInput() || minAmount);
    input.addEventListener("input", () => {
      setSavedInput(Math.max(minAmount, Math.floor(Number(input.value) || minAmount)));
      if (typeof savePrestige === "function") savePrestige();
      updateGpToGsConverter();
      updateGsToGfConverter();
    });
    input.addEventListener("change", () => {
      const amount = Math.floor(Number(input.value));
      if (Number.isFinite(amount) && amount >= minAmount) {
        input.value = String(amount);
        setSavedInput(amount);
        if (typeof savePrestige === "function") savePrestige();
      }
      updateGpToGsConverter();
      updateGsToGfConverter();
    });
    button.addEventListener("click", start);
    maxButton?.addEventListener("click", () => {
      input.value = String(Math.floor(Math.max(0, Number(getBalance()) || 0)));
      setSavedInput(Math.max(minAmount, Math.floor(Number(input.value) || minAmount)));
      if (typeof savePrestige === "function") savePrestige();
      updateGpToGsConverter();
      updateGsToGfConverter();
    });
  }

  window.refreshGlyphConverter = () => {
    renderConversionFormula();
    finishGpToGsConversion();
    finishGsToGfConversion();
    updateGpToGsConverter();
    updateGsToGfConverter();
  };

  window.refreshGlyphsAccess();
  bindConverterInput("glyphGpInput", "glyphConvertButton", "glyphGpMax", () => glyphGpInput, value => { glyphGpInput = value; }, () => gp, MIN_CONVERSION, startGpToGsConversion);
  bindConverterInput("glyphGsInput", "glyphGsConvertButton", "glyphGsMax", () => glyphGsInput, value => { glyphGsInput = value; }, () => glyphShards, MIN_CONVERSION, startGsToGfConversion);
  window.refreshGlyphConverter();
  setInterval(window.refreshGlyphConverter, 50);
})();
