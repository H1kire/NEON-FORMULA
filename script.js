const MS_PER_SEC = 1000;
let lastFrame = Date.now();

let t = 0;
let value = 0;

let aLevel = 0;
let bLevel = 0;
let cLevel = 0;
let dLevel = 0;
let eLevel = 0;

const SAVE_KEY = "neon_formula_idle_v4_5";

// DOM
const timeDisplay = document.getElementById("time");
const valueDisplay = document.getElementById("value");
const growthDisplay = document.getElementById("growth");

const formulaDisplay = document.getElementById("formulaText");

const aLevelDisplay = document.getElementById("aLevel");
const bLevelDisplay = document.getElementById("bLevel");
const cLevelDisplay = document.getElementById("cLevel");
const dLevelDisplay = document.getElementById("dLevel");
const eLevelDisplay = document.getElementById("eLevel");

const btnA = document.getElementById("btnA");
const btnB = document.getElementById("btnB");
const btnC = document.getElementById("btnC");
const btnD = document.getElementById("btnD");
const btnE = document.getElementById("btnE");

const aCostDisplay = document.getElementById("aCost");
const bCostDisplay = document.getElementById("bCost");
const cCostDisplay = document.getElementById("cCost");
const dCostDisplay = document.getElementById("dCost");
const eCostDisplay = document.getElementById("eCost");

const TICK = 100;
const OFFLINE_RATE = 1000;

// ======================
// SAVE
// ======================

