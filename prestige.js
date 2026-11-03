// ======================
// ASCENSION / PERMANENT RESEARCH
// ======================
let p = 0;
let prestigeUnlocked = false;
window.prestigeUpgrades = window.prestigeUpgrades || { simpleBoost: 0, globalSum: 0, autoBuyer: 0 };

const prestigeBtn = document.getElementById("prestigeBtn");
const pDisplay = document.getElementById("pValue");
const prestigePanel = document.getElementById("prestigePanel");
const simpleBoostLevel = document.getElementById("simpleBoostLevel");
const simpleBoostCost = document.getElementById("simpleBoostCost");
const globalSumLevel = document.getElementById("globalSumLevel");
const globalSumCost = document.getElementById("globalSumCost");
const autoBuyerLevel = document.getElementById("autoBuyerLevel");
const autoBuyerCost = document.getElementById("autoBuyerCost");

function getPrestigeCost() { return 1e15 * Math.pow(2, p); }

function getPrestigeGain() {
    let base = value;
    if (base < 1e15) return 0;
    let points = 0;
    let cost = 1e15;
    while (base >= cost) { base /= 2; cost *= 2; points++; }
    return points;
}

function doPrestige() {
    const gain = getPrestigeGain();
    if (gain <= 0) return;
    t = 0; value = 0;
    aLevel = 0; bLevel = 0; cLevel = 0; dLevel = 0; eLevel = 0;
    p += gain;
    prestigeUnlocked = true;
    savePrestige();
    if (typeof saveGame === "function") saveGame();
    updatePrestigeUI();
    if (typeof updateUI === "function") updateUI();
}

function savePrestige() {
    localStorage.setItem("prestigeSave", JSON.stringify({ p, prestigeUnlocked, prestigeUpgrades }));
}

function loadPrestige() {
    const raw = localStorage.getItem("prestigeSave");
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        p = Number(data.p) || 0;
        prestigeUnlocked = Boolean(data.prestigeUnlocked);
        prestigeUpgrades = {
            simpleBoost: Number(data.prestigeUpgrades?.simpleBoost) || 0,
            globalSum: Number(data.prestigeUpgrades?.globalSum) || 0,
            autoBuyer: Number(data.prestigeUpgrades?.autoBuyer) || 0
        };
        window.prestigeUpgrades = prestigeUpgrades;
    } catch (error) { console.error("Could not load ascension data:", error); }
}

function getSimpleBoostCost() { return Math.ceil(Math.pow(1.5, prestigeUpgrades.simpleBoost)); }
function getGlobalSumCost() { return Math.min(5, Math.ceil(10 * Math.pow(10, prestigeUpgrades.globalSum))); }
function getAutoBuyerCost() { return Math.ceil(10 * Math.pow(10, prestigeUpgrades.autoBuyer)); }

function buySimpleBoost() {
    const cost = getSimpleBoostCost();
    if (p < cost) return;
    p -= cost; prestigeUpgrades.simpleBoost++;
    savePrestige(); updatePrestigeUI();
    if (typeof updateUI === "function") updateUI();
}
function buyGlobalSum() {
    if (prestigeUpgrades.globalSum >= 5) return;
    const cost = getGlobalSumCost();
    if (p < cost) return;
    p -= cost; prestigeUpgrades.globalSum++;
    savePrestige(); updatePrestigeUI();
    if (typeof updateUI === "function") updateUI();
}
function buyAutoBuyer() {
    if (prestigeUpgrades.autoBuyer >= 5) return;
    const cost = getAutoBuyerCost();
    if (p < cost) return;
    p -= cost; prestigeUpgrades.autoBuyer++;
    savePrestige(); updatePrestigeUI();
}

function updatePrestigeUI() {
    if (!prestigeBtn) return;
    const gain = getPrestigeGain();
    if (gain > 0) {
        prestigeBtn.style.display = "inline-block";
        prestigeBtn.innerHTML = "ASCEND +" + gain + ' <span>↗</span>';
    } else prestigeBtn.style.display = "none";
    if (prestigePanel) prestigePanel.style.display = prestigeUnlocked ? "block" : "none";
    if (pDisplay) pDisplay.textContent = typeof format === "function" ? format(p) : String(p);
    if (simpleBoostLevel) simpleBoostLevel.textContent = prestigeUpgrades.simpleBoost;
    if (simpleBoostCost) simpleBoostCost.textContent = getSimpleBoostCost();
    if (globalSumLevel) globalSumLevel.textContent = prestigeUpgrades.globalSum;
    if (globalSumCost) globalSumCost.textContent = prestigeUpgrades.globalSum >= 5 ? "MAX" : getGlobalSumCost();
    if (autoBuyerLevel) autoBuyerLevel.textContent = prestigeUpgrades.autoBuyer;
    if (autoBuyerCost) autoBuyerCost.textContent = prestigeUpgrades.autoBuyer >= 5 ? "MAX" : getAutoBuyerCost();
}
setInterval(updatePrestigeUI, 500);
loadPrestige();
updatePrestigeUI();