// FORMULA ASCENT — shared KaTeX renderer for every mathematical UI token.
(() => {
  "use strict";
  const cache = new WeakMap();
  function render(id, latex, options = {}) {
    const element = document.getElementById(id);
    if (!element || typeof latex !== "string") return;
    element.classList.add("math-formula");
    const displayMode = !!options.displayMode;
    const key = (displayMode ? "D:" : "I:") + latex;
    if (cache.get(element) === key) return;
    cache.set(element, key);
    if (!window.katex || typeof window.katex.render !== "function") {
      element.textContent = latex;
      return;
    }
    window.katex.render(latex, element, {
      displayMode, throwOnError: false, strict: "ignore",
      trust: false, output: "htmlAndMathml"
    });
  }
  function escapeText(value) {
    return String(value ?? "").replace(/\\/g, "\\backslash ")
      .replace(/([{}#$%&_])/g, "\\$1")
      .replace(/~/g, "\\textasciitilde{}")
      .replace(/\^/g, "\\textasciicircum{}");
  }
  function renderText(id, value) {
    render(id, "\\text{" + escapeText(value) + "}");
  }
  function renderCurrency(id, value, symbol) {
    if (typeof symbol !== "string" || !symbol.trim()) return renderText(id, value);
    render(id, "\\text{" + escapeText(value) + "}\\, " + symbol);
  }

  // Keep notation consistent in static copy and in content inserted by UI updates.
  const tokenPattern = /(?:[Δ∆]\s*t(?:[_₍]\s*(?:dl|bl)[₎]?)?|t[_₍]\s*(?:dl|bl)[₎]?|[A-H][–−-][A-H]|[A-Za-z]_[A-Za-z0-9]+|[A-Za-z][⁰¹²³⁴⁵⁶⁷⁸⁹]+|W₀|[fgh](?=\s*\()|\b[A-H]\b|[a-h](?=\s*=)|\b(?:AP|GP|GS|GF|SC|Qa|Qi|Sx)\b|\b(?:i|v|k|q|s|w|t|x|p|L|n)\b|[τΣΛ∫√]|\d+(?:[.,]\d+)?\s*%)/g;
  function tokenLatex(token) {
    const compact = token.replace(/\s+/g, "");
    const temporal = compact.match(/^[Δ∆]?t[_₍]?(dl|bl)[₎]?$/i);
    if (temporal) return (compact.startsWith("Δ") || compact.startsWith("∆") ? "\\Delta " : "") + "t_{" + temporal[1].toLowerCase() + "}";
    if (/^[A-H][–−-][A-H]$/.test(compact)) return compact[0] + "\\text{–}" + compact[2];
    if (/^[A-Za-z]_[A-Za-z0-9]+$/.test(compact)) return compact[0] + "_{" + compact.slice(2) + "}";
    if (/^[A-Za-z][⁰¹²³⁴⁵⁶⁷⁸⁹]+$/.test(compact)) return compact[0] + "^{" + compact.slice(1).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, digit => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(digit)) + "}";
    if (compact === "W₀") return "W_0";
    if (/^[fgh]\(/.test(compact)) return compact.replace(/([fgh])\(([^)]*)\)/, "$1($2)");
    if (/^\d/.test(compact)) return compact.replace(",", ".").replace("%", "\\%");
    if (/^(AP|GP|GS|GF|SC|Qa|Qi|Sx)$/.test(compact)) return "\\mathrm{" + compact + "}";
    if (/^[A-H]$/.test(compact)) return "\\mathrm{" + compact + "}";
    if (/^[A-Za-z]$/.test(compact)) return compact;
    if (/^[τΣΛ∫√]$/.test(compact)) return compact;
    return compact;
  }
  function shouldSkip(node) {
    const parent = node.parentElement;
    return !parent || !!parent.closest("script,style,textarea,input,select,option,button[aria-label],.katex,.math-inline,[contenteditable='true']");
  }
  function renderInlineMath(root = document.body) {
    if (!root || !document.createTreeWalker || !window.katex) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      tokenPattern.lastIndex = 0;
      if (!shouldSkip(node) && tokenPattern.test(node.nodeValue)) nodes.push(node);
    }
    for (const node of nodes) {
      const value = node.nodeValue, fragment = document.createDocumentFragment();
      let last = 0, match;
      tokenPattern.lastIndex = 0;
      while ((match = tokenPattern.exec(value))) {
        if (match.index > last) fragment.append(document.createTextNode(value.slice(last, match.index)));
        const span = document.createElement("span");
        span.className = "math-inline";
        window.katex.render(tokenLatex(match[0]), span, {
          displayMode: false, throwOnError: false, strict: "ignore",
          trust: false, output: "htmlAndMathml"
        });
        fragment.append(span);
        last = match.index + match[0].length;
      }
      if (last < value.length) fragment.append(document.createTextNode(value.slice(last)));
      node.parentNode?.replaceChild(fragment, node);
    }
  }
  window.FAFormula = Object.freeze({ render, renderText, renderCurrency });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => renderInlineMath());
  else renderInlineMath();
  if (typeof MutationObserver !== "undefined") {
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "characterData") renderInlineMath(record.target.parentElement);
      for (const node of record.addedNodes || []) {
        if (node.nodeType === Node.ELEMENT_NODE && !node.classList?.contains("math-inline") && !node.classList?.contains("katex")) renderInlineMath(node);
        else if (node.nodeType === Node.TEXT_NODE) renderInlineMath(node.parentElement);
      }
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  }
})();