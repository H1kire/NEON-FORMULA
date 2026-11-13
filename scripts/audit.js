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
if(!sources["assets/js/firebase-cloud-save.js"].includes("(game.gLevel !== undefined && !finiteNonNegative(game.gLevel))")||!sources["assets/js/firebase-cloud-save.js"].includes("(game.hLevel !== undefined && !finiteNonNegative(game.hLevel))"))fail("Cloud restore must validate optional G/H levels");
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
  formula_ascent_save_v2:JSON.stringify({t:12,value:345,aLevel:1,bLevel:2,cLevel:3,dLevel:4,eLevel:5,fLevel:1,gLevel:2,hLevel:3,formulaState:{a:1,b:1,c:1,d:1,e:1},formulaSteps:12,formulaAccumulator:0,lastTime:100}),
  prestigeSave:JSON.stringify({p:123,gp:4,prestigeUnlocked:true,prestigeUpgrades:{simpleBoost:2,globalSum:3}}),
  faMeta:JSON.stringify({research:[1,2,3,4,5,6,7,1,9,10],settings:{autosave:true,offline:true,compact:true,reducedMotion:false},automation:{unlocked:[true,false,false,false,false],enabled:[true,true,true,true,true],paused:false},stats:{totalPlayTime:10,lifetimeValue:100,ascensions:2,genesisPrestiges:1,purchases:20},treeUnlocked:true,treePassPurchased:true}),
  faTree:JSON.stringify([{id:0,level:1},{id:3,level:1}])
 };
 vm.runInNewContext(parser+";globalThis.__parse=parseSnapshotData;",context);
 const parsed=context.__parse(snapshot);
 if(parsed.meta.research[7]!==1||parsed.meta.research[9]!==10||parsed.meta.automation.unlocked[0]!==true||parsed.tree.length!==2||parsed.prestige.p!==123||parsed.game.fLevel!==1||parsed.game.gLevel!==2||parsed.game.hLevel!==3)throw new Error("A saved progression section or letter purchase was lost during snapshot parsing");
 const bad=JSON.parse(snapshot.faMeta);bad.research[3]=-1;
 snapshot.faMeta=JSON.stringify(bad);
 let rejected=false;try{context.__parse(snapshot)}catch(error){rejected=true}
 if(!rejected)throw new Error("Invalid Research levels must be rejected instead of accepted as a complete save");
 pass("Cloud snapshot round-trip validation preserves Research, automation, tree, prestige and letter purchases");

 const preferenceSource=sources["assets/js/firebase-cloud-save.js"].match(/function mergeLocalPreferences\(cloudMeta\) \{[\s\S]*?\n  \}/)?.[0];
 if(!preferenceSource)throw new Error("Local preference merge helper missing");
 const localPreferences={language:"ru",notation:"scientific",settings:{autosave:false,offline:false,compact:false,reducedMotion:true}};
 const preferenceContext={META_KEY:"faMeta",window:{FAStorage:{getJSON:()=>localPreferences},FA_META:{}}};
 vm.runInNewContext(preferenceSource+";globalThis.__merge=mergeLocalPreferences;",preferenceContext);
 const restoredMeta=preferenceContext.__merge({language:"en",notation:"standard",settings:{autosave:true,offline:true,compact:true,reducedMotion:false},research:[1]});
 if(restoredMeta.language!=="ru"||restoredMeta.notation!=="scientific"||restoredMeta.settings.autosave!==false||restoredMeta.settings.reducedMotion!==true||restoredMeta.research[0]!==1)throw new Error("Cloud restore must preserve local interface preferences while restoring cloud progression");
 if(!sources["assets/js/firebase-cloud-save.js"].includes("mergeLocalPreferences(parsed.meta)")||!sources["assets/js/firebase-cloud-save.js"].includes('data[META_KEY] = JSON.stringify(parsed.meta)'))throw new Error("Cloud restore does not apply preserved local preferences to the restored meta snapshot");

 pass("Cloud restore replaces progression but preserves local language, notation and interface settings");

 const restoreSource=sources["assets/js/firebase-cloud-save.js"];
 const coreSource=sources["assets/js/script.js"];
 const uiSource=sources["assets/js/app-ui.js"];
 const treePersistenceSource=sources["assets/js/tree.js"];
 const cloudRestore=restoreSource.slice(restoreSource.indexOf("async function restoreFromCloud()"),restoreSource.indexOf('if (saveButton) saveButton.addEventListener'));
 const cloudSave=restoreSource.slice(restoreSource.indexOf("async function saveToCloud()"),restoreSource.indexOf("async function restoreFromCloud()"));
 const writerGuards=[
  [coreSource.includes("if(window.FA_CLOUD_RESTORING)return false;"),"run autosave is blocked during restore"],
  [coreSource.includes("if(window.FA_CLOUD_RESTORING)return;\n const now=performance.now()"),"game simulation pauses during restore"],
  [coreSource.includes('if(window.FA_CLOUD_RESTORING)return;saveGame();saveMeta()'),"beforeunload cannot overwrite restored data"],
  [uiSource.includes('window.saveMeta=()=>window.FA_CLOUD_RESTORING?false:'),"Research/settings metadata writer is blocked during restore"],
  [sources["assets/js/prestige.js"].includes("function savePrestige(){if(window.FA_CLOUD_RESTORING)return false;"),"AP/GP and prestige writer is blocked during restore"],
  [treePersistenceSource.includes("function persist(){if(window.FA_CLOUD_RESTORING)return false;"),"tree writer is blocked during restore"]
 ];
 for(const [ok,label] of writerGuards)if(!ok)throw new Error("Missing restore race protection: "+label);
 const lockPosition=cloudRestore.indexOf("window.FA_CLOUD_RESTORING = true;");
 const requestPosition=cloudRestore.indexOf(".once(\"value\")");
 if(lockPosition<0||requestPosition<0||lockPosition>requestPosition)throw new Error("Restore writer lock must be set before any asynchronous fetch");
 if(!cloudRestore.includes("window.FA_CLOUD_RESTORING = false;")||!cloudRestore.includes("window.location.reload();"))throw new Error("Restore must unlock writers on failure and reload on success");
 if(!cloudRestore.includes('window.FAStorage.getRaw(key, null) !== data[key]')||!cloudRestore.includes('restoredData[key] !== data[key]'))throw new Error("Restore must read back and verify every local save section");
 if(!cloudSave.includes('const verification = await reference.once("value")')||!cloudSave.includes('stored.data[key] !== data[key]'))throw new Error("Cloud save must read back and verify every uploaded section");
 pass("Cloud restore race test: game loop, autosaves and beforeunload cannot overwrite restored state");
 pass("Cloud save/restore read-back verification covers all four persistence sections");

 const persistentKeys=new Set();
 for(const source of Object.values(sources)){
  for(const match of source.matchAll(/FAStorage\.(?:getJSON|setJSON|getRaw|setRaw)\(["']([^"']+)["']/g))persistentKeys.add(match[1]);
  for(const match of source.matchAll(/(?:SAVE_KEY|PRESTIGE_KEY|META_KEY|TREE_KEY)\s*=\s*["']([^"']+)["']/g))persistentKeys.add(match[1]);
 }
 const includedKeys=new Set(["formula_ascent_save_v2","prestigeSave","faMeta","faTree","formula_ascent_save_v1","neon_formula_idle_v4_5"]);
 const missingKeys=[...persistentKeys].filter(key=>!includedKeys.has(key));
 if(missingKeys.length)throw new Error("Untracked persistent local save keys: "+missingKeys.join(", "));
 for(const key of ["formula_ascent_save_v2","prestigeSave","faMeta","faTree"])if(!persistentKeys.has(key))throw new Error("Expected persistence section not found: "+key);
 pass("Persistence inventory: every local game-save key is represented in the cloud snapshot");

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
 ['function nodeCost(n){return n.id===0?1:n.id===3?5:n.id===1986?25:n.id===1987?50:n.id===1925?10','G/H gates and Miniaturization cost 25/50/10 GP'],
 ['function available(n){return (n.id===0||n.id===3||(n.id===1986&&nodes[3].level>0)||(n.id===1987&&nodes[1986].level>0)||(n.id===1925&&nodes[1986].level>0))&&n.level<n.maxLevel}','F/H gates and Miniaturization unlock in sequence'],
 ['window.isLetterFUnlocked=()=>nodes[3].level>0','NODE #0004 unlocks Letter F'],
 ['const addEdge=','deduplicated edge builder'],
 ['nodes[a].links.push(b);nodes[b].links.push(a)','bidirectional multi-link adjacency'],
 ['type==="pentagon"?1.5+random()','hyper node effect scaling']
];
for(const [token,label] of treeStructureChecks){if(!treeSource.includes(token))fail("Upgrade tree structure missing "+label);else pass("Upgrade tree "+label)}
if(!treeSource.includes('const letterGate=({1986:"G",1987:"H",1988:"I",1989:"J"})[n.id]||""'))fail("Upgrade Tree must reserve NODE #1987–#1990 for letters G–J");else pass("Upgrade Tree G–J gate assignments");
if(!treeSource.includes('window.isLetterFUnlocked=()=>nodes[3].level>0;window.isLetterGUnlocked=()=>nodes[1986].level>0;window.isLetterHUnlocked=()=>nodes[1987].level>0;window.isMiniaturizationUnlocked=()=>nodes[1925].level>0;'))fail("Upgrade Tree F–H and QOL unlock APIs are missing");else pass("Upgrade Tree F–H and QOL unlock APIs");
if(!treeSource.includes("if(isSquareCell(p.col,p.row))return \"square\"")||!treeSource.includes('innovationNode=n.type==="square"'))fail("Designated square cells must be square innovation nodes");else pass("Designated square nodes are square innovation slots");
if(!treeSource.includes("window.refundUpgradeTree=()=>")||!treeSource.includes("window.FAAuth.isDeveloper()")||!treeSource.includes("gp=Math.min(Number.MAX_VALUE,gp+refunded)")||!treeSource.includes("for(const n of nodes)if(n.active)n.level=0"))fail("Developer tree refund must be UID-restricted, return spent GP and clear active node levels");else pass("Developer-only Upgrade Tree refund and bonus deactivation");
if(!treeSource.includes("const savedTree=persist(),savedPrestige=savePrestige()"))fail("Tree refund must persist both tree and Genesis Point progress");
if(!html.includes('id="developerTreeRefundBtn"')||!sources["assets/js/script.js"].includes('$("developerTreeRefundBtn")?.addEventListener("click",applyDeveloperTreeRefund)'))fail("Developer tree refund button is not connected");else pass("Developer refund button wiring");
if(!sources["assets/js/app-ui.js"].includes("nodeLetterGTitle")||!sources["assets/js/app-ui.js"].includes("nodeLetterJTitle"))fail("G–J node labels must be localized");else pass("G–J gate labels are localized");
if(treeSource.includes("spatialGrid")||treeSource.includes("cellSize"))fail("Upgrade tree reveal must not reference the removed spatial index");
else pass("Upgrade tree reveal has no stale spatial-index references");
if(!treeSource.includes("const revealAround=(center)=>{")||!treeSource.includes("for(let id=0;id<TOTAL;id++){\n    if(!nodes[id].active)continue;\n    const p=positions[id],dx=p.x-center.x,dy=p.y-center.y;"))
 fail("Upgrade tree must calculate visible nodes directly from the current fixed-grid positions");
