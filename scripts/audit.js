"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),errors=[],warnings=[];
const read=file=>fs.readFileSync(path.join(root,file),"utf8"),exists=file=>fs.existsSync(path.join(root,file));
const fail=message=>errors.push(message),pass=message=>process.stdout.write("  OK  "+message+"\n");
const required=["index.html","README.md","docs/LEGACY_FORMULAS.md","package.json","assets/css/style.css","assets/css/formula-math.css","assets/vendor/katex/katex.min.css","assets/vendor/katex/katex.min.js","assets/vendor/katex/fonts","assets/js/storage.js","assets/js/prestige.js","assets/js/tree.js","assets/js/app-ui.js","assets/js/formula-renderer.js","assets/js/script.js"];
for(const file of required){if(!exists(file))fail("Missing "+file);else pass("Found "+file)}
if(exists(".idea"))warnings.push(".idea should not be committed.");
const html=read("index.html"),css=read("assets/css/style.css"),mathCss=read("assets/css/formula-math.css"),jsFiles=["assets/js/storage.js","assets/js/prestige.js","assets/js/tree.js","assets/js/app-ui.js","assets/js/formula-renderer.js","assets/js/script.js"];
const sources=Object.fromEntries(jsFiles.map(file=>[file,read(file)]));
for(const file of jsFiles){try{new vm.Script(sources[file],{filename:file});pass("Syntax "+file)}catch(error){fail("Syntax "+file+": "+error.message)}}
let pkg;try{pkg=JSON.parse(read("package.json"));pass("Valid package.json")}catch(error){fail("Invalid package.json: "+error.message)}
const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]),duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
if(duplicates.length)fail("Duplicate IDs: "+[...new Set(duplicates)].join(", "));else pass("Unique HTML IDs ("+ids.length+")");
const idSet=new Set(ids);
for(const file of jsFiles)for(const m of sources[file].matchAll(/getElementById\(["']([^"']+)["']\)/g))if(!idSet.has(m[1]))fail(file+" missing HTML ID #"+m[1]);
const scriptRefs=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m=>m[1]);
for(const src of scriptRefs)if(!exists(src))fail("Missing script "+src);
const order=["assets/js/storage.js","assets/js/prestige.js","assets/js/tree.js","assets/js/app-ui.js","assets/vendor/katex/katex.min.js","assets/js/formula-renderer.js","assets/js/script.js"];
if(order.join("|")!==scriptRefs.join("|"))fail("Script order incorrect");else pass("Script dependency order");
for(const m of html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.css)["']/g)){if(!exists(m[1]))fail("Missing CSS "+m[1]);else pass("CSS path "+m[1])}
const globals=new Set();
for(const src of Object.values(sources)){for(const m of src.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g))globals.add(m[1]);for(const m of src.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g))globals.add(m[1])}
for(const m of html.matchAll(/\bon(?:click|change|input|submit)=["']([^"']+)["']/g)){const call=m[1].match(/^\s*([A-Za-z_$][\w$]*)\s*\(/);if(call&&!globals.has(call[1]))fail("Missing event function "+call[1])}
const app=sources["assets/js/app-ui.js"],en=app.match(/en:\{([\s\S]*?)\},\s*ru:\{/),ru=app.match(/ru:\{([\s\S]*?)\}\s*\n\s*\};/);
const keySet=b=>new Set([...b.matchAll(/(?:^|,)([A-Za-z_$][\w$]*):/g)].map(m=>m[1]));
if(!en||!ru)fail("Localization dictionaries not found");else{const ek=keySet(en[1]),rk=keySet(ru[1]);for(const m of html.matchAll(/data-i18n=["']([^"']+)["']/g)){if(!ek.has(m[1]))fail("Missing EN key "+m[1]);if(!rk.has(m[1]))fail("Missing RU key "+m[1])}pass("Localization keys")}
const sourceHtml=html.replace(/<!--[\s\S]*?-->/g,""),voidTags=new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]),stack=[];
for(const m of sourceHtml.matchAll(/<\/?([a-zA-Z][\w:-]*)\b[^>]*>/g)){const token=m[0],tag=m[1].toLowerCase();if(token.startsWith("</")){const open=stack.pop();if(open!==tag)fail("HTML nesting mismatch at "+token+" (open "+(open||"none")+")")}else if(!voidTags.has(tag)&&!token.endsWith("/>"))stack.push(tag)}
if(stack.length)fail("Unclosed HTML tags "+stack.join(","));else pass("HTML nesting");
if((css.match(/{/g)||[]).length!==(css.match(/}/g)||[]).length||(mathCss.match(/{/g)||[]).length!==(mathCss.match(/}/g)||[]).length)fail("CSS brace mismatch");else pass("CSS braces");
if(!css.includes(".upgrade-title{color:#e2ebe8;font-size:13px;font-weight:700}")||!css.includes(".upgrade-desc{color:#82938e;font:10px var(--mono);")||!css.includes("#formulaModulePanel .upgrade-title{font-size:16pt}")||!css.includes("#formulaModulePanel .upgrade-desc:not(.math-formula){font-size:16pt}")||!mathCss.includes("font-size: 16pt;")||!mathCss.includes("font-size: 25pt;"))fail("Formula typography sizes do not match the 16 pt / 25 pt specification");else pass("Formula typography sizes and original interface defaults");
for(const file of jsFiles.slice(1))if(/\blocalStorage\b/.test(sources[file]))fail("Direct localStorage access in "+file);
if(!sources["assets/js/tree.js"].includes("const TOTAL=3886"))fail("Upgrade tree count changed");
if(pkg&&(!pkg.scripts?.check||!pkg.scripts?.start))fail("Missing npm scripts");
const formatMatch=sources["assets/js/script.js"].match(/function format\(n\)\{[\s\S]*?\n\}/);
if(!formatMatch)fail("Could not locate number formatter");
else{
  const context={FA_META:{language:"en",settings:{compact:true},notation:"standard"}};
  try{
    vm.runInNewContext(formatMatch[0]+";globalThis.__format=format;",context);
    if(context.__format(999999999999999)!=="1.00Qa")fail("Suffix rollover failed near 1 Qa");
    if(context.__format(1e303)!=="1.00Ce")fail("Ce suffix mapping failed");
    if(context.__format(1.79e308)!=="1.79e+308")fail("Scientific overflow notation failed");
    pass("Number-format boundary tests");
  }catch(error){fail("Number-format runtime test: "+error.message)}
}
const rendererSource=sources["assets/js/formula-renderer.js"],renderCalls=[],renderElement={id:"math",classList:{add:()=>{} }};
try{
  const rendererContext={window:{katex:{render:(latex)=>renderCalls.push(latex)}},document:{getElementById:()=>renderElement}};
  vm.runInNewContext(rendererSource+";window.FAFormula.render('math','x^2');window.FAFormula.render('math','x^2');window.FAFormula.render('math','x^3');",rendererContext);
  if(renderCalls.length!==2)fail("Formula renderer cache did not skip an unchanged expression");
  else pass("KaTeX adapter rendering and cache test");
}catch(error){fail("Formula renderer test: "+error.message)}
const formulaSource=sources["assets/js/script.js"],formulaBlock=formulaSource.slice(formulaSource.indexOf("function safeProduct"),formulaSource.indexOf("function getGain()"));
if(!formulaBlock||formulaBlock.includes("function getGain"))fail("Could not locate recursive A-E formula helpers");
else{
  const context={};
  try{
    const prefix="let aLevel=0,bLevel=0,cLevel=0,dLevel=0,eLevel=0;let formulaState={a:1,b:1,c:1,d:1,e:1};let formulaSteps=0,formulaAccumulator=0;const LETTER_BASE_COSTS={a:1000,b:100000,c:10000000,d:1000000000,e:1000000000000};const bonuses={};const metaBonus=type=>bonuses[type]??(type==='limitExpansion'?0:1);const window={};";
    const tests='for(let i=1;i<=300;i++)updateFormulaState(i);const product=formulaState.a*formulaState.b*formulaState.c*formulaState.d*formulaState.e;if(Math.abs(product-1096.8707881151995)>0.01)throw new Error("Five-minute baseline multiplier mismatch: "+product);if(Object.values(formulaState).some(v=>v<1||!Number.isFinite(v)))throw new Error("A-E produced an invalid multiplier");aLevel=300;const half=getLetterParameters().a;if(Math.abs(half-1.505)>1e-9)throw new Error("300-level soft-cap midpoint mismatch: "+half);bonuses.efficiency=1.4;if(!(getLetterParameters().a<half))throw new Error("Research 1 does not improve global letter efficiency");bonuses.limitExpansion=20;aLevel=10000;bLevel=10000;const expanded=getLetterParameters();if(!(expanded.a<1.2&&expanded.b>1))throw new Error("Research 4 does not expand divisor/exponent limits");bonuses.efficiency=1;bonuses.limitExpansion=0;bonuses.letterExponentReduction=0;bonuses.letterBaseReduction=0;aLevel=0;if(getACost()!==1000)throw new Error("First A purchase price changed");aLevel=1;if(getACost()!==8000)throw new Error("Base 2^3 letter price progression mismatch");bonuses.letterExponentReduction=.99;if(getACost()!==1022)throw new Error("Research 2 99% exponent reduction boundary mismatch");bonuses.letterExponentReduction=0;bonuses.letterBaseReduction=.5;if(getACost()!==1000)throw new Error("Research 3 base reduction floor mismatch");const savedSteps=formulaSteps;advanceFormulaClock(.5);if(formulaSteps!==savedSteps)throw new Error("Formula engine advanced before one real second");advanceFormulaClock(.5);if(formulaSteps!==savedSteps+1)throw new Error("Formula engine did not advance exactly once per real second");globalThis.__formulaTest={product,values:{...formulaState},half,expanded};';
    vm.runInNewContext(prefix+formulaBlock+tests,context);
    pass("Recursive A-E five-minute baseline, global research, soft-cap and price tests");
  }catch(error){fail("Recursive A-E formula runtime test: "+error.message)}
}
const timingSource=sources["assets/js/script.js"];
if(!timingSource.includes("const TICK=10"))fail("The game loop interval must remain 10 ms");
if(!timingSource.includes("result=safeProduct(t*t,base,boost)"))fail("Base production must match f(t)=t^2 without an extra coefficient or time offset");
if(!timingSource.includes("for(let i=0;i<=prestigeUpgrades.globalSum;i++)"))fail("Global Sum must retain the base t^2 term");
if(timingSource.includes("BASE_PRODUCTION")||timingSource.includes("Math.pow(t+1,2),base,boost"))fail("Legacy production coefficient or time offset remains active");
if(!timingSource.includes("setInterval(loop,TICK)"))fail("The 10 ms game loop scheduler is missing");
if(!timingSource.includes("const averageRate=rateBefore+(rateAfter-rateBefore)*0.5"))fail("Production accumulation must use trapezoidal integration");
if(!timingSource.includes("const rateAfter=getGain(),averageRate=rateBefore+(rateAfter-rateBefore)*0.5;"))fail("Offline production must use trapezoidal integration too");
if(!timingSource.includes("const now=performance.now(),delta=Math.max(0,(now-lastFrame)/1000);lastFrame=now;"))fail("Elapsed tick time must not be silently capped or discarded");
if(!timingSource.includes("valueDisplay.textContent=formatPrecise(value,2);growthDisplay.textContent=formatPrecise(getGrowthPerSecond(),2);"))fail("HUD must display fractional total value and growth rate");
if(!timingSource.includes("function formatPrecise(n,digits=2)"))fail("Precise HUD number formatter is missing");
else pass("10 ms tick, accurate elapsed-time integration and HUD precision checks");