function saveGame() {

    const data = {
        t: t,
        p: p,
        value: value,

        aLevel: aLevel,
        bLevel: bLevel,
        cLevel: cLevel,
        dLevel: dLevel,
        eLevel: eLevel,

        lastTime: Date.now()
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function loadGame() {

    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;

    const data = JSON.parse(raw);

    const now = Date.now();
    const diff = (now - data.lastTime) / OFFLINE_RATE;

    t = data.t || 0;
    value = data.value || 0;


    aLevel = data.aLevel || 0;
    bLevel = data.bLevel || 0;
    cLevel = data.cLevel || 0;
    dLevel = data.dLevel || 0;
    eLevel = data.eLevel || 0;

    let steps = Math.min(diff, 10000);

    for (let i = 0; i < steps; i++) {
        t += 1;
        value += getGain();
    }
}

function resetSave(){

    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem("prestigeSave");

    p = 0;
    t = 0;
    value = 0;

    aLevel = 0;
    bLevel = 0;
    cLevel = 0;
    dLevel = 0;
    eLevel = 0;

    updateUI();
}

// ======================
// FORMAT
// ======================

function format(n){

    if(n < 1000)
        return n.toFixed(0);

    const u = [
        "K",
        "M",
        "B",
        "T",
        "Qa",
        "Qi",
        "Sx",
        "Sp",
        "Oc",
        "No"
    ];

    let i = -1;

    while(n >= 1000 && i < u.length - 1){

        n /= 1000;
        i++;

    }

    return n.toFixed(2) + u[i];

}

// ======================
// COSTS
// ======================

function getACost(){
    return 1000 * Math.pow(2,aLevel);
}

function getBCost(){
    return 100000 * Math.pow(2,bLevel);
}

function getCCost(){
    return 10000000 * Math.pow(2,cLevel);
}

function getDCost(){
    return 1000000000 * Math.pow(2,dLevel);
}

function getECost(){
    return 1000000000000 * Math.pow(2,eLevel);
}

// ======================
// FORMULAS
// ======================

function getA(){

    if(aLevel <= 0)
        return 1;

    let root =
        Math.max(
            3 - (aLevel * 0.01),
            2
        );

    return Math.pow(
        Math.max(t,1),
        1 / root
    );

}

function getB(){

    if(bLevel <= 0)
        return 1;

    let power =
        0.5 +
        (bLevel * 0.01);

    return Math.pow(
        getA(),
        power
    );

}

function getC(){

    if(cLevel <= 0)
        return 1;

    let divider =
        10 - cLevel;

    if(divider > 1){

        return (
            getA() *
            getB()
        ) / divider;

    }

    let multiplier =
        1 +
        ((cLevel - 10) * 0.01);

    return (
        getA() *
        getB()
    ) * multiplier;

}

function getD(){

    if(dLevel <= 0)
        return 1;

    let multiplier =
        1 +
        (dLevel * 0.05);

    return (
        getA() +
        getB() +
        getC()
    ) * multiplier;

}

function getE(){

    if(eLevel <= 0)
        return 1;

    let base =
        Math.max(
            5 - (eLevel * 0.01),
            2
        );

    let inside =
        Math.max(
            getA() *
            getB() *
            getC() *
            getD(),
            1
        );

    return (
        Math.log(inside) /
        Math.log(base)
    );

}

// ======================
// GAIN
// ======================

function getGain(){

    return (
        Math.pow(
            t + 1,
            2
        ) *
        getA() *
        getB() *
        getC() *
        getD() *
        getE()
    );

}
function getGrowthPerSecond(){

    return getGain() * (MS_PER_SEC / TICK);

}

// ======================
// BUY
// ======================

function buyA(){

    const cost =
        getACost();

    if(value < cost)
        return;

    value -= cost;

    aLevel++;

}

function buyB(){

    const cost =
        getBCost();

    if(value < cost)
        return;

    value -= cost;

    bLevel++;

}

function buyC(){

    const cost =
        getCCost();

    if(value < cost)
        return;

    value -= cost;

    cLevel++;

}

function buyD(){

    const cost =
        getDCost();

    if(value < cost)
        return;

    value -= cost;

    dLevel++;

}

function buyE(){

    const cost =
        getECost();

    if(value < cost)
        return;

    value -= cost;

    eLevel++;

}

// ======================
// FORMULA TEXT
// ======================

function updateFormulaText(){

    let formula =
        "f(t)=t²";

    if(aLevel > 0)
        formula += " × a";

    if(bLevel > 0)
        formula += " × b";

    if(cLevel > 0)
        formula += " × c";

    if(dLevel > 0)
        formula += " × d";

    if(eLevel > 0)
        formula += " × e";

    formulaDisplay.textContent =
        formula;

}

// ======================
// BUTTON COLORS
// ======================

function setBtn(btn,cost){

    if(!btn)
        return;

    if(value >= cost){

        btn.classList.add("good");
        btn.classList.remove("bad");

    }
    else{

        btn.classList.add("bad");
        btn.classList.remove("good");

    }

}

// ======================
// UI
// ======================

function updateUI(){

    timeDisplay.textContent =
        t.toFixed(1);

    valueDisplay.textContent =
        format(value);

    growthDisplay.textContent =
        format(getGrowthPerSecond());

    aLevelDisplay.textContent =
        aLevel;

    bLevelDisplay.textContent =
        bLevel;

    cLevelDisplay.textContent =
        cLevel;

    dLevelDisplay.textContent =
        dLevel;

    eLevelDisplay.textContent =
        eLevel;

    // динамические формулы

    document.getElementById("aFormula")
        .textContent =
        `a = t^(1/${Math.max(3 - aLevel*0.01,2).toFixed(2)})`;

    document.getElementById("bFormula")
        .textContent =
        `b = a^${(0.5 + bLevel*0.01).toFixed(2)}`;

    const div =
        10 - cLevel;

    if(div > 1){

        document.getElementById("cFormula")
            .textContent =
            `c = a*b/${div}`;

    }
    else{

        document.getElementById("cFormula")
            .textContent =
            `c = a*b*${(
                1 +
                ((cLevel-10)*0.01)
            ).toFixed(2)}`;

    }

    document.getElementById("dFormula")
        .textContent =
        `d = (a+b+c)*${(
            1 +
            dLevel*0.05
        ).toFixed(2)}`;

    document.getElementById("eFormula")
        .textContent =
        `e = log${Math.max(
            5 - eLevel*0.01,
            2
        ).toFixed(2)}(a*b*c*d)`;

    setBtn(btnA,getACost());
    setBtn(btnB,getBCost());
    setBtn(btnC,getCCost());
    setBtn(btnD,getDCost());
    setBtn(btnE,getECost());

    aCostDisplay.textContent =
        format(getACost());

    bCostDisplay.textContent =
        format(getBCost());

    cCostDisplay.textContent =
        format(getCCost());

    dCostDisplay.textContent =
        format(getDCost());

    eCostDisplay.textContent =
        format(getECost());

    updateFormulaText();

}

// ======================
// LOOP
// ======================

function loop(){

    let now = Date.now();
    let delta = (now - lastFrame) / 1000;
    lastFrame = now;

    t += delta;
    value += getGain() * delta * (1000 / TICK);

    updateUI();

}

// ======================
// START
// ======================

loadGame();
updateUI();

setInterval(loop, TICK);
setInterval(saveGame, 5000);