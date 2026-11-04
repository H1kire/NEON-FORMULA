// FORMULA ASCENT — temporary live typography controls.
(() => {
  "use strict";
  const root = document.documentElement;
  const textSlider = document.getElementById("fontTextSize");
  const formulaSlider = document.getElementById("fontFormulaSize");
  const textOutput = document.getElementById("fontTextOutput");
  const formulaOutput = document.getElementById("fontFormulaOutput");
  const reset = document.getElementById("fontTestReset");
  if (!textSlider || !formulaSlider || !textOutput || !formulaOutput) return;

  function apply() {
    const textSize = Number(textSlider.value);
    const formulaSize = Number(formulaSlider.value);
    root.style.setProperty("--fa-test-text-size", textSize + "em");
    root.style.setProperty("--fa-test-formula-size", formulaSize + "em");
    textOutput.value = textSize.toFixed(1) + "em";
    formulaOutput.value = formulaSize.toFixed(1) + "em";
    textOutput.textContent = textOutput.value;
    formulaOutput.textContent = formulaOutput.value;
  }
  textSlider.addEventListener("input", apply);
  formulaSlider.addEventListener("input", apply);
  if (reset) reset.addEventListener("click", () => {
    textSlider.value = "1";
    formulaSlider.value = "2";
    apply();
  });
  apply();
})();
