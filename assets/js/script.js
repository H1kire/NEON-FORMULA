// FORMULA ASCENT — core idle simulation
const TICK=10, AUTOSAVE_INTERVAL=5000, BASE_PRODUCTION=0.08;
let lastFrame=Date.now(),t=0,value=0;
// prestigeUpgrades is owned by prestige.js; avoid a duplicate global lexical declaration.
let aLevel=0,bLevel=0,cLevel=0,dLevel=0,eLevel=0;
const SAVE_KEY="formula_ascent_save_v2",LEGACY_SAVE_KEY="formula_ascent_save_v1",OLD_SAVE_KEY="neon_formula_idle_v4_5";
const $=id=>document.getElementById(id);
const timeDisplay=$("time"),valueDisplay=$("value"),growthDisplay=$("growth"),formulaDisplay=$("formulaText");
const aLevelDisplay=$("aLevel"),bLevelDisplay=$("bLevel"),cLevelDisplay=$("cLevel"),dLevelDisplay=$("dLevel"),eLevelDisplay=$("eLevel");
const btnA=$("btnA"),btnB=$("btnB"),btnC=$("btnC"),btnD=$("btnD"),btnE=$("btnE");
const aCostDisplay=$("aCost"),bCostDisplay=$("bCost"),cCostDisplay=$("cCost"),dCostDisplay=$("dCost"),eCostDisplay=$("eCost");
function metaBonus(type){return typeof getMetaBonus==="function"?getMetaBonus(type):1}
function saveGame(force=false){
 if(!force&&FA_META.settings.autosave===false)return false;
 const data={t,value,aLevel,bLevel,cLevel,dLevel,eLevel,lastTime:Date.now()};
 return FAStorage.setJSON(SAVE_KEY,data);
}
function loadGame(){
 let sourceKey=SAVE_KEY,d=FAStorage.getJSON(SAVE_KEY,null);
 if(!d){sourceKey=LEGACY_SAVE_KEY;d=FAStorage.getJSON(LEGACY_SAVE_KEY,null)}
 if(!d){sourceKey=OLD_SAVE_KEY;d=FAStorage.getJSON(OLD_SAVE_KEY,null)}
 if(!d||typeof d!=="object")return;
 try{
  t=Math.max(0,Number(d.t)||0);value=Math.min(Number.MAX_VALUE,Math.max(0,Number(d.value)||0));
  aLevel=Math.max(0,Number(d.aLevel)||0);bLevel=Math.max(0,Number(d.bLevel)||0);cLevel=Math.max(0,Number(d.cLevel)||0);dLevel=Math.max(0,Number(d.dLevel)||0);eLevel=Math.max(0,Number(d.eLevel)||0);
  const elapsed=Math.max(0,(Date.now()-(Number(d.lastTime)||Date.now()))/1000);
  if(FA_META.settings.offline!==false&&elapsed>2){const away=Math.min(elapsed,28800)*.35;value=Math.min(Number.MAX_VALUE,value+integrateOffline(away));t+=away;}
  if(sourceKey!==SAVE_KEY&&saveGame(true))FAStorage.remove(sourceKey);
 }catch(err){console.error("Save data could not be loaded",err)}
}
function integrateOffline(seconds){const origin=t,steps=Math.min(28800,Math.max(1,Math.ceil(seconds))),step=seconds/steps;let total=0;try{for(let i=0;i<steps;i++){t=origin+(i+.5)*step;total=Math.min(Number.MAX_VALUE,total+getGain()*step)}}finally{t=origin}return Math.min(Number.MAX_VALUE,total*.82)}
function manualSave(){const results=[saveGame(true),saveMeta(),savePrestige()],ok=results.every(Boolean);const button=$("manualSaveBtn");if(button){const old=button.textContent;button.textContent=ok?(FA_META.language==="ru"?"СОХРАНЕНО":"SAVED"):(FA_META.language==="ru"?"ОШИБКА СОХРАНЕНИЯ":"SAVE FAILED");setTimeout(()=>button.textContent=old,1600)}}
function resetSave(){
 if(!confirm(FA_META.language==="ru"?"Удалить весь прогресс, включая исследования и древо?":"Delete all progress, including research and the tree?"))return;
 FAStorage.removeMany([SAVE_KEY,LEGACY_SAVE_KEY,OLD_SAVE_KEY,"prestigeSave","faMeta","faTree"]);
 location.reload();
}
function format(n){
 if(!Number.isFinite(n))return "∞";
 if(n>=1.79e308)return n.toExponential(2);
 if(n<1e6)return Math.floor(n).toLocaleString(FA_META.language==="ru"?"ru-RU":"en-US");
 if(FA_META.settings.compact===false&&n<1e15)return Math.floor(n).toLocaleString(FA_META.language==="ru"?"ru-RU":"en-US");
 if(FA_META.notation==="scientific")return n.toExponential(2);
 if(FA_META.notation==="engineering"){const e=Math.floor(Math.log10(n)/3)*3;return (n/Math.pow(10,e)).toFixed(2)+"e"+e}
 const units=["M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc","UDc","DDc","TDc","QaDc","QiDc","SxDc","SpDc","OcDc","NoDc","Vg","UVg","DVg","TVg","QaVg","QiVg","SxVg","SpVg","OcVg","NoVg","Tg","UTg","DTg","TTg","QaTg","QiTg","SxTg","SpTg","OcTg","NoTg","Qd","UQd","DQd","TQd","QaQd","QiQd","SxQd","SpQd","OcQd","NoQd","Qn","UQn","DQn","TQn","QaQn","QiQn","SxQn","SpQn","OcQn","NoQn","Se","USe","DSe","TSe","QaSe","QiSe","SxSe","SpSe","OcSe","NoSe","St","USt","DSt","TSt","QaSt","QiSt","SxSt","SpSt","OcSt","NoSt","Og","UOg","DOg","TOg","QaOg","QiOg","SxOg","SpOg","OcOg","NoOg","Nn","UNn","DNn","TNn","QaNn","QiNn","SxNn","SpNn","OcNn","NoNn","Ce"];
 let group=Math.floor(Math.log10(n)/3),index=group-2;
 if(index<0)return Math.floor(n).toLocaleString(FA_META.language==="ru"?"ru-RU":"en-US");
 if(index>=units.length)return n.toExponential(2);
 let scaled=n/Math.pow(1000,group);
 if(Number(scaled.toFixed(2))>=1000){group++;index++;if(index>=units.length)return n.toExponential(2);scaled=n/Math.pow(1000,group)}
 return scaled.toFixed(2)+units[index];
}
function getACost(){return 1000*Math.pow(2.5,aLevel)*metaBonus("rootCost")}
function getBCost(){return 100000*Math.pow(2.35,bLevel)}
function getCCost(){return 10000000*Math.pow(2.3,cLevel)}
function getDCost(){return 1000000000*Math.pow(2.25,dLevel)}
function getECost(){return 1000000000000*Math.pow(2.2,eLevel)}
// Stable helpers for the special functions used by modules A-E.
function safeProduct(...values){
 let result=1;
 for(const value of values){
  if(!Number.isFinite(value)||value<=0)return value===0?0:Number.MAX_VALUE;
  if(result>Number.MAX_VALUE/value)return Number.MAX_VALUE;
  result*=value;
 }
 return result;
}
// Principal real branch of Lambert W for x >= 1, solved in log-space.
function lambertW(x){
 if(!(x>0))return 0;
 const logX=Math.log(x);
 let w=x<3?x/(1+x):Math.max(1e-12,logX-Math.log(Math.max(logX,1e-12)));
 for(let i=0;i<12;i++){
  const g=w+Math.log(w)-logX;
  const delta=(2*g*w*(w+1))/(2*(w+1)*(w+1)+g);
  w=Math.max(1e-12,w-delta);
  if(Math.abs(delta)<1e-13*Math.max(1,w))break;
 }
 return w;
}
// Abramowitz-Stegun approximation; sufficient for a smooth idle-game multiplier.
function erfApprox(x){
 x=Math.max(0,Number(x)||0);
 if(x===0)return 0;
 const p=0.3275911,a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429;
 const z=1/(1+p*x);
 const poly=(((((a5*z+a4)*z)+a3)*z+a2)*z+a1)*z;
 return Math.min(1,Math.max(0,1-poly*Math.exp(-x*x)));
}
function levelScale(level,cap=100){return 1+Math.min(Math.max(0,level),cap)*.02}
function getA(){
 if(aLevel<=0)return 1;
 const root=Math.max(2.63-Math.min(aLevel,63)*.01,2);
 return Math.pow(1+t/86400,1/root);
}
function getB(){
 if(bLevel<=0)return 1;
 const divisor=20/(levelScale(bLevel)*metaBonus("power"));
 return 1+lambertW(getA())/divisor;
}
function getC(){
 if(cLevel<=0)return 1;
 const divisor=40/(levelScale(cLevel)*metaBonus("product"));
 return 1+Math.log1p(safeProduct(getA(),getB()))/divisor;
}
function getD(){
 if(dLevel<=0)return 1;
 // Module levels and research accelerate the approach to erf's fixed 1.05 cap.
 const abc=safeProduct(getA(),getB(),getC(),levelScale(dLevel),metaBonus("sigma"));
 return 1+erfApprox(Math.sqrt(Math.log1p(abc)))/20;
}
function getE(){
 if(eLevel<=0)return 1;
 // Integral from 0 to x of 1/(1+u^2) du = atan(x); its cap stays 1 + pi/200.
 const abcd=safeProduct(getA(),getB(),getC(),getD(),levelScale(eLevel),metaBonus("log"));
 return 1+Math.atan(abcd)/100;
}
function getGain(){
 let boost=(1+(prestigeUpgrades.simpleBoost||0)*.25)*metaBonus("production")*metaBonus("time");
 const base=safeProduct(getA(),getB(),getC(),getD(),getE());
 let result;
 if((prestigeUpgrades.globalSum||0)===0)result=Math.pow(t+1,2)*base*boost;
 else{let sum=0;for(let i=1;i<=prestigeUpgrades.globalSum;i++)sum+=Math.pow(t+i,2);result=sum*base*boost}
 result*=BASE_PRODUCTION;
 if(FA_META.treeUnlocked&&typeof treeProductionMultiplier==="function")result*=treeProductionMultiplier();
 return Number.isNaN(result)||result<0?0:Math.min(result,Number.MAX_VALUE);
}
function getGrowthPerSecond(){return getGain()}
function setBtn(btn,cost){if(!btn)return;btn.classList.toggle("good",value>=cost);btn.classList.toggle("bad",value<cost)}
function purchase(cost,fn){if(value<cost)return;value-=cost;fn();FA_META.stats.purchases++;saveMeta();updateUI()}
function buyA(){purchase(getACost(),()=>aLevel++)}function buyB(){purchase(getBCost(),()=>bLevel++)}function buyC(){purchase(getCCost(),()=>cLevel++)}function buyD(){purchase(getDCost(),()=>dLevel++)}function buyE(){purchase(getECost(),()=>eLevel++)}
function updateFormulaText(){
 const n=prestigeUpgrades.globalSum||0;
 let latex=n===0?"f(t)=t^{2}":"f(t)=\\sum_{i=1}^{"+n+"}(t+i)^2";
 let plain=n===0?"f(t)=t²":"f(t)=Σ₁→"+n+"((t+i)²";
 if(aLevel){latex+=" \\cdot a";plain+=" × a"}if(bLevel){latex+=" \\cdot b";plain+=" × b"}if(cLevel){latex+=" \\cdot c";plain+=" × c"}if(dLevel){latex+=" \\cdot d";plain+=" × d"}if(eLevel){latex+=" \\cdot e";plain+=" × e"}
 if(n)plain+=")";
 if(window.FAFormula&&window.katex)FAFormula.render("formulaText",latex,{displayMode:true});else formulaDisplay.textContent=plain;
}
function updateUI(){
 timeDisplay.textContent=t.toFixed(1);valueDisplay.textContent=format(value);growthDisplay.textContent=format(getGrowthPerSecond());
 aLevelDisplay.textContent=aLevel;bLevelDisplay.textContent=bLevel;cLevelDisplay.textContent=cLevel;dLevelDisplay.textContent=dLevel;eLevelDisplay.textContent=eLevel;
 if(window.FAFormula&&window.katex){
  FAFormula.render("aFormula","a=\\left(1+\\frac{t}{86400}\\right)^{\\frac{1}{"+Math.max(2.63-Math.min(aLevel,63)*.01,2).toFixed(2)+"}}");
  FAFormula.render("bFormula","b=1+\\frac{W(a)}{"+(20/(levelScale(bLevel)*metaBonus("power"))).toFixed(2)+"}");
  FAFormula.render("cFormula","c=1+\\frac{\\ln(1+a\\cdot b)}{"+(40/(levelScale(cLevel)*metaBonus("product"))).toFixed(2)+"}");
  FAFormula.render("dFormula","d=1+\\frac{\\operatorname{erf}\\left(\\sqrt{\\ln\\left(1+abc\\cdot "+(levelScale(dLevel)*metaBonus("sigma")).toFixed(2)+"\\right)}\\right)}{20}");
  FAFormula.render("eFormula","e=1+\\frac{\\arctan\\left(abcd\\cdot "+(levelScale(eLevel)*metaBonus("log")).toFixed(2)+"\\right)}{100}");
 }else{
 $("aFormula").textContent="a = (1 + t / 86,400)^(1/"+Math.max(2.63-Math.min(aLevel,63)*.01,2).toFixed(2)+")";
 $("bFormula").textContent="b = 1 + W(a)/"+(20/(levelScale(bLevel)*metaBonus("power"))).toFixed(2);
 $("cFormula").textContent="c = 1 + ln(1 + a·b)/"+(40/(levelScale(cLevel)*metaBonus("product"))).toFixed(2);
 $("dFormula").textContent="d = 1 + erf(√ln(1 + a·b·c × "+(levelScale(dLevel)*metaBonus("sigma")).toFixed(2)+"))/20";
 $("eFormula").textContent="e = 1 + atan(a·b·c·d × "+(levelScale(eLevel)*metaBonus("log")).toFixed(2)+")/100";
 }
 setBtn(btnA,getACost());setBtn(btnB,getBCost());setBtn(btnC,getCCost());setBtn(btnD,getDCost());setBtn(btnE,getECost());
 aCostDisplay.textContent=format(getACost());bCostDisplay.textContent=format(getBCost());cCostDisplay.textContent=format(getCCost());dCostDisplay.textContent=format(getDCost());eCostDisplay.textContent=format(getECost());
 for(const b of [btnA,btnB,btnC,btnD,btnE])b.textContent=tr("buyUpgrade");
 updateFormulaText();if(window.refreshTree)window.refreshTree();
}
function autoBuy(){const a=FA_META.automation;if(!a||a.paused||FA_META.research[7]<1)return;const efficiency=metaBonus("auto"),costs=[getACost(),getBCost(),getCCost(),getDCost(),getECost()].map(cost=>cost/efficiency),actions=[()=>aLevel++,()=>bLevel++,()=>cLevel++,()=>dLevel++,()=>eLevel++];for(let i=0;i<5;i++)if(a.unlocked[i]&&a.enabled[i]&&value>=costs[i])purchase(costs[i],actions[i])}
function loop(){
 const now=performance.now(),delta=Math.min((now-lastFrame)/1000,.25);lastFrame=now;
 t+=delta;const gain=getGain()*delta;value=Math.min(Number.MAX_VALUE,value+gain);FA_META.stats.totalPlayTime+=delta;FA_META.stats.lifetimeValue=Math.min(Number.MAX_VALUE,FA_META.stats.lifetimeValue+gain);
 autoBuy();updateUI();
}
loadGame();updateUI();lastFrame=performance.now();
setInterval(loop,TICK);setInterval(saveGame,AUTOSAVE_INTERVAL);setInterval(saveMeta,10000);
window.addEventListener("beforeunload",()=>{saveGame();saveMeta()});