else pass("Upgrade tree reveal scans the fixed-grid positions safely");
if(!treeSource.includes("const GRID_SPACING=73.00156874163076")||!treeSource.includes("positions[id]={x:(col-CENTER_COLUMN)*GRID_SPACING,y:(row-CENTER_ROW)*GRID_SPACING}"))
 fail("Upgrade tree nodes must preserve equal grid spacing");
else pass("Upgrade tree keeps equal horizontal and vertical grid spacing");
if(!treeSource.includes("edgeRandom()<.28")||!treeSource.includes("edgeRandom()<.10")||!treeSource.includes("if(visitedCount!==ACTIVE_TOTAL)")||!treeSource.includes("addEdge(G_GATE_NODE_ID,branchNode)"))
 fail("Upgrade tree must retain randomized cross-links, full connectivity and direct G-branch links");
else pass("Upgrade tree retains randomized cross-links, full connectivity and direct G-branch links");
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
 ['fLevel,gLevel,hLevel,fExponent:getFExponent()','Letter F–H levels and F exponent are exposed'],
 ['fLevel,gLevel,hLevel,formulaState','Letter F–H levels are stored in local saves'],
 ['id="fFormula"','Letter F formula is displayed'],
 ['id="fLevel"','Letter F level is displayed'],
 ['id="fCost"','Letter F next cost is displayed'],
 ['id="btnF"','Letter F purchase button is displayed']
];
for(const [token,label] of letterFChecks){if(!treeSource.includes(token)&&!html.includes(token)&&!sources["assets/js/script.js"].includes(token)&&!sources["assets/js/app-ui.js"].includes(token))fail("Letter F unlock check missing "+label);else pass("Letter F "+label)}
const treeLayoutChecks=[
 ['const positions=[],gridCoords=[],gridIndex=new Map()','fixed rectangular grid coordinates'],
 ['const GRID_SPACING=73.00156874163076','grid step matches the previous center-to-NODE #0004 distance'],
 ['const GRID_COLUMNS=Math.ceil(Math.sqrt(TOTAL))','regular grid width'],
 ['const GRID_ROWS=Math.ceil(TOTAL/GRID_COLUMNS)','regular grid height'],
 ['setGridNode(0,CENTER_COLUMN,CENTER_ROW)','root remains at the center of the map'],
 ['setGridNode(3,CENTER_COLUMN+1,CENTER_ROW)','NODE #0004 remains one grid step from the root'],
 ['const edgeRandom=()=>','separate deterministic random-link generator'],
 ['const cardinalDirections=[[-1,0],[1,0],[0,-1],[0,1]]','orthogonal grid adjacency'],
 ['const diagonalDirections=[[-1,1],[1,1]]','diagonal grid adjacency'],
 ['while(visitedCount<ACTIVE_TOTAL&&frontier.length)','connected randomized spanning network over retained nodes'],
 ['if(visitedCount!==ACTIVE_TOTAL)','all retained nodes remain connected'],
 ['const GATE_COLUMN=CENTER_COLUMN+1','F gate defines the start of the horizontal ray'],
 ['const G_BRANCH_COLUMN=CENTER_COLUMN+2,G_BRANCH_RADIUS=4','four-cell vertical branches start at the Letter G gate'],
 ['const isActiveCell=(col,row)=>','only cells left of the gate, the horizontal ray and the two G innovation branches remain active'],
 ['if(isSquareCell(p.col,p.row))return "square"','all nodes to the right of the F gate are squares'],
 ['const cell=gridCoords[id],active=isActiveCell(cell.col,cell.row)','removed cells are excluded from the active tree'],
 ['n.active&&n.level>=n.maxLevel','tree progress counts only retained nodes'],
 ['nodes.filter(n=>n.active&&n.level>0)','removed nodes are excluded from tree persistence'],
 ['if(neighbor!==undefined&&nodes[neighbor].active&&edgeRandom()<.28)addEdge(id,neighbor)','random orthogonal cross-links'],
 ['if(neighbor!==undefined&&nodes[neighbor].active&&edgeRandom()<.10)addEdge(id,neighbor)','random diagonal cross-links'],
 ['const REVEAL_RADIUS=80,REVEAL_RADIUS_SQ=REVEAL_RADIUS*REVEAL_RADIUS','80-unit reveal radius'],
 ['if(!nodes[id].active)continue','removed nodes are excluded from visibility calculation'],
 ['const areaRevealed=new Uint8Array(TOTAL),revealed=new Uint8Array(TOTAL)','separate geometric candidates from graph-connected visibility'],
 ['function rebuildConnectedReveal(candidates,roots,adjacency,output)','graph-connected reveal traversal'],
 ['revealAround(positions[0])','initial reveal around the center'],
 ['for(const n of nodes)if(n.active&&n.level>0){revealAround(n);if(n.id!==0)roots.push(n.id)}','reveal around every purchased node and seed its connected component'],
 ['rebuildConnectedReveal(areaRevealed,roots,nodes.map(n=>n.links),revealed)','hide candidate nodes without a path to a visible root'],
 ['if(!edgeVisible(a,b))continue','show links only between graph-connected revealed nodes'],
 ['if(!n.active||!revealed[n.id]||n.x<left-40','hide nodes outside revealed regions'],
 ['if(!n.active||!revealed[n.id])continue','prevent selecting hidden nodes'],
 ['n.level++;rebuildRevealed()','expand visibility immediately after first purchase']
];
for(const [token,label] of treeLayoutChecks){if(!treeSource.includes(token))fail("Upgrade tree layout/reveal check missing "+label);else pass("Upgrade tree "+label)}
const treeGridSource=treeSource.slice(treeSource.indexOf("const positions=[],gridCoords=[],gridIndex=new Map();"),treeSource.indexOf("const addEdge="));
try{
 const gridContext={TOTAL:3886,ACTIVE_TOTAL:0};
 vm.runInNewContext(treeGridSource+";globalThis.__grid={positions,gridCoords,gridIndex,GRID_SPACING,GRID_COLUMNS,GRID_ROWS,CENTER_COLUMN,CENTER_ROW,GATE_COLUMN,ACTIVE_TOTAL,isActiveCell,isSquareCell,isPathCell,isCenterExceptionCell,isWithinSquareExclusion};",gridContext);
 const g=gridContext.__grid;
 if(g.positions.length!==3886||g.gridCoords.length!==3886||g.gridIndex.size!==3886)throw new Error("The grid must contain exactly 3,886 unique node cells");
 if(g.positions[0].x!==0||g.positions[0].y!==0)throw new Error("NODE #0001 must remain at the map center");
 if(Math.abs(Math.hypot(g.positions[3].x-g.positions[0].x,g.positions[3].y-g.positions[0].y)-g.GRID_SPACING)>1e-9)throw new Error("NODE #0004 must remain exactly one grid step from the root");
 for(let id=0;id<3886;id++){
  const p=g.positions[id],c=g.gridCoords[id];
  if(!p||!c||Math.abs(p.x-(c.col-g.CENTER_COLUMN)*g.GRID_SPACING)>1e-9||Math.abs(p.y-(c.row-g.CENTER_ROW)*g.GRID_SPACING)>1e-9)throw new Error("Node "+id+" is not aligned to the regular grid");
 }
 if(!(g.GRID_SPACING<80&&Math.SQRT2*g.GRID_SPACING>80))throw new Error("The existing reveal radius must include direct grid neighbors but exclude diagonal neighbors");
 let activeCount=0;
 for(let id=0;id<3886;id++){
  const c=g.gridCoords[id],base=c.col<=g.GATE_COLUMN||c.row===g.CENTER_ROW||(c.col===g.CENTER_COLUMN+2&&Math.abs(c.row-g.CENTER_ROW)<=4);
  const square=g.isSquareCell(c.col,c.row);
  const path=g.isPathCell(c.col,c.row);
  const excluded=g.isWithinSquareExclusion(c.col,c.row);
  const centerException=g.isCenterExceptionCell(c.col,c.row);
  const expected=base&&(square||path||centerException||!excluded);
  if(g.isActiveCell(c.col,c.row)!==expected)throw new Error("Node "+id+" has an incorrect retained/removed state");
  if(expected)activeCount++;
  if(expected&&!square&&!path&&!centerException&&excluded)throw new Error("A non-square node remains inside a square's two-step exclusion radius");
 }
 if(activeCount!==g.ACTIVE_TOTAL||g.ACTIVE_TOTAL!==2072)throw new Error("Square exclusion rules must preserve exactly 2,072 active nodes");
 if(!g.isActiveCell(g.CENTER_COLUMN+2,g.CENTER_ROW)||!g.isActiveCell(g.CENTER_COLUMN+2,g.CENTER_ROW-4)||!g.isActiveCell(g.CENTER_COLUMN+2,g.CENTER_ROW+4)||g.isActiveCell(g.CENTER_COLUMN+2,g.CENTER_ROW-5)||g.isActiveCell(g.CENTER_COLUMN+2,g.CENTER_ROW+5))throw new Error("The G gate must have exactly four active cells upward and downward");
 if(!g.isSquareCell(g.CENTER_COLUMN+2,g.CENTER_ROW-4)||!g.isSquareCell(g.CENTER_COLUMN+2,g.CENTER_ROW+4))throw new Error("All eight G branch destinations must be square nodes");
 if(!g.isActiveCell(g.CENTER_COLUMN,g.CENTER_ROW-2)||!g.isActiveCell(g.CENTER_COLUMN,g.CENTER_ROW+2)||!g.isCenterExceptionCell(g.CENTER_COLUMN-2,g.CENTER_ROW))throw new Error("The center exception must preserve its full two-step neighborhood");
 if(g.gridCoords[1986].col!==g.CENTER_COLUMN+2||g.gridCoords[1986].row!==g.CENTER_ROW)throw new Error("NODE #1987 must anchor the vertical innovation branches");
 pass("Upgrade tree grid runtime: equal spacing, preserved IDs, square ray and symmetric G innovation branches");
}catch(error){fail("Upgrade tree grid runtime test: "+error.message)}
try{
 const networkSource=treeSource.slice(0,treeSource.indexOf(" const saved=FAStorage.getJSON"));
 const networkContext={};
 vm.runInNewContext(networkSource+";globalThis.__network={nodes,edges,ACTIVE_TOTAL,gridCoords,gridIndex,CENTER_ROW,G_BRANCH_COLUMN,G_BRANCH_RADIUS};})();",networkContext);
 const net=networkContext.__network,adj=net.nodes.map(()=>[]);
 const miniNode=net.nodes[1925];
 if(!miniNode||!miniNode.active||miniNode.type!=="square"||miniNode.links.length!==2)throw new Error("NODE #1926 must remain an active square innovation node with exactly two links");
 const miniCoords=net.gridCoords[1925];
 if(miniCoords.col!==net.G_BRANCH_COLUMN||miniCoords.row!==net.CENTER_ROW-1)throw new Error("NODE #1926 must remain the first square in the upper G branch");
 for(const [a,b] of net.edges){adj[a].push(b);adj[b].push(a)}
 const seen=new Uint8Array(net.nodes.length),queue=[0];seen[0]=1;
 for(let head=0;head<queue.length;head++)for(const next of adj[queue[head]])if(net.nodes[next].active&&!seen[next]){seen[next]=1;queue.push(next)}
 if(queue.length!==net.ACTIVE_TOTAL)throw new Error("Every active node must remain reachable from NODE #0001");
 const squareNodes=net.nodes.filter(n=>n.active&&n.type==="square");
 for(const square of squareNodes){
  const c=net.gridCoords[square.id];
  if(square.id===0)continue;
  if(!(c.row===net.CENTER_ROW||(c.col===net.G_BRANCH_COLUMN&&Math.abs(c.row-net.CENTER_ROW)<=net.G_BRANCH_RADIUS)))throw new Error("A square node exists outside the F ray or G innovation branch");
  for(const other of net.nodes){
   if(!other.active||other.type==="square"||other.id===square.id)continue;
   const p=net.gridCoords[other.id],dx=p.col-c.col,dy=p.row-c.row;
   const centerDx=p.col-net.gridCoords[0].col,centerDy=p.row-net.CENTER_ROW;
   if(dx*dx+dy*dy<=4&&p.row!==net.CENTER_ROW&&centerDx*centerDx+centerDy*centerDy>4)throw new Error("A non-path non-square node is inside a square's two-step exclusion radius");
  }
 }
 const gGate=1986;
 const isFBranchNode=id=>id!==0&&((net.gridCoords[id].row===net.CENTER_ROW&&net.gridCoords[id].col>=net.gridCoords[3].col)||(net.gridCoords[id].col===net.G_BRANCH_COLUMN&&Math.abs(net.gridCoords[id].row-net.CENTER_ROW)<=net.G_BRANCH_RADIUS));
 for(const [a,b] of net.edges){
  const aBranch=isFBranchNode(a),bBranch=isFBranchNode(b);
  if((aBranch&&!bBranch&&b!==0)||(bBranch&&!aBranch&&a!==0))throw new Error("An F-branch square connects to a node outside its branch");
 }
 if(!net.edges.some(([a,b])=>(a===0&&b===3)||(a===3&&b===0)))throw new Error("The F gate must retain its connection to the central root");
 for(const square of squareNodes){
  if(square.id===0)continue;
  const links=net.nodes[square.id].links;
  for(const otherId of links)if(otherId!==0&&!isFBranchNode(otherId))throw new Error("Square NODE "+(square.id+1)+" has an external connection");
 }
 for(let offset=-net.G_BRANCH_RADIUS;offset<=net.G_BRANCH_RADIUS;offset++){
  if(offset===0)continue;
  const id=net.gridIndex.get((net.G_BRANCH_COLUMN)+":"+(net.CENTER_ROW+offset));
  if(id===undefined||!net.nodes[id].active||net.nodes[id].type!=="square")throw new Error("A G branch destination is missing or is not square");
  if(!net.edges.some(([a,b])=>(a===gGate&&b===id)||(a===id&&b===gGate)))throw new Error("G gate is not directly linked to branch square NODE "+(id+1));
 }
 if(squareNodes.length<9)throw new Error("The F ray and G branch must retain their dedicated square nodes");
 pass("Upgrade tree network runtime: connected graph, square exclusion, F-ray placement and all eight direct G branches");
}catch(error){fail("Upgrade tree network runtime test: "+error.message)}
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
 const fContext={fLevel:0,gLevel:0,hLevel:0,t:10,LETTER_BASE_COSTS:{f:1e15,g:1e18,h:1e21},window:{isLetterFUnlocked:()=>true,isLetterGUnlocked:()=>false,isLetterHUnlocked:()=>false},getA:()=>2,getE:()=>3,safeProduct:(...values)=>values.reduce((a,b)=>a*b,1),safePow:(base,power)=>Math.pow(base,power),getLetterPrice:(base,level)=>base*Math.pow(8,level)};
 vm.runInNewContext(fFormulaSource+";globalThis.__f={getF,getFExponent,getFCost};",fContext);
 if(fContext.__f.getF()!==1)throw new Error("Unpurchased F must remain neutral");
 if(fContext.__f.getFCost()!==1e15)throw new Error("First F purchase must cost exactly 1 Qa");
 fContext.fLevel=1;if(fContext.__f.getFExponent()!==0.4||fContext.__f.getFCost()!==8e15)throw new Error("F first purchase must start at p=0.40 and next price must follow the shared 8x curve");
 fContext.t=4;if(fContext.__f.getF()!==1)throw new Error("F must remain inactive before t=5");
 fContext.t=5;if(!(fContext.__f.getF()>1))throw new Error("Purchased F must activate at t=5");
 fContext.fLevel=2;if(Math.abs(fContext.__f.getFExponent()-0.4001)>1e-12)throw new Error("Each F upgrade must increase p by 0.0001");
 fContext.fLevel=4501;if(fContext.__f.getFExponent()!==0.85)throw new Error("F exponent must cap at 0.85");
 pass("Letter F runtime tests: purchase gating, activation threshold, 1 Qa base price, shared price growth and p progression");
 const ghContext={fLevel:0,gLevel:0,hLevel:0,t:3600,LETTER_BASE_COSTS:{f:1e15,g:1e18,h:1e21},window:{isLetterFUnlocked:()=>true,isLetterGUnlocked:()=>true,isLetterHUnlocked:()=>true},getA:()=>10,getB:()=>10,getC:()=>10,getD:()=>10,getE:()=>1,safeProduct:(...values)=>values.reduce((a,b)=>a*b,1),safePow:(base,power)=>base>0?Math.pow(base,power):0,getLetterPrice:(base,level)=>base*Math.pow(8,level)};
 vm.runInNewContext(fFormulaSource+";globalThis.__gh={getG,getGCost,getH,getHBase,getHCost,getHExponent,lambertW0};",ghContext);
 if(ghContext.__gh.getG()!==0)throw new Error("Unpurchased G must provide no bonus");
 if(ghContext.__gh.getGCost()!==1e18)throw new Error("G first purchase must cost 1 Qi");
 ghContext.gLevel=1;const gx=Math.log1p(3600)/5,expectedG=.05*gx*gx/(1+gx*gx);
 if(Math.abs(ghContext.__gh.getG()-expectedG)>1e-12)throw new Error("G time saturation formula mismatch");
 ghContext.hLevel=0;if(ghContext.__gh.getHBase()!==250||ghContext.__gh.getHCost()!==1e21)throw new Error("H initial base or 1 Sx price mismatch");
 ghContext.hLevel=10000;if(ghContext.__gh.getHBase()!==200)throw new Error("H logarithm base must decrease by 0.005 per level");
 ghContext.hLevel=30000;if(ghContext.__gh.getHBase()!==100)throw new Error("H logarithm base must stop at 100");
 if(Math.abs(ghContext.__gh.lambertW0(Math.E)-1)>1e-12)throw new Error("Lambert W principal branch solver failed W(e)=1");
 ghContext.hLevel=1;const h=ghContext.__gh.getH();if(!(h>0&&Number.isFinite(h)))throw new Error("H multiplier must be finite and positive at t=3600");
 pass("Letter G/H runtime tests: time saturation, 5% per level, shared price curve, Lambert W and 100 base floor");

}catch(error){fail("Letter F runtime test: "+error.message)}
const timingSource=sources["assets/js/script.js"];
if(!timingSource.includes("const TICK=10"))fail("The game loop interval must remain 10 ms");
if(!timingSource.includes("factors.push(getGlobalSumMultiplier(),letterProduct,boost)"))fail("Production must keep t squared outside the Global Sum and include all letter multipliers");
if(!timingSource.includes("function getIntegralMultiplier()")||!timingSource.includes("factors.push(getIntegralMultiplier())"))fail("NODE #0001 integral must multiply production after it is permanently unlocked");
if(!timingSource.includes("const sumTerm=sumLevel>0?"))fail("Displayed formula must show Global Sum only after it is purchased");
if(!timingSource.includes('const productTerm="\\\\prod_{\\\\ell\\\\in\\\\mathcal{L}}\\\\ell"'))fail("Displayed formula must use compact product notation for A–E");
if(!timingSource.includes("\\\\int_{0}^{e}\\\\sqrt{1+x}"))fail("Displayed formula must place the complete multiplier product inside the integral");
if(!timingSource.includes("const formulaLetterGetters=[getA,getB,getC,getD,getE,getF,getG,getH]"))fail("All current letter multipliers, including F–H, must be registered inside the global sum");
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
  const letterContext={aLevel:0,bLevel:0,cLevel:0,dLevel:0,eLevel:0,fLevel:0,gLevel:0,hLevel:0,window:{isLetterFUnlocked:()=>true,isLetterGUnlocked:()=>false,isLetterHUnlocked:()=>false},getA:()=>2,getB:()=>3,getC:()=>5,getD:()=>7,getE:()=>11,getF:()=>1,formulaLetterGetters:[()=>2,()=>3,()=>5,()=>7,()=>11,()=>letterContext.getF()],safeProduct:(...values)=>values.reduce((a,b)=>a*b,1)};
  vm.runInNewContext(letterProductSource+";globalThis.__letterProduct=getLetterProduct;",letterContext);
  if(letterContext.__letterProduct()!==1)fail("Unpurchased A–E letters must not affect production");
  letterContext.aLevel=1;if(letterContext.__letterProduct()!==2)fail("First A purchase must activate A exactly once");
  letterContext.cLevel=1;if(letterContext.__letterProduct()!==10)fail("First C purchase must add C while unpurchased letters remain excluded");
  letterContext.bLevel=1;letterContext.dLevel=1;letterContext.eLevel=1;if(letterContext.__letterProduct()!==2310)fail("All five purchased core letters must multiply together");letterContext.fLevel=1;letterContext.getF=()=>13;if(letterContext.__letterProduct()!==30030)fail("Purchased and unlocked Letter F must join the production product");letterContext.window.isLetterFUnlocked=()=>false;if(letterContext.__letterProduct()!==2310)fail("Letter F must remain excluded when its tree node is locked");
  pass("Letter unlock tests: no unpurchased contribution; each letter activates on its first purchase");

}catch(error){fail("Production rate runtime test: "+error.message)}
const prestigeSource= sources["assets/js/prestige.js"];
if(!prestigeSource.includes("fLevel=0")||!prestigeSource.includes("gLevel=0")||!prestigeSource.includes("hLevel=0"))fail("Letter F–H levels must reset with the other run upgrades on prestige");else pass("Letter F–H prestige reset");
const resetSource=sources["assets/js/script.js"].match(/function resetSave\(\)[\s\S]*?\n\}/)?.[0]||"";
const resetRequirements=[
 "resetRun()","p=0;gp=0;prestigeUnlocked=false",
 "prestigeUpgrades={simpleBoost:0,globalSum:0}",
 "FA_META.research=Array(10).fill(0)",
 "FA_META.automation={unlocked:[false,false,false,false,false],enabled:[true,true,true,true,true],paused:false}",
 "FA_META.treeUnlocked=false","FA_META.treePassPurchased=false",
 "FA_META.stats={totalPlayTime:0,lifetimeValue:0,ascensions:0,genesisPrestiges:0,purchases:0}",
 'FAStorage.removeMany([LEGACY_SAVE_KEY,OLD_SAVE_KEY,"faTree"])',
 "saveGame(true)","savePrestige()","saveMeta()"
];
const missingReset=resetRequirements.filter(part=>!resetSource.includes(part));
if(missingReset.length)fail("Full RESET is missing local progression resets: "+missingReset.join(", "));
else pass("Full RESET clears run, AP/GP, prestige upgrades, Research, automation, Genesis Gate, tree and statistics");
if(/cloudSave|firebase|saveToCloud|deleteCloud|cloudRestore/.test(resetSource))fail("Full RESET must not access Firebase or cloud-save operations");
else pass("Full RESET is local-only and leaves Firebase cloud storage untouched");
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
const uiSource=sources["assets/js/app-ui.js"];
if(!uiSource.includes("miniUpgrades:false"))fail("Miniaturization must be disabled by default");
if(!uiSource.includes('window.refreshQolSettings=()=>')||!uiSource.includes('document.body.classList.toggle("mini-upgrades",!!meta.settings.miniUpgrades)'))fail("QOL setting must control and refresh the Miniaturization class");
if(!html.includes('data-menu-tab="qol"')||!html.includes('id="menu-qol"')||!html.includes('id="qolMiniaturizationToggle"'))fail("Dedicated QOL menu tab and Miniaturization toggle are missing");
if(!css.includes(".mini-upgrades #upgradesGrid")||!css.includes("@media(max-width:480px){.mini-upgrades #upgradesGrid"))fail("Miniaturization compact desktop/mobile card layouts are missing");
if(!sources["assets/js/script.js"].includes('const away=Math.min(elapsed,28800)*.35;value=Math.min(Number.MAX_VALUE,value+integrateOffline(away));t+=away;'))fail("Offline integration must calculate before advancing the run timer");
if(!sources["assets/js/script.js"].includes("if(sourceKey!==SAVE_KEY&&saveGame(true))FAStorage.remove(sourceKey)"))fail("Legacy saves must be migrated using the current in-memory run state");
if(!sources["assets/js/script.js"].includes('$("manualSaveBtn")'))fail("Manual save button must use its explicit ID");

if(errors.length){process.stderr.write("\nAUDIT FAILED: "+errors.length+" issue(s)\n");for(const e of errors)process.stderr.write("  FAIL "+e+"\n");process.exitCode=1}else{process.stdout.write("\nAUDIT PASSED");if(warnings.length)process.stdout.write(" with warnings");process.stdout.write(".\n")}
for(const w of warnings)process.stdout.write("  WARN "+w+"\n");
