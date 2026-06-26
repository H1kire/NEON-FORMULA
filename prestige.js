// ======================
// PRESTIGE SYSTEM V4
// ======================

// prestige points (p)
let p = 0;

// prestige unlock flag
let prestigeUnlocked = false;

// DOM
const prestigeBtn = document.getElementById("prestigeBtn");
const pDisplay = document.getElementById("pValue");

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

    savePrestige();
    updatePrestigeUI();
}

// ======================
// SAVE / LOAD
// ======================

function savePrestige() {
    localStorage.setItem("prestigeSave", JSON.stringify({
        p: p
    }));
}

function loadPrestige() {

    const data = localStorage.getItem("prestigeSave");

    if (!data)
        return;

    p = JSON.parse(data).p || 0;
}

// ======================
// UI CONTROL
// ======================

function updatePrestigeUI() {

    if (!prestigeBtn)
        return;

    let gain = getPrestigeGain();

    // show button only if available
    if (gain > 0) {
        prestigeBtn.style.display = "block";
        prestigeBtn.textContent = `PRESTIGE +${gain}p`;
    } else {
        prestigeBtn.style.display = "none";
    }

    if (pDisplay)
        pDisplay.textContent = p;
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