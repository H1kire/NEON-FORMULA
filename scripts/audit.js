"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),errors=[],warnings=[];
const read=file=>fs.readFileSync(path.join(root,file),"utf8"),exists=file=>fs.existsSync(path.join(root,file));
const fail=message=>errors.push(message),pass=message=>process.stdout.write("  OK  "+message+"\n");
const required=["index.html","README.md","package.json","assets/css/style.css","assets/js/storage.js","assets/js/prestige.js","assets/js/tree.js","assets/js/app-ui.js","assets/js/script.js"];
for(const file of required){if(!exists(file))fail("Missing "+file);else pass("Found "+file)}
if(exists(".idea"))warnings.push(".idea should not be committed.");
const html=read("index.html"),css=read("assets/css/style.css"),jsFiles=["assets/js/storage.js","assets/js/prestige.js","assets/js/tree.js","assets/js/app-ui.js","assets/js/script.js"];
const sources=Object.fromEntries(jsFiles.map(file=>[file,read(file)]));
for(const file of jsFiles){try{new vm.Script(sources[file],{filename:file});pass("Syntax "+file)}catch(error){fail("Syntax "+file+": "+error.message)}}
let pkg;try{pkg=JSON.parse(read("package.json"));pass("Valid package.json")}catch(error){fail("Invalid package.json: "+error.message)}
const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]),duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
if(duplicates.length)fail("Duplicate IDs: "+[...new Set(duplicates)].join(", "));else pass("Unique HTML IDs ("+ids.length+")");
const idSet=new Set(ids);
for(const file of jsFiles)for(const m of sources[file].matchAll(/getElementById\(["']([^"']+)["']\)/g))if(!idSet.has(m[1]))fail(file+" missing HTML ID #"+m[1]);
const scriptRefs=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m=>m[1]);
for(const src of scriptRefs)if(!exists(src))fail("Missing script "+src);
const order=["assets/js/storage.js","assets/js/prestige.js","assets/js/tree.js","assets/js/app-ui.js","assets/js/script.js"];
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
if((css.match(/{/g)||[]).length!==(css.match(/}/g)||[]).length)fail("CSS brace mismatch");else pass("CSS braces");
for(const file of jsFiles.slice(1))if(/\blocalStorage\b/.test(sources[file]))fail("Direct localStorage access in "+file);
if(!sources["assets/js/tree.js"].includes("const TOTAL=3886"))fail("Upgrade tree count changed");
if(pkg&&(!pkg.scripts?.check||!pkg.scripts?.start))fail("Missing npm scripts");
if(errors.length){process.stderr.write("\nAUDIT FAILED: "+errors.length+" issue(s)\n");for(const e of errors)process.stderr.write("  FAIL "+e+"\n");process.exitCode=1}else{process.stdout.write("\nAUDIT PASSED");if(warnings.length)process.stdout.write(" with warnings");process.stdout.write(".\n")}
for(const w of warnings)process.stdout.write("  WARN "+w+"\n");
