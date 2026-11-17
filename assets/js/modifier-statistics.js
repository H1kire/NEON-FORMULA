// FORMULA ASCENT — live account modifier ledger
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  let activeTab = "account";
  let rowId = 0;
  const isRu = () => window.FA_META?.language === "ru";
  const tr = (ru, en) => isRu() ? ru : en;
  const safe = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const fmt = value => typeof window.format === "function" ? window.format(safe(value)) : String(value);
  const multiplier = value => "\\times\\," + "\\text{" + fmt(value) + "}";
  const percent = value => "\\text{" + (value >= 0 ? "+" : "") + fmt(value * 100) + "\\%}";
  const powerOfTwo = level => Math.pow(2, Math.max(0, safe(level)));
  const hasLevel = value => safe(value) > 0;
  const renderMath = (element, latex) => {
    if (window.FAFormula?.render) window.FAFormula.render(element.id, latex);
    else element.textContent = latex;
  };
  const renderPlainMath = (element, value) => {
    if (window.FAFormula?.renderText) window.FAFormula.renderText(element.id, value);
    else element.textContent = value;
  };
  const addCard = (root, title, category, wide = false) => {
    const card = document.createElement("article");
    card.className = "modifier-card" + (wide ? " wide" : "");
    const head = document.createElement("div");
    head.className = "modifier-card-head";
    const h = document.createElement("h4");
    h.id = "modifierHeading" + (++rowId);
    renderPlainMath(h, title);
    const tag = document.createElement("span");
    tag.id = "modifierCategory" + (++rowId);
    renderPlainMath(tag, category);
    head.append(h, tag);
    card.append(head);
    root.append(card);
    return card;
  };
  const addRow = (card, label, value, options = {}) => {
    const row = document.createElement("div");
    row.className = "modifier-row";
    const rowKey = ++rowId;
    const copy = document.createElement("div");
    copy.className = "modifier-row-label";
    copy.id = "modifierLabel" + rowKey;
    renderPlainMath(copy, label);
    if (options.source) {
      const source = document.createElement("small");
      source.className = "modifier-row-source";
      source.id = "modifierSource" + rowKey;
      renderPlainMath(source, options.source);
      copy.append(source);
    }
    const result = document.createElement("strong");
    result.className = "modifier-row-value";
    result.id = "modifierValue" + rowKey;
    row.append(copy, result);
    card.append(row);
    if (options.currency) {
      if (window.FAFormula?.renderCurrency) window.FAFormula.renderCurrency(result.id, String(value), options.currency);
      else result.textContent = String(value) + " " + options.currency;
    } else if (options.latex) renderMath(result, options.latex);
    else renderPlainMath(result, String(value));
  };
  const addMultiplier = (card, label, value, source) =>
    addRow(card, label, fmt(value), {source, latex: multiplier(value)});
  const addPercent = (card, label, value, source) =>
    addRow(card, label, percent(value), {source, latex: percent(value)});
  const addNumber = (card, label, value, source) =>
    addRow(card, label, fmt(value), {source});
  const empty = (root, message) => {
    const el = document.createElement("div");
    el.className = "modifier-empty";
    el.textContent = message;
    root.append(el);
  };

  window.showStatisticsTab = tab => {
    activeTab = tab === "modifiers" ? "modifiers" : "account";
    document.querySelectorAll("[data-statistics-tab]").forEach(button =>
      button.classList.toggle("active", button.dataset.statisticsTab === activeTab));
    document.querySelectorAll(".statistics-subpage").forEach(page =>
      page.classList.toggle("active", page.id === "statistics-" + activeTab));
    const labels = document.querySelectorAll("[data-statistics-label]");
    labels.forEach(el => {
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
    const title = $("modifierTitle"), kicker = $("modifierKicker"), description = $("modifierDescription");
    if (title) title.textContent = tr("Активные модификаторы", "Active modifiers");
    if (kicker) kicker.textContent = tr("ПОЛНЫЙ СПИСОК ДЕЙСТВУЮЩИХ ЭФФЕКТОВ", "LIVE EFFECT BREAKDOWN");
    if (description) description.textContent = tr(
      "Все действующие бонусы игры, разделённые по источникам и типам влияния.",
      "Every currently active game bonus, separated by source and effect."
    );
    document.querySelectorAll("[data-statistics-label]").forEach(el => {
      el.textContent = el.dataset.statisticsLabel === "account" ? tr("СТАТИСТИКА АККАУНТА", "ACCOUNT STATISTICS") : tr("МОДИФИКАТОРЫ", "MODIFIERS");
    });
    root.replaceChildren();
    rowId = 0;

    const research = window.FA_META?.research || Array(10).fill(0);
    const currentLetterLevels = {a:aLevel,b:bLevel,c:cLevel,d:dLevel,e:eLevel,f:fLevel,g:gLevel,h:hLevel};
    const upgrades = window.prestigeUpgrades || {};
    const dilation = window.TimeDilation?.getState?.();
    const blackHole = window.BlackHole?.getState?.();
    const glyph = window.getGlyphBonuses?.() || {entries:[]};
    const formulaDetails = window.FAMathSystem?.getState?.() || {};
    const treeProduction = typeof window.treeProductionMultiplier === "function" ? window.treeProductionMultiplier() : 1;
    const nodeLevel = id => typeof window.getTreeNodeLevel === "function" ? window.getTreeNodeLevel(id) : 0;
    const unlockedIntegral = !!window.isIntegralNodePurchased?.();
    const glyphFormula = typeof window.getGlyphFormulaTimeMultiplier === "function" ? window.getGlyphFormulaTimeMultiplier() : 1;
    const glyphOrdinary = typeof window.getGlyphOrdinaryTimeMultiplier === "function" ? window.getGlyphOrdinaryTimeMultiplier() : 1;
    const glyphDilation = typeof window.getGlyphDilationTimeMultiplier === "function" ? window.getGlyphDilationTimeMultiplier() : 1;
    const glyphCostDivisor = typeof window.getGlyphCostDivisor === "function" ? window.getGlyphCostDivisor() : 1;
    const glyphLetter = typeof window.getGlyphLetterValueMultiplier === "function" ? window.getGlyphLetterValueMultiplier() : 1;
    const glyphSum = typeof window.getGlyphGlobalSumPercent === "function" ? window.getGlyphGlobalSumPercent() : 0;
    const researchBonus = key => typeof window.getMetaBonus === "function" ? window.getMetaBonus(key) : 1;
    const addIf = (card, condition, fn) => { if (condition) fn(); };

    // Production formula: preserve the exact order and independent factors used by getGain().
    {
      const card = addCard(root, tr("Производство Score", "Score production"), "f(t)");
      addRow(card, tr("Базовая временная часть", "Base time term"), fmt(safe(t) ** 2), {latex:"t^2"});
      if (glyphFormula !== 1) addMultiplier(card, tr("Влияние времени в формуле (дважды)", "Formula time influence (applied twice)"), glyphFormula ** 2, "GLYPH");
      if (unlockedIntegral) addMultiplier(card, tr("Интегральный множитель", "Integral multiplier"), typeof window.getIntegralMultiplier === "function" ? window.getIntegralMultiplier() : 1, "GENESIS CORE + AP UPGRADES");
      if (hasLevel(upgrades.globalSum)) addMultiplier(card, tr("Global Sum", "Global Sum"), typeof window.getGlobalSumMultiplier === "function" ? window.getGlobalSumMultiplier() : 1, "AP UPGRADES + TEMPORAL + GLYPH");
      if (typeof window.getLetterProduct === "function") addMultiplier(card, tr("Произведение активных букв", "Active letter product"), window.getLetterProduct(), "A–H");
      if (researchBonus("production") !== 1) addMultiplier(card, tr("Исследование: Quantum Multiplier", "Research: Quantum Multiplier"), researchBonus("production"), "RESEARCH");
      if (researchBonus("time") !== 1) addMultiplier(card, tr("Исследование: Temporal Core", "Research: Temporal Core"), researchBonus("time"), "RESEARCH");
      const dilationProduction = 1 + 0.1 * safe(dilation?.levels?.production);
      if (dilationProduction !== 1) addMultiplier(card, tr("Time Dilation: производство", "Time Dilation: production"), dilationProduction, "DILATION UPGRADES");
      const blackHoleProduction = 1 + 0.2 * safe(blackHole?.levels?.production);
      if (blackHoleProduction !== 1) addMultiplier(card, tr("Black Hole: производство", "Black Hole: production"), blackHoleProduction, "BLACK HOLE UPGRADES");
      if (treeProduction !== 1) addMultiplier(card, tr("Общий множитель Древа", "Upgrade Tree production"), treeProduction, "GENESIS TREE");
      if (card.querySelectorAll(".modifier-row").length === 1) empty(card, tr("Кроме базового члена времени дополнительных множителей производства пока нет.", "No additional production modifiers are active beyond the base time term."));
    }

    // Letter values and formula research.
    {
      const card = addCard(root, tr("Значения букв и формулы", "Letter values and formulas"), "A–H");
      const apLetter = 1 + 0.001 * safe(upgrades.letterValueBoost);
      const dilationLetter = 1 + 0.005 * safe(dilation?.levels?.letters);
      const blackHoleLetter = 1 + 0.01 * safe(blackHole?.levels?.letters);
      if (apLetter !== 1) addMultiplier(card, tr("Усиление букв за AP", "AP letter amplification"), apLetter, "AP UPGRADE");
      if (dilationLetter !== 1) addMultiplier(card, tr("Усиление букв от Time Dilation", "Time Dilation letter values"), dilationLetter, "DILATION UPGRADES");
      if (blackHoleLetter !== 1) addMultiplier(card, tr("Усиление букв от Black Hole", "Black Hole letter values"), blackHoleLetter, "BLACK HOLE UPGRADES");
      if (glyphLetter !== 1) addMultiplier(card, tr("Усиление букв от глифа", "Glyph letter values"), glyphLetter, "EQUIPPED GLYPH");
      if (researchBonus("efficiency") !== 1) addMultiplier(card, tr("Эффективность уровней букв", "Letter level efficiency"), researchBonus("efficiency"), "RESEARCH");
      if (researchBonus("coupling") !== 1) addMultiplier(card, tr("Взаимные зависимости букв", "Cross-letter dependencies"), researchBonus("coupling"), "RESEARCH");
      if (researchBonus("eInput") !== 1) addMultiplier(card, tr("Входное значение E", "Letter E input"), researchBonus("eInput"), "RESEARCH");
      if (researchBonus("limitExpansion") !== 1) addMultiplier(card, tr("Расширение пределов параметров", "Parameter limit expansion"), 1 + 0.01 * researchBonus("limitExpansion"), "RESEARCH");
      if (typeof window.getLetterParameters === "function") {
        const params = window.getLetterParameters();
        for (const key of ["a","b","c","d","e"]) {
          const value = params[key];
          const label = tr("Текущий параметр ", "Current parameter ") + key.toUpperCase();
          addNumber(card, label, value, "LETTER LEVEL " + safe(currentLetterLevels[key]));
        }
      }
      for (const [key, id] of [["f","fLevel"],["g","gLevel"],["h","hLevel"]]) {
        if (document.getElementById(id) && $(id)?.closest(".upgrade") && !$(id).closest(".upgrade").hidden) {
          addNumber(card, tr("Уровень буквы ", "Letter level ") + key.toUpperCase(), safe(currentLetterLevels[key]), "UNLOCKED MODULE");
        }
      }
      if (safe(currentLetterLevels.f) > 0 && !$("letterFUpgrade")?.hidden) {
        addNumber(card, tr("Показатель степени F", "Letter F exponent"), formulaDetails.fExponent, "LETTER F");
        addMultiplier(card, tr("Текущий множитель F", "Current Letter F multiplier"), formulaDetails.f || 1, "LETTER F · ACTIVATES AT t ≥ 5");
      }
      if (safe(currentLetterLevels.g) > 0 && !$("letterGUpgrade")?.hidden) {
        addMultiplier(card, tr("Общий множитель от G", "Global multiplier from G"), typeof window.getGFactor === "function" ? window.getGFactor() : 1, "LETTER G");
        addNumber(card, tr("Текущая добавка G", "Current G additive value"), formulaDetails.g, "LETTER G");
      }
      if (safe(currentLetterLevels.h) > 0 && !$("letterHUpgrade")?.hidden) {
        addNumber(card, tr("Основание степени H", "Letter H exponent base"), formulaDetails.hBase, "LETTER H");
        addNumber(card, tr("Показатель степени H", "Letter H exponent"), formulaDetails.hExponent, "LETTER H");
        addMultiplier(card, tr("Текущий множитель H", "Current Letter H multiplier"), formulaDetails.h || 1, "LETTER H");
      }
      if (!card.querySelector(".modifier-row")) empty(card, tr("Дополнительные усиления букв пока не активны.", "No additional letter modifiers are active."));
    }

    // Letter purchase price modifiers.
    {
      const card = addCard(root, tr("Стоимость улучшений букв", "Letter upgrade costs"), "ECONOMY");
      const exponentReduction = Math.min(0.99, Math.max(0, 0.001 * safe(research[1])));
      const baseReduction = Math.min(0.5, Math.max(0, 0.0001 * safe(research[2])));
      const priceExponent = Math.max(0.03, 3 * (1 - exponentReduction));
      const priceBase = Math.max(1, 2 * (1 - baseReduction));
      const dilationDiscount = Math.pow(0.99875, safe(dilation?.levels?.discount));
      const blackHoleDiscount = Math.pow(0.9975, safe(blackHole?.levels?.discount));
      const temporalDiscount = dilationDiscount * blackHoleDiscount;
      if (exponentReduction > 0) addPercent(card, tr("Снижение показателя роста цены", "Price growth exponent reduction"), -exponentReduction, "RESEARCH");
      if (baseReduction > 0) addPercent(card, tr("Снижение основания роста цены", "Price growth base reduction"), -baseReduction, "RESEARCH");
      addNumber(card, tr("Итоговое основание роста цены", "Final price growth base"), priceBase, "RESEARCH");
      addNumber(card, tr("Итоговый показатель степени цены", "Final price growth exponent"), priceExponent, "RESEARCH");
      addMultiplier(card, tr("Рост цены за уровень", "Price growth per level"), typeof window.getLetterPriceGrowth === "function" ? window.getLetterPriceGrowth() : Math.pow(priceBase, priceExponent), "RESEARCH");
      if (glyphCostDivisor !== 1) addRow(card, tr("Делитель стоимости от глифа", "Glyph cost divisor"), fmt(glyphCostDivisor), {source:"EQUIPPED GLYPH", latex:"\\div\\," + "\\text{" + fmt(glyphCostDivisor) + "}"});
      if (dilationDiscount !== 1) addMultiplier(card, tr("Скидка от Time Dilation", "Time Dilation discount"), dilationDiscount, "DILATION UPGRADES");
      if (blackHoleDiscount !== 1) addMultiplier(card, tr("Скидка от Black Hole", "Black Hole discount"), blackHoleDiscount, "BLACK HOLE UPGRADES");
      if (temporalDiscount !== 1) addMultiplier(card, tr("Совокупная временная скидка", "Combined temporal discount"), temporalDiscount, "TIME DILATION × BLACK HOLE");
      const finalCostFactor = temporalDiscount / glyphCostDivisor;
      if (finalCostFactor !== 1) addMultiplier(card, tr("Итоговый множитель стоимости", "Final letter cost factor"), finalCostFactor, "ALL COST MODIFIERS");
      if (!card.querySelector(".modifier-row")) empty(card, tr("Снижения стоимости пока не активны.", "No letter cost reductions are active."));
    }

    // Global Sum and Integral internals.
    {
      const card = addCard(root, tr("Global Sum и Integral", "Global Sum and Integral"), "FORMULA");
      if (hasLevel(upgrades.globalSum)) addNumber(card, tr("Уровень Global Sum (дополнительные члены)", "Global Sum level (additional terms)"), upgrades.globalSum, "AP UPGRADE");
      if (hasLevel(upgrades.simpleBoost)) addMultiplier(card, tr("Вес каждого дополнительного члена", "Weight of each additional term"), 1 + 0.25 * safe(upgrades.simpleBoost), "AP UPGRADE");
      if (hasLevel(upgrades.integralSumCoefficient)) addNumber(card, tr("Коэффициент интеграла и суммы", "Integral and Sum coefficient"), 1 + safe(upgrades.integralSumCoefficient), "AP UPGRADE");
      const dilationSum = 1 + 0.01 * safe(dilation?.levels?.sum);
      const blackHoleSum = 1 + 0.02 * safe(blackHole?.levels?.sum);
      if (dilationSum !== 1) addMultiplier(card, tr("Дополнительный вес от Time Dilation", "Additional weight from Time Dilation"), dilationSum, "DILATION UPGRADES");
      if (blackHoleSum !== 1) addMultiplier(card, tr("Дополнительный вес от Black Hole", "Additional weight from Black Hole"), blackHoleSum, "BLACK HOLE UPGRADES");
      if (glyphSum > 0) addPercent(card, tr("Бонус Global Sum от глифа", "Glyph Global Sum bonus"), glyphSum, "EQUIPPED GLYPH");
      if (hasLevel(upgrades.globalSum)) addNumber(card, tr("Итоговый дополнительный вес", "Final additional term weight"), typeof window.getGlobalSumAdditionalWeight === "function" ? window.getGlobalSumAdditionalWeight() : 0, "LIVE CALCULATION");
      if (hasLevel(upgrades.globalSum)) addMultiplier(card, tr("Итоговый множитель Global Sum", "Final Global Sum multiplier"), typeof window.getGlobalSumMultiplier === "function" ? window.getGlobalSumMultiplier() : 1, "LIVE CALCULATION");
      if (unlockedIntegral) addMultiplier(card, tr("Итоговый множитель Integral", "Final Integral multiplier"), typeof window.getIntegralMultiplier === "function" ? window.getIntegralMultiplier() : 1, "GENESIS CORE");
      if (!card.querySelector(".modifier-row")) empty(card, tr("Global Sum и Integral ещё не имеют активных улучшений.", "Global Sum and Integral have no active upgrades yet."));
    }

    // AP and GP prestige multipliers and threshold modifiers.
    {
      const card = addCard(root, tr("Престиж: AP и GP", "Prestige: AP and GP"), "PRESTIGE");
      const apThresholdLevel = nodeLevel(1924), gpThresholdLevel = nodeLevel(1925);
      const apTreeLevel = nodeLevel(1861), gpTreeLevel = nodeLevel(1923);
      const dilationThreshold = 1 + 0.001 * safe(dilation?.levels?.prestige);
      const blackHoleThreshold = 1 + 0.002 * safe(blackHole?.levels?.prestige);
      const temporalThreshold = dilationThreshold * blackHoleThreshold;
      const apTreeThreshold = 1 + Math.min(25, apThresholdLevel) * 0.05;
      const gpTreeThreshold = 1 + Math.min(25, gpThresholdLevel) * 0.05;
      if (researchBonus("prestige") !== 1) addMultiplier(card, tr("Получение AP от Research", "AP gain from Research"), researchBonus("prestige"), "RESEARCH");
      if (apTreeThreshold !== 1) addMultiplier(card, tr("Делитель порога AP от Древа", "AP threshold divisor from Tree"), apTreeThreshold, "GENESIS TREE");
      if (dilationThreshold !== 1) addMultiplier(card, tr("Делитель порога AP от Time Dilation", "AP threshold divisor from Time Dilation"), dilationThreshold, "DILATION UPGRADES");
      if (blackHoleThreshold !== 1) addMultiplier(card, tr("Делитель порога AP от Black Hole", "AP threshold divisor from Black Hole"), blackHoleThreshold, "BLACK HOLE UPGRADES");
      if (temporalThreshold !== 1) addMultiplier(card, tr("Совокупный временной делитель порога AP", "Combined temporal AP threshold divisor"), temporalThreshold, "TIME DILATION × BLACK HOLE");
      if (apTreeLevel > 0) addMultiplier(card, tr("Множитель получения AP от Древа", "AP gain multiplier from Tree"), powerOfTwo(apTreeLevel), "GENESIS TREE");
      if (gpTreeThreshold !== 1) addMultiplier(card, tr("Делитель порога GP от Древа", "GP threshold divisor from Tree"), gpTreeThreshold, "GENESIS TREE");
      addNumber(card, tr("Итоговый делитель порога AP", "Final AP threshold divisor"), apTreeThreshold * temporalThreshold, "BASE × TREE × TEMPORAL");
      addNumber(card, tr("Итоговый делитель порога GP", "Final GP threshold divisor"), 2.5 * gpTreeThreshold, "BASE 2.5 × GENESIS TREE");
      if (gpTreeLevel > 0) addMultiplier(card, tr("Множитель получения GP от Древа", "GP gain multiplier from Tree"), powerOfTwo(gpTreeLevel), "GENESIS TREE");
      if (typeof window.getPrestigeGain === "function") addRow(card, tr("Доступное получение AP сейчас", "AP currently available to gain"), fmt(window.getPrestigeGain()), {currency:"\\mathrm{AP}", source:"CURRENT SCORE"});
      if (typeof window.getGenesisGain === "function" && window.FA_META?.treePassPurchased) addRow(card, tr("Доступное получение GP сейчас", "GP currently available to gain"), fmt(window.getGenesisGain()), {currency:"\\mathrm{GP}", source:"CURRENT AP"});
      if (!card.querySelector(".modifier-row")) empty(card, tr("Бонусы престижа пока не активны.", "No prestige modifiers are active yet."));
    }

    // Time systems, keeping ordinary time, Dilation time and Black Hole time separate.
    {
      const card = addCard(root, tr("Временные потоки", "Time flow systems"), "TIME");
      const dilationTau = 1 + 0.05 * safe(dilation?.levels?.tau);
      const blackHoleTau = 1 + 0.05 * safe(blackHole?.levels?.tau);
      if (dilationTau !== 1) addMultiplier(card, tr("Скорость обычного времени от Time Dilation", "Ordinary time speed from Time Dilation"), dilationTau, "DILATION UPGRADE · τ");
      if (blackHoleTau !== 1) addMultiplier(card, tr("Скорость обычного времени от Black Hole", "Ordinary time speed from Black Hole"), blackHoleTau, "BLACK HOLE UPGRADE · τ");
      if (glyphOrdinary !== 1) addMultiplier(card, tr("Скорость обычного времени от глифа", "Ordinary time speed from Glyph"), glyphOrdinary, "EQUIPPED GLYPH");
      if (glyphDilation !== 1) addMultiplier(card, tr("Накопление нестандартного времени от глифа", "Non-standard time accumulation from Glyph"), glyphDilation, "EQUIPPED GLYPH");
      if (window.FA_META?.settings?.offline !== false) {
        addMultiplier(card, tr("Скорость офлайн-прогресса", "Offline progress rate"), 0.35, "GAME RULE · MAXIMUM 8 HOURS");
        addNumber(card, tr("Максимальное учитываемое отсутствие", "Maximum offline duration"), "8 h", "OFFLINE PROGRESSION");
      }
      if (researchBonus("time") !== 1) addMultiplier(card, tr("Бонус временного производства", "Time-based production bonus"), researchBonus("time"), "RESEARCH · PRODUCTION, NOT CLOCK SPEED");
      if (!card.querySelector(".modifier-row")) empty(card, tr("Дополнительных ускорителей времени пока нет.", "No additional time-flow modifiers are active."));
    }

    // Research modifiers not already represented by a dedicated subsystem.
    {
      const card = addCard(root, tr("Исследовательский центр", "Research Division"), "RESEARCH");
      const researchRows = [
        [0, "efficiency", tr("Математическая эффективность", "Mathematical Efficiency"), researchBonus("efficiency")],
        [3, "limitExpansion", tr("Расширение пределов", "Parameter limit expansion"), researchBonus("limitExpansion")],
        [4, "coupling", tr("Резонанс зависимостей", "Dependency Resonance"), researchBonus("coupling")],
        [5, "eInput", tr("Логарифмический вход E", "Logarithmic input of E"), researchBonus("eInput")],
        [7, "auto", tr("Эффективность автоматизации", "Automation efficiency"), researchBonus("auto")],
        [8, "production", tr("Общее производство", "Total production"), researchBonus("production")],
        [9, "prestige", tr("Получение AP", "AP gain"), researchBonus("prestige")]
      ];
      for (const [index, key, label, value] of researchRows) {
        if (hasLevel(research[index])) addMultiplier(card, label, value, tr("Уровень ", "LEVEL ") + research[index]);
      }
      if (!card.querySelector(".modifier-row")) empty(card, tr("Исследовательские бонусы ещё не приобретены.", "No Research Division bonuses have been purchased."));
    }

    // White Hole / Time Dilation parameters and research levels.
    if (dilation?.unlocked) {
      const card = addCard(root, tr("Белая дыра: параметры", "White Hole: parameters"), "TIME DILATION");
      for (const key of ["i","v","k"]) addNumber(card, tr("Текущий параметр ", "Current parameter ") + key, dilation.parameters[key], "DILATION LEVEL " + safe(dilation.levels[key]));
      addNumber(card, tr("Параметр временного потока τ", "Temporal flow parameter τ"), dilation.parameters.tau, "DILATION LEVEL " + safe(dilation.levels.tau));
      const parameterBoost = 1 + 0.001 * safe(dilation.levels.parameters);
      if (parameterBoost !== 1) addMultiplier(card, tr("Резонанс параметров i, v и k", "i, v and k parameter resonance"), parameterBoost, "DILATION UPGRADES");
      for (const key of ["sum","letters","discount","production","prestige"]) {
        if (hasLevel(dilation.levels[key])) addNumber(card, tr("Уровень улучшения ", "Upgrade level ") + key, dilation.levels[key], "DILATION UPGRADES");
      }
    }

    // Black Hole parameters and the exponent used by its conversion reward.
    if (blackHole?.unlocked) {
      const card = addCard(root, tr("Чёрная дыра: параметры", "Black Hole: parameters"), "BLACK HOLE");
      for (const key of ["q","s","w"]) addNumber(card, tr("Текущий параметр ", "Current parameter ") + key, blackHole.parameters[key], "BLACK HOLE LEVEL " + safe(blackHole.levels[key]));
      const parameterBoost = 1 + 0.002 * safe(blackHole.levels.parameters);
      if (parameterBoost !== 1) addMultiplier(card, tr("Резонанс параметров q, s и w", "q, s and w parameter resonance"), parameterBoost, "BLACK HOLE UPGRADES");
      if (safe(blackHole.p) > 0) addNumber(card, tr("Показатель степени p", "Exponent p"), blackHole.p, "p = 0.85L");
      const researchL = 1 + 0.1 * safe(window.getBlackHoleResearchLevel?.());
      if (researchL !== 1) addMultiplier(card, tr("Усиление L от исследования", "Research enhancement of L"), researchL, "BLACK HOLE RESEARCH");
      for (const key of ["sum","letters","discount","production","prestige"]) {
        if (hasLevel(blackHole.levels[key])) addNumber(card, tr("Уровень улучшения ", "Upgrade level ") + key, blackHole.levels[key], "BLACK HOLE UPGRADES");
      }
    }

    // Automation status and its research efficiency.
    {
      const card = addCard(root, tr("Автоматизация", "Automation"), "AUTOMATION");
      const automation = window.FA_META?.automation || {};
      const unlocked = (automation.unlocked || []).filter(Boolean).length;
      const enabled = (automation.unlocked || []).filter((value, index) => value && automation.enabled?.[index] !== false).length;
      if (researchBonus("auto") !== 1) addMultiplier(card, tr("Эффективность автоматических покупок", "Automatic purchase efficiency"), researchBonus("auto"), "RESEARCH");
      addNumber(card, tr("Открыто модулей", "Modules unlocked"), unlocked, "AUTOMATION");
      addNumber(card, tr("Активно модулей", "Modules enabled"), enabled, "AUTOMATION");
      addRow(card, tr("Общая пауза", "Global pause"), automation.paused ? tr("Включена", "ON") : tr("Выключена", "OFF"));
    }

    // The exact aggregated equipped-glyph effects, using the existing glyph effect calculator.
    {
      const card = addCard(root, tr("Активные эффекты глифа", "Active Glyph effects"), "EQUIPPED GLYPH");
      const entries = Array.isArray(glyph.entries) ? glyph.entries : [];
      for (const entry of entries) {
        let latex = "";
        const value = String(entry.value || "");
        if (value.startsWith("×")) latex = "\\times\\," + "\\text{" + value.slice(1) + "}";
        else if (value.startsWith("÷")) latex = "\\div\\," + "\\text{" + value.slice(1) + "}";
        else if (value.startsWith("−")) latex = "-\\text{" + value.slice(1).replace("%","") + "}\\%";
        else if (value.startsWith("+")) latex = "+\\text{" + value.slice(1).replace("%","") + "}\\%";
        addRow(card, entry.name || entry.id, value, {source:"AION", latex:latex || undefined});
      }
      if (!entries.length) empty(card, tr("Экипированный глиф отсутствует или не даёт активных бонусов.", "No equipped glyph or no active glyph bonuses."));
    }

    const note = document.createElement("p");
    note.className = "modifier-note";
    note.textContent = tr(
      "Значения обновляются в реальном времени. Нулевые и неактивные бонусы скрыты; параметры систем показываются отдельно от множителей.",
      "Values update live. Inactive bonuses are hidden; system parameters are listed separately from multipliers."
    );
    root.append(note);
  };

  // Keep the ledger current while it is visible without doing needless work on other pages.
  window.setInterval(() => {
    if (activeTab === "modifiers" && $("menu-statistics")?.classList.contains("active") &&
        $("statistics-modifiers")?.classList.contains("active")) {
      window.refreshModifierStatistics();
    }
  }, 750);

  window.showStatisticsTab("account");
})();