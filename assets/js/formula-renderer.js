// FORMULA ASCENT — KaTeX display adapter.
// KaTeX is vendored locally; this file only handles typography, never game calculations.
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
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false,
      output: "htmlAndMathml"
    });
  }
  function renderText(id, value) {
    const text = String(value ?? "");
    const escaped = text.replace(/\\/g, "\\backslash ")
      .replace(/([{}#$%&_])/g, "\\$1")
      .replace(/~/g, "\\textasciitilde{}")
      .replace(/\^/g, "\\textasciicircum{}");
    render(id, "\\text{" + escaped + "}");
  }
  window.FAFormula = Object.freeze({ render, renderText });
})();
