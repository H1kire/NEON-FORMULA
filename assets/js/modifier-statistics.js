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
  const sourceLabel = source => {
    const labels = {
      GLYPH:tr("Источник: экипированный глиф","Source: equipped Glyph"),
      RESEARCH:tr("Источник: Исследовательский центр","Source: Research Division"),
      "AP UPGRADE":tr("Источник: улучшения за AP","Source: AP upgrades"),
      "AP UPGRADES + TEMPORAL + GLYPH":tr("Источники: улучшения за AP, временные улучшения и глиф","Sources: AP upgrades, temporal upgrades and Glyph"),
      "GENESIS TREE":tr("Источник: Древо Генезиса","Source: Genesis Tree"),
      "DILATION UPGRADES":tr("Источник: улучшения Time Dilation","Source: Time Dilation upgrades"),
      "BLACK HOLE UPGRADES":tr("Источник: улучшения Black Hole","Source: Black Hole upgrades"),
      "EQUIPPED GLYPH":tr("Источник: экипированный глиф","Source: equipped Glyph"),
      "ACTIVE LETTER":tr("Источник: активная буква","Source: active letter"),
      "LIVE CALCULATION":tr("Источник: итоговый расчёт игровой формулы","Source: final live game calculation"),
      "GENESIS CORE":tr("Источник: узел Genesis Core","Source: Genesis Core node"),
      "GENESIS CORE + AP UPGRADES":tr("Источники: узел Genesis Core и улучшения за AP","Sources: Genesis Core node and AP upgrades"),
      "ALL COST MODIFIERS":tr("Состав: все скидки и делители стоимости улучшений букв","Components: all letter-upgrade cost discounts and divisors"),
      "TIME DILATION × BLACK HOLE":tr("Источники: Time Dilation и Black Hole","Sources: Time Dilation and Black Hole"),
      "BASE × TREE × TEMPORAL":tr("Состав: базовое значение × узел Древа × временные улучшения","Components: base value × Tree node × temporal upgrades"),
      "BASE 2.5 × GENESIS TREE":tr("Состав: базовый делитель 2,5 × узел GP Threshold","Components: base divisor 2.5 × GP Threshold node"),
      "DILATION UPGRADE · τ":tr("Источник: улучшение τ системы Time Dilation","Source: Time Dilation τ upgrade"),
      "BLACK HOLE UPGRADE · τ":tr("Источник: улучшение τ системы Black Hole","Source: Black Hole τ upgrade"),
      "TIME DILATION × BLACK HOLE × GLYPH":tr("Состав: Time Dilation τ × Black Hole τ × множитель времени глифа","Components: Time Dilation τ × Black Hole τ × Glyph time multiplier"),
      "OFFLINE PROGRESSION":tr("Правило офлайн-прогресса","Offline progression rule"),
      "GAME RULE · MAXIMUM 8 HOURS":tr("Правило игры: учитывается не более 8 часов отсутствия","Game rule: at most 8 hours away are counted"),
      "RESEARCH · PRODUCTION, NOT CLOCK SPEED":tr("Источник: Temporal Core; влияет на производство, а не на скорость часов","Source: Temporal Core; affects production, not clock speed"),
      "ADDITIVE BONUS":tr("Состав: базовое значение плюс сумма бонусов","Components: base value plus the sum of bonuses"),
      "BLACK HOLE RESEARCH":tr("Источник: исследование Black Hole, повышающее L","Source: Black Hole research, which increases L"),
      "AUTOMATION":tr("Состояние модулей автоматизации","Automation module status"),
      "UNLOCKED MODULE":tr("Источник: открытый модуль буквы","Source: unlocked letter module"),
      "LETTER F":tr("Источник: формула буквы F","Source: Letter F formula"),
      "LETTER F · ACTIVATES AT t ≥ 5":tr("Источник: формула F; до t ≥ 5 множитель равен 1","Source: Letter F formula; multiplier stays at 1 until t ≥ 5"),
      "LETTER G":tr("Источник: формула буквы G; усиливает значения A–E","Source: Letter G formula; amplifies A–E values"),
      "LETTER H":tr("Источник: формула буквы H","Source: Letter H formula"),
      "A–H":tr("В произведение входят A–F и H; буква G усиливает A–E отдельно","The product includes A–F and H; letter G separately amplifies A–E"),
      "p = 0.85L":tr("Формула: показатель преобразования p равен 0,85 × L","Formula: conversion exponent p equals 0.85 × L")
    };
    if (labels[source]) return labels[source];
    if (source?.startsWith("LETTER LEVEL ")) return tr("Текущий уровень улучшения параметра буквы: ","Current letter parameter upgrade level: ") + source.slice(13);
    if (source?.startsWith("DILATION LEVEL ")) return tr("Уровень улучшения параметра Белой дыры: ","White Hole parameter upgrade level: ") + source.slice(15);
    if (source?.startsWith("BLACK HOLE LEVEL ")) return tr("Уровень улучшения параметра Чёрной дыры: ","Black Hole parameter upgrade level: ") + source.slice(17);
    if (source?.startsWith("RESEARCH #")) return tr("Источник: исследование ","Source: Research ") + source.slice(10);
    return source ? tr("Источник: ","Source: ") + source : "";
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
      renderPlainMath(source, sourceLabel(options.source));
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
    addRow(card, label, typeof value === "number" ? fmt(value) : String(value), {source});
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
      if (glyphFormula !== 1) addMultiplier(card, tr("Множитель глифа, применяемый дважды к временному члену t²", "Glyph multiplier applied twice to the time term t²"), glyphFormula ** 2, "GLYPH");
      if (unlockedIntegral) addMultiplier(card, tr("Множитель Integral, который умножает производство Score", "Integral multiplier applied to Score production"), typeof window.getIntegralMultiplier === "function" ? window.getIntegralMultiplier() : 1, "GENESIS CORE + AP UPGRADES");
      if (hasLevel(upgrades.globalSum)) addMultiplier(card, tr("Множитель Global Sum, который применяется к производству Score", "Global Sum multiplier applied to Score production"), typeof window.getGlobalSumMultiplier === "function" ? window.getGlobalSumMultiplier() : 1, "AP UPGRADES + TEMPORAL + GLYPH");
      if (typeof window.getLetterProduct === "function") addMultiplier(card, tr("Произведение активных букв A–F и H (G усиливает A–E отдельно)", "Product of active letters A–F and H (G separately amplifies A–E)"), window.getLetterProduct(), "A–H");
      if (researchBonus("production") !== 1) addMultiplier(card, tr("Множитель общего производства Score от Quantum Multiplier", "Score-production multiplier from Quantum Multiplier"), researchBonus("production"), "RESEARCH");
      if (researchBonus("time") !== 1) addMultiplier(card, tr("Множитель временной составляющей производства Score от Temporal Core", "Time-dependent Score-production multiplier from Temporal Core"), researchBonus("time"), "RESEARCH");
      const researchProduction = researchBonus("production") * researchBonus("time");
      if (researchProduction !== 1) addMultiplier(card, tr("Совокупный множитель исследований к производству Score", "Combined Research multiplier to Score production"), researchProduction, tr("Quantum Multiplier × Temporal Core", "Quantum Multiplier × Temporal Core"));
      const dilationProductionBonus = 0.1 * safe(dilation?.levels?.production);
      const blackHoleProductionBonus = 0.2 * safe(blackHole?.levels?.production);
      if (dilationProductionBonus > 0) addPercent(card, tr("Добавка к производству Score от Time Dilation", "Additive Score-production bonus from Time Dilation"), dilationProductionBonus, "DILATION UPGRADES");
      if (blackHoleProductionBonus > 0) addPercent(card, tr("Добавка к производству Score от Black Hole", "Additive Score-production bonus from Black Hole"), blackHoleProductionBonus, "BLACK HOLE UPGRADES");
      const temporalProduction = 1 + dilationProductionBonus + blackHoleProductionBonus;
      if (temporalProduction !== 1) addMultiplier(card, tr("Совокупный временной множитель производства Score", "Combined temporal multiplier to Score production"), temporalProduction, tr("Базовый множитель 1 + бонус Time Dilation + бонус Black Hole", "Base factor 1 + Time Dilation bonus + Black Hole bonus"));
      if (researchProduction * temporalProduction !== 1) addMultiplier(card, tr("Итоговый множитель исследований и временных улучшений к производству Score", "Final Research and temporal-upgrade multiplier to Score production"), researchProduction * temporalProduction, tr("Исследования перемножаются; бонусы Time Dilation и Black Hole складываются", "Research factors multiply; Time Dilation and Black Hole bonuses add"));
      if (treeProduction !== 1) addMultiplier(card, tr("Общий множитель производства Score от активных узлов Древа", "Score-production multiplier from active Upgrade Tree nodes"), treeProduction, "GENESIS TREE");
      if (card.querySelectorAll(".modifier-row").length === 1) empty(card, tr("Кроме базового члена времени дополнительных множителей производства пока нет.", "No additional production modifiers are active beyond the base time term."));
    }

    // Letter values and formula research.
    {
      const card = addCard(root, tr("Значения букв и формулы", "Letter values and formulas"), "A–H");
      const apLetter = 1 + 0.001 * safe(upgrades.letterValueBoost);
      const dilationLetter = 1 + 0.005 * safe(dilation?.levels?.letters);
      const blackHoleLetter = 1 + 0.01 * safe(blackHole?.levels?.letters);
      if (apLetter !== 1) addMultiplier(card, tr("Множитель значений активных букв от улучшения за AP", "Active-letter value multiplier from the AP upgrade"), apLetter, "AP UPGRADE");
      if (dilationLetter !== 1) addMultiplier(card, tr("Множитель значений активных букв от Time Dilation", "Active-letter value multiplier from Time Dilation"), dilationLetter, "DILATION UPGRADES");
      if (blackHoleLetter !== 1) addMultiplier(card, tr("Множитель значений активных букв от Black Hole", "Active-letter value multiplier from Black Hole"), blackHoleLetter, "BLACK HOLE UPGRADES");
      if (glyphLetter !== 1) addMultiplier(card, tr("Усиление букв от глифа", "Glyph letter values"), glyphLetter, "EQUIPPED GLYPH");
      if (researchBonus("efficiency") !== 1) addMultiplier(card, tr("Множитель эффективности уровней букв: усиливает влияние каждого купленного уровня на параметры A–E", "Letter-level efficiency multiplier: increases the effect of each purchased level on A–E parameters"), researchBonus("efficiency"), "RESEARCH");
      if (researchBonus("coupling") !== 1) addMultiplier(card, tr("Множитель взаимных зависимостей в формулах обновления A–E", "Cross-letter dependency multiplier in the A–E update formulas"), researchBonus("coupling"), "RESEARCH");
      if (researchBonus("eInput") !== 1) addMultiplier(card, tr("Множитель логарифмического входа, используемого при расчёте E", "Multiplier for the logarithmic input used to calculate E"), researchBonus("eInput"), "RESEARCH");
      if (researchBonus("limitExpansion") > 0) addMultiplier(card, tr("Масштаб расширения пределов параметров A–E", "A–E parameter-limit expansion scale"), 1 + 0.01 * researchBonus("limitExpansion"), tr("Делители параметров уменьшаются, показатели степени увеличиваются", "Parameter divisors decrease; exponents increase"));
      if (typeof window.getLetterParameters === "function") {
        const params = window.getLetterParameters();
        for (const key of ["a","b","c","d","e"]) {
          const value = params[key];
          const label = tr("Текущий параметр ", "Current parameter ") + key.toUpperCase();
          addNumber(card, label, value, "LETTER LEVEL " + safe(currentLetterLevels[key]));
        }
        const liveLetters = {a:getA(),b:getB(),c:getC(),d:getD(),e:getE()};
        for (const key of ["a","b","c","d","e"]) {
          if (safe(currentLetterLevels[key]) > 0) {
            addMultiplier(card, tr("Итоговое значение буквы ", "Final value of letter ") + key.toUpperCase(), liveLetters[key], "ACTIVE LETTER");
          }
        }
      }
      for (const [key, id] of [["f","fLevel"],["g","gLevel"],["h","hLevel"]]) {
        if (document.getElementById(id) && $(id)?.closest(".upgrade") && !$(id).closest(".upgrade").hidden) {
          addNumber(card, tr("Уровень буквы ", "Letter level ") + key.toUpperCase(), safe(currentLetterLevels[key]), "UNLOCKED MODULE");
        }
      }
      if (safe(currentLetterLevels.f) > 0 && !$("letterFUpgrade")?.hidden) {
        addNumber(card, tr("Показатель степени F", "Letter F exponent"), formulaDetails.fExponent, "LETTER F");
        addMultiplier(card, tr("Множитель F, непосредственно умножающий производство Score", "F multiplier applied directly to Score production"), formulaDetails.f || 1, "LETTER F · ACTIVATES AT t ≥ 5");
      }
      if (safe(currentLetterLevels.g) > 0 && !$("letterGUpgrade")?.hidden) {
        addMultiplier(card, tr("Множитель G, применяемый к значениям букв A–E", "G multiplier applied to the values of letters A–E"), typeof window.getGFactor === "function" ? window.getGFactor() : 1, "LETTER G");
        addNumber(card, tr("Текущая добавка G", "Current G additive value"), formulaDetails.g, "LETTER G");
      }
      if (safe(currentLetterLevels.h) > 0 && !$("letterHUpgrade")?.hidden) {
        addNumber(card, tr("Основание степени H", "Letter H exponent base"), formulaDetails.hBase, "LETTER H");
        addNumber(card, tr("Показатель степени H", "Letter H exponent"), formulaDetails.hExponent, "LETTER H");
        addMultiplier(card, tr("Множитель H, непосредственно умножающий производство Score", "H multiplier applied directly to Score production"), formulaDetails.h || 1, "LETTER H");
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
      if (exponentReduction > 0) addPercent(card, tr("Снижение показателя степени в формуле роста цены букв", "Reduction to the exponent in the letter price-growth formula"), -exponentReduction, "RESEARCH");
      if (baseReduction > 0) addPercent(card, tr("Снижение основания в формуле роста цены букв", "Reduction to the base in the letter price-growth formula"), -baseReduction, "RESEARCH");
      addNumber(card, tr("Итоговое основание роста цены", "Final price growth base"), priceBase, "RESEARCH");
      addNumber(card, tr("Итоговый показатель степени цены", "Final price growth exponent"), priceExponent, "RESEARCH");
      addMultiplier(card, tr("Множитель цены каждого следующего уровня букв", "Price multiplier for each next letter level"), typeof window.getLetterPriceGrowth === "function" ? window.getLetterPriceGrowth() : Math.pow(priceBase, priceExponent), "RESEARCH");
      if (glyphCostDivisor !== 1) addRow(card, tr("Делитель стоимости от глифа", "Glyph cost divisor"), fmt(glyphCostDivisor), {source:"EQUIPPED GLYPH", latex:"\\div\\," + "\\text{" + fmt(glyphCostDivisor) + "}"});
      if (dilationDiscount !== 1) addMultiplier(card, tr("Множитель стоимости улучшений букв от скидки Time Dilation", "Letter-upgrade cost multiplier from Time Dilation discount"), dilationDiscount, "DILATION UPGRADES");
      if (blackHoleDiscount !== 1) addMultiplier(card, tr("Множитель стоимости улучшений букв от скидки Black Hole", "Letter-upgrade cost multiplier from Black Hole discount"), blackHoleDiscount, "BLACK HOLE UPGRADES");
      if (temporalDiscount !== 1) addMultiplier(card, tr("Совокупный множитель стоимости улучшений букв от временных скидок", "Combined letter-upgrade cost multiplier from temporal discounts"), temporalDiscount, "TIME DILATION × BLACK HOLE");
      const finalCostFactor = temporalDiscount / glyphCostDivisor;
      if (finalCostFactor !== 1) addMultiplier(card, tr("Итоговый множитель к цене улучшений букв после всех скидок и делителя глифа", "Final letter-upgrade cost multiplier after all discounts and Glyph divisor"), finalCostFactor, "ALL COST MODIFIERS");
      if (!card.querySelector(".modifier-row")) empty(card, tr("Снижения стоимости пока не активны.", "No letter cost reductions are active."));
    }

    // Global Sum and Integral internals.
    {
      const card = addCard(root, tr("Global Sum и Integral", "Global Sum and Integral"), "FORMULA");
      if (hasLevel(upgrades.globalSum)) addNumber(card, tr("Уровень Global Sum (дополнительные члены)", "Global Sum level (additional terms)"), upgrades.globalSum, "AP UPGRADE");
      if (hasLevel(upgrades.simpleBoost)) addMultiplier(card, tr("Множитель веса каждого дополнительного члена Global Sum", "Weight multiplier for each additional Global Sum term"), 1 + 0.25 * safe(upgrades.simpleBoost), "AP UPGRADE");
      if (hasLevel(upgrades.integralSumCoefficient)) addNumber(card, tr("Уровень коэффициента k для Integral и Global Sum", "Integral and Global Sum coefficient k level"), safe(upgrades.integralSumCoefficient), tr("AP-улучшение: именно это значение k входит в формулы", "AP upgrade: this is the k value used in the formulas"));
      const dilationSumBonus = 0.01 * safe(dilation?.levels?.sum);
      const blackHoleSumBonus = 0.02 * safe(blackHole?.levels?.sum);
      const temporalSumMultiplier = 1 + dilationSumBonus + blackHoleSumBonus;
      if (dilationSumBonus > 0) addPercent(card, tr("Добавка к количеству членов n в Global Sum от Time Dilation", "Additive bonus to the Global Sum term count n from Time Dilation"), dilationSumBonus, "DILATION UPGRADES");
      if (blackHoleSumBonus > 0) addPercent(card, tr("Добавка к количеству членов n в Global Sum от Black Hole", "Additive bonus to the Global Sum term count n from Black Hole"), blackHoleSumBonus, "BLACK HOLE UPGRADES");
      if (temporalSumMultiplier !== 1) addMultiplier(card, tr("Итоговый множитель к количеству членов n в Global Sum", "Final multiplier to the Global Sum term count n"), temporalSumMultiplier, "ADDITIVE BONUS");
      if (glyphSum > 0) addPercent(card, tr("Процентная добавка глифа к весу членов Global Sum", "Glyph percentage bonus to Global Sum term weight"), glyphSum, "EQUIPPED GLYPH");
      if (hasLevel(upgrades.globalSum)) addNumber(card, tr("Итоговый дополнительный вес", "Final additional term weight"), typeof window.getGlobalSumAdditionalWeight === "function" ? window.getGlobalSumAdditionalWeight() : 0, "LIVE CALCULATION");
      if (hasLevel(upgrades.globalSum)) addMultiplier(card, tr("Итоговый множитель Global Sum к производству Score", "Final Global Sum multiplier to Score production"), typeof window.getGlobalSumMultiplier === "function" ? window.getGlobalSumMultiplier() : 1, "LIVE CALCULATION");
      if (unlockedIntegral) addMultiplier(card, tr("Итоговый множитель Integral к производству Score", "Final Integral multiplier to Score production"), typeof window.getIntegralMultiplier === "function" ? window.getIntegralMultiplier() : 1, "GENESIS CORE");
      if (!card.querySelector(".modifier-row")) empty(card, tr("Global Sum и Integral ещё не имеют активных улучшений.", "Global Sum and Integral have no active upgrades yet."));
    }

    // AP and GP prestige multipliers and threshold modifiers.
    {
      const card = addCard(root, tr("Престиж: AP и GP", "Prestige: AP and GP"), "PRESTIGE");
      const apThresholdLevel = nodeLevel(1924), gpThresholdLevel = nodeLevel(1925);
      const apTreeLevel = nodeLevel(1861), gpTreeLevel = nodeLevel(1923);
      const dilationThresholdBonus = 0.001 * safe(dilation?.levels?.prestige);
      const blackHoleThresholdBonus = 0.002 * safe(blackHole?.levels?.prestige);
      const temporalThreshold = 1 + dilationThresholdBonus + blackHoleThresholdBonus;
      const apTreeThreshold = 1 + Math.min(25, apThresholdLevel) * 0.05;
      const gpTreeThreshold = 1 + Math.min(25, gpThresholdLevel) * 0.05;
      if (researchBonus("prestige") !== 1) addMultiplier(card, tr("Множитель количества AP, получаемых при Вознесении", "Multiplier to AP gained on Ascension"), researchBonus("prestige"), "RESEARCH");
      if (apTreeThreshold !== 1) addMultiplier(card, tr("Множитель делителя показателя степени порогов AP от узла AP Threshold", "AP-threshold exponent-divisor multiplier from the AP Threshold node"), apTreeThreshold, "GENESIS TREE");
      if (dilationThresholdBonus > 0) addPercent(card, tr("Добавка к делителю показателя степени порогов AP от Time Dilation", "Additive bonus to the AP-threshold exponent divisor from Time Dilation"), dilationThresholdBonus, "DILATION UPGRADES");
      if (blackHoleThresholdBonus > 0) addPercent(card, tr("Добавка к делителю показателя степени порогов AP от Black Hole", "Additive bonus to the AP-threshold exponent divisor from Black Hole"), blackHoleThresholdBonus, "BLACK HOLE UPGRADES");
      if (temporalThreshold !== 1) addMultiplier(card, tr("Совокупный множитель делителя показателя степени порогов AP", "Combined multiplier to the AP-threshold exponent divisor"), temporalThreshold, "ADDITIVE BONUS");
      if (apTreeLevel > 0) addMultiplier(card, tr("Множитель количества получаемых AP от узла AP Multiplier", "AP gain multiplier from the AP Multiplier node"), powerOfTwo(apTreeLevel), "GENESIS TREE");
      if (gpTreeThreshold !== 1) addMultiplier(card, tr("Множитель делителя показателя степени порогов GP от узла GP Threshold", "GP-threshold exponent-divisor multiplier from the GP Threshold node"), gpTreeThreshold, "GENESIS TREE");
      addNumber(card, tr("Итоговый делитель порога AP", "Final AP threshold divisor"), apTreeThreshold * temporalThreshold, "BASE × TREE × TEMPORAL");
      addNumber(card, tr("Итоговый делитель порога GP", "Final GP threshold divisor"), 2.5 * gpTreeThreshold, "BASE 2.5 × GENESIS TREE");
      if (gpTreeLevel > 0) addMultiplier(card, tr("Множитель количества получаемых GP от узла GP Multiplier", "GP gain multiplier from the GP Multiplier node"), powerOfTwo(gpTreeLevel), "GENESIS TREE");
      if (typeof window.getPrestigeGain === "function") addRow(card, tr("Текущее количество AP, которое будет получено при Вознесении", "AP currently gained by Ascension"), fmt(window.getPrestigeGain()), {currency:"\\mathrm{AP}", source:"CURRENT SCORE"});
      if (typeof window.getGenesisGain === "function" && window.FA_META?.treePassPurchased) addRow(card, tr("Текущее количество GP, которое будет получено при Престиже Генезиса", "GP currently gained by Genesis Prestige"), fmt(window.getGenesisGain()), {currency:"\\mathrm{GP}", source:"CURRENT AP"});
      if (!card.querySelector(".modifier-row")) empty(card, tr("Бонусы престижа пока не активны.", "No prestige modifiers are active yet."));
    }

    // Time systems, keeping ordinary time, Dilation time and Black Hole time separate.
    {
      const card = addCard(root, tr("Временные потоки", "Time flow systems"), "TIME");
      const dilationTau = 1 + 0.05 * safe(dilation?.levels?.tau);
      const blackHoleTau = 1 + 0.05 * safe(blackHole?.levels?.tau);
      if (dilationTau !== 1) addMultiplier(card, tr("Множитель скорости накопления обычного времени t от Time Dilation", "Ordinary-time t accumulation multiplier from Time Dilation"), dilationTau, "DILATION UPGRADE · τ");
      if (blackHoleTau !== 1) addMultiplier(card, tr("Множитель скорости накопления обычного времени t от Black Hole", "Ordinary-time t accumulation multiplier from Black Hole"), blackHoleTau, "BLACK HOLE UPGRADE · τ");
      if (glyphOrdinary !== 1) addMultiplier(card, tr("Множитель скорости накопления обычного времени t от глифа", "Ordinary-time t accumulation multiplier from Glyph"), glyphOrdinary, "EQUIPPED GLYPH");
      const ordinaryTimeSpeed = (typeof window.getDilationTimeSpeed === "function" ? window.getDilationTimeSpeed() : dilationTau * blackHoleTau) * glyphOrdinary;
      if (ordinaryTimeSpeed !== 1) addMultiplier(card, tr("Итоговый множитель скорости накопления обычного времени t", "Final ordinary-time t accumulation multiplier"), ordinaryTimeSpeed, "TIME DILATION × BLACK HOLE × GLYPH");
      if (glyphDilation !== 1) addMultiplier(card, tr("Множитель скорости накопления нестандартного времени t_dl и t_bl от глифа", "Glyph multiplier to non-standard time accumulation t_dl and t_bl"), glyphDilation, "EQUIPPED GLYPH");
      if (window.FA_META?.settings?.offline !== false) {
        addMultiplier(card, tr("Базовый коэффициент офлайн-прогресса", "Base offline progression coefficient"), 0.35, "GAME RULE · MAXIMUM 8 HOURS");
        addNumber(card, tr("Максимальное учитываемое отсутствие", "Maximum offline duration"), "8 h", "OFFLINE PROGRESSION");
      }
      if (researchBonus("time") !== 1) addMultiplier(card, tr("Множитель временной составляющей производства Score", "Time-dependent Score-production multiplier"), researchBonus("time"), "RESEARCH · PRODUCTION, NOT CLOCK SPEED");
      if (!card.querySelector(".modifier-row")) empty(card, tr("Дополнительных ускорителей времени пока нет.", "No additional time-flow modifiers are active."));
    }

    // Research modifiers not already represented by a dedicated subsystem.
    {
      const card = addCard(root, tr("Исследовательский центр", "Research Division"), "RESEARCH");
      const researchRows = [
        [0, "efficiency", tr("Эффективность прокачки параметров букв A–E: +4% к эффективному уровню за уровень исследования", "A–E parameter upgrade efficiency: +4% effective level per research level"), researchBonus("efficiency")],
        [3, "limitExpansion", tr("Масштаб пределов параметров A–E: делители уменьшаются, показатели степени увеличиваются", "A–E parameter-limit scale: divisors decrease and exponents increase"), researchBonus("limitExpansion")],
        [4, "coupling", tr("Усиление взаимных зависимостей между буквами A–E: +2% за уровень", "Strengthens cross-letter dependencies between A–E: +2% per level"), researchBonus("coupling")],
        [5, "eInput", tr("Усиление входа E в формуле обновления буквы E: +8% за уровень", "Strengthens the input to the E update formula: +8% per level"), researchBonus("eInput")],
        [7, "auto", tr("Множитель эффективности автоматических покупок модулей", "Automatic module-purchase efficiency multiplier"), researchBonus("auto")],
        [8, "production", tr("Множитель итогового производства Score", "Total Score-production multiplier"), researchBonus("production")],
        [9, "prestige", tr("Множитель количества получаемых AP после расчёта порогов", "Multiplier to AP gained after threshold calculation"), researchBonus("prestige")]
      ];
      for (const [index, key, label, value] of researchRows) {
        if (hasLevel(research[index])) addMultiplier(card, label, key === "limitExpansion" ? 1 + 0.01 * value : value, tr("Исследование №", "Research #") + (index + 1) + " · " + tr("уровень ", "level ") + research[index]);
      }
      if (!card.querySelector(".modifier-row")) empty(card, tr("Исследовательские бонусы ещё не приобретены.", "No Research Division bonuses have been purchased."));
    }

    // White Hole / Time Dilation parameters and research levels.
    if (dilation?.unlocked) {
      const card = addCard(root, tr("Белая дыра: параметры", "White Hole: parameters"), "TIME DILATION");
      for (const key of ["i","v","k"]) addNumber(card, tr("Параметр ", "Parameter ") + key + tr(" интегральной функции Белой дыры", " of the White Hole integral"), dilation.parameters[key], tr("Уровень прокачки параметра: ", "Parameter upgrade level: ") + safe(dilation.levels[key]));
      addNumber(card, tr("Параметр временного потока τ", "Temporal flow parameter τ"), dilation.parameters.tau, "DILATION LEVEL " + safe(dilation.levels.tau));
      const parameterBoost = 1 + 0.001 * safe(dilation.levels.parameters);
      if (parameterBoost !== 1) addMultiplier(card, tr("Множитель параметров i, v и k в интегральной функции Белой дыры", "Multiplier to parameters i, v and k in the White Hole integral"), parameterBoost, "DILATION UPGRADES");
      for (const key of ["sum","letters","discount","production","prestige"]) {
        if (hasLevel(dilation.levels[key])) addNumber(card, tr("Уровень улучшения ", "Upgrade level ") + key, dilation.levels[key], "DILATION UPGRADES");
      }
    }

    // Black Hole parameters and the exponent used by its conversion reward.
    if (blackHole?.unlocked) {
      const card = addCard(root, tr("Чёрная дыра: параметры", "Black Hole: parameters"), "BLACK HOLE");
      for (const key of ["q","s","w"]) addNumber(card, tr("Параметр ", "Parameter ") + key + tr(" интегральной функции Чёрной дыры", " of the Black Hole integral"), blackHole.parameters[key], tr("Уровень прокачки параметра: ", "Parameter upgrade level: ") + safe(blackHole.levels[key]));
      const parameterBoost = 1 + 0.002 * safe(blackHole.levels.parameters);
      if (parameterBoost !== 1) addMultiplier(card, tr("Множитель параметров q, s и w в интегральной функции Чёрной дыры", "Multiplier to parameters q, s and w in the Black Hole integral"), parameterBoost, "BLACK HOLE UPGRADES");
      if (safe(blackHole.p) > 0) addNumber(card, tr("Показатель степени p", "Exponent p"), blackHole.p, "p = 0.85L");
      const researchL = 1 + 0.1 * safe(window.getBlackHoleResearchLevel?.());
      if (researchL !== 1) addMultiplier(card, tr("Множитель L, определяющего показатель степени p преобразования Чёрной дыры", "Multiplier to L, which determines the Black Hole conversion exponent p"), researchL, "BLACK HOLE RESEARCH");
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
      if (researchBonus("auto") !== 1) addMultiplier(card, tr("Множитель эффективности автоматических покупок улучшений букв", "Automatic letter-upgrade purchase efficiency multiplier"), researchBonus("auto"), "RESEARCH");
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