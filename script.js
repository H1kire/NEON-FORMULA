// FORMULA ASCENT — core idle simulation
const TICK=10, AUTOSAVE_INTERVAL=5000, BASE_PRODUCTION=0.08;
let lastFrame=Date.now(),t=0,value=0;
let prestigeUpgrades=window.prestigeUpgrades||{simpleBoost:0,globalSum:0,autoBuyer:0};
let aLevel=0,bLevel=0,cLevel=0,dLevel=0,eLevel=0;
let autoBuyA=true,autoBuyB=true,autoBuyC=true,autoBuyD=true,autoBuyE=true;
const SAVE_KEY="formula_ascent_save_v2",LEGACY_SAVE_KEY="formula_ascent_save_v1",OLD_SAVE_KEY="neon_formula_idle_v4_5";
const $=id=>document.getElementById(id);
const timeDisplay=$("time"),valueDisplay=$("value"),growthDisplay=$("growth"),formulaDisplay=$("formulaText");
const aLevelDisplay=$("aLevel"),bLevelDisplay=$("bLevel"),cLevelDisplay=$("cLevel"),dLevelDisplay=$("dLevel"),eLevelDisplay=$("eLevel");
const btnA=$("btnA"),btnB=$("btnB"),btnC=$("btnC"),btnD=$("btnD"),btnE=$("btnE");
const aCostDisplay=$("aCost"),bCostDisplay=$("bCost"),cCostDisplay=$("cCost"),dCostDisplay=$("dCost"),eCostDisplay=$("eCost");
function metaBonus(type){return typeof getMetaBonus==="function"?getMetaBonus(type):1}
function saveGame(force=false){
 if(!force&&FA_META.settings.autosave===false)return;
 const data={t,value,aLevel,bLevel,cLevel,dLevel,eLevel,autoBuyA,autoBuyB,autoBuyC,autoBuyD,autoBuyE,lastTime:Date.now()};
 localStorage.setItem(SAVE_KEY,JSON.stringify(data));
}
function loadGame(){
 const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem(LEGACY_SAVE_KEY)||localStorage.getItem(OLD_SAVE_KEY);if(!raw)return;
 try{
  const d=JSON.parse(raw);t=Math.max(0,Number(d.t)||0);value=Math.max(0,Number(d.value)||0);
  aLevel=Math.max(0,Number(d.aLevel)||0);bLevel=Math.max(0,Number(d.bLevel)||0);cLevel=Math.max(0,Number(d.cLevel)||0);dLevel=Math.max(0,Number(d.dLevel)||0);eLevel=Math.max(0,Number(d.eLevel)||0);
  autoBuyA=d.autoBuyA!==false;autoBuyB=d.autoBuyB!==false;autoBuyC=d.autoBuyC!==false;autoBuyD=d.autoBuyD!==false;autoBuyE=d.autoBuyE!==false;
  const elapsed=Math.max(0,(Date.now()-(Number(d.lastTime)||Date.now()))/1000);
  if(FA_META.settings.offline!==false&&elapsed>2){const away=Math.min(elapsed,28800)*.35;t+=away;value+=integrateOffline(away);}
 }catch(err){console.error("Save data could not be loaded",err)}
}
function integrateOffline(seconds){const start=t;return BASE_PRODUCTION*metaBonus("production")*metaBonus("time")*((Math.pow(start+seconds+1,3)-Math.pow(start+1,3))/3)*.82}
function manualSave(){saveGame(true);saveMeta();savePrestige();const button=document.querySelector(".small-action");if(button){const old=button.textContent;button.textContent=FA_META.language==="ru"?"СОХРАНЕНО":"SAVED";setTimeout(()=>button.textContent=old,1200)}}
function resetSave(){
 if(!confirm(FA_META.language==="ru"?"Удалить весь прогресс, включая исследования и древо?":"Delete all progress, including research and the tree?"))return;
 [SAVE_KEY,LEGACY_SAVE_KEY,OLD_SAVE_KEY,"prestigeSave","faMeta","faTree"].forEach(k=>localStorage.removeItem(k));
 location.reload();
}
function format(n){
 if(!Number.isFinite(n))return "∞";if(n<1000)return Math.floor(n).toString();if(FA_META.settings.compact===false&&n<1e15)return Math.floor(n).toLocaleString("en-US");
 if(FA_META.notation==="scientific")return n.toExponential(2);
 if(FA_META.notation==="engineering"){const e=Math.floor(Math.log10(n)/3)*3;return (n/Math.pow(10,e)).toFixed(2)+"e"+e}
 const units=["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc","UDc","DDc","TDc","QaDc","QiDc","SxDc","SpDc","OcDc","NoDc","Vg","UVg","DVg","TVg","QaVg","QiVg","SxVg","SpVg","OcVg","NoVg","Tg","UTg","DTg","TTg","QaTg","QiTg","SxTg","SpTg","OcTg","NoTg","Qd","UQd","DQd","TQd","QaQd","QiQd","SxQd","SpQd","OcQd","NoQd","Qn","UQn","DQn","TQn","QaQn","QiQn","SxQn","SpQn","OcQn","NoQn","Se","USe","DSe","TSe","QaSe","QiSe","SxSe","SpSe","OcSe","NoSe","St","USt","DSt","TSt","QaSt","QiSt","SxSt","SpSt","OcSt","NoSt","Og","UOg","DOg","TOg","QaOg","QiOg","SxOg","SpOg","OcOg","NoOg","Ng","UNg","DNg","TNg","QaNg","QiNg","SxNg","SpNg","OcNg","NoNg","Ce","UCe"];
 let i=-1;while(n>=1000&&i<units.length-1){n/=1000;i++}return n.toFixed(2)+(units[i]||"e"+((i+1)*3));
}
function getACost(){return 1000*Math.pow(2.5,aLevel)*metaBonus("rootCost")}
function getBCost(){return 100000*Math.pow(2.35,bLevel)}
function getCCost(){return 10000000*Math.pow(2.3,cLevel)}
function getDCost(){return 1000000000*Math.pow(2.25,dLevel)}
function getECost(){return 1000000000000*Math.pow(2.2,eLevel)}
function getA(){if(aLevel<=0)return 1;const root=Math.max(3-aLevel*.01,2);return Math.pow(Math.max(t,1),1/root)}
function getB(){if(bLevel<=0)return 1;return Math.pow(getA(),(.5+bLevel*.01)*metaBonus("power"))}
function getC(){if(cLevel<=0)return 1;const div=10-cLevel;if(div>1)return getA()*getB()/div;return getA()*getB()*(1+((cLevel-10)*.01))*metaBonus("product")}
function getD(){if(dLevel<=0)return 1;return(getA()+getB()+getC())*(1+dLevel*.05)*metaBonus("sigma")}
function getE(){if(eLevel<=0)return 1;const base=Math.max(5-eLevel*.01,2),inside=Math.max(getA()*getB()*getC()*getD(),1);return Math.log(inside)/Math.log(base)*metaBonus("log")}
function getGain(){
 let boost=(1+(prestigeUpgrades.simpleBoost||0)*.25)*metaBonus("production")*metaBonus("time");
 const base=getA()*getB()*getC()*getD()*getE();
 let result;
 if((prestigeUpgrades.globalSum||0)===0)result=Math.pow(t+1,2)*base*boost;
 else{let sum=0;for(let i=1;i<=prestigeUpgrades.globalSum;i++)sum+=Math.pow(t+i,2);result=sum*base*boost}
 result*=BASE_PRODUCTION;
 if(FA_META.treeUnlocked&&typeof treeProductionMultiplier==="function")result*=treeProductionMultiplier();
 return Number.isFinite(result)?result:0;
}
function getGrowthPerSecond(){return getGain()}
function setBtn(btn,cost){if(!btn)return;btn.classList.toggle("good",value>=cost);btn.classList.toggle("bad",value<cost)}
function purchase(cost,fn){if(value<cost)return;value-=cost;fn();FA_META.stats.purchases++;saveMeta();updateUI()}
function buyA(){purchase(getACost(),()=>aLevel++)}function buyB(){purchase(getBCost(),()=>bLevel++)}function buyC(){purchase(getCCost(),()=>cLevel++)}function buyD(){purchase(getDCost(),()=>dLevel++)}function buyE(){purchase(getECost(),()=>eLevel++)}
function updateFormulaText(){let f=(prestigeUpgrades.globalSum||0)===0?"f(t)=t²":"f(t)=Σ₁→"+prestigeUpgrades.globalSum+"((t+i)²";if(aLevel)f+=" × a";if(bLevel)f+=" × b";if(cLevel)f+=" × c";if(dLevel)f+=" × d";if(eLevel)f+=" × e";if(prestigeUpgrades.globalSum)f+=")";formulaDisplay.textContent=f}
function updateUI(){
 timeDisplay.textContent=t.toFixed(1);valueDisplay.textContent=format(value);growthDisplay.textContent=format(getGrowthPerSecond());
 aLevelDisplay.textContent=aLevel;bLevelDisplay.textContent=bLevel;cLevelDisplay.textContent=cLevel;dLevelDisplay.textContent=dLevel;eLevelDisplay.textContent=eLevel;
 $("aFormula").textContent="a = t^(1/"+Math.max(3-aLevel*.01,2).toFixed(2)+")";
 $("bFormula").textContent="b = a^"+(.5+bLevel*.01).toFixed(2);
 const div=10-cLevel;$("cFormula").textContent=div>1?"c = a*b/"+div:"c = a*b*"+(1+(cLevel-10)*.01).toFixed(2);
 $("dFormula").textContent="d = (a+b+c)*"+(1+dLevel*.05).toFixed(2);
 $("eFormula").textContent="e = log"+Math.max(5-eLevel*.01,2).toFixed(2)+"(a*b*c*d)";
 setBtn(btnA,getACost());setBtn(btnB,getBCost());setBtn(btnC,getCCost());setBtn(btnD,getDCost());setBtn(btnE,getECost());
 aCostDisplay.textContent=format(getACost());bCostDisplay.textContent=format(getBCost());cCostDisplay.textContent=format(getCCost());dCostDisplay.textContent=format(getDCost());eCostDisplay.textContent=format(getECost());
 for(const [id,on] of [["autoA",autoBuyA],["autoB",autoBuyB],["autoC",autoBuyC],["autoD",autoBuyD],["autoE",autoBuyE]])$(id).textContent=on?tr("autoOn"):tr("autoOff");for(const b of [btnA,btnB,btnC,btnD,btnE])b.textContent=tr("buyUpgrade");
 updateFormulaText();if(window.refreshTree)window.refreshTree();
}
function toggleAutoA(){autoBuyA=!autoBuyA;updateUI()}function toggleAutoB(){autoBuyB=!autoBuyB;updateUI()}function toggleAutoC(){autoBuyC=!autoBuyC;updateUI()}function toggleAutoD(){autoBuyD=!autoBuyD;updateUI()}function toggleAutoE(){autoBuyE=!autoBuyE;updateUI()}
function autoBuy(){const researchAuto=Math.floor((FA_META.research[7]||0)/2);const unlocked=Math.max(prestigeUpgrades.autoBuyer||0,researchAuto);if(unlocked>=1&&autoBuyA&&value>=getACost())buyA();if(unlocked>=2&&autoBuyB&&value>=getBCost())buyB();if(unlocked>=3&&autoBuyC&&value>=getCCost())buyC();if(unlocked>=4&&autoBuyD&&value>=getDCost())buyD();if(unlocked>=5&&autoBuyE&&value>=getECost())buyE()}
function loop(){
 const now=performance.now(),delta=Math.min((now-lastFrame)/1000,.25);lastFrame=now;
 t+=delta;const gain=getGain()*delta;value+=gain;FA_META.stats.totalPlayTime+=delta;FA_META.stats.lifetimeValue+=gain;
 autoBuy();updateUI();
}
loadGame();updateUI();lastFrame=performance.now();
setInterval(loop,TICK);setInterval(saveGame,AUTOSAVE_INTERVAL);setInterval(saveMeta,10000);
window.addEventListener("beforeunload",()=>{saveGame();saveMeta()});