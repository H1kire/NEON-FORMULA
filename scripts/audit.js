"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),errors=[],warnings=[];
const read=file=>fs.readFileSync(path.join(root,file),"utf8"),exists=file=>fs.existsSync(path.join(root,file));
const fail=message=>errors.push(message),pass=message=>process.stdout.write("  OK  "+message+"\n");
const required=["index.html","README.md","package.json","assets/css/style.css","assets/css/formula-math.css","assets/vendor/katex/katex.min.css","assets/vendor/katex/katex.min.js","assets/vendor/katex/fonts","assets/js/storage.js","assets/js/prestige.js","assets/js/tree.js","assets/js/app-ui.js","assets/js/formula-renderer.js","assets/js/font-test.js","assets/js/script.js"];
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
const formulaSource=sources["assets/js/script.js"],formulaBlock=formulaSource.slice(formulaSource.indexOf("// Stable helpers"),formulaSource.indexOf("function getGain()"));
if(!formulaBlock||formulaBlock.includes("function getGain"))fail("Could not locate A-E formula helpers");
else{
  const context={};
  try{
    vm.runInNewContext("let aLevel=1,bLevel=1,cLevel=1,dLevel=1,eLevel=1,t=0;const metaBonus=()=>1;"+formulaBlock+String.raw`
      const w1=lambertW(1),w10=lambertW(10);
      if(Math.abs(w1-0.5671432904097838)>1e-10)throw new Error("Lambert W(1) mismatch");
      if(Math.abs(w10*Math.exp(w10)-10)>1e-8)throw new Error("Lambert W residual mismatch");
      if(Math.abs(erfApprox(1)-0.8427007)>1e-5)throw new Error("erf approximation mismatch");
      const values=[getA(),getB(),getC(),getD(),getE()];
      if(values.some(v=>v<1||!Number.isFinite(v)))throw new Error("A-E multiplier below 1 or non-finite");
      t=1e12;aLevel=bLevel=cLevel=dLevel=eLevel=100;
      const d=getD(),e=getE();
      if(d>1.05+1e-10)throw new Error("D exceeded its 1.05 cap");
      if(e>1+Math.PI/200+1e-10)throw new Error("E exceeded its integral cap");
      globalThis.__formulaTest={w1,w10,d,e};
    `,context);
    pass("A-E special-function and multiplier-cap tests");
  }catch(error){fail("A-E formula runtime test: "+error.message)}
}
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
