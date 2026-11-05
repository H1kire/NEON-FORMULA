// FORMULA ASCENT — core idle simulation and universal letter mathematics
const TICK=10, AUTOSAVE_INTERVAL=5000;
let lastFrame=Date.now(),t=0,value=0;
let aLevel=0,bLevel=0,cLevel=0,dLevel=0,eLevel=0;
const SAVE_KEY="formula_ascent_save_v2",LEGACY_SAVE_KEY="formula_ascent_save_v1",OLD_SAVE_KEY="neon_formula_idle_v4_5";
const $=id=>document.getElementById(id);
const timeDisplay=$("time"),valueDisplay=$("value"),growthDisplay=$("growth"),formulaDisplay=$("formulaText");
const aLevelDisplay=$("aLevel"),bLevelDisplay=$("bLevel"),cLevelDisplay=$("cLevel"),dLevelDisplay=$("dLevel"),eLevelDisplay=$("eLevel");
const btnA=$("btnA"),btnB=$("btnB"),btnC=$("btnC"),btnD=$("btnD"),btnE=$("btnE");
const aCostDisplay=$("aCost"),bCostDisplay=$("bCost"),cCostDisplay=$("cCost"),dCostDisplay=$("dCost"),eCostDisplay=$("eCost");
function metaBonus(type){return typeof getMetaBonus==="function"?getMetaBonus(type):1}
let formulaState={a:1,b:1,c:1,d:1,e:1},formulaSteps=0,formulaAccumulator=0;
const LETTER_BASE_COSTS={a:1000,b:100000,c:10000000,d:1000000000,e:1000000000000};
const LETTER_BASE_PARAMETERS={a:1.81,b:0.652,c:1.66,d:11.7,e:2.057};
function safeProduct(...values){
 let result=1;
 for(const value of values){
  if(value===0)return 0;
  if(!Number.isFinite(value)||value<0)return Number.MAX_VALUE;
  if(value>0&&result>Number.MAX_VALUE/value)return Number.MAX_VALUE;
  result*=value;
 }
 return result;
}
function safePow(base,power){
 if(!(base>0))return 0;
 const exponent=Math.log(base)*power;
 if(exponent>=Math.log(Number.MAX_VALUE))return Number.MAX_VALUE;
 if(exponent<=-745)return 0;
 return Math.exp(exponent);
}
function safeLogProduct(...values){return Math.log1p(safeProduct(...values))}
function getEffectiveLetterLevel(level){
 const efficiency=Math.max(1,metaBonus("efficiency"));
 return Math.max(0,level)*efficiency;
}
function getExpandedParameterLimit(baseLimit,role="divisor"){
 const scale=1+0.01*Math.max(0,metaBonus("limitExpansion"));
 return role==="exponent"?baseLimit*scale:baseLimit/scale;
}
function getLetterParameter(base,target,level){
 const effective=getEffectiveLetterLevel(level);
 const progress=effective/(300+effective);
 return base+(target-base)*progress;
}
function getLetterParameters(){
 return {
  a:getLetterParameter(1.81,getExpandedParameterLimit(1.20,"divisor"),aLevel),
  b:getLetterParameter(0.652,getExpandedParameterLimit(0.90,"exponent"),bLevel),
  c:getLetterParameter(1.66,getExpandedParameterLimit(1.10,"divisor"),cLevel),
  d:getLetterParameter(11.7,getExpandedParameterLimit(7,"divisor"),dLevel),
  e:getLetterParameter(2.057,getExpandedParameterLimit(1.30,"divisor"),eLevel)
 };
}
function getLetterPrice(base,level){
 const exponent=Math.max(0.03,3*(1-Math.min(0.99,Math.max(0,metaBonus("letterExponentReduction")))));
 const baseFactor=Math.max(1,2*(1-Math.min(0.5,Math.max(0,metaBonus("letterBaseReduction")))));
 const growth=Math.pow(baseFactor,exponent);
 const raw=base*Math.pow(growth,Math.max(0,level));
 return Number.isFinite(raw)?Math.min(Number.MAX_VALUE,Math.ceil(raw)):Number.MAX_VALUE;
}
function getACost(){return getLetterPrice(LETTER_BASE_COSTS.a,aLevel)}
function getBCost(){return getLetterPrice(LETTER_BASE_COSTS.b,bLevel)}
function getCCost(){return getLetterPrice(LETTER_BASE_COSTS.c,cLevel)}
function getDCost(){return getLetterPrice(LETTER_BASE_COSTS.d,dLevel)}
function getECost(){return getLetterPrice(LETTER_BASE_COSTS.e,eLevel)}
function updateFormulaState(timeSeconds){
 const old=formulaState,p=getLetterParameters(),coupling=Math.max(1,metaBonus("coupling"));
 const next={
  a:safePow(1+Math.max(0,timeSeconds)/60,(1+Math.log(Math.max(1,old.c))*coupling)/Math.max(1e-12,p.a)),
  b:1+Math.max(0,safePow(Math.max(1,old.a),p.b*coupling)-1)/1.055,
  c:1+safeLogProduct(old.a,old.b,old.c,coupling)/Math.max(1e-12,p.c),
  d:1+Math.sqrt(safeProduct(old.a,old.b,old.c,coupling))/Math.max(1e-12,p.d),
  e:1+safeLogProduct(old.b,old.d,metaBonus("eInput"),coupling)/Math.max(1e-12,p.e)
 };
 for(const key of ["a","b","c","d","e"])if(!Number.isFinite(next[key])||next[key]<1)next[key]=Number.MAX_VALUE;
 formulaState=next;
}
function advanceFormulaClock(delta){
 formulaAccumulator+=Math.max(0,delta);
 while(formulaAccumulator>=1){
  formulaAccumulator-=1;formulaSteps++;
  updateFormulaState(formulaSteps);
 }
}
function resetFormulaState(){formulaState={a:1,b:1,c:1,d:1,e:1};formulaSteps=0;formulaAccumulator=0}
function getA(){return formulaState.a}function getB(){return formulaState.b}function getC(){return formulaState.c}function getD(){return formulaState.d}function getE(){return formulaState.e}
const formulaLetterGetters=[getA,getB,getC,getD,getE];
window.registerFormulaLetter=getter=>{if(typeof getter==="function"&&!formulaLetterGetters.includes(getter))formulaLetterGetters.push(getter)};
function getLetterProduct(){return safeProduct(...formulaLetterGetters.map(getter=>getter()))}
window.FAMathSystem={
 getEffectiveLevel:getEffectiveLetterLevel,
 getParameter:getLetterParameter,
 getExpandedLimit:getExpandedParameterLimit,
 getDependencyStrength:()=>Math.max(1,metaBonus("coupling")),
 getParameters:getLetterParameters,
 getLetterPrice:getLetterPrice,
 getState:()=>({...formulaState})
};
function saveGame(force=false){
 if(!force&&FA_META.settings.autosave===false)return false;
 const data={t,value,aLevel,bLevel,cLevel,dLevel,eLevel,formulaState,formulaSteps,formulaAccumulator,lastTime:Date.now()};
 return FAStorage.setJSON(SAVE_KEY,data);
}
function loadGame(){
 let sourceKey=SAVE_KEY,d=FAStorage.getJSON(SAVE_KEY,null);
 if(!d){sourceKey=LEGACY_SAVE_KEY;d=FAStorage.getJSON(LEGACY_SAVE_KEY,null)}
 if(!d){sourceKey=OLD_SAVE_KEY;d=FAStorage.getJSON(OLD_SAVE_KEY,null)}
 if(!d||typeof d!=="object")return;
 try{
  t=Math.max(0,Number(d.t)||0);value=Math.min(Number.MAX_VALUE,Math.max(0,Number(d.value)||0));
  aLevel=Math.max(0,Math.floor(Number(d.aLevel)||0));bLevel=Math.max(0,Math.floor(Number(d.bLevel)||0));cLevel=Math.max(0,Math.floor(Number(d.cLevel)||0));dLevel=Math.max(0,Math.floor(Number(d.dLevel)||0));eLevel=Math.max(0,Math.floor(Number(d.eLevel)||0));
  const savedState=d.formulaState;
  if(savedState&&["a","b","c","d","e"].every(k=>Number.isFinite(Number(savedState[k]))&&Number(savedState[k])>=1)){
   formulaState={a:Number(savedState.a),b:Number(savedState.b),c:Number(savedState.c),d:Number(savedState.d),e:Number(savedState.e)};
   formulaSteps=Math.max(0,Math.floor(Number(d.formulaSteps)||0));
   formulaAccumulator=Math.max(0,Math.min(.999999,Number(d.formulaAccumulator)||0));
  }else{
   resetFormulaState();
   const rebuild=Math.min(86400,Math.floor(t)),offset=Math.max(0,Math.floor(t)-rebuild);
   formulaSteps=offset;
   for(let i=1;i<=rebuild;i++){formulaSteps++;updateFormulaState(formulaSteps)}
  }
  const elapsed=Math.max(0,(Date.now()-(Number(d.lastTime)||Date.now()))/1000);
  if(FA_META.settings.offline!==false&&elapsed>2){const away=Math.min(elapsed,28800)*.35;value=Math.min(Number.MAX_VALUE,value+integrateOffline(away));t+=away;}
  if(sourceKey!==SAVE_KEY&&saveGame(true))FAStorage.remove(sourceKey);
 }catch(err){console.error("Save data could not be loaded",err)}
}
function integrateOffline(seconds){
 const origin=t,steps=Math.min(28800,Math.max(1,Math.ceil(seconds))),step=seconds/steps;let total=0;
 try{
  for(let i=0;i<steps;i++){
   t=origin+i*step;
   const rateBefore=getGain();
   t=origin+(i+1)*step;advanceFormulaClock(step);
   const rateAfter=getGain(),averageRate=rateBefore+(rateAfter-rateBefore)*0.5;
   total=Math.min(Number.MAX_VALUE,total+safeProduct(averageRate,step));
  }
 }finally{t=origin}
 return Math.min(Number.MAX_VALUE,total*.82);
}
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
function getGlobalSumMultiplier(){
 const n=Math.max(0,Number(prestigeUpgrades.globalSum)||0);
 const legacy=Math.max(0,Number(prestigeUpgrades.simpleBoost)||0);
 return 1+n*(1+0.25*legacy);
}
function getGain(){
 const letterProduct=getLetterProduct();
 const boost=metaBonus("production")*metaBonus("time");
 let result=safeProduct(t*t,getGlobalSumMultiplier(),letterProduct,boost);
 if(FA_META.treeUnlocked&&typeof treeProductionMultiplier==="function")result=safeProduct(result,treeProductionMultiplier());
 return Number.isNaN(result)||result<0?0:Math.min(result,Number.MAX_VALUE);
}
function formatPrecise(n,digits=2){
 if(!Number.isFinite(n))return "∞";
 if(n>=1e6)return format(n);
 return n.toFixed(digits);
}
function getGrowthPerSecond(){return getGain()}
function setBtn(btn,cost){if(!btn)return;btn.classList.toggle("good",value>=cost);btn.classList.toggle("bad",value<cost)}
function purchase(cost,fn){if(value<cost)return;value-=cost;fn();FA_META.stats.purchases++;saveMeta();updateUI()}
function buyA(){purchase(getACost(),()=>aLevel++)}function buyB(){purchase(getBCost(),()=>bLevel++)}function buyC(){purchase(getCCost(),()=>cLevel++)}function buyD(){purchase(getDCost(),()=>dLevel++)}function buyE(){purchase(getECost(),()=>eLevel++)}
function updateFormulaText(){
 const latex="\\begin{aligned}f(t)&=t^{2}\\cdot\\left(\\sum_{i=0}^{"+(prestigeUpgrades.globalSum||0)+"}w_i\\right)\\cdot\\left(\\prod_{\\ell\\in\\mathcal{L}}\\ell\\right)\\\\w_0&=1,\\quad w_{i>0}=1+0.25L\\end{aligned}";
 const plain="f(t)=t² × Σ(i=0…"+(prestigeUpgrades.globalSum||0)+") wᵢ × Π(all letter modules),  w₀=1, wᵢ>0=1+0.25L";
 if(window.FAFormula&&window.katex)FAFormula.render("formulaText",latex,{displayMode:true});else formulaDisplay.textContent=plain;
}
function updateUI(){
 timeDisplay.textContent=t.toFixed(2);valueDisplay.textContent=formatPrecise(value,2);growthDisplay.textContent=formatPrecise(getGrowthPerSecond(),2);
 aLevelDisplay.textContent=aLevel;bLevelDisplay.textContent=bLevel;cLevelDisplay.textContent=cLevel;dLevelDisplay.textContent=dLevel;eLevelDisplay.textContent=eLevel;
 const p=getLetterParameters(),coupling=metaBonus("coupling"),eInput=metaBonus("eInput");
 if(window.FAFormula&&window.katex){
  FAFormula.render("aFormula","a=\\left(1+\\frac{t}{60}\\right)^{\\frac{1+\\ln(c)"+(coupling===1?"":"\\cdot "+coupling.toFixed(2))+"}{"+p.a.toFixed(4)+"}}");
  FAFormula.render("bFormula","b=1+\\frac{a^{"+(p.b*coupling).toFixed(4)+"}-1}{1.055}");
  FAFormula.render("cFormula","c_{n+1}=1+\\frac{\\ln(1+abc_n"+(coupling===1?"":"\\cdot "+coupling.toFixed(2))+ ")}{"+p.c.toFixed(4)+"}");
  FAFormula.render("dFormula","d=1+\\frac{\\sqrt{abc"+(coupling===1?"":"\\cdot "+coupling.toFixed(2))+"}}{"+p.d.toFixed(4)+"}");
  FAFormula.render("eFormula","e=1+\\frac{\\ln(1+bd"+(eInput*coupling===1?"":"\\cdot "+(eInput*coupling).toFixed(2))+ ")}{"+p.e.toFixed(4)+"}");
 }else{
  $("aFormula").textContent="a = (1 + t / 60)^((1 + ln(c)"+(coupling===1?"":" × "+coupling.toFixed(2))+") / "+p.a.toFixed(4)+")";
  $("bFormula").textContent="b = 1 + (a^"+(p.b*coupling).toFixed(4)+" - 1) / 1.055";
  $("cFormula").textContent="c[n+1] = 1 + ln(1 + a*b*c[n]"+(coupling===1?"":" × "+coupling.toFixed(2))+") / "+p.c.toFixed(4);
  $("dFormula").textContent="d = 1 + sqrt(a*b*c"+(coupling===1?"":" × "+coupling.toFixed(2))+") / "+p.d.toFixed(4);
  $("eFormula").textContent="e = 1 + ln(1 + b*d"+(eInput*coupling===1?"":" × "+(eInput*coupling).toFixed(2))+") / "+p.e.toFixed(4);
 }
 setBtn(btnA,getACost());setBtn(btnB,getBCost());setBtn(btnC,getCCost());setBtn(btnD,getDCost());setBtn(btnE,getECost());
 aCostDisplay.textContent=format(getACost());bCostDisplay.textContent=format(getBCost());cCostDisplay.textContent=format(getCCost());dCostDisplay.textContent=format(getDCost());eCostDisplay.textContent=format(getECost());
 for(const b of [btnA,btnB,btnC,btnD,btnE])b.textContent=tr("buyUpgrade");
 updateFormulaText();if(window.refreshTree)window.refreshTree();
}
function autoBuy(){
 const a=FA_META.automation;if(!a||a.paused||FA_META.research[7]<1)return;
 const efficiency=metaBonus("auto"),costs=[getACost(),getBCost(),getCCost(),getDCost(),getECost()].map(cost=>cost/efficiency),actions=[()=>aLevel++,()=>bLevel++,()=>cLevel++,()=>dLevel++,()=>eLevel++];
 for(let i=0;i<5;i++)if(a.unlocked[i]&&a.enabled[i]&&value>=costs[i])purchase(costs[i],actions[i]);
}
function loop(){
 const now=performance.now(),delta=Math.max(0,(now-lastFrame)/1000);lastFrame=now;
 const rateBefore=getGain();
 t+=delta;advanceFormulaClock(delta);
 const rateAfter=getGain();
 // Trapezoidal integration reduces per-tick accumulation error while retaining the 10 ms loop.
 const averageRate=rateBefore+(rateAfter-rateBefore)*0.5;
 const gain=safeProduct(averageRate,delta);
 value=Math.min(Number.MAX_VALUE,value+gain);
 FA_META.stats.totalPlayTime+=delta;
 FA_META.stats.lifetimeValue=Math.min(Number.MAX_VALUE,FA_META.stats.lifetimeValue+gain);
 autoBuy();updateUI();
}
loadGame();updateUI();lastFrame=performance.now();
setInterval(loop,TICK);setInterval(saveGame,AUTOSAVE_INTERVAL);setInterval(saveMeta,10000);
window.addEventListener("beforeunload",()=>{saveGame();saveMeta()});