const prestigeSource=sources["assets/js/prestige.js"];
const thresholdMatch=prestigeSource.match(/function countThresholds\([\s\S]*?\}\nfunction getPrestigeGain/);
if(!thresholdMatch)fail("Could not locate prestige threshold calculator");
else{
  const countSource=thresholdMatch[0].split("\nfunction getPrestigeGain")[0],context={};
  try{
    vm.runInNewContext(countSource+";globalThis.__count=countThresholds;",context);
    for(const [scale,base,divisor] of [[1e15,1.05,1],[1000,1.1,2.5]]){
      for(const x of [2,3,4]){
        const threshold=scale*Math.pow(base,x/divisor);
        if(context.__count(threshold,scale,base,divisor)!==x-1)fail("Prestige threshold exact-boundary error at x="+x);
        if(context.__count(threshold*(1-1e-12),scale,base,divisor)!==x-2)fail("Prestige threshold below-boundary error at x="+x);
      }
    }
    pass("AP and GP threshold boundary tests");
  }catch(error){fail("Prestige threshold runtime test: "+error.message)}
}
try{
  const memory=new Map(),mockWindow={localStorage:{getItem:key=>memory.has(key)?memory.get(key):null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)}};
  vm.runInNewContext(sources["assets/js/storage.js"],{window:mockWindow,console:{warn:()=>{}}});
  const api=mockWindow.FAStorage;
  if(!api.setJSON("audit",{ok:true})||api.getJSON("audit").ok!==true||!api.remove("audit"))fail("Storage manager read/write/remove test failed");
  const blocked={};Object.defineProperty(blocked,"localStorage",{get(){throw new Error("storage blocked")}});
  vm.runInNewContext(sources["assets/js/storage.js"],{window:blocked,console:{warn:()=>{}}});
  if(blocked.FAStorage.setJSON("audit",{ok:true})!==false||blocked.FAStorage.getJSON("audit","fallback")!=="fallback")fail("Storage-unavailable fallback test failed");
  pass("Storage manager and unavailable-storage tests");
}catch(error){fail("Storage manager runtime test: "+error.message)}
if(!sources["assets/js/script.js"].includes('const away=Math.min(elapsed,28800)*.35;value=Math.min(Number.MAX_VALUE,value+integrateOffline(away));t+=away;'))fail("Offline integration must calculate before advancing the run timer");
if(!sources["assets/js/script.js"].includes("if(sourceKey!==SAVE_KEY&&saveGame(true))FAStorage.remove(sourceKey)"))fail("Legacy saves must be migrated using the current in-memory run state");
if(!sources["assets/js/script.js"].includes('$("manualSaveBtn")'))fail("Manual save button must use its explicit ID");

if(errors.length){process.stderr.write("\nAUDIT FAILED: "+errors.length+" issue(s)\n");for(const e of errors)process.stderr.write("  FAIL "+e+"\n");process.exitCode=1}else{process.stdout.write("\nAUDIT PASSED");if(warnings.length)process.stdout.write(" with warnings");process.stdout.write(".\n")}
for(const w of warnings)process.stdout.write("  WARN "+w+"\n");
