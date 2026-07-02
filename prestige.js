// ======================
// PRESTIGE SYSTEM \ PRESCTIGE.js
// ======================

// prestige points (p)
let p = 0;

// prestige unlock flag
let prestigeUnlocked = false;

// ======================
// prestigeUpgrades
// ======================

window.prestigeUpgrades = window.prestigeUpgrades || {
    simpleBoost: 0,
    globalSum: 0
};


// DOM
const prestigeBtn = document.getElementById("prestigeBtn");
const pDisplay = document.getElementById("pValue");
const prestigePanel = document.getElementById("prestigePanel");
const simpleBoostLevel = document.getElementById("simpleBoostLevel");
const simpleBoostCost = document.getElementById("simpleBoostCost");

const globalSumLevel = document.getElementById("globalSumLevel");
const globalSumCost = document.getElementById("globalSumCost");

// ======================
// COST FUNCTION
// 1 p = 1Qa * 2^x
// x = current prestige points gained + 1
// ======================

function getPrestigeCost() {
    return 1e15 * Math.pow(2, p);
}

// ======================
// CALCULATE PRESTIGE POINTS
// based on current value
// ======================

function getPrestigeGain() {

    let base = value;

    if (base < 1e15)
        return 0;

    // how many times we "fit" scaling
    let points = 0;
    let cost = 1e15;

    while (base >= cost) {
        base /= 2;
        cost *= 2;
        points++;
    }

    return points;
}

// ======================
// PRESTIGE BUY
// ======================

function doPrestige() {

    let gain = getPrestigeGain();

    if (gain <= 0)
        return;

    // reset main progress
    t = 0;
    value = 0;

    aLevel = 0;
    bLevel = 0;
    cLevel = 0;
    dLevel = 0;
    eLevel = 0;

    // add prestige points
    p += gain;

    prestigeUnlocked = true;

    savePrestige();
    updatePrestigeUI();
}

// ======================
// SAVE / LOAD
// ======================

function savePrestige() {
    localStorage.setItem("prestigeSave", JSON.stringify({
        p: p,
        prestigeUnlocked: prestigeUnlocked,
        prestigeUpgrades: prestigeUpgrades
    }));
}

function loadPrestige() {

    const data = localStorage.getItem("prestigeSave");

    if (!data)
        return;

    p = JSON.parse(data).p || 0;
    prestigeUnlocked = data.prestigeUnlocked || false;
    prestigeUpgrades = data.prestigeUpgrades || {
        simpleBoost: 0,
        globalSum: 0
    };
}

// ==================================================================
// PRESTIGE UPG.
// ==================================================================
// ======================
// COST PRESTIGE UPG.
// ======================

function getSimpleBoostCost(){
    return Math.ceil(1 * Math.pow(1.5, prestigeUpgrades.simpleBoost));
}

function getGlobalSumCost(){
    return Math.min(
        5,
        Math.ceil(10 * Math.pow(10, prestigeUpgrades.globalSum))
    );
}

// ======================
// BUY PRESTIGE UPG.
// ======================

function buySimpleBoost(){

    const cost = getSimpleBoostCost();

    if(p < cost) return;

    p -= cost;
    prestigeUpgrades.simpleBoost++;

    savePrestige();
    updatePrestigeUI();
}
function buyGlobalSum(){

    const cost = getGlobalSumCost();

    if(p < cost) return;

    p -= cost;

    if(prestigeUpgrades.globalSum < 5)
        prestigeUpgrades.globalSum++;

    savePrestige();
    updatePrestigeUI();
}


// ======================
// BUY PRESTIGE UPG.
// ======================


// ======================
// UI CONTROL
// ======================

function updatePrestigeUI() {

    if (!prestigeBtn)
        return;

    let gain = getPrestigeGain();

    // BUTTON
    if (gain > 0) {
        prestigeBtn.style.display = "block";
        prestigeBtn.textContent = `PRESTIGE +${gain}p`;
    } else {
        prestigeBtn.style.display = "none";
    }

    // PRESTIGE PANEL
    if (prestigePanel) {
        if(prestigeUnlocked){

            prestigePanel.style.display = "block";

        }
        else{

            prestigePanel.style.display = "none";

        }
    }

    if (pDisplay)
        pDisplay.textContent = p;

    simpleBoostLevel.textContent = prestigeUpgrades.simpleBoost;
    simpleBoostCost.textContent = getSimpleBoostCost();

    globalSumLevel.textContent = prestigeUpgrades.globalSum;
    globalSumCost.textContent = getGlobalSumCost();
}

// ======================
// LOOP
// ======================

setInterval(() => {

    updatePrestigeUI();

}, 500);

// ======================
// INIT
// ======================

loadPrestige();
updatePrestigeUI();