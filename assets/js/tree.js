// FORMULA ASCENT — 3,886-node chaotic multi-link upgrade network
(() => {
 const TOTAL=3886,nodes=[],edges=[],edgeKeys=new Set();
 let seed=0xFA2026;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 // Fully chaotic organic placement: every new point branches from a randomly
 // selected existing point, with a random angle and distance. No rows, rays,
 // waves, rings, or visual ordering by node ID.
 const positions=[],graphPositions=[];
 let layoutSeed=0xC0FFEE;
 const layoutRandom=()=>{layoutSeed=(layoutSeed*1664525+1013904223)>>>0;return layoutSeed/4294967296};
 const cellSize=40,minSpacing=40,spatialGrid=new Map();
 const cellKey=(x,y)=>Math.floor(x/cellSize)+":"+Math.floor(y/cellSize);
 const addToGrid=(id,p)=>{
  const key=cellKey(p.x,p.y);
  if(!spatialGrid.has(key))spatialGrid.set(key,[]);
  spatialGrid.get(key).push(id);
 };
 const hasRoom=(x,y)=>{
  const cx=Math.floor(x/cellSize),cy=Math.floor(y/cellSize),limit=minSpacing*minSpacing;
  for(let gx=cx-1;gx<=cx+1;gx++)for(let gy=cy-1;gy<=cy+1;gy++){
   const bucket=spatialGrid.get(gx+":"+gy);
   if(!bucket)continue;
   for(const id of bucket){
    const p=positions[id],dx=p.x-x,dy=p.y-y;
    if(dx*dx+dy*dy<limit)return false;
   }
  }
  return true;
 };
 positions.push({x:0,y:0});addToGrid(0,positions[0]);
 for(let id=1;id<TOTAL;id++){
  let point=null;
  // Prefer short, irregular branches; every anchor is selected randomly
  // from the entire cloud, not from the previous ID or a fixed direction.
  for(let attempt=0;attempt<160&&!point;attempt++){
   const anchor=positions[Math.floor(layoutRandom()*positions.length)];
   const angle=layoutRandom()*Math.PI*2;
   const distance=42+layoutRandom()*118;
   const x=anchor.x+Math.cos(angle)*distance;
   const y=anchor.y+Math.sin(angle)*distance;
   if(hasRoom(x,y))point={x,y};
  }
  // If a dense pocket is full, allow a longer random branch rather than
  // placing nodes on top of one another.
  for(let attempt=0;attempt<100&&!point;attempt++){
   const anchor=positions[Math.floor(layoutRandom()*positions.length)];
   const angle=layoutRandom()*Math.PI*2;
   const distance=160+layoutRandom()*240;
   const x=anchor.x+Math.cos(angle)*distance;
   const y=anchor.y+Math.sin(angle)*distance;
   if(hasRoom(x,y))point={x,y};
  }
  if(!point)point={x:positions[0].x+id*minSpacing,y:0};
  positions.push(point);addToGrid(id,point);
 }
 // Keep the existing graph topology independent from the new visual layout.
 // These legacy coordinates are used only to choose the same nearest neighbors.
 graphPositions.push({x:0,y:0});
 const oldCoreRadius=95*4.5,oldRadialStep=oldCoreRadius/3.5;
 for(let id=1;id<TOTAL;id++){
  const arm=(id-1)%4,armStep=Math.floor((id-1)/4);
  const radius=oldCoreRadius+armStep*oldRadialStep;
  const angle=arm*Math.PI*2/4+2.35*Math.log1p(radius/oldCoreRadius)
    +.045*Math.sin(armStep*.19+arm*1.7);
  graphPositions.push({x:radius*Math.cos(angle),y:radius*Math.sin(angle)});
 }
 const addEdge=(a,b)=>{
  if(a===b||a<0||b<0)return;
  const lo=Math.min(a,b),hi=Math.max(a,b),key=lo+":"+hi;
  if(edgeKeys.has(key))return;
  edgeKeys.add(key);edges.push([lo,hi]);
 };
 const typeFor=id=>{
  if(id===0||id===3)return "square";
  const roll=random();
  return roll<.58?"circle":roll<.82?"triangle":roll<.94?"square":"pentagon";
 };
 for(let id=0;id<TOTAL;id++){
  const type=typeFor(id);
  // Coordinates are independently randomized; ID order does not define visual placement.
  const x=positions[id].x,y=positions[id].y;
  const maxLevel=type==="square"?1:type==="triangle"?10:type==="pentagon"?5:2+Math.floor(random()*99);
  const effect=type==="pentagon"?1.5+random():type==="triangle"?1.05+random()*.1:type==="circle"?1.002+random()*.023:1;
  const cost=id===3?5:type==="square"?1:type==="pentagon"?100000:type==="triangle"?1000:100;
  nodes.push({id,type,typeKey:"nodeType"+type[0].toUpperCase()+type.slice(1),depth:Math.floor(Math.sqrt(id)),parent:-1,links:[],maxLevel,level:0,x,y,cost,effect});
 }
 // Build a connected backbone, then add deterministic cross-links to create a tangled graph.
 for(let id=1;id<TOTAL;id++){
  const n=nodes[id],start=Math.max(0,id-48);
  let nearest=start,best=Infinity;
  for(let j=start;j<id;j++){
   const p=graphPositions[j],q=graphPositions[id],dx=q.x-p.x,dy=q.y-p.y,d=dx*dx+dy*dy;
   if(d<best){best=d;nearest=j}
  }
  n.parent=nearest;addEdge(id,nearest);
  const extraCount=1+(random()<.34?1:0)+(random()<.1?1:0);
  for(let k=0;k<extraCount;k++){
   const candidate=Math.max(0,id-48+Math.floor(random()*49));
   if(candidate!==nearest)addEdge(id,candidate);
  }
 }
 for(const [a,b] of edges){nodes[a].links.push(b);nodes[b].links.push(a)}
 const saved=FAStorage.getJSON("faTree",[]);
 if(Array.isArray(saved))saved.forEach(v=>{
  const id=Number(v?.id);
  if(Number.isInteger(id)&&id>=0&&id<TOTAL){
   const level=Math.floor(Number(v.level)||0);
   nodes[id].level=Math.min(nodes[id].maxLevel,Math.max(0,level));
  }
 });
 // Reveal nodes within 80 units of the center or any node purchased at least once.
 const REVEAL_RADIUS=80,REVEAL_RADIUS_SQ=REVEAL_RADIUS*REVEAL_RADIUS;
 const areaRevealed=new Uint8Array(TOTAL),revealed=new Uint8Array(TOTAL);
 function rebuildConnectedReveal(candidates,roots,adjacency,output){
  output.fill(0);
  const queue=[];
  for(const id of roots)if(candidates[id]&&!output[id]){output[id]=1;queue.push(id)}
  for(let head=0;head<queue.length;head++){
   const id=queue[head];
   for(const next of adjacency[id])if(candidates[next]&&!output[next]){output[next]=1;queue.push(next)}
  }
 }
 function rebuildRevealed(){
  areaRevealed.fill(0);
  const revealAround=(center)=>{
   const cx=Math.floor(center.x/cellSize),cy=Math.floor(center.y/cellSize);
   for(let gx=cx-2;gx<=cx+2;gx++)for(let gy=cy-2;gy<=cy+2;gy++){
    const bucket=spatialGrid.get(gx+":"+gy);
    if(!bucket)continue;
    for(const id of bucket){
     const p=positions[id],dx=p.x-center.x,dy=p.y-center.y;
     if(dx*dx+dy*dy<=REVEAL_RADIUS_SQ)areaRevealed[id]=1;
    }
   }
  };
  revealAround(positions[0]);
  const roots=[0];
  for(const n of nodes)if(n.level>0){revealAround(n);if(n.id!==0)roots.push(n.id)}
  rebuildConnectedReveal(areaRevealed,roots,nodes.map(n=>n.links),revealed);
 }
 rebuildRevealed();
 const MIN_SCALE=.0001,MAX_SCALE=2.5;
 let selected=-1,scale=.28,offsetX=0,offsetY=0,drag=null,initialized=false,canvas,ctx,cachedMultiplier=1,lastTreeRefresh=0;
 const recalc=()=>{cachedMultiplier=1;for(const n of nodes)if(n.level&&n.effect>1)cachedMultiplier*=Math.pow(n.effect,n.level)};
 recalc();
 const purchasedCount=()=>nodes.reduce((sum,n)=>sum+(n.level>=n.maxLevel?1:0),0);
 window.treePurchasedCount=purchasedCount;window.treeProductionMultiplier=()=>cachedMultiplier;window.isIntegralNodePurchased=()=>nodes[0].level>0;window.isLetterFUnlocked=()=>nodes[3].level>0;
 function persist(){return FAStorage.setJSON("faTree",nodes.filter(n=>n.level>0).map(n=>({id:n.id,level:n.level})))}
 function nodeCost(n){return n.id===0?1:n.id===3?5:Math.ceil(n.cost*Math.pow(1.55,n.level))}
 // The first content node is the only active purchase in this initial tree release.
 function available(n){return (n.id===0||n.id===3)&&n.level<n.maxLevel}
 function canBuy(n){return available(n)&&gp>=nodeCost(n)}
 function status(n){return n.level>=n.maxLevel?"purchased":available(n)?"available":"locked"}
 function edgeVisible(a,b){return revealed[a]===1&&revealed[b]===1}
 function selectedEdges(){
  const connected=new Set();
  if(selected<0)return connected;
  for(const next of nodes[selected].links)connected.add(Math.min(selected,next)+":"+Math.max(selected,next));
  return connected;
 }
 function pathNode(x,y,r,type){
  ctx.beginPath();
  if(type==="circle"){ctx.arc(x,y,r,0,Math.PI*2);return}
  const sides=type==="triangle"?3:type==="pentagon"?5:4,rotation=type==="triangle"?-Math.PI/2:type==="square"?Math.PI/4:-Math.PI/2;
  for(let i=0;i<sides;i++){
   const a=rotation+i*Math.PI*2/sides,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
   if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.closePath();
 }
 function nodeColor(n,s){
  if(s==="purchased")return "#6bd8cf";
  if(s==="available")return "#b8f36b";
  return n.type==="pentagon"?"#d68bff":n.type==="triangle"?"#f0a66d":n.type==="square"?"#6bd8cf":"#52635e";
 }
 function canvasSize(){if(!canvas)return;const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(r.width*dpr));canvas.height=Math.max(1,Math.floor(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
 function draw(){
  if(!ctx||!canvas)return;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#090f13";ctx.fillRect(0,0,w,h);
  const left=-offsetX/scale,top=-offsetY/scale,right=left+w/scale,bottom=top+h/scale;
  ctx.save();ctx.translate(offsetX,offsetY);ctx.scale(scale,scale);
  ctx.strokeStyle="rgba(120,157,144,.055)";ctx.lineWidth=1/scale;
  for(let x=Math.floor(left/200)*200;x<right;x+=200){ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke()}
  for(let y=Math.floor(top/200)*200;y<bottom;y+=200){ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke()}
  const blueEdges=selectedEdges(),fade=Math.max(.22,Math.min(1,scale/.28));
  for(const [a,b] of edges){
   const p=nodes[a],n=nodes[b];
   if(!edgeVisible(a,b))continue;
   if((p.x<left-30&&n.x<left-30)||(p.x>right+30&&n.x>right+30)||(p.y<top-30&&n.y<top-30)||(p.y>bottom+30&&n.y>bottom+30))continue;
   const key=a+":"+b,isBlue=blueEdges.has(key);
   const alpha=fade*(isBlue?.82:.62);
   ctx.save();ctx.lineCap="round";ctx.lineWidth=(isBlue?2.25:1.5)/scale;
   ctx.strokeStyle="rgba("+(isBlue?"75,151,255,":"105,226,157,")+alpha+")";
   ctx.shadowColor=isBlue?"rgba(65,139,255,.95)":"rgba(87,231,145,.8)";
   ctx.shadowBlur=(isBlue?10:7)/scale;
   ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(n.x,n.y);ctx.stroke();ctx.restore();
  }
  for(const n of nodes){
   if(!revealed[n.id]||n.x<left-40||n.x>right+40||n.y<top-40||n.y>bottom+40)continue;
   const s=status(n),r=(n.id===selected?22.5:n.id===0?19.5:12.3)/scale;
   const color=nodeColor(n,s);
   pathNode(n.x,n.y,r,n.type);
   ctx.fillStyle=s==="locked"?"rgba(40,54,51,.9)":color;ctx.fill();
   ctx.strokeStyle=s==="available"?"#d5ff9d":s==="purchased"?"#9af4eb":n.type==="pentagon"?"rgba(214,139,255,.9)":n.type==="triangle"?"rgba(240,166,109,.85)":n.type==="square"?"rgba(107,216,207,.85)":"rgba(137,157,148,.65)";
   ctx.lineWidth=(s==="available"||n.id===selected?2.7:1.7)/scale;ctx.stroke();
   if(s==="available"){ctx.beginPath();ctx.arc(n.x,n.y,r+9/scale,0,Math.PI*2);ctx.strokeStyle="rgba(184,243,107,.38)";ctx.lineWidth=1/scale;ctx.stroke()}
   if(n.id===selected){ctx.beginPath();ctx.arc(n.x,n.y,r+9/scale,0,Math.PI*2);ctx.strokeStyle="rgba(107,216,207,.65)";ctx.lineWidth=1/scale;ctx.stroke()}
  }
  ctx.restore();
 }
 function updateInspector(){
  const n=nodes[selected],id=document.querySelector(".inspector-id"),title=document.querySelector("#treeInspector h3"),desc=document.querySelector("#treeInspector p"),level=document.getElementById("nodeLevel"),cost=document.getElementById("nodeCost"),btn=document.getElementById("nodeBuy");
  if(!n){id.textContent="NODE —";title.textContent=tr("selectNode");desc.textContent=tr("selectNodeDesc");level.textContent="0 / 1";cost.textContent="—";btn.disabled=true;btn.textContent=tr("selectNode");return}
  const typeName=tr(n.typeKey),shapeLimit=n.type==="circle"?tr("nodeRangeCircle"):n.type==="triangle"?"10":n.type==="pentagon"?"5":"1";
  id.textContent="NODE #"+String(n.id+1).padStart(4,"0")+" · "+(n.type==="square"?"CONTENT NODE":typeName.toUpperCase())+" · "+n.links.length+" LINKS";
  title.textContent=n.id===0?tr("nodeRootTitle"):n.id===3?tr("nodeLetterFTitle"):n.type==="square"?tr("nodeContentTitle"):typeName+" "+tr("nodeUpgrade");
  desc.textContent=n.id===0?(FA_META.language==="ru"?"Навсегда добавляет интеграл в формулу производства. Верхний предел интеграла — текущий множитель e. Эффект сохраняется после престижа.":"Permanently adds an integral to the production formula. Its upper limit is the current e multiplier. The effect survives prestige resets."):n.id===3?tr("nodeLetterFDesc"):n.type==="square"?tr("nodeContentDesc"):tr("nodeFutureDesc")+" "+tr("nodeLimit")+" "+shapeLimit+".";
  level.textContent=n.level+" / "+n.maxLevel;
  cost.textContent=(typeof format==="function"?format(nodeCost(n)):String(nodeCost(n)))+" GP";
  btn.disabled=!canBuy(n);btn.textContent=n.level>=n.maxLevel?tr("maxed"):!available(n)?tr("lockedText"):gp<nodeCost(n)?tr("notEnough"):tr("buy");
 }
 window.refreshTreeLanguage=updateInspector;
 window.buyTreeNode=()=>{
  const n=nodes[selected];if(!n||!canBuy(n))return;
  gp-=nodeCost(n);savePrestige();n.level++;rebuildRevealed();FA_META.stats.purchases++;recalc();persist();saveMeta();updateInspector();updateProgress();draw();updateUI();refreshStats();
 };
 function updateProgress(){const el=document.getElementById("treeProgress"),balance=document.getElementById("treeGpBalance");if(el)el.textContent=purchasedCount()+" / "+TOTAL;if(balance)balance.textContent=(typeof format==="function"?format(gp):String(gp))+" GP"}
 function centerRoot(){if(!canvas)return;scale=.28;offsetX=canvas.clientWidth/2;offsetY=canvas.clientHeight/2;draw()}
 window.initUpgradeTree=()=>{
  if(initialized){canvasSize();draw();return}
  initialized=true;canvas=document.getElementById("treeCanvas");ctx=canvas.getContext("2d");
  canvas.addEventListener("pointerdown",e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,ox:offsetX,oy:offsetY,moved:false}});
  canvas.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;offsetX=drag.ox+dx;offsetY=drag.oy+dy;draw()});
  canvas.addEventListener("pointerup",e=>{
   if(!drag)return;
   if(!drag.moved){
    const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left-offsetX)/scale,y=(e.clientY-r.top-offsetY)/scale;
    let best=-1,dist=31/scale;
    for(const n of nodes){if(!revealed[n.id])continue;const d=Math.hypot(n.x-x,n.y-y);if(d<dist){dist=d;best=n.id}}
    selected=best;updateInspector();draw();
   }
   drag=null;
  });
  canvas.addEventListener("pointercancel",()=>drag=null);
  canvas.addEventListener("wheel",e=>{e.preventDefault();const r=canvas.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,wx=(mx-offsetX)/scale,wy=(my-offsetY)/scale;scale=Math.max(MIN_SCALE,Math.min(MAX_SCALE,scale*(e.deltaY<0?1.12:.72)));offsetX=mx-wx*scale;offsetY=my-wy*scale;draw()},{passive:false});
  window.addEventListener("resize",canvasSize);document.getElementById("nodeBuy").addEventListener("click",window.buyTreeNode);
  canvasSize();centerRoot();updateInspector();updateProgress();
 };
 window.treeZoom=dir=>{if(!initialized)return;const cx=canvas.clientWidth/2,cy=canvas.clientHeight/2,wx=(cx-offsetX)/scale,wy=(cy-offsetY)/scale;scale=Math.max(MIN_SCALE,Math.min(MAX_SCALE,scale*(dir>0?1.18:.65)));offsetX=cx-wx*scale;offsetY=cy-wy*scale;draw()};
 window.treeResetView=()=>{centerRoot();updateInspector()};
 window.refreshTree=()=>{if(!initialized||!document.getElementById("page-tree").classList.contains("active"))return;const now=performance.now();if(now-lastTreeRefresh<100)return;lastTreeRefresh=now;draw();updateInspector();updateProgress()};
 updateProgress();
})();