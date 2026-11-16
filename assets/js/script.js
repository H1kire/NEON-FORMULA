// FORMULA ASCENT — core idle simulation and universal letter mathematics
const TICK=10, AUTOSAVE_INTERVAL=5000;
let lastFrame=Date.now(),t=0,value=0;
let dilationMode=false,dilationTime=0,dilationCurrency=0,dilationILevel=0,dilationKLevel=0,dilationVLevel=0,dilationTauLevel=0,dilationIntegrating=false,dilationOperationStartedAt=0,dilationOperationReward=0;
let aLevel=0,bLevel=0,cLevel=0,dLevel=0,eLevel=0,fLevel=0,gLevel=0,hLevel=0;
const SAVE_KEY="formula_ascent_save_v2",LEGACY_SAVE_KEY="formula_ascent_save_v1",OLD_SAVE_KEY="neon_formula_idle_v4_5";
const $=id=>document.getElementById(id);
const timeDisplay=$("time"),valueDisplay=$("value"),growthDisplay=$("growth"),formulaDisplay=$("formulaText");
const aLevelDisplay=$("aLevel"),bLevelDisplay=$("bLevel"),cLevelDisplay=$("cLevel"),dLevelDisplay=$("dLevel"),eLevelDisplay=$("eLevel");
const btnA=$("btnA"),btnB=$("btnB"),btnC=$("btnC"),btnD=$("btnD"),btnE=$("btnE");
const aCostDisplay=$("aCost"),bCostDisplay=$("bCost"),cCostDisplay=$("cCost"),dCostDisplay=$("dCost"),eCostDisplay=$("eCost");
function metaBonus(type){return typeof getMetaBonus==="function"?getMetaBonus(type):1}
let formulaState={a:1,b:1,c:1,d:1,e:1},formulaSteps=0,formulaAccumulator=0;
const LETTER_BASE_COSTS={a:1000,b:100000,c:10000000,d:1000000000,e:1000000000000,f:1000000000000000,g:1e18,h:1e21};
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
function getDilationLevels(){return {i:dilationILevel,k:dilationKLevel,v:dilationVLevel,tau:dilationTauLevel}}
function getDilationParameters(){return {i:1+dilationILevel,k:1+0.1*dilationKLevel,v:1+0.5*dilationVLevel,tau:1+0.05*dilationTauLevel}}
function getDilationTimeSpeed(){return 1+0.05*dilationTauLevel}
function getDilationUpgradeCost(key,offset=0){const level=({i:dilationILevel,k:dilationKLevel,v:dilationVLevel,tau:dilationTauLevel})[key]+offset,pricing={i:{base:100000,ratio:2.5},v:{base:250000,ratio:3},k:{base:1000000,ratio:3.5},tau:{base:1000,ratio:10}}[key];if(level===undefined||!pricing)return Number.MAX_SAFE_INTEGER;const cost=pricing.base*Math.pow(pricing.ratio,level);return Number.isFinite(cost)?Math.min(Number.MAX_SAFE_INTEGER,Math.ceil(cost)):Number.MAX_SAFE_INTEGER}
function calculateDilationReward(upper=dilationTime){const {i,k,v}=getDilationParameters(),power=safePow(1+safeProduct(v,Math.max(0,upper)),k+1),difference=Math.max(0,power-1),factor=i/(v*(k+1));return Math.min(Number.MAX_VALUE,safeProduct(factor,difference))}
function completeDilationIntegration(){if(!dilationIntegrating)return;dilationCurrency=Math.min(Number.MAX_VALUE,dilationCurrency+dilationOperationReward);dilationTime=0;dilationIntegrating=false;dilationOperationStartedAt=0;dilationOperationReward=0;saveGame(true);updateUI();if(window.refreshDilationResearch)window.refreshDilationResearch()}
function updateTimeDilationUI(){const unlocked=typeof window.isTimeDilationUnlocked==="function"&&window.isTimeDilationUnlocked(),parameters=getDilationParameters(),timeTab=$("timeDilationTab"),modeToggle=$("dilationModeToggle"),timeDisplay=$("dilationTimeDisplay"),currencyDisplay=$("dilationCurrencyDisplay"),researchCurrency=$("dilationResearchCurrency"),integrate=$("dilationIntegrateBtn"),progressTrack=$("dilationProgressTrack"),progressFill=$("dilationProgressFill"),status=$("dilationOperationStatus"),threshold=$("dilationThresholdText"),timeLabel=$("dilationTimeLabel"),currencyLabel=$("dilationCurrencyLabel");if(timeTab)timeTab.style.display=unlocked?"":"none";if(window.FAFormula){if(timeLabel)FAFormula.render("dilationTimeLabel",(window.FA_META?.language==="ru"?"\\text{НАКОПЛЕНО}":"\\text{ACCUMULATED}")+"\\;t_{dl}");if(currencyLabel)FAFormula.render("dilationCurrencyLabel",window.FA_META?.language==="ru"?"\\text{БАЛАНС}\\;\\Delta t_{dl}":"\\Delta t_{dl}\\;\\text{BALANCE}");for(const key of ["i","v","k"]){const label=$("dilationParameterLabel_"+key),display=$("dilationParameterValue_"+key);if(label&&!label.dataset.mathReady){FAFormula.render("dilationParameterLabel_"+key,key);label.dataset.mathReady="1"}if(display){const value=formatPrecise(parameters[key],2);if(display.textContent!==value)display.textContent=value}}}if(timeDisplay){if(window.FAFormula)FAFormula.renderCurrency("dilationTimeDisplay",formatPrecise(dilationTime,2),"t_{dl}");else timeDisplay.textContent=formatPrecise(dilationTime,2)+" t₍dl₎"}if(currencyDisplay){if(window.FAFormula)FAFormula.renderCurrency("dilationCurrencyDisplay",format(dilationCurrency),"\\Delta t_{dl}");else currencyDisplay.textContent=format(dilationCurrency)+" ∆t₍dl₎"}if(researchCurrency){if(window.FAFormula)FAFormula.renderCurrency("dilationResearchCurrency",format(dilationCurrency),"\\Delta t_{dl}");else researchCurrency.textContent=format(dilationCurrency)+" ∆t_dl"}if(modeToggle){modeToggle.checked=dilationMode;modeToggle.disabled=!unlocked||dilationIntegrating}if(threshold){const thresholdParts=tr("dilationThreshold").split("{time}");if(window.FAFormula&&thresholdParts.length===2){threshold.textContent="";threshold.append(document.createTextNode(thresholdParts[0]));const thresholdValue=document.createElement("span");thresholdValue.id="dilationThresholdValue";const thresholdUnit=document.createElement("span");thresholdUnit.id="dilationThresholdUnit";threshold.append(thresholdValue,document.createTextNode(" "),thresholdUnit);FAFormula.renderText("dilationThresholdValue",format(60));FAFormula.render("dilationThresholdUnit","t_{dl}")}else threshold.textContent=tr("dilationThreshold").replace("{time}",format(60))}if(window.FAFormula)FAFormula.render("dilationFormula","\\Delta t_{dl}=\\int_{0}^{t_{dl}} i(vx+1)^k\\,dx");const hint=$("dilationOperationHint");if(hint){const parts=tr("dilationOperationHint").split("{variable}");if(parts.length===2){hint.textContent="";hint.append(document.createTextNode(parts[0]));const variable=document.createElement("span");variable.id="dilationOperationHintVariable";hint.append(variable,document.createTextNode(parts[1]));if(window.FAFormula)FAFormula.render("dilationOperationHintVariable","t_{dl}");else variable.textContent="t₍dl₎"}else hint.textContent=tr("dilationOperationHint")}const modeDescription=$("dilationModeDescription");if(modeDescription){const modeParts=tr("dilationModeDescription").split("{variable}");if(modeParts.length===2){modeDescription.textContent="";modeDescription.append(document.createTextNode(modeParts[0]));const modeVariable=document.createElement("span");modeVariable.id="dilationModeDescriptionVariable";modeDescription.append(modeVariable,document.createTextNode(modeParts[1]));if(window.FAFormula)FAFormula.render("dilationModeDescriptionVariable","t_{dl}");else modeVariable.textContent="t₍dl₎"}else modeDescription.textContent=tr("dilationModeDescription")}if(integrate){integrate.disabled=!unlocked||!dilationMode||dilationIntegrating||dilationTime<60;integrate.textContent=dilationIntegrating?tr("dilationRunning"):tr("dilationIntegrate")}if(progressTrack)progressTrack.hidden=!dilationIntegrating;if(progressFill&&dilationIntegrating){const progress=Math.max(0,Math.min(1,(Date.now()-dilationOperationStartedAt)/5000));progressFill.style.width=(progress*100).toFixed(1)+"%"}if(status)status.textContent=dilationIntegrating?Math.max(0,5-(Date.now()-dilationOperationStartedAt)/1000).toFixed(1)+" s":dilationMode?tr("dilationModeActive"):tr("dilationModePaused")}
window.updateTimeDilationUI=updateTimeDilationUI;
window.TimeDilation={
 getState:()=>({unlocked:!!window.isTimeDilationUnlocked?.(),mode:dilationMode,time:dilationTime,currency:dilationCurrency,integrating:dilationIntegrating,levels:getDilationLevels(),parameters:getDilationParameters()}),
 getUpgradeCost:getDilationUpgradeCost,
 buyUpgrade:key=>{
  if(!window.isTimeDilationUnlocked?.()||!["i","k","v","tau"].includes(key))return false;
  const quote=window.getUpgradeBatchQuote?window.getUpgradeBatchQuote(dilationCurrency,offset=>getDilationUpgradeCost(key,offset)):{count:1,total:getDilationUpgradeCost(key),affordable:dilationCurrency>=getDilationUpgradeCost(key)};
  if(!quote.count||!quote.affordable)return false;
  dilationCurrency-=quote.total;
  for(let i=0;i<quote.count;i++){if(key==="i")dilationILevel++;else if(key==="k")dilationKLevel++;else if(key==="v")dilationVLevel++;else dilationTauLevel++}
  saveGame(true);updateUI();if(window.refreshDilationResearch)window.refreshDilationResearch();return true
 },
 setMode:enabled=>{if(dilationIntegrating)return false;if(enabled&&!window.isTimeDilationUnlocked?.())return false;dilationMode=!!enabled;lastFrame=performance.now();saveGame(true);updateUI();return true},
 startIntegration:()=>{if(!window.isTimeDilationUnlocked?.()||!dilationMode||dilationIntegrating||dilationTime<60)return false;dilationOperationReward=calculateDilationReward(dilationTime);dilationIntegrating=true;dilationOperationStartedAt=Date.now();saveGame(true);updateUI();return true},
 forceDisable:()=>{dilationMode=false;dilationIntegrating=false;dilationOperationStartedAt=0;dilationOperationReward=0;saveGame(true);updateUI()}
};
window.toggleDilationMode=enabled=>window.TimeDilation.setMode(enabled);
window.setDilationMode=enabled=>window.TimeDilation.setMode(enabled);
window.startDilationIntegration=()=>window.TimeDilation.startIntegration();
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
 const glyphDivisor=typeof window.getGlyphCostDivisor==="function"?Math.max(1,window.getGlyphCostDivisor()):1;
 const exponent=Math.max(0.03,3*(1-Math.min(0.99,Math.max(0,metaBonus("letterExponentReduction")))));
 const baseFactor=Math.max(1,2*(1-Math.min(0.5,Math.max(0,metaBonus("letterBaseReduction")))));
 const growth=Math.pow(baseFactor,exponent);
 const raw=base*Math.pow(growth,Math.max(0,level));
 const adjusted=raw/glyphDivisor;
 return Number.isFinite(adjusted)?Math.max(1,Math.min(Number.MAX_VALUE,Math.ceil(adjusted))):Number.MAX_VALUE;
}
function getACost(offset=0){return getLetterPrice(LETTER_BASE_COSTS.a,aLevel+offset)}
function getBCost(offset=0){return getLetterPrice(LETTER_BASE_COSTS.b,bLevel+offset)}
function getCCost(offset=0){return getLetterPrice(LETTER_BASE_COSTS.c,cLevel+offset)}
function getDCost(offset=0){return getLetterPrice(LETTER_BASE_COSTS.d,dLevel+offset)}
function getECost(offset=0){return getLetterPrice(LETTER_BASE_COSTS.e,eLevel+offset)}
function updateFormulaState(timeSeconds){
 const old=formulaState,p=getLetterParameters(),coupling=Math.max(1,metaBonus("coupling"));
 const formulaTime=timeSeconds*(typeof window.getGlyphFormulaTimeMultiplier==="function"?window.getGlyphFormulaTimeMultiplier():1);
 const next={
  a:safePow(1+Math.max(0,formulaTime)/60,(1+Math.log(Math.max(1,old.c))*coupling)/Math.max(1e-12,p.a)),
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
function getA(){return safeProduct(formulaState.a,getGFactor())}function getB(){return safeProduct(formulaState.b,getGFactor())}function getC(){return safeProduct(formulaState.c,getGFactor())}function getD(){return safeProduct(formulaState.d,getGFactor())}function getE(){return safeProduct(formulaState.e,getGFactor())}
const LETTER_F_BASE_EXPONENT=0.40,LETTER_F_MAX_EXPONENT=0.85,LETTER_F_MAX_LEVEL=4501;
function getFExponent(){return Math.min(LETTER_F_MAX_EXPONENT,LETTER_F_BASE_EXPONENT+Math.max(0,fLevel-1)*0.0001)}
function getFCost(offset=0){return fLevel+offset>=LETTER_F_MAX_LEVEL?Number.MAX_SAFE_INTEGER:getLetterPrice(LETTER_BASE_COSTS.f,fLevel+offset)}
function getF(){
 const unlocked=typeof window.isLetterFUnlocked==="function"&&window.isLetterFUnlocked();
 if(fLevel<=0||!unlocked||t<5)return 1;
 const upper=safeProduct(getA(),getE());
 const integral=Math.log1p(upper);
 const x=safeProduct(Math.log1p(t),integral);
 const powered=safePow(x,getFExponent());
 if(powered>=Math.log(Number.MAX_VALUE))return Number.MAX_VALUE;
 const result=1+Math.exp(powered);
 return Number.isFinite(result)?Math.min(result,Number.MAX_VALUE):Number.MAX_VALUE;
}
const LETTER_H_MAX_LEVEL=30000;
function getG(){
 const unlocked=typeof window.isLetterGUnlocked==="function"&&window.isLetterGUnlocked();
 if(gLevel<=0||!unlocked)return 0;
 const x=Math.log1p(Math.max(0,t))/5,x2=x*x;
 return 0.05*gLevel*(x2/(1+x2));
}
function getGFactor(){return 1+getG()}
function lambertW0(z){
 if(!(z>0))return 0;
 const logZ=Math.log(z);
 let w=z<Math.E?z/(1+z):Math.max(1e-12,logZ-Math.log(Math.max(logZ,1e-12)));
 for(let i=0;i<20;i++){
  const residual=w+Math.log(Math.max(w,1e-300))-logZ;
  const step=residual/(1+1/Math.max(w,1e-300));
  const next=Math.max(0,w-step);
  if(Math.abs(next-w)<=1e-14*Math.max(1,next)){w=next;break}
  w=next;
 }
 return w;
}
function getHBase(){return Math.max(100,250-0.005*hLevel)}
function getHExponent(){
 const product=safeProduct(getA(),getB(),getC(),getD());
 return Math.max(1,Math.log(Math.max(1,product))/Math.log(getHBase()));
}
function getH(){
 const unlocked=typeof window.isLetterHUnlocked==="function"&&window.isLetterHUnlocked();
 if(hLevel<=0||!unlocked)return 1;
 return safePow(lambertW0(Math.max(0,t)/10),getHExponent());
}
function getGCost(offset=0){return getLetterPrice(LETTER_BASE_COSTS.g,gLevel+offset)}
function getHCost(offset=0){return hLevel+offset>=LETTER_H_MAX_LEVEL?Number.MAX_SAFE_INTEGER:getLetterPrice(LETTER_BASE_COSTS.h,hLevel+offset)}

const formulaLetterGetters=[getA,getB,getC,getD,getE,getF,getG,getH];
window.registerFormulaLetter=getter=>{if(typeof getter==="function"&&!formulaLetterGetters.includes(getter))formulaLetterGetters.push(getter)};
function getLetterProduct(){
 const active=[];
 if(aLevel>0)active.push(getA());
 if(bLevel>0)active.push(getB());
 if(cLevel>0)active.push(getC());
 if(dLevel>0)active.push(getD());
 if(eLevel>0)active.push(getE());
 if(fLevel>0&&typeof window.isLetterFUnlocked==="function"&&window.isLetterFUnlocked())active.push(getF());
 if(hLevel>0&&typeof window.isLetterHUnlocked==="function"&&window.isLetterHUnlocked())active.push(getH());
 return safeProduct(...active,...formulaLetterGetters.slice(8).map(getter=>getter()),typeof window.getGlyphLetterValueMultiplier==="function"?window.getGlyphLetterValueMultiplier():1);
}
window.FAMathSystem={
 getEffectiveLevel:getEffectiveLetterLevel,
 getParameter:getLetterParameter,
 getExpandedLimit:getExpandedParameterLimit,
 getDependencyStrength:()=>Math.max(1,metaBonus("coupling")),
 getParameters:getLetterParameters,
 getLetterPrice:getLetterPrice,
 getState:()=>({...formulaState,f:getF(),g:getG(),h:getH(),fLevel,gLevel,hLevel,fExponent:getFExponent(),hBase:getHBase(),hExponent:getHExponent()})
};
function saveGame(force=false){
 if(window.FA_CLOUD_RESTORING)return false;
 if(!force&&FA_META.settings.autosave===false)return false;
 const data={t,value,aLevel,bLevel,cLevel,dLevel,eLevel,fLevel,gLevel,hLevel,formulaState,formulaSteps,formulaAccumulator,dilationMode,dilationTime,dilationCurrency,dilationILevel,dilationKLevel,dilationVLevel,dilationTauLevel,dilationIntegrating,dilationOperationStartedAt,dilationOperationReward,lastTime:Date.now()};
 return FAStorage.setJSON(SAVE_KEY,data);
}
function loadGame(){
 let sourceKey=SAVE_KEY,d=FAStorage.getJSON(SAVE_KEY,null);
 if(!d){sourceKey=LEGACY_SAVE_KEY;d=FAStorage.getJSON(LEGACY_SAVE_KEY,null)}
 if(!d){sourceKey=OLD_SAVE_KEY;d=FAStorage.getJSON(OLD_SAVE_KEY,null)}
 if(!d||typeof d!=="object")return;
 try{
  t=Math.max(0,Number(d.t)||0);value=Math.min(Number.MAX_VALUE,Math.max(0,Number(d.value)||0));
  aLevel=Math.max(0,Math.floor(Number(d.aLevel)||0));bLevel=Math.max(0,Math.floor(Number(d.bLevel)||0));cLevel=Math.max(0,Math.floor(Number(d.cLevel)||0));dLevel=Math.max(0,Math.floor(Number(d.dLevel)||0));eLevel=Math.max(0,Math.floor(Number(d.eLevel)||0));fLevel=Math.max(0,Math.min(LETTER_F_MAX_LEVEL,Math.floor(Number(d.fLevel)||0)));gLevel=Math.max(0,Math.floor(Number(d.gLevel)||0));hLevel=Math.max(0,Math.min(LETTER_H_MAX_LEVEL,Math.floor(Number(d.hLevel)||0)));
  dilationMode=d.dilationMode===true;dilationTime=Math.max(0,Number(d.dilationTime)||0);dilationCurrency=Math.max(0,Number(d.dilationCurrency)||0);dilationILevel=Math.max(0,Math.floor(Number(d.dilationILevel)||0));dilationKLevel=Math.max(0,Math.floor(Number(d.dilationKLevel)||0));dilationVLevel=Math.max(0,Math.floor(Number(d.dilationVLevel)||0));dilationTauLevel=Math.max(0,Math.floor(Number(d.dilationTauLevel)||0));dilationIntegrating=d.dilationIntegrating===true;dilationOperationStartedAt=Math.max(0,Number(d.dilationOperationStartedAt)||0);dilationOperationReward=Math.max(0,Number(d.dilationOperationReward)||0);if(dilationIntegrating&&!dilationOperationStartedAt){dilationIntegrating=false;dilationOperationReward=0}
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
  if(FA_META.settings.offline!==false&&elapsed>2&&!dilationMode){const away=Math.min(elapsed,28800)*.35*getDilationTimeSpeed()*(typeof window.getGlyphOrdinaryTimeMultiplier==="function"?window.getGlyphOrdinaryTimeMultiplier():1);value=Math.min(Number.MAX_VALUE,value+integrateOffline(away));t+=away;}
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
function manualSave(){const results=[saveGame(true),saveMeta(),savePrestige(),saveTreeProgress()],ok=results.every(Boolean);const button=$("manualSaveBtn");if(button){const old=button.textContent;button.textContent=ok?(FA_META.language==="ru"?"СОХРАНЕНО":"SAVED"):(FA_META.language==="ru"?"ОШИБКА СОХРАНЕНИЯ":"SAVE FAILED");setTimeout(()=>button.textContent=old,1600)}}
function resetSave(){
 const message=FA_META.language==="ru"
  ?"Полностью начать игру заново? Будут удалены ВСЕ локальные игровые достижения и улучшения: Score, время, A–H, AP, GP, Research, автоматизация, престижные улучшения, Врата Генезиса и все узлы древа. Настройки и вход в Google сохранятся. Облачное сохранение Firebase НЕ будет затронуто."
  :"Start the game completely from scratch? ALL local game progress will be erased: Score, time, A–H, AP, GP, Research, automation, prestige upgrades, Genesis Gate and every tree node. Settings and Google sign-in will remain. Your Firebase cloud save will NOT be touched.";
 if(!confirm(message))return;
 resetRun();dilationMode=false;dilationTime=0;dilationCurrency=0;dilationILevel=0;dilationKLevel=0;dilationVLevel=0;dilationTauLevel=0;dilationIntegrating=false;dilationOperationStartedAt=0;dilationOperationReward=0;
 p=0;gp=0;prestigeUnlocked=false;glyphShards=0;glyphGpInput=1000;glyphOperationStartedAt=0;glyphOperationAmount=0;glyphOperationReward=0;glyphFragments=0;glyphGsInput=1000;glyphGsOperationStartedAt=0;glyphGsOperationAmount=0;glyphGsOperationReward=0;glyphInventory=[];glyphEquippedId=null;
 prestigeUpgrades={simpleBoost:0,globalSum:0,integralSumCoefficient:0,letterValueBoost:0};
 window.prestigeUpgrades=prestigeUpgrades;
 FA_META.research=Array(10).fill(0);
 FA_META.researchVersion=2;
 FA_META.automation={unlocked:Array(8).fill(false),enabled:Array(8).fill(true),paused:false};
 FA_META.treeUnlocked=false;
 FA_META.treePassPurchased=false;
 FA_META.settings.miniUpgrades=false;
 document.body.classList.remove("mini-upgrades");
 FA_META.stats={totalPlayTime:0,lifetimeValue:0,ascensions:0,genesisPrestiges:0,purchases:0};
 lastFrame=Date.now();
 const removed=FAStorage.removeMany([LEGACY_SAVE_KEY,OLD_SAVE_KEY,"faTree"]);
 const saved=[saveGame(true),savePrestige(),saveMeta()].every(Boolean);
 if(!removed||!saved){
  alert(FA_META.language==="ru"?"Не удалось полностью сохранить сброс на этом устройстве. Проверьте доступ к локальному хранилищу и повторите попытку.":"The full reset could not be saved on this device. Check local storage access and try again.");
  return;
 }
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
function getGlobalSumAdditionalWeight(){
 const n=Math.max(0,Number(prestigeUpgrades.globalSum)||0);
 if(n<=0)return 0;
 const legacy=Math.max(0,Number(prestigeUpgrades.simpleBoost)||0);
 const glyph=1+(typeof window.getGlyphGlobalSumPercent==="function"?window.getGlyphGlobalSumPercent():0);
 const w=(1+0.25*legacy)*glyph,level=Math.max(0,Number(prestigeUpgrades.integralSumCoefficient)||0);
 return Math.min(Number.MAX_VALUE,n*w*(1+level*w));
}
function getGlobalSumMultiplier(){
 const n=Math.max(0,Number(prestigeUpgrades.globalSum)||0);
 if(n<=0)return 1;
 const legacy=Math.max(0,Number(prestigeUpgrades.simpleBoost)||0);
 const glyph=1+(typeof window.getGlyphGlobalSumPercent==="function"?window.getGlyphGlobalSumPercent():0);
 const w=(1+0.25*legacy)*glyph,level=Math.max(0,Number(prestigeUpgrades.integralSumCoefficient)||0);
 return Math.min(Number.MAX_VALUE,(1+level)+n*w*(1+level*w));
}
function getIntegralMultiplier(){
 const upper=Math.max(0,getE()),level=Math.max(0,Number(prestigeUpgrades.integralSumCoefficient)||0),base=Math.max(0,safeProduct(2/3,Math.max(0,safePow(1+upper,1.5)-1))),weightedPart=Math.max(0,safeProduct(2/5,Math.max(0,safePow(1+upper,2.5)-1))-base);
 return Math.min(Number.MAX_VALUE,base+safeProduct(level,weightedPart));
}
function getGain(){
 const letterProduct=getLetterProduct();
 const boost=metaBonus("production")*metaBonus("time");
 const integralUnlocked=typeof window!=="undefined"&&typeof window.isIntegralNodePurchased==="function"&&window.isIntegralNodePurchased();
 const formulaTime=typeof window.getGlyphFormulaTimeMultiplier==="function"?window.getGlyphFormulaTimeMultiplier():1;
 const factors=[safeProduct(t,t,formulaTime,formulaTime)];
 if(integralUnlocked)factors.push(getIntegralMultiplier());
 factors.push(getGlobalSumMultiplier(),letterProduct,1+0.001*Math.max(0,Number(prestigeUpgrades.letterValueBoost)||0),boost);
 let result=safeProduct(...factors);
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
function purchase(cost,fn){if(value<cost)return false;value-=cost;fn();FA_META.stats.purchases++;saveMeta();updateUI();return true}
function purchaseLetterBatch(costGetter,remaining,apply){
 const quote=window.getUpgradeBatchQuote?window.getUpgradeBatchQuote(value,costGetter,remaining):{count:1,total:costGetter(),affordable:value>=costGetter()};
 if(!quote.count||!quote.affordable)return false;
 value-=quote.total;
 for(let i=0;i<quote.count;i++){apply();FA_META.stats.purchases++}
 saveMeta();updateUI();return true;
}
let lastLetterBatchRefresh=0;
function refreshLetterBatchUI(force=false){
 const now=performance.now();if(!force&&now-lastLetterBatchRefresh<250)return;lastLetterBatchRefresh=now;
 const defs=[
  ["a",getACost,Infinity,btnA,"buyUpgrade",null],["b",getBCost,Infinity,btnB,"buyUpgrade",null],["c",getCCost,Infinity,btnC,"buyUpgrade",null],["d",getDCost,Infinity,btnD,"buyUpgrade",null],["e",getECost,Infinity,btnE,"buyUpgrade",null],
  ["f",getFCost,Math.max(0,LETTER_F_MAX_LEVEL-fLevel),$("btnF"),"buyUpgrade","buyF"],["g",getGCost,Infinity,$("btnG"),"buyUpgrade","buyG"],["h",getHCost,Math.max(0,LETTER_H_MAX_LEVEL-hLevel),$("btnH"),"buyUpgrade","buyH"]
 ];
 for(const [key,costGetter,remaining,button,upgradeKey,firstKey] of defs){
  if(!button)continue;
  const quote=window.getUpgradeBatchQuote(value,offset=>costGetter(offset),remaining),maxed=remaining===0;
  const display=$(key+"Cost");
  const shownCost=quote.count?quote.total:costGetter(0);
  if(display){if(maxed)display.textContent=tr("maxed");else if(window.FAFormula)FAFormula.renderText(key+"Cost",format(shownCost));else display.textContent=format(shownCost)}
  setBtn(button,shownCost);button.disabled=maxed||!quote.count||!quote.affordable;
  button.textContent=(quote.count>1?tr(upgradeKey)+" ×"+quote.count:firstKey&&({a:0})[key]===1?tr(firstKey):firstKey&&({f:1,g:1,h:1})[key]?tr(firstKey):tr(upgradeKey));
 }
}
window.refreshLetterBatchUI=()=>refreshLetterBatchUI(true);
function buyA(){purchaseLetterBatch(getACost,Infinity,()=>aLevel++)}function buyB(){purchaseLetterBatch(getBCost,Infinity,()=>bLevel++)}function buyC(){purchaseLetterBatch(getCCost,Infinity,()=>cLevel++)}function buyD(){purchaseLetterBatch(getDCost,Infinity,()=>dLevel++)}function buyE(){purchaseLetterBatch(getECost,Infinity,()=>eLevel++)}
function buyF(){purchaseLetterBatch(getFCost,Math.max(0,LETTER_F_MAX_LEVEL-fLevel),()=>fLevel++)}
function buyG(){if(!window.isLetterGUnlocked?.())return;purchaseLetterBatch(getGCost,Infinity,()=>gLevel++)}
function buyH(){if(!window.isLetterHUnlocked?.())return;purchaseLetterBatch(getHCost,Math.max(0,LETTER_H_MAX_LEVEL-hLevel),()=>hLevel++)}
function updateFormulaText(){
 const sumLevel=Math.max(0,Number(prestigeUpgrades.globalSum)||0);
 const integralUnlocked=typeof window.isIntegralNodePurchased==="function"&&window.isIntegralNodePurchased();
 const sumTerm=sumLevel>0?"\\left(\\sum_{i=0}^{"+sumLevel+"}w_i(1+Lw_i)\\right)\\cdot":"";
 const productTerm="\\prod_{\\ell\\in\\mathcal{L}}\\ell";
 let latex;
 if(integralUnlocked){
  latex="\\begin{aligned}f(t)&=t^{2}\\cdot\\int_{0}^{e}\\sqrt{1+x}(1+Lx)\\cdot"+sumTerm+productTerm+"\\,dx";
 }else{
  latex="\\begin{aligned}f(t)&=t^{2}\\cdot"+sumTerm+productTerm;
 }
 latex+="\\end{aligned}";
 const plain="f(t)=t² × "+(integralUnlocked?"∫₀ᵉ √(1+x)(1+Lx) × ":"")+(sumLevel>0?"Σ(i=0…"+sumLevel+") wᵢ(1+Lwᵢ) × ":"")+"Π(all letter modules)";
 if(window.FAFormula&&window.katex)FAFormula.render("formulaText",latex,{displayMode:true});else formulaDisplay.textContent=plain;
}
function updateUI(){
 timeDisplay.textContent=t.toFixed(2);if(window.FAFormula){FAFormula.renderText("value",formatPrecise(value,2));FAFormula.renderText("growth",formatPrecise(getGrowthPerSecond(),2))}else{valueDisplay.textContent=formatPrecise(value,2);growthDisplay.textContent=formatPrecise(getGrowthPerSecond(),2)}
 aLevelDisplay.textContent=aLevel;bLevelDisplay.textContent=bLevel;cLevelDisplay.textContent=cLevel;dLevelDisplay.textContent=dLevel;eLevelDisplay.textContent=eLevel;
 const p=getLetterParameters(),coupling=metaBonus("coupling"),eInput=metaBonus("eInput");
 if(window.FAFormula&&window.katex){
  FAFormula.render("aFormula","a=\\left(1+\\frac{t}{60}\\right)^{\\frac{1+\\ln(c)"+(coupling===1?"":"\\cdot "+coupling.toFixed(2))+"}{"+p.a.toFixed(4)+"}}");
  FAFormula.render("bFormula","b=1+\\frac{a^{"+(p.b*coupling).toFixed(4)+"}-1}{1.055}");
  FAFormula.render("cFormula","c_{n+1}=1+\\frac{\\ln(1+abc_n"+(coupling===1?"":"\\cdot "+coupling.toFixed(2))+ ")}{"+p.c.toFixed(4)+"}");
  FAFormula.render("dFormula","d=1+\\frac{\\sqrt{abc"+(coupling===1?"":"\\cdot "+coupling.toFixed(2))+"}}{"+p.d.toFixed(4)+"}");
  FAFormula.render("eFormula","e=1+\\frac{\\ln(1+bd"+(eInput*coupling===1?"":"\\cdot "+(eInput*coupling).toFixed(2))+ ")}{"+p.e.toFixed(4)+"}");
  FAFormula.render("fFormula","f=1+\\exp\\left(\\left[\\ln(1+t)\\cdot\\int_{0}^{ae}\\frac{1}{1+x}\\,dx\\right]^{"+getFExponent().toFixed(4)+"}\\right)");
  FAFormula.render("gFormula","g(t)=5L\\%\\cdot\\frac{x^2}{1+x^2},\\quad x=\\frac{\\ln(1+t)}{5}");
  FAFormula.render("hFormula","h(t)=W_0\\left(\\frac{t}{10}\\right)^{\\max\\left(1,\\log_{"+getHBase().toFixed(3)+"}(abcd)\\right)}");
 }else{
  $("aFormula").textContent="a = (1 + t / 60)^((1 + ln(c)"+(coupling===1?"":" × "+coupling.toFixed(2))+") / "+p.a.toFixed(4)+")";
  $("bFormula").textContent="b = 1 + (a^"+(p.b*coupling).toFixed(4)+" - 1) / 1.055";
  $("cFormula").textContent="c[n+1] = 1 + ln(1 + a*b*c[n]"+(coupling===1?"":" × "+coupling.toFixed(2))+") / "+p.c.toFixed(4);
  $("dFormula").textContent="d = 1 + sqrt(a*b*c"+(coupling===1?"":" × "+coupling.toFixed(2))+") / "+p.d.toFixed(4);
  $("eFormula").textContent="e = 1 + ln(1 + b*d"+(eInput*coupling===1?"":" × "+(eInput*coupling).toFixed(2))+") / "+p.e.toFixed(4);
  $("fFormula").textContent="f = 1 + exp([ln(1 + t) × ∫₀ᵃᵉ 1/(1 + x) dx]^"+getFExponent().toFixed(4)+")";
  $("gFormula").textContent="g(t) = 5L% × x² / (1 + x²), x = ln(1 + t) / 5";
  $("hFormula").textContent="h(t) = W₀(t / 10)^max(1, log"+getHBase().toFixed(3)+"(a·b·c·d))";
 }
 setBtn(btnA,getACost());setBtn(btnB,getBCost());setBtn(btnC,getCCost());setBtn(btnD,getDCost());setBtn(btnE,getECost());
 for(const [id,cost] of [["aCost",getACost()],["bCost",getBCost()],["cCost",getCCost()],["dCost",getDCost()],["eCost",getECost()]]){if(window.FAFormula)FAFormula.renderText(id,format(cost));else $(id).textContent=format(cost)}
 for(const b of [btnA,btnB,btnC,btnD,btnE])b.textContent=tr("buyUpgrade");
 const letterFUnlocked=typeof window.isLetterFUnlocked==="function"&&window.isLetterFUnlocked();
  const letterFCard=$("letterFUpgrade"),letterFRow=$("formulaValueFRow");
  if(letterFCard)letterFCard.hidden=!letterFUnlocked;
  if(letterFRow)letterFRow.hidden=!letterFUnlocked;
  const fLevelDisplay=$("fLevel"),fCostDisplay=$("fCost"),fBuyButton=$("btnF");
  if(fLevelDisplay)fLevelDisplay.textContent=fLevel;
  if(fCostDisplay){if(fLevel>=LETTER_F_MAX_LEVEL)fCostDisplay.textContent=tr("maxed");else if(window.FAFormula)FAFormula.renderText("fCost",format(getFCost()));else fCostDisplay.textContent=format(getFCost())}
  if(fBuyButton){setBtn(fBuyButton,getFCost());fBuyButton.disabled=fLevel>=LETTER_F_MAX_LEVEL;fBuyButton.textContent=fLevel===0?tr("buyF"):tr("buyUpgrade");}
  const letterGUnlocked=typeof window.isLetterGUnlocked==="function"&&window.isLetterGUnlocked();
  const letterHUnlocked=typeof window.isLetterHUnlocked==="function"&&window.isLetterHUnlocked();
  const gCard=$("letterGUpgrade"),hCard=$("letterHUpgrade"),gRow=$("formulaValueGRow"),hRow=$("formulaValueHRow");
  if(gCard)gCard.hidden=!letterGUnlocked;if(gRow)gRow.hidden=!letterGUnlocked;
  if(hCard)hCard.hidden=!letterHUnlocked;if(hRow)hRow.hidden=!letterHUnlocked;
  const gLevelDisplay=$("gLevel"),gCostDisplay=$("gCost"),gBuyButton=$("btnG");
  if(gLevelDisplay)gLevelDisplay.textContent=gLevel;if(gCostDisplay){if(window.FAFormula)FAFormula.renderText("gCost",format(getGCost()));else gCostDisplay.textContent=format(getGCost())}
  if(gBuyButton){setBtn(gBuyButton,getGCost());gBuyButton.textContent=gLevel===0?tr("buyG"):tr("buyUpgrade");}
  const hLevelDisplay=$("hLevel"),hCostDisplay=$("hCost"),hBuyButton=$("btnH");
  if(hLevelDisplay)hLevelDisplay.textContent=hLevel;if(hCostDisplay){if(hLevel>=LETTER_H_MAX_LEVEL)hCostDisplay.textContent=tr("maxed");else if(window.FAFormula)FAFormula.renderText("hCost",format(getHCost()));else hCostDisplay.textContent=format(getHCost())}
  if(hBuyButton){setBtn(hBuyButton,getHCost());hBuyButton.disabled=hLevel>=LETTER_H_MAX_LEVEL;hBuyButton.textContent=hLevel===0?tr("buyH"):tr("buyUpgrade");}
  const liveValues={a:getA(),b:getB(),c:getC(),d:getD(),e:getE(),f:getF(),g:getG()*100,h:getH()};
  for(const letter of ["a","b","c","d","e","f","g","h"]){
   const display=$("formulaValue"+letter.toUpperCase());
   if(display)display.textContent=formatPrecise(liveValues[letter],2);
  }
  const sumLevel=Math.max(0,Number(prestigeUpgrades.globalSum)||0);
  const weightList=$("formulaWeightValues");
  if(weightList){
   weightList.hidden=sumLevel<=0;
   const w0Display=$("formulaValueW0"),wiDisplay=$("formulaValueWi");
   if(w0Display)w0Display.textContent="1";
   if(wiDisplay)wiDisplay.textContent=formatPrecise(getGlobalSumAdditionalWeight(),2);
  }
  refreshLetterBatchUI();updateFormulaText();updateTimeDilationUI();if(window.refreshDilationAccess)window.refreshDilationAccess();if(window.refreshTree)window.refreshTree();
}
window.getDeveloperValues=()=>({t,ap:p,gp});
window.applyDeveloperValues=(next)=>{
 if(!window.FAAuth||!window.FAAuth.isDeveloper()||!next||typeof next!=="object")return false;
 const values=[next.t,next.ap,next.gp].map(Number);
 if(values.some(v=>!Number.isFinite(v)||v<0))return false;
 t=Math.min(Number.MAX_VALUE,values[0]);
 p=Math.floor(Math.min(Number.MAX_VALUE,values[1]));
 gp=Math.floor(Math.min(Number.MAX_VALUE,values[2]));
 lastFrame=performance.now();
 const savedRun=saveGame(true),savedPrestige=savePrestige();
 updateUI();updatePrestigeUI();
 return savedRun&&savedPrestige;
};
function applyDeveloperPanel(){
 const timeInput=$("developerTimeInput"),apInput=$("developerAPInput"),gpInput=$("developerGPInput"),status=$("developerStatus");
 if(!window.FAAuth||!window.FAAuth.isDeveloper())return;
 const values=[timeInput?.value,apInput?.value,gpInput?.value];
 if(values.some(v=>v===undefined||String(v).trim()==="")){if(status){status.textContent=tr("developerInvalid");status.dataset.state="error";status.hidden=false}return}
 const ok=window.applyDeveloperValues({t:values[0],ap:values[1],gp:values[2]});
 if(status){status.textContent=ok?tr("developerSaved"):tr("developerInvalid");status.dataset.state=ok?"success":"error";status.hidden=false}
 if(ok&&window.refreshFirebaseAuthUI)window.refreshFirebaseAuthUI();
}
$("developerApplyBtn")?.addEventListener("click",applyDeveloperPanel);
function applyDeveloperTreeRefund(){
 if(!window.FAAuth||!window.FAAuth.isDeveloper())return;
 const status=$("developerTreeRefundStatus");
 const message=tr("developerTreeRefundConfirm");
 if(!confirm(message))return;
 const result=typeof window.refundUpgradeTree==="function"?window.refundUpgradeTree():false;
 if(!result||typeof result!=="object"){
  if(status){status.textContent=tr("developerTreeRefundError");status.dataset.state="error";status.hidden=false}
  return;
 }
 if(result.refunded<=0){
  if(status){status.textContent=tr("developerTreeRefundEmpty");status.dataset.state="success";status.hidden=false}
  return;
 }
 if(status){
  status.textContent=result.saved?tr("developerTreeRefunded").replace("{amount}",format(result.refunded)):tr("developerTreeRefundError");
  status.dataset.state=result.saved?"success":"error";status.hidden=false;
 }
}
$("developerTreeRefundBtn")?.addEventListener("click",applyDeveloperTreeRefund);
function autoBuy(){
 const a=FA_META.automation;if(!a||a.paused||FA_META.research[7]<1)return;
 const efficiency=metaBonus("auto"),costs=[getACost(),getBCost(),getCCost(),getDCost(),getECost(),getFCost(),getGCost(),getHCost()].map(cost=>cost/efficiency),actions=[()=>aLevel++,()=>bLevel++,()=>cLevel++,()=>dLevel++,()=>eLevel++,()=>fLevel++,()=>gLevel++,()=>hLevel++];
 for(let i=0;i<5;i++)if(a.unlocked[i]&&a.enabled[i]&&value>=costs[i])purchase(costs[i],actions[i]);
 if(a.unlocked[5]&&a.enabled[5]&&window.isLetterFUnlocked?.()&&fLevel<LETTER_F_MAX_LEVEL&&value>=costs[5])purchase(costs[5],actions[5]);
 if(a.unlocked[6]&&a.enabled[6]&&window.isLetterGUnlocked?.()&&value>=costs[6])purchase(costs[6],actions[6]);
 if(a.unlocked[7]&&a.enabled[7]&&window.isLetterHUnlocked?.()&&hLevel<LETTER_H_MAX_LEVEL&&value>=costs[7])purchase(costs[7],actions[7]);
}
function loop(){
 if(window.FA_CLOUD_RESTORING)return;
 const now=performance.now(),delta=Math.max(0,(now-lastFrame)/1000);lastFrame=now;
 const rateBefore=getGain();
 const dilationUnlocked=typeof window.isTimeDilationUnlocked==="function"&&window.isTimeDilationUnlocked();
 if(dilationMode&&dilationUnlocked){if(!dilationIntegrating)dilationTime=Math.min(Number.MAX_VALUE,dilationTime+delta*(typeof window.getGlyphDilationTimeMultiplier==="function"?window.getGlyphDilationTimeMultiplier():1))}else{const elapsedT=delta*getDilationTimeSpeed()*(typeof window.getGlyphOrdinaryTimeMultiplier==="function"?window.getGlyphOrdinaryTimeMultiplier():1);t+=elapsedT;advanceFormulaClock(elapsedT)}
 if(dilationIntegrating&&Date.now()-dilationOperationStartedAt>=5000)completeDilationIntegration();
 const rateAfter=getGain();
 // Trapezoidal integration reduces per-tick accumulation error while retaining the 10 ms loop.
 const averageRate=rateBefore+(rateAfter-rateBefore)*0.5;
 const gain=safeProduct(averageRate,delta);
 value=Math.min(Number.MAX_VALUE,value+gain);
 FA_META.stats.totalPlayTime+=delta;
 FA_META.stats.lifetimeValue=Math.min(Number.MAX_VALUE,FA_META.stats.lifetimeValue+gain);
 autoBuy();updateUI();
}
loadGame();if(window.refreshGlyphInventory)window.refreshGlyphInventory();updateUI();lastFrame=performance.now();
setInterval(loop,TICK);setInterval(saveGame,AUTOSAVE_INTERVAL);setInterval(saveMeta,10000);
window.addEventListener("beforeunload",()=>{if(window.FA_CLOUD_RESTORING)return;saveGame();saveMeta()});
