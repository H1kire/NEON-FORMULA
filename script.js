// ====================
// SCRIPT.JS
// ====================
const MS_PER_SEC = 1000;
let lastFrame = Date.now();

let t = 0;
let value = 0;

let prestigeUpgrades = window.prestigeUpgrades || {
    simpleBoost: 0,
    globalSum: 0
};

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

        "K",    // 1e3
        "M",    // 1e6
        "B",    // 1e9
        "T",    // 1e12
        "Qa",   // 1e15
        "Qi",   // 1e18
        "Sx",   // 1e21
        "Sp",   // 1e24
        "Oc",   // 1e27
        "No",   // 1e30

        "Dc",   // 1e33
        "UDc",  // 1e36
        "DDc",  // 1e39
        "TDc",  // 1e42
        "QaDc", // 1e45
        "QiDc", // 1e48
        "SxDc", // 1e51
        "SpDc", // 1e54
        "OcDc", // 1e57
        "NoDc", // 1e60

        "Vg",   // 1e63
        "UVg",  // 1e66
        "DVg",  // 1e69
        "TVg",  // 1e72
        "QaVg", // 1e75
        "QiVg", // 1e78
        "SxVg", // 1e81
        "SpVg", // 1e84
        "OcVg", // 1e87
        "NoVg", // 1e90

        "Tg",   // 1e93
        "UTg",  // 1e96
        "DTg",  // 1e99
        "TTg",  // 1e102
        "QaTg", // 1e105
        "QiTg", // 1e108
        "SxTg", // 1e111
        "SpTg", // 1e114
        "OcTg", // 1e117
        "NoTg", // 1e120

        "Qd",   // 1e123
        "UQd",  // 1e126
        "DQd",  // 1e129
        "TQd",  // 1e132
        "QaQd", // 1e135
        "QiQd", // 1e138
        "SxQd", // 1e141
        "SpQd", // 1e144
        "OcQd", // 1e147
        "NoQd", // 1e150

        "Qn",   // 1e153
        "UQn",  // 1e156
        "DQn",  // 1e159
        "TQn",  // 1e162
        "QaQn", // 1e165
        "QiQn", // 1e168
        "SxQn", // 1e171
        "SpQn", // 1e174
        "OcQn", // 1e177
        "NoQn", // 1e180

        "Se",   // 1e183
        "USe",  // 1e186
        "DSe",  // 1e189
        "TSe",  // 1e192
        "QaSe", // 1e195
        "QiSe", // 1e198
        "SxSe", // 1e201
        "SpSe", // 1e204
        "OcSe", // 1e207
        "NoSe", // 1e210

        "St",   // 1e213
        "USt",  // 1e216
        "DSt",  // 1e219
        "TSt",  // 1e222
        "QaSt", // 1e225
        "QiSt", // 1e228
        "SxSt", // 1e231
        "SpSt", // 1e234
        "OcSt", // 1e237
        "NoSt", // 1e240

        "Og",   // 1e243
        "UOg",  // 1e246
        "DOg",  // 1e249
        "TOg",  // 1e252
        "QaOg", // 1e255
        "QiOg", // 1e258
        "SxOg", // 1e261
        "SpOg", // 1e264
        "OcOg", // 1e267
        "NoOg", // 1e270

        "Ng",   // 1e273
        "UNg",  // 1e276
        "DNg",  // 1e279
        "TNg",  // 1e282
        "QaNg", // 1e285
        "QiNg", // 1e288
        "SxNg", // 1e291
        "SpNg", // 1e294
        "OcNg", // 1e297
        "NoNg", // 1e300

        "Ce",   // 1e303
        "UCe"   // 1e306

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

    let boost = 1;

    // Simple Boost
    boost *= (1 + (prestigeUpgrades.simpleBoost || 0) * 0.25);

    // Общая часть формулы
    const base =
        getA() *
        getB() *
        getC() *
        getD() *
        getE();

    let result;

    // Без Global Sum
    if((prestigeUpgrades.globalSum || 0) === 0){

        result =
            Math.pow(t + 1, 2) *
            base *
            boost;

    }

    // Global Sum
    else{

        let sum = 0;

        for(
            let i = 1;
            i <= prestigeUpgrades.globalSum;
            i++
        ){

            sum += Math.pow(t + i, 2);

        }

        result =
            sum *
            base *
            boost;

    }

    // Защита
    if(!isFinite(result))
        return 0;

    return result;

}

function getGrowthPerSecond(){

    return getGain();

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

    // Пока нет Global Sum
    if(prestigeUpgrades.globalSum === 0){

        let formula = "f(t)=t²";

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

        formulaDisplay.textContent = formula;

    }

    // После покупки Global Sum
    else{

        let formula =
            `f(t)=Σ₁→${prestigeUpgrades.globalSum}((t+i)²`;

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

        formula += ")";

        formulaDisplay.textContent = formula;

    }

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

    value += getGain() * delta;

    updateUI();
}

// ======================
// START
// ======================

loadGame();
updateUI();

setInterval(loop, TICK);
setInterval(saveGame, 5000);