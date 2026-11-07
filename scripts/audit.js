"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),errors=[],warnings=[];
const read=file=>fs.readFileSync(path.join(root,file),"utf8"),exists=file=>fs.existsSync(path.join(root,file));
const fail=message=>errors.push(message),pass=message=>process.stdout.write("  OK  "+message+"\n");
const required=["index.html","README.md","docs/LEGACY_FORMULAS.md","package.json","assets/css/style.css","assets/css/formula-math.css","assets/vendor/katex/katex.min.css","assets/vendor/katex/katex.min.js","assets/vendor/katex/fonts","assets/js/storage.js","assets/js/prestige.js","assets/js/tree.js","assets/js/app-ui.js","assets/js/formula-renderer.js","assets/js/script.js","assets/js/firebase-auth.js","assets/js/firebase-cloud-save.js"];
for(const file of required){if(!exists(file))fail("Missing "+file);else pass("Found "+file)}
if(exists(".idea"))warnings.push(".idea should not be committed.");
const html=read("index.html"),css=read("assets/css/style.css"),mathCss=read("assets/css/formula-math.css"),jsFiles=["assets/js/storage.js","assets/js/prestige.js","assets/js/tree.js","assets/js/app-ui.js","assets/js/formula-renderer.js","assets/js/script.js","assets/js/firebase-auth.js","assets/js/firebase-cloud-save.js"];
const sources=Object.fromEntries(jsFiles.map(file=>[file,read(file)]));
for(const file of jsFiles){try{new vm.Script(sources[file],{filename:file});pass("Syntax "+file)}catch(error){fail("Syntax "+file+": "+error.message)}}
let pkg;try{pkg=JSON.parse(read("package.json"));pass("Valid package.json")}catch(error){fail("Invalid package.json: "+error.message)}
const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]),duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
if(duplicates.length)fail("Duplicate IDs: "+[...new Set(duplicates)].join(", "));else pass("Unique HTML IDs ("+ids.length+")");
const idSet=new Set(ids);
for(const file of jsFiles)for(const m of sources[file].matchAll(/getElementById\(["']([^"']+)["']\)/g))if(!idSet.has(m[1]))fail(file+" missing HTML ID #"+m[1]);
const scriptRefs=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m=>m[1]);
for(const src of scriptRefs)if(!src.startsWith("http")&&!exists(src))fail("Missing script "+src);
const order=["assets/js/storage.js","assets/js/prestige.js","assets/js/tree.js","assets/js/app-ui.js","assets/vendor/katex/katex.min.js","assets/js/formula-renderer.js","assets/js/script.js","https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js","https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js","https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js","https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check-compat.js","assets/js/firebase-auth.js","assets/js/firebase-cloud-save.js"];
if(order.join("|")!==scriptRefs.join("|"))fail("Script order incorrect");else pass("Script dependency order");
for(const m of html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.css)["']/g)){if(!exists(m[1]))fail("Missing CSS "+m[1]);else pass("CSS path "+m[1])}
if(!html.includes("firebase-auth.js")||!html.includes("firebase-auth-compat.js"))fail("Firebase Authentication SDK scripts are missing");
if(!html.includes("firebase-database-compat.js")||!html.includes("firebase-cloud-save.js"))fail("Firebase Realtime Database cloud-save scripts are missing");
if(!html.includes("firebase-app-check-compat.js"))fail("Firebase App Check compat SDK is missing");
if(!sources["assets/js/firebase-auth.js"].includes("ReCaptchaEnterpriseProvider")||!sources["assets/js/firebase-auth.js"].includes("appCheck.activate(")||!sources["assets/js/firebase-auth.js"].includes("6LeHzRMuAAAAABhZcCo-TLLav_-95kDqxsDoZYJS")||!sources["assets/js/firebase-auth.js"].includes("window.FAAppCheck={initialized:true")||!sources["assets/js/firebase-auth.js"].includes("appCheckError"))fail("Firebase App Check Enterprise initialization or diagnostic status is missing");
else pass("Firebase App Check Enterprise provider, public site key, auto-refresh and initialization diagnostics");
if(!sources["assets/js/firebase-cloud-save.js"].includes("saveTreeProgress")||!sources["assets/js/firebase-cloud-save.js"].includes("parseSnapshotData")||!sources["assets/js/firebase-cloud-save.js"].includes("restoreFromCloud"))fail("Complete cloud save/restore implementation is incomplete");
if(!sources["assets/js/firebase-cloud-save.js"].includes('"users/" + checkedUser.uid + "/cloudSave"')||!sources["assets/js/firebase-cloud-save.js"].includes('record.uid === checkedUser.uid')||!sources["assets/js/firebase-cloud-save.js"].includes('record.uid !== restoringUser.uid'))fail("Cloud save must use a per-UID path and verify ownership for both status checks and restore");
if(!sources["assets/js/firebase-cloud-save.js"].includes("FAStorage.getRaw")||!sources["assets/js/firebase-cloud-save.js"].includes("FAStorage.setRaw"))fail("Cloud save must use guarded raw storage helpers");
if(!sources["assets/js/firebase-cloud-save.js"].includes('const SNAPSHOT_KEYS = [GAME_KEY, PRESTIGE_KEY, META_KEY, TREE_KEY]'))fail("Cloud snapshots must include run, prestige, meta/research and upgrade-tree data");
if(!sources["assets/js/firebase-cloud-save.js"].includes("meta.research.every(value => Number.isInteger(value) && value >= 0)")||!sources["assets/js/firebase-cloud-save.js"].includes("meta.automation.unlocked.length !== 5"))fail("Cloud snapshot must validate all Research levels and automation purchases");
if(!sources["assets/js/firebase-cloud-save.js"].includes("for (const key of SNAPSHOT_KEYS) {")||!sources["assets/js/firebase-cloud-save.js"].includes("window.FAStorage.setRaw(key, data[key])"))fail("Cloud restore must replace every saved progression section");
if(!sources["assets/js/script.js"].includes("savePrestige(),saveTreeProgress()"))fail("Manual local save must include upgrade-tree purchases");
if(html.includes('id="fExponent"')||html.includes("letterFPower")||html.includes("letterFActivation"))fail("Letter F card must show only LEVEL and COST stats");
else pass("Letter F compact LEVEL/COST-only card");
try {
 const parserStart=sources["assets/js/firebase-cloud-save.js"].indexOf("  function parseSnapshotData(data) {");
 const parserEnd=sources["assets/js/firebase-cloud-save.js"].indexOf("  function collectLocalSnapshot()",parserStart);
 if(parserStart<0||parserEnd<0)throw new Error("Cloud snapshot parser not found");
 const parser=sources["assets/js/firebase-cloud-save.js"].slice(parserStart,parserEnd).replace(/^  /gm,"");
 const context={GAME_KEY:"formula_ascent_save_v2",PRESTIGE_KEY:"prestigeSave",META_KEY:"faMeta",TREE_KEY:"faTree",SNAPSHOT_KEYS:["formula_ascent_save_v2","prestigeSave","faMeta","faTree"]};
 const snapshot={
  formula_ascent_save_v2:JSON.stringify({t:12,value:345,aLevel:1,bLevel:2,cLevel:3,dLevel:4,eLevel:5,fLevel:1,formulaState:{a:1,b:1,c:1,d:1,e:1},formulaSteps:12,formulaAccumulator:0,lastTime:100}),
  prestigeSave:JSON.stringify({p:123,gp:4,prestigeUnlocked:true,prestigeUpgrades:{simpleBoost:2,globalSum:3}}),
  faMeta:JSON.stringify({research:[1,2,3,4,5,6,7,1,9,10],settings:{autosave:true,offline:true,compact:true,reducedMotion:false},automation:{unlocked:[true,false,false,false,false],enabled:[true,true,true,true,true],paused:false},stats:{totalPlayTime:10,lifetimeValue:100,ascensions:2,genesisPrestiges:1,purchases:20},treeUnlocked:true,treePassPurchased:true}),
  faTree:JSON.stringify([{id:0,level:1},{id:3,level:1}])
 };
 vm.runInNewContext(parser+";globalThis.__parse=parseSnapshotData;",context);
 const parsed=context.__parse(snapshot);
 if(parsed.meta.research[7]!==1||parsed.meta.research[9]!==10||parsed.meta.automation.unlocked[0]!==true||parsed.tree.length!==2||parsed.prestige.p!==123||parsed.game.fLevel!==1)throw new Error("A saved progression section or purchase was lost during snapshot parsing");
 const bad=JSON.parse(snapshot.faMeta);bad.research[3]=-1;
 snapshot.faMeta=JSON.stringify(bad);
 let rejected=false;try{context.__parse(snapshot)}catch(error){rejected=true}
 if(!rejected)throw new Error("Invalid Research levels must be rejected instead of accepted as a complete save");
 pass("Cloud snapshot round-trip validation preserves Research, automation, tree, prestige and letter purchases");
}catch(error){fail("Cloud progression snapshot runtime test: "+error.message)}


try{const rules=JSON.parse(read("database.rules.json"));if(rules.rules?.users?.["$uid"]?.[".read"]!=="auth !== null && auth.uid === $uid"||rules.rules?.users?.["$uid"]?.[".write"]!=="auth !== null && auth.uid === $uid"||rules.rules?.[".read"]||rules.rules?.[".write"])fail("Realtime Database rules must grant only per-user authenticated access");else pass("Firebase Realtime Database owner-only rules")}catch(error){fail("Invalid database.rules.json: "+error.message)}
if(!sources["assets/js/firebase-auth.js"].includes("signInWithPopup")||!sources["assets/js/firebase-auth.js"].includes("onAuthStateChanged")||!sources["assets/js/firebase-auth.js"].includes("signOut"))fail("Google sign-in, session restoration, or sign-out handler is missing");
const developerUid="ZcdUu9qeDTTTHiFeUIGSoLbbf0H3";
if(!sources["assets/js/firebase-auth.js"].includes('const DEVELOPER_UID="'+developerUid+'"')||!sources["assets/js/firebase-auth.js"].includes("currentUser.uid===DEVELOPER_UID")||!sources["assets/js/firebase-auth.js"].includes("developerPanel.hidden=!developerAccess"))fail("Developer panel must be visible only for the configured Firebase UID");
if(!sources["assets/js/script.js"].includes("!window.FAAuth.isDeveloper()")||!sources["assets/js/script.js"].includes("window.applyDeveloperValues")||!sources["assets/js/script.js"].includes("saveGame(true),savedPrestige=savePrestige()"))fail("Developer value changes must re-check UID, validate values, and save run/prestige data");
for(const id of ["developerPanel","developerTimeInput","developerAPInput","developerGPInput","developerApplyBtn","developerStatus"])if(!idSet.has(id))fail("Missing developer panel element #"+id);
pass("UID-restricted developer panel, input validation, persistence and EN/RU localization");
if(sources["assets/js/firebase-auth.js"].includes("setItem(")||sources["assets/js/firebase-auth.js"].includes("SAVE_KEY"))fail("Firebase Authentication must not modify local game saves");
const globals=new Set();
for(const src of Object.values(sources)){for(const m of src.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g))globals.add(m[1]);for(const m of src.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g))globals.add(m[1])}
for(const m of html.matchAll(/\bon(?:click|change|input|submit)=["']([^"']+)["']/g)){const call=m[1].match(/^\s*([A-Za-z_$][\w$]*)\s*\(/);if(call&&!globals.has(call[1]))fail("Missing event function "+call[1])}
const app=sources["assets/js/app-ui.js"],en=app.match(/en:\{([\s\S]*?)\},\s*ru:\{/),ru=app.match(/ru:\{([\s\S]*?)\}\s*\n\s*\};/);
const keySet=b=>new Set([...b.matchAll(/(?:^|,)([A-Za-z_$][\w$]*):/g)].map(m=>m[1]));
if(!en||!ru)fail("Localization dictionaries not found");else{const ek=keySet(en[1]),rk=keySet(ru[1]);for(const m of html.matchAll(/data-i18n=["']([^"']+)["']/g)){if(!ek.has(m[1]))fail("Missing EN key "+m[1]);if(!rk.has(m[1]))fail("Missing RU key "+m[1])}for(const key of ["developerAccess","developerTitle","developerDescription","developerTime","developerAP","developerGP","developerApply","developerSaved","developerInvalid"]){if(!ek.has(key)||!rk.has(key))fail("Missing developer localization "+key)}pass("Localization keys")}
const sourceHtml=html.replace(/<!--[\s\S]*?-->/g,""),voidTags=new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]),stack=[];
for(const m of sourceHtml.matchAll(/<\/?([a-zA-Z][\w:-]*)\b[^>]*>/g)){const token=m[0],tag=m[1].toLowerCase();if(token.startsWith("</")){const open=stack.pop();if(open!==tag)fail("HTML nesting mismatch at "+token+" (open "+(open||"none")+")")}else if(!voidTags.has(tag)&&!token.endsWith("/>"))stack.push(tag)}
if(stack.length)fail("Unclosed HTML tags "+stack.join(","));else pass("HTML nesting");
if((css.match(/{/g)||[]).length!==(css.match(/}/g)||[]).length||(mathCss.match(/{/g)||[]).length!==(mathCss.match(/}/g)||[]).length)fail("CSS brace mismatch");else pass("CSS braces");
if(!css.includes(".upgrade-title{color:#e2ebe8;font-size:13px;font-weight:700}")||!css.includes(".upgrade-desc{color:#82938e;font:10px var(--mono);")||!css.includes("#formulaModulePanel .upgrade-title{font-size:16pt}")||!css.includes("#formulaModulePanel .upgrade-desc:not(.math-formula){font-size:16pt}")||!mathCss.includes("font-size: 16pt;")||!mathCss.includes("font-size: 25pt;"))fail("Formula typography sizes do not match the 16 pt / 25 pt specification");else pass("Formula typography sizes and original interface defaults");
for(const file of jsFiles.slice(1))if(/\blocalStorage\b/.test(sources[file]))fail("Direct localStorage access in "+file);
if(!sources["assets/js/storage.js"].includes("function getRaw(")||!sources["assets/js/storage.js"].includes("function setRaw("))fail("Guarded raw storage helpers are missing");
if(!sources["assets/js/tree.js"].includes("const TOTAL=3886"))fail("Upgrade tree count changed");
const treeSource=sources["assets/js/tree.js"];
const treeStructureChecks=[
 ['const TOTAL=3886','fixed 3,886-node network'],
 ['type==="square"?1:type==="triangle"?10:type==="pentagon"?5','node type level limits'],
 ['n.id===0?1','root node base cost'],
 ['if(id===3)return "square"','NODE #0004 is a square content node'],
 ['const roll=random();\n  if(id===3)return "square"','NODE #0004 override preserves the existing random-generation sequence'],
 ['const cost=id===3?5','NODE #0004 costs exactly 5 GP'],
 ['function nodeCost(n){return n.id===0?1:n.id===3?5','NODE #0004 fixed one-time purchase cost'],
 ['function available(n){return (n.id===0||n.id===3)&&n.level<n.maxLevel}','only NODE #0001 and NODE #0004 are currently purchasable'],
 ['window.isLetterFUnlocked=()=>nodes[3].level>0','NODE #0004 unlocks Letter F'],
 ['const addEdge=','deduplicated edge builder'],
 ['nodes[a].links.push(b);nodes[b].links.push(a)','bidirectional multi-link adjacency'],
 ['type==="pentagon"?1.5+random()','hyper node effect scaling']
];
for(const [token,label] of treeStructureChecks){if(!treeSource.includes(token))fail("Upgrade tree structure missing "+label);else pass("Upgrade tree "+label)}
const letterFChecks=[
 ['id="letterFUpgrade" hidden','Letter F module is hidden before unlock'],
 ['id="formulaValueFRow" hidden','Letter F live-value row is hidden before unlock'],
 ['if(letterFCard)letterFCard.hidden=!letterFUnlocked','Letter F module visibility follows its tree unlock'],
 ['if(letterFRow)letterFRow.hidden=!letterFUnlocked','Letter F live-value row follows its tree unlock'],
 ['nodeLetterFTitle','NODE #0004 has a dedicated content-node name'],
 ['nodeContentTitle','all square content nodes have a special inspector name'],
 ['function getF()','Letter F formula implementation'],
 ['if(fLevel<=0||!unlocked||t<5)return 1','Letter F remains neutral until purchased, unlocked and t reaches 5 seconds'],
 ['const LETTER_F_BASE_EXPONENT=0.40','Letter F starts at exponent 0.40'],
 ['const LETTER_F_BASE_EXPONENT=0.40,LETTER_F_MAX_EXPONENT=0.85,LETTER_F_MAX_LEVEL=4501','Letter F has a bounded upgrade progression'],
 ['function getFCost()','Letter F uses the shared letter price curve'],
 ['if(fLevel<=0||!unlocked||t<5)return 1','Letter F is inactive until purchased, unlocked and t reaches five seconds'],
 ['function buyF()','Letter F can be purchased and upgraded'],
 ['fLevel,fExponent:getFExponent()','Letter F level and exponent are exposed'],
 ['fLevel,formulaState','Letter F level is stored in local saves'],
 ['id="fFormula"','Letter F formula is displayed'],
 ['id="fLevel"','Letter F level is displayed'],
 ['id="fCost"','Letter F next cost is displayed'],
 ['id="btnF"','Letter F purchase button is displayed']
];
for(const [token,label] of letterFChecks){if(!treeSource.includes(token)&&!html.includes(token)&&!sources["assets/js/script.js"].includes(token)&&!sources["assets/js/app-ui.js"].includes(token))fail("Letter F unlock check missing "+label);else pass("Letter F "+label)}
const treeLayoutChecks=[
 ['const positions=[],graphPositions=[]','separate visual and topology coordinates'],
 ['const cellSize=40,minSpacing=40','40-unit minimum node spacing'],
 ['const anchor=positions[Math.floor(layoutRandom()*positions.length)]','random anchor chosen from the whole existing cloud'],
 ['const angle=layoutRandom()*Math.PI*2','random placement angle'],
 ['const distance=42+layoutRandom()*118','short random branch distance'],
 ['if(hasRoom(x,y))point={x,y}','overlap prevention'],
 ['const REVEAL_RADIUS=80,REVEAL_RADIUS_SQ=REVEAL_RADIUS*REVEAL_RADIUS','80-unit reveal radius'],
 ['const areaRevealed=new Uint8Array(TOTAL),revealed=new Uint8Array(TOTAL)','separate geometric candidates from graph-connected visibility'],
 ['function rebuildConnectedReveal(candidates,roots,adjacency,output)','graph-connected reveal traversal'],
 ['revealAround(positions[0])','initial reveal around the center'],
 ['for(const n of nodes)if(n.level>0){revealAround(n);if(n.id!==0)roots.push(n.id)}','reveal around every purchased node and seed its connected component'],
 ['rebuildConnectedReveal(areaRevealed,roots,nodes.map(n=>n.links),revealed)','hide candidate nodes without a path to a visible root'],
 ['if(!edgeVisible(a,b))continue','show links only between graph-connected revealed nodes'],
 ['if(!revealed[n.id]||n.x<left-40','hide nodes outside revealed regions'],
 ['if(!revealed[n.id])continue','prevent selecting hidden nodes'],
 ['n.level++;rebuildRevealed()','expand visibility immediately after first purchase']
];
for(const [token,label] of treeLayoutChecks){if(!treeSource.includes(token))fail("Upgrade tree layout/reveal check missing "+label);else pass("Upgrade tree "+label)}
const treeVisualChecks=[
 ['const MIN_SCALE=.0001,MAX_SCALE=2.5','camera zoom bounds'],
 ['scale=Math.max(MIN_SCALE','clamped camera zoom'],
 ['function edgeVisible(a,b)','links limited to revealed nodes'],
 ['function selectedEdges()','selected node connection highlighting'],
 ['75,151,255,','selected-link blue neon'],
 ['105,226,157,','default green neon links'],
 ['ctx.shadowBlur=(isBlue?10:7)/scale','subtle neon glow'],
  ['scale/.28','zoom-aware glow fade'],
 ['n.id===selected?22.5:n.id===0?19.5:12.3','node display sizes'],
 ['isBlue?2.25:1.5','link display widths'],
 ['dist=31/scale','mouse hit testing']
];
for(const [token,label] of treeVisualChecks){if(!treeSource.includes(token))fail("Upgrade tree visual/navigation feature missing "+label);else pass("Upgrade tree "+label)}
const revealHelperSource=treeSource.slice(treeSource.indexOf("function rebuildConnectedReveal"),treeSource.indexOf("function rebuildRevealed"));
try{
 const revealContext={};
 vm.runInNewContext(revealHelperSource+";globalThis.__rebuildConnectedReveal=rebuildConnectedReveal;",revealContext);
 const candidates=new Uint8Array([1,1,1,1,1,1,0]),visible=new Uint8Array(7);
 const adjacency=[[1],[0,2],[1],[4],[3,5],[4],[6]];
 revealContext.__rebuildConnectedReveal(candidates,[0],adjacency,visible);
 if([...visible].join("")!=="1110000")fail("Nodes without a graph path to the visible root must remain hidden");
 revealContext.__rebuildConnectedReveal(candidates,[0,4],adjacency,visible);
 if([...visible].join("")!=="1111110")fail("A separately purchased node must reveal its own connected component");
 pass("Upgrade tree graph-connected node visibility and disconnected-node hiding");
}catch(error){fail("Upgrade tree connected reveal runtime test: "+error.message)}
const treeEdgeSource=treeSource.slice(treeSource.indexOf("function edgeVisible"),treeSource.indexOf("function pathNode"));
try{
 const edgeContext={revealed:new Uint8Array([1,1,1,0]),selected:0,nodes:[{links:[1,2]},{links:[0,2]},{links:[0,1,3]},{links:[2]}]};
 vm.runInNewContext(treeEdgeSource+";globalThis.__edgeVisible=edgeVisible;globalThis.__selectedEdges=selectedEdges;",edgeContext);
 if(!edgeContext.__edgeVisible(0,1)||!edgeContext.__edgeVisible(1,2)||edgeContext.__edgeVisible(2,3))fail("Tree links must appear only when both endpoint nodes are revealed");
 if([...edgeContext.__selectedEdges()].sort().join(",")!=="0:1,0:2")fail("Selecting NODE #0001 must highlight every direct connected link");
 edgeContext.selected=2;
 if([...edgeContext.__selectedEdges()].sort().join(",")!=="0:2,1:2,2:3")fail("Selecting another node must highlight all of its direct connected links");
 edgeContext.selected=-1;
 if(edgeContext.__selectedEdges().size!==0)fail("No node selection must leave all links green");
 pass("Upgrade tree link visibility and selected-node connection highlighting");
}catch(error){fail("Upgrade tree link behavior test: "+error.message)}
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
const fFormulaSource=sources["assets/js/script.js"].slice(sources["assets/js/script.js"].indexOf("const LETTER_F_BASE_EXPONENT"),sources["assets/js/script.js"].indexOf("const formulaLetterGetters"));
try{
 const fContext={fLevel:0,t:10,LETTER_BASE_COSTS:{f:1e15},window:{isLetterFUnlocked:()=>true},getA:()=>2,getE:()=>3,safeProduct:(...values)=>values.reduce((a,b)=>a*b,1),safePow:(base,power)=>Math.pow(base,power),getLetterPrice:(base,level)=>base*Math.pow(8,level)};
 vm.runInNewContext(fFormulaSource+";globalThis.__f={getF,getFExponent,getFCost};",fContext);
 if(fContext.__f.getF()!==1)throw new Error("Unpurchased F must remain neutral");
 if(fContext.__f.getFCost()!==1e15)throw new Error("First F purchase must cost exactly 1 Qa");
 fContext.fLevel=1;if(fContext.__f.getFExponent()!==0.4||fContext.__f.getFCost()!==8e15)throw new Error("F first purchase must start at p=0.40 and next price must follow the shared 8x curve");
 fContext.t=4;if(fContext.__f.getF()!==1)throw new Error("F must remain inactive before t=5");
 fContext.t=5;if(!(fContext.__f.getF()>1))throw new Error("Purchased F must activate at t=5");
 fContext.fLevel=2;if(Math.abs(fContext.__f.getFExponent()-0.4001)>1e-12)throw new Error("Each F upgrade must increase p by 0.0001");
 fContext.fLevel=4501;if(fContext.__f.getFExponent()!==0.85)throw new Error("F exponent must cap at 0.85");
 pass("Letter F runtime tests: purchase gating, activation threshold, 1 Qa base price, shared price growth and p progression");
}catch(error){fail("Letter F runtime test: "+error.message)}
const timingSource=sources["assets/js/script.js"];
if(!timingSource.includes("const TICK=10"))fail("The game loop interval must remain 10 ms");
if(!timingSource.includes("factors.push(getGlobalSumMultiplier(),letterProduct,boost)"))fail("Production must keep t squared outside the Global Sum and include all letter multipliers");
if(!timingSource.includes("function getIntegralMultiplier()")||!timingSource.includes("factors.push(getIntegralMultiplier())"))fail("NODE #0001 integral must multiply production after it is permanently unlocked");
if(!timingSource.includes("const sumTerm=sumLevel>0?"))fail("Displayed formula must show Global Sum only after it is purchased");
if(!timingSource.includes('const productTerm="\\\\prod_{\\\\ell\\\\in\\\\mathcal{L}}\\\\ell"'))fail("Displayed formula must use compact product notation for A–E");
if(!timingSource.includes("\\\\int_{0}^{e}\\\\sqrt{1+x}"))fail("Displayed formula must place the complete multiplier product inside the integral");
if(!timingSource.includes("const formulaLetterGetters=[getA,getB,getC,getD,getE,getF]"))fail("All current letter multipliers, including F, must be registered inside the global sum");
if(!timingSource.includes("Math.log1p(t)")||!timingSource.includes("Math.log1p(upper)")||!timingSource.includes("Math.exp(powered)"))fail("Letter F must use the agreed integral-exponential formula");
if(!timingSource.includes("if(aLevel>0)active.push(getA())")||!timingSource.includes("if(bLevel>0)active.push(getB())")||!timingSource.includes("if(cLevel>0)active.push(getC())")||!timingSource.includes("if(dLevel>0)active.push(getD())")||!timingSource.includes("if(eLevel>0)active.push(getE())"))fail("A–E multipliers must join the production product only after their first purchase");
if(!timingSource.includes("window.registerFormulaLetter=getter=>"))fail("Future letter modules must be able to register inside the global sum");
if(!timingSource.includes("function getGlobalSumAdditionalWeight()")||!timingSource.includes("return n*(1+0.25*legacy)"))fail("Global Sum must expose the combined contribution of all additional weights");
if(!timingSource.includes("formatPrecise(getGlobalSumAdditionalWeight(),2)"))fail("Live Global Sum value must display the aggregate additional-weight contribution");
if(timingSource.includes("BASE_PRODUCTION")||timingSource.includes("Math.pow(t+1,2),base,boost"))fail("Legacy production coefficient or time offset remains active");
if(!timingSource.includes("setInterval(loop,TICK)"))fail("The 10 ms game loop scheduler is missing");
if(!timingSource.includes("const averageRate=rateBefore+(rateAfter-rateBefore)*0.5"))fail("Production accumulation must use trapezoidal integration");
if(!timingSource.includes("const rateAfter=getGain(),averageRate=rateBefore+(rateAfter-rateBefore)*0.5;"))fail("Offline production must use trapezoidal integration too");
if(!timingSource.includes("const now=performance.now(),delta=Math.max(0,(now-lastFrame)/1000);lastFrame=now;"))fail("Elapsed tick time must not be silently capped or discarded");
if(!timingSource.includes("valueDisplay.textContent=formatPrecise(value,2);growthDisplay.textContent=formatPrecise(getGrowthPerSecond(),2);"))fail("HUD must display fractional total value and growth rate");
if(!timingSource.includes("function formatPrecise(n,digits=2)"))fail("Precise HUD number formatter is missing");
else pass("10 ms tick, accurate elapsed-time integration and HUD precision checks");
const gainSource=timingSource.slice(timingSource.indexOf("function getGlobalSumAdditionalWeight()"),timingSource.indexOf("function getGrowthPerSecond()"));
try{
  const gainContext={t:10,prestigeUpgrades:{simpleBoost:0,globalSum:0},metaBonus:()=>1,getLetterProduct:()=>1,getE:()=>1,safePow:(b,p)=>Math.pow(b,p),window:{isIntegralNodePurchased:()=>false},safeProduct:(...values)=>values.reduce((a,b)=>a*b,1),FA_META:{treeUnlocked:false}};
  vm.runInNewContext(gainSource+";globalThis.__gain=getGain();",gainContext);
  if(gainContext.__gain!==100)fail("Base production at t=10 must remain exactly 100 before Global Sum");
  gainContext.window.isIntegralNodePurchased=()=>true;
  vm.runInNewContext(gainSource+";globalThis.__gain=getGain();",gainContext);
  const integralFactor=2/3*(Math.pow(2,1.5)-1);
  if(Math.abs(gainContext.__gain-100*integralFactor)>1e-9)fail("Purchased NODE #0001 must apply the evaluated integral to production");
  gainContext.window.isIntegralNodePurchased=()=>false;
  gainContext.prestigeUpgrades.globalSum=2;
  vm.runInNewContext(gainSource+";globalThis.__gain=getGain();globalThis.__weight=getGlobalSumAdditionalWeight();",gainContext);
  if(gainContext.__gain!==300||gainContext.__weight!==2)fail("The first Global Sum purchase must add two unit-weight terms (n=2), tripling production");
  gainContext.prestigeUpgrades.simpleBoost=1;
  vm.runInNewContext(gainSource+";globalThis.__gain=getGain();globalThis.__weight=getGlobalSumAdditionalWeight();",gainContext);
  if(gainContext.__gain!==350||gainContext.__weight!==2.5)fail("One Ascension Legacy level must add 25% weight to each of the two Global Sum terms");
  gainContext.prestigeUpgrades.globalSum=0;
  vm.runInNewContext(gainSource+";globalThis.__gain=getGain();",gainContext);
  if(gainContext.__gain!==100)fail("Ascension Legacy must not alter production when Global Sum is zero");
  pass("Production tests: base, NODE #0001 integral, Global Sum, aggregate weight display and Ascension Legacy scaling");
  const letterProductSource=timingSource.slice(timingSource.indexOf("function getLetterProduct()"),timingSource.indexOf("window.FAMathSystem"));
  const letterContext={aLevel:0,bLevel:0,cLevel:0,dLevel:0,eLevel:0,fLevel:0,window:{isLetterFUnlocked:()=>true},getA:()=>2,getB:()=>3,getC:()=>5,getD:()=>7,getE:()=>11,getF:()=>1,formulaLetterGetters:[()=>2,()=>3,()=>5,()=>7,()=>11,()=>letterContext.getF()],safeProduct:(...values)=>values.reduce((a,b)=>a*b,1)};
  vm.runInNewContext(letterProductSource+";globalThis.__letterProduct=getLetterProduct;",letterContext);
  if(letterContext.__letterProduct()!==1)fail("Unpurchased A–E letters must not affect production");
  letterContext.aLevel=1;if(letterContext.__letterProduct()!==2)fail("First A purchase must activate A exactly once");
  letterContext.cLevel=1;if(letterContext.__letterProduct()!==10)fail("First C purchase must add C while unpurchased letters remain excluded");
  letterContext.bLevel=1;letterContext.dLevel=1;letterContext.eLevel=1;if(letterContext.__letterProduct()!==2310)fail("All five purchased core letters must multiply together");letterContext.fLevel=1;letterContext.getF=()=>13;if(letterContext.__letterProduct()!==30030)fail("Purchased and unlocked Letter F must join the production product");letterContext.window.isLetterFUnlocked=()=>false;if(letterContext.__letterProduct()!==2310)fail("Letter F must remain excluded when its tree node is locked");
  pass("Letter unlock tests: no unpurchased contribution; each letter activates on its first purchase");

}catch(error){fail("Production rate runtime test: "+error.message)}
const prestigeSource= sources["assets/js/prestige.js"];
if(!prestigeSource.includes("fLevel=0"))fail("Letter F level must reset with the other run upgrades on prestige");else pass("Letter F prestige reset matches A–E run upgrades");
const resetSource=sources["assets/js/script.js"].match(/function resetSave\(\)[\s\S]*?\n\}/)?.[0]||"";
if(!resetSource.includes("resetRun()")||!resetSource.includes("saveGame(true)")||!resetSource.includes("FAStorage.removeMany([LEGACY_SAVE_KEY,OLD_SAVE_KEY])"))fail("Manual RESET must clear and save only the current run");
if(/"prestigeSave"|"faMeta"|"faTree"|cloudSave|removeMany\(\[SAVE_KEY/.test(resetSource))fail("Manual RESET must preserve prestige, meta, tree and cloud-save data");else pass("Manual RESET preserves prestige/meta/tree and never touches cloud saves");
const runResetSource=prestigeSource.match(/function resetRun\(\)[\s\S]*?\n\}/)?.[0];
if(!runResetSource)fail("Current-run reset function is missing");
else{
 try{
  const runState={t:91,value:123456,aLevel:3,bLevel:4,cLevel:5,dLevel:6,eLevel:7,fLevel:8,formulaState:{a:2},formulaSteps:90,formulaAccumulator:.5};
  const resetContext={...runState,resetFormulaState(){this.formulaState={a:1,b:1,c:1,d:1,e:1};this.formulaSteps=0;this.formulaAccumulator=0}};
  vm.runInNewContext(runResetSource+";resetRun();",resetContext);
  if([resetContext.t,resetContext.value,resetContext.aLevel,resetContext.bLevel,resetContext.cLevel,resetContext.dLevel,resetContext.eLevel,resetContext.fLevel].some(v=>v!==0)||resetContext.formulaSteps!==0||resetContext.formulaAccumulator!==0||resetContext.formulaState.a!==1)fail("Current-run reset must zero time, Score, all letter levels and formula state");
  else pass("Current-run reset clears Score, time, A–F and formula state only");
 }catch(error){fail("Current-run reset runtime test: "+error.message)}
}
try{
 const costSource=prestigeSource.match(/function getGlobalSumCost\(\)[\s\S]*?\}/)?.[0];
 if(!costSource)throw new Error("Global Sum cost function missing");
 const costContext={prestigeUpgrades:{globalSum:0}};
 vm.runInNewContext(costSource+";globalThis.__cost=getGlobalSumCost;",costContext);
 const levels=[0,2,3,4,5],costs=[1,1000,1000000,1000000000,1000000000000];
 for(let i=0;i<levels.length;i++){costContext.prestigeUpgrades.globalSum=levels[i];if(costContext.__cost()!==costs[i])throw new Error("Wrong AP cost at Global Sum n="+levels[i]+": "+costContext.__cost())}
 costContext.prestigeUpgrades.globalSum=6;if(costContext.__cost()!==Number.MAX_SAFE_INTEGER)throw new Error("Completed Global Sum must report a capped cost");
 pass("Global Sum AP costs preserve 1 / 1K / 1M / 1B / 1T progression while n starts at 2");
 const legacyCostSource=prestigeSource.match(/function getSimpleBoostCost\(\)[\s\S]*?\}/)?.[0];
 if(!legacyCostSource)throw new Error("Ascension Legacy cost function missing");
 const legacyContext={prestigeUpgrades:{simpleBoost:0}};
 vm.runInNewContext(legacyCostSource+";globalThis.__legacyCost=getSimpleBoostCost;",legacyContext);
 const legacyCosts=[125,15625,1953125,244140625,30517578125];
 for(let level=0;level<legacyCosts.length;level++){legacyContext.prestigeUpgrades.simpleBoost=level;if(legacyContext.__legacyCost()!==legacyCosts[level])throw new Error("Wrong Ascension Legacy AP cost at level "+level+": "+legacyContext.__legacyCost())}
 pass("Ascension Legacy AP costs follow 125 × 125^level");
}catch(error){fail("Global Sum cost test: "+error.message)}


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
