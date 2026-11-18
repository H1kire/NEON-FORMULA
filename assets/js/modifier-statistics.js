// FORMULA ASCENT — compact final modifier summary
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  let activeTab = "account";
  let rowId = 0;
  const isRu = () => window.FA_META?.language === "ru";
  const tr = (ru, en) => isRu() ? ru : en;
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const fmt = value => typeof window.format === "function" ? window.format(num(value)) : String(value);
  const renderMath = (element, latex) => {
    if (window.FAFormula?.render) window.FAFormula.render(element.id, latex);
    else element.textContent = latex;
  };
  const safeProduct = (...values) => {
    let result = 1;
    for (const raw of values) {
      const value = num(raw);
      if (value <= 0) return 0;
      if (result > Number.MAX_VALUE / value) return Number.MAX_VALUE;
      result *= value;
    }
    return result;
  };
  const factorLatex = value => {
    const n = num(value);
    if (!Number.isFinite(n)) return "\\times\\,\\infty";
    return "\\times\\,\\text{" + fmt(n) + "}";
  };

  const addGroup = (root, title, wide = false) => {
    const group = document.createElement("section");
    group.className = "modifier-compact-group" + (wide ? " wide" : "");
    const heading = document.createElement("h4");
    heading.className = "modifier-compact-title";
    heading.textContent = title;
    group.append(heading);
    root.append(group);
    return group;
  };

  const addFactor = (group, label, value) => {
    const row = document.createElement("div");
    row.className = "modifier-compact-row";
    const name = document.createElement("span");
    name.className = "modifier-compact-label";
    name.id = "modifierCompactLabel" + (++rowId);
    const result = document.createElement("strong");
    result.className = "modifier-compact-value";
    result.id = "modifierCompactValue" + (++rowId);
    row.append(name, result);
    group.append(row);
    renderMath(name, label);
    renderMath(result, factorLatex(value));
  };

  window.showStatisticsTab = tab => {
    activeTab = tab === "modifiers" ? "modifiers" : "account";
    document.querySelectorAll("[data-statistics-tab]").forEach(button =>
      button.classList.toggle("active", button.dataset.statisticsTab === activeTab));
    document.querySelectorAll(".statistics-subpage").forEach(page =>
      page.classList.toggle("active", page.id === "statistics-" + activeTab));
    document.querySelectorAll("[data-statistics-label]").forEach(el => {
      el.textContent = el.dataset.statisticsLabel === "account"
        ? tr("СТАТИСТИКА АККАУНТА", "ACCOUNT STATISTICS")
        : tr("МОДИФИКАТОРЫ", "MODIFIERS");
    });
    if (activeTab === "modifiers") window.refreshModifierStatistics();
    else if (window.refreshStats) window.refreshStats();
  };

  window.refreshModifierStatistics = () => {
    const root = $("modifierStatisticsContent");
    if (!root) return;

    const title = $("modifierTitle");
    const kicker = $("modifierKicker");
    const description = $("modifierDescription");
    if (title) title.textContent = tr("Итоговые множители", "Final multipliers");
    if (kicker) kicker.textContent = tr("СВОДКА ДЕЙСТВУЮЩИХ ЭФФЕКТОВ", "ACTIVE EFFECT SUMMARY");
    if (description) description.textContent = tr(
      "Только конечные множители — без разбивки по источникам и промежуточных расчётов.",
      "Final multipliers only — no source breakdown or intermediate calculations."
    );

    root.replaceChildren();
    rowId = 0;

    // These are the same live values and formulas used by the game itself.
    const research = window.FA_META?.research || Array(10).fill(0);
    const upgrades = window.prestigeUpgrades || {};
    const dilation = window.TimeDilation?.getState?.() || {levels:{}};
    const blackHole = window.BlackHole?.getState?.() || {levels:{}};
    const meta = key => typeof window.getMetaBonus === "function" ? window.getMetaBonus(key) : 1;
    const treeLevel = id => typeof window.getTreeNodeLevel === "function" ? Math.max(0, num(window.getTreeNodeLevel(id))) : 0;
    const glyphFormula = typeof window.getGlyphFormulaTimeMultiplier === "function" ? window.getGlyphFormulaTimeMultiplier() : 1;
    const glyphOrdinary = typeof window.getGlyphOrdinaryTimeMultiplier === "function" ? window.getGlyphOrdinaryTimeMultiplier() : 1;
    const glyphDilation = typeof window.getGlyphDilationTimeMultiplier === "function" ? window.getGlyphDilationTimeMultiplier() : 1;
    const glyphLetter = typeof window.getGlyphLetterValueMultiplier === "function" ? window.getGlyphLetterValueMultiplier() : 1;
    const glyphCostDivisor = typeof window.getGlyphCostDivisor === "function" ? Math.max(1, window.getGlyphCostDivisor()) : 1;
    const treeProduction = typeof window.treeProductionMultiplier === "function" ? window.treeProductionMultiplier() : 1;
    const letterCommon = typeof getLetterValueMultiplier === "function" ? getLetterValueMultiplier() : 1;
    const formula = window.FAMathSystem?.getState?.() || {};
    const letterGetters = {a:getA,b:getB,c:getC,d:getD,e:getE};
    const letterValue = key => typeof letterGetters[key] === "function" ? letterGetters[key]() : 1;
    const getLevel = key => num(dilation.levels?.[key]);
    const getBHLevel = key => num(blackHole.levels?.[key]);

    // Production multipliers: the exact factors assembled by getGain().
    const integral = window.isIntegralNodePurchased?.() && typeof getIntegralMultiplier === "function"
      ? getIntegralMultiplier() : 1;
    const globalSum = typeof getGlobalSumMultiplier === "function" ? getGlobalSumMultiplier() : 1;
    const lettersProduct = typeof getLetterProduct === "function" ? getLetterProduct() : 1;
    const researchProduction = meta("production") * meta("time");
    const temporalProduction = 1 + 0.1 * getLevel("production") + 0.2 * getBHLevel("production");
    const productionTotal = safeProduct(
      glyphFormula * glyphFormula, integral, globalSum, lettersProduct,
      researchProduction, temporalProduction, treeProduction
    );

    {
      const group = addGroup(root, tr("ПРОИЗВОДСТВО SCORE", "SCORE PRODUCTION"));
      addFactor(group, "t^2", glyphFormula * glyphFormula);
      addFactor(group, "\\text{Integral}", integral);
      addFactor(group, "\\text{Global Sum}", globalSum);
      addFactor(group, "\\text{Letters product}", lettersProduct);
      addFactor(group, "\\text{Other production}", safeProduct(researchProduction, temporalProduction, treeProduction));
      addFactor(group, "\\text{TOTAL}", productionTotal);
    }

    // Letter values: common multiplier, then each letter's final live bonus.
    {
      const group = addGroup(root, tr("БУКВЫ", "LETTERS"));
      addFactor(group, "\\text{All Letters}", letterCommon);
      for (const key of ["a","b","c","d","e"]) {
        const base = Math.max(Number.MIN_VALUE, num(formula[key]));
        addFactor(group, key.toUpperCase(), letterValue(key) / base);
      }
      const gFactor = typeof getGFactor === "function" ? getGFactor() : 1;
      addFactor(group, "G\\;\\to\\;A\\text{--}E", gFactor);
      const fUnlocked = typeof window.isLetterFUnlocked === "function" && window.isLetterFUnlocked() && num(formula.fLevel) > 0;
      const hUnlocked = typeof window.isLetterHUnlocked === "function" && window.isLetterHUnlocked() && num(formula.hLevel) > 0;
      addFactor(group, "F", fUnlocked ? num(formula.f) : 1);
      addFactor(group, "H", hUnlocked ? num(formula.h) : 1);
    }

    // Final cost modifier, including every discount and divisor currently applied.
    {
      const group = addGroup(root, tr("СТОИМОСТЬ УЛУЧШЕНИЙ", "UPGRADE COSTS"));
      const growth = typeof getLetterPriceGrowth === "function" ? getLetterPriceGrowth() : 1;
      const temporalDiscount = Math.pow(0.99875, getLevel("discount")) * Math.pow(0.9975, getBHLevel("discount"));
      addFactor(group, "\\text{Price growth per level}", growth);
      addFactor(group, "\\text{Cost discount}", temporalDiscount / glyphCostDivisor);
    }

    // Research effects shown as their final effective factors.
    {
      const group = addGroup(root, tr("ИССЛЕДОВАНИЯ", "RESEARCH"));
      addFactor(group, "\\text{A--E level efficiency}", meta("efficiency"));
      addFactor(group, "\\text{A--E limit scale}", 1 + 0.01 * num(research[3]));
      addFactor(group, "\\text{A--E dependencies}", meta("coupling"));
      addFactor(group, "\\text{E input}", meta("eInput"));
      addFactor(group, "\\text{Automation}", meta("auto"));
    }

    // Prestige: gains and threshold divisors are kept distinct.
    {
      const group = addGroup(root, tr("ПРЕСТИЖ", "PRESTIGE"));
      const apGain = meta("prestige") * Math.pow(2, treeLevel(1861));
      const apThreshold = (1 + Math.min(25, treeLevel(1924)) * 0.05) *
        (typeof window.getTemporalPrestigeDivisorMultiplier === "function" ? window.getTemporalPrestigeDivisorMultiplier() : 1);
      const gpGain = Math.pow(2, treeLevel(1923));
      const gpThreshold = 2.5 * (1 + Math.min(25, treeLevel(1925)) * 0.05);
      addFactor(group, "\\text{AP gain}", apGain);
      addFactor(group, "\\text{AP threshold divisor}", apThreshold);
      addFactor(group, "\\text{GP gain}", gpGain);
      addFactor(group, "\\text{GP threshold divisor}", gpThreshold);
    }

    // Clock multipliers, separated by the time stream they affect.
    {
      const group = addGroup(root, tr("СКОРОСТЬ ВРЕМЕНИ", "TIME FLOW"));
      const ordinaryTime = (typeof getDilationTimeSpeed === "function" ? getDilationTimeSpeed() : 1) * glyphOrdinary;
      addFactor(group, "t", ordinaryTime);
      addFactor(group, "t_{dl}", glyphDilation);
      addFactor(group, "t_{bl}", glyphDilation);
      if (window.FA_META?.settings?.offline !== false) {
        addFactor(group, "\\text{Offline rate}", 0.35 * ordinaryTime);
      }
    }

    const live = document.createElement("span");
    live.className = "modifier-compact-live";
    live.textContent = tr("Обновление в реальном времени", "Live values");
    root.append(live);
  };

  window.setInterval(() => {
    if (activeTab === "modifiers" && $("menu-statistics")?.classList.contains("active") &&
        $("statistics-modifiers")?.classList.contains("active")) {
      window.refreshModifierStatistics();
    }
  }, 750);

  window.showStatisticsTab("account");
})();