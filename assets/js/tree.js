// FORMULA ASCENT — 3,886-node regular-grid upgrade network
(() => {
 const TOTAL=3886,nodes=[],edges=[],edgeKeys=new Set();
 let ACTIVE_TOTAL=0;
 let seed=0xFA2026;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 // Every node occupies one unique cell in the same regular rectangular grid.
 const positions=[],gridCoords=[],gridIndex=new Map();
 // One grid step preserves the previous center-to-NODE #0004 distance.
 const GRID_SPACING=73.00156874163076;
 const GRID_COLUMNS=Math.ceil(Math.sqrt(TOTAL));
 const GRID_ROWS=Math.ceil(TOTAL/GRID_COLUMNS);
 const CENTER_COLUMN=Math.floor(GRID_COLUMNS/2);
 const CENTER_ROW=Math.floor(GRID_ROWS/2);
 const GATE_COLUMN=CENTER_COLUMN+1;
 // NODE #1987 (Letter G) opens four square innovation nodes in each vertical direction.
 const G_BRANCH_COLUMN=CENTER_COLUMN+2,G_BRANCH_RADIUS=4;
 const isSquareCell=(col,row)=>(col===GATE_COLUMN&&row===CENTER_ROW)||(col>GATE_COLUMN&&row===CENTER_ROW)||(col===G_BRANCH_COLUMN&&Math.abs(row-CENTER_ROW)<=G_BRANCH_RADIUS);
 const isPathCell=(col,row)=>row===CENTER_ROW;
 const isCenterExceptionCell=(col,row)=>{const dx=col-CENTER_COLUMN,dy=row-CENTER_ROW;return dx*dx+dy*dy<=4};
 // The F-ray and its G innovation branch form a closed connection family; only NODE #0001 may connect across its boundary.
 const isFBranchCell=(col,row)=>(row===CENTER_ROW&&col>=GATE_COLUMN)||(col===G_BRANCH_COLUMN&&Math.abs(row-CENTER_ROW)<=G_BRANCH_RADIUS);
 const isFBranchNode=id=>id!==0&&isFBranchCell(gridCoords[id].col,gridCoords[id].row);
 const isBranchCompatible=(a,b)=>a===0||b===0||isFBranchNode(a)===isFBranchNode(b);
 const isWithinSquareExclusion=(col,row)=>{
  for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){
   if(dx*dx+dy*dy>4)continue;
   if(isSquareCell(col+dx,row+dy))return true;
  }
  return false;
 };
 const isActiveCell=(col,row)=>{
  const base=col<=GATE_COLUMN||row===CENTER_ROW||(col===G_BRANCH_COLUMN&&Math.abs(row-CENTER_ROW)<=G_BRANCH_RADIUS);
  return base&&(isSquareCell(col,row)||isPathCell(col,row)||isCenterExceptionCell(col,row)||!isWithinSquareExclusion(col,row));
 };
 const gridKey=(col,row)=>col+":"+row;
 const setGridNode=(id,col,row)=>{
  gridCoords[id]={col,row};
  positions[id]={x:(col-CENTER_COLUMN)*GRID_SPACING,y:(row-CENTER_ROW)*GRID_SPACING};
  gridIndex.set(gridKey(col,row),id);
 };
 // Keep the root at the map center and NODE #0004 exactly one grid step to its right.
 setGridNode(0,CENTER_COLUMN,CENTER_ROW);
 setGridNode(3,CENTER_COLUMN+1,CENTER_ROW);
 let nextGridId=1;
 for(let row=0;row<GRID_ROWS;row++)for(let col=0;col<GRID_COLUMNS;col++){
  if(gridIndex.has(gridKey(col,row)))continue;
  while(nextGridId===3)nextGridId++;
  if(nextGridId>=TOTAL)break;
  setGridNode(nextGridId++,col,row);
 }
 if(nextGridId<TOTAL)throw new Error("Upgrade tree grid does not have enough cells");
 for(const p of gridCoords)if(isActiveCell(p.col,p.row))ACTIVE_TOTAL++;
 if(ACTIVE_TOTAL<=0)throw new Error("Upgrade tree has no active nodes");
 let edgeSeed=0xED6E2026;
 const edgeRandom=()=>{edgeSeed=(edgeSeed*1664525+1013904223)>>>0;return edgeSeed/4294967296};
 const addEdge=(a,b)=>{
  if(a===b||a<0||b<0||!isBranchCompatible(a,b))return;
  const lo=Math.min(a,b),hi=Math.max(a,b),key=lo+":"+hi;
  if(edgeKeys.has(key))return;
  edgeKeys.add(key);edges.push([lo,hi]);
 };
 const typeFor=id=>{
  if(id===0)return "square";
  const roll=random();
  if(id===3)return "square";
  const p=gridCoords[id];
  if(isSquareCell(p.col,p.row))return "square";
  return roll<.70?"circle":roll<.94?"triangle":"pentagon";
 };
 for(let id=0;id<TOTAL;id++){
  const type=typeFor(id);
  // Node IDs retain their gameplay identity; their positions follow the fixed grid.
  const x=positions[id].x,y=positions[id].y;
  const maxLevel=type==="square"?1:type==="triangle"?10:type==="pentagon"?5:2+Math.floor(random()*99);
  const effect=type==="pentagon"?1.5+random():type==="triangle"?1.05+random()*.1:type==="circle"?1.002+random()*.023:1;
  const cost=id===3?5:type==="square"?1:type==="pentagon"?100000:type==="triangle"?1000:100;
  const cell=gridCoords[id],active=isActiveCell(cell.col,cell.row);
  nodes.push({id,active,type,typeKey:"nodeType"+type[0].toUpperCase()+type.slice(1),depth:Math.floor(Math.sqrt(id)),parent:-1,links:[],maxLevel,level:0,x,y,cost,effect});
 }
 // Build a randomized spanning network over the grid so every node remains reachable.
 const cardinalDirections=[[-1,0],[1,0],[0,-1],[0,1]];
 const diagonalDirections=[[-1,1],[1,1]];
 const gridNeighbors=(id,directions)=>{
  const p=gridCoords[id],result=[];
  for(const [dx,dy] of directions){
   const neighbor=gridIndex.get(gridKey(p.col+dx,p.row+dy));
   if(neighbor!==undefined&&isActiveCell(gridCoords[neighbor].col,gridCoords[neighbor].row)&&isBranchCompatible(id,neighbor))result.push(neighbor);
  }
  return result;
 };
 const visited=new Uint8Array(TOTAL),inFrontier=new Uint8Array(TOTAL),frontier=[];
 const addFrontierFrom=id=>{
  for(const neighbor of gridNeighbors(id,cardinalDirections)){
   if(!visited[neighbor]&&!inFrontier[neighbor]){inFrontier[neighbor]=1;frontier.push(neighbor)}
  }
 };
 visited[0]=1;
 let visitedCount=1;
 // Keep the four immediate neighbors visible around the center from the start.
 for(const neighbor of gridNeighbors(0,cardinalDirections)){
  if(!visited[neighbor]){addEdge(0,neighbor);nodes[neighbor].parent=0;visited[neighbor]=1;visitedCount++}
 }
 addFrontierFrom(0);
 for(let id=1;id<TOTAL;id++)if(visited[id])addFrontierFrom(id);
 while(visitedCount<ACTIVE_TOTAL&&frontier.length){
  const index=Math.floor(edgeRandom()*frontier.length),id=frontier[index];
  frontier[index]=frontier[frontier.length-1];frontier.pop();inFrontier[id]=0;
  if(visited[id])continue;
  const parents=gridNeighbors(id,cardinalDirections).filter(neighbor=>visited[neighbor]);
  if(!parents.length)continue;
  const parent=parents[Math.floor(edgeRandom()*parents.length)];
  addEdge(id,parent);nodes[id].parent=parent;visited[id]=1;visitedCount++;
  addFrontierFrom(id);
 }
 if(visitedCount!==ACTIVE_TOTAL)throw new Error("Upgrade tree active grid network is disconnected");
 // Connect every square innovation node directly to the Letter G gate, forming clear upper/lower branches.
 const G_GATE_NODE_ID=1986;
 for(let offset=-G_BRANCH_RADIUS;offset<=G_BRANCH_RADIUS;offset++){
  if(offset===0)continue;
  const branchNode=gridIndex.get(gridKey(G_BRANCH_COLUMN,CENTER_ROW+offset));
  if(branchNode!==undefined&&nodes[branchNode].active&&nodes[branchNode].type==="square")addEdge(G_GATE_NODE_ID,branchNode);
 }
 // Add seeded random orthogonal and diagonal cross-links for a loose web of threads.
 for(let id=0;id<TOTAL;id++){
  const p=gridCoords[id];
  if(!nodes[id].active)continue;
  for(const [dx,dy] of [[1,0],[0,1]]){
   const neighbor=gridIndex.get(gridKey(p.col+dx,p.row+dy));
   if(neighbor!==undefined&&nodes[neighbor].active&&edgeRandom()<.28)addEdge(id,neighbor);
  }
  for(const [dx,dy] of diagonalDirections){
   const neighbor=gridIndex.get(gridKey(p.col+dx,p.row+dy));
   if(neighbor!==undefined&&nodes[neighbor].active&&edgeRandom()<.10)addEdge(id,neighbor);
  }
 }
 for(const [a,b] of edges){nodes[a].links.push(b);nodes[b].links.push(a)}
 const saved=FAStorage.getJSON("faTree",[]);
 if(Array.isArray(saved))saved.forEach(v=>{
  const id=Number(v?.id);
  if(Number.isInteger(id)&&id>=0&&id<TOTAL){
   const level=Math.floor(Number(v.level)||0);
   if(nodes[id].active)nodes[id].level=Math.min(nodes[id].maxLevel,Math.max(0,level));
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
   // Scan the fixed node array directly; the old spatial index was removed by the grid rewrite.
   for(let id=0;id<TOTAL;id++){
    if(!nodes[id].active)continue;
    const p=positions[id],dx=p.x-center.x,dy=p.y-center.y;
    if(dx*dx+dy*dy<=REVEAL_RADIUS_SQ)areaRevealed[id]=1;
   }
  };
  revealAround(positions[0]);
  const roots=[0];
  for(const n of nodes)if(n.active&&n.level>0){revealAround(n);if(n.id!==0)roots.push(n.id)}
  rebuildConnectedReveal(areaRevealed,roots,nodes.map(n=>n.links),revealed);
 }
 rebuildRevealed();
 const MIN_SCALE=.0001,MAX_SCALE=2.5;
 let selected=-1,scale=.28,offsetX=0,offsetY=0,drag=null,initialized=false,canvas,ctx,cachedMultiplier=1,lastTreeRefresh=0;
 const recalc=()=>{cachedMultiplier=1;for(const n of nodes)if(n.active&&n.level&&n.effect>1)cachedMultiplier*=Math.pow(n.effect,n.level)};
 recalc();
 const purchasedCount=()=>nodes.reduce((sum,n)=>sum+(n.active&&n.level>=n.maxLevel?1:0),0);
 window.treePurchasedCount=purchasedCount;window.treeActiveCount=()=>ACTIVE_TOTAL;window.treeProductionMultiplier=()=>cachedMultiplier;window.isIntegralNodePurchased=()=>nodes[0].level>0;window.isLetterFUnlocked=()=>nodes[3].level>0;window.isLetterGUnlocked=()=>nodes[1986].level>0;window.isLetterHUnlocked=()=>nodes[1987].level>0;window.isMiniaturizationUnlocked=()=>nodes[1925].level>0;
 function persist(){if(window.FA_CLOUD_RESTORING)return false;return FAStorage.setJSON("faTree",nodes.filter(n=>n.active&&n.level>0).map(n=>({id:n.id,level:n.level})))}
 window.saveTreeProgress=persist;
 function nodeCost(n){return n.id===0?1:n.id===3?5:n.id===1986?25:n.id===1987?50:n.id===1925?10:Math.ceil(n.cost*Math.pow(1.55,n.level))}
 // Letter gates unlock in sequence: F, then G, then H.
 function available(n){return (n.id===0||n.id===3||(n.id===1986&&nodes[3].level>0)||(n.id===1987&&nodes[1986].level>0)||(n.id===1925&&nodes[1986].level>0))&&n.level<n.maxLevel}
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
   if(!n.active||!revealed[n.id]||n.x<left-40||n.x>right+40||n.y<top-40||n.y>bottom+40)continue;
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
  const letterGate=({1986:"G",1987:"H",1988:"I",1989:"J"})[n.id]||"";
  const innovationNode=n.type==="square"&&n.id!==0&&n.id!==3&&!letterGate&&gridCoords[n.id].col===G_BRANCH_COLUMN&&Math.abs(gridCoords[n.id].row-CENTER_ROW)<=G_BRANCH_RADIUS;
  const miniaturizationNode=innovationNode&&n.id===1925;
  id.textContent="NODE #"+String(n.id+1).padStart(4,"0")+" · "+(letterGate?"LETTER "+letterGate+" GATE":innovationNode?"INNOVATION NODE":n.type==="square"?"CONTENT NODE":typeName.toUpperCase())+" · "+n.links.length+" LINKS";
  title.textContent=n.id===0?tr("nodeRootTitle"):n.id===3?tr("nodeLetterFTitle"):letterGate?tr("nodeLetter"+letterGate+"Title"):miniaturizationNode?tr("miniaturizationTitle"):innovationNode?tr("nodeInnovationTitle"):n.type==="square"?tr("nodeContentTitle"):typeName+" "+tr("nodeUpgrade");
  desc.textContent=n.id===0?(FA_META.language==="ru"?"Навсегда добавляет интеграл в формулу производства. Верхний предел интеграла — текущий множитель e. Эффект сохраняется после престижа.":"Permanently adds an integral to the production formula. Its upper limit is the current e multiplier. The effect survives prestige resets."):n.id===3?tr("nodeLetterFDesc"):letterGate?tr("nodeLetter"+letterGate+"Desc"):miniaturizationNode?tr("miniaturizationNodeDesc"):innovationNode?tr("nodeInnovationDesc"):n.type==="square"?tr("nodeContentDesc"):tr("nodeFutureDesc")+" "+tr("nodeLimit")+" "+shapeLimit+".";
  level.textContent=n.level+" / "+n.maxLevel;
  cost.textContent=(letterGate==="I"||letterGate==="J")?"—":(typeof format==="function"?format(nodeCost(n)):String(nodeCost(n)))+" GP";
  btn.disabled=!canBuy(n);btn.textContent=n.level>=n.maxLevel?tr("maxed"):!available(n)?tr("lockedText"):gp<nodeCost(n)?tr("notEnough"):tr("buy");
 }
 window.refreshTreeLanguage=updateInspector;
 window.buyTreeNode=()=>{
  const n=nodes[selected];if(!n||!canBuy(n))return;
  gp-=nodeCost(n);savePrestige();n.level++;if(n.id===1925&&window.refreshQolSettings)window.refreshQolSettings();rebuildRevealed();FA_META.stats.purchases++;recalc();persist();saveMeta();updateInspector();updateProgress();draw();updateUI();refreshStats();
 };
 window.refundUpgradeTree=()=>{
  if(!window.FAAuth||!window.FAAuth.isDeveloper())return false;
  let refunded=0;
  for(const n of nodes){
   if(!n.active||n.level<=0)continue;
   for(let level=0;level<n.level;level++){
    const cost=n.id===0?1:n.id===3?5:n.id===1986?25:n.id===1987?50:Math.ceil(n.cost*Math.pow(1.55,level));
    refunded=Math.min(Number.MAX_VALUE,refunded+cost);
   }
  }
  if(refunded<=0)return {refunded:0,saved:true};
  gp=Math.min(Number.MAX_VALUE,gp+refunded);
  for(const n of nodes)if(n.active)n.level=0;
  selected=-1;rebuildRevealed();recalc();
  const savedTree=persist(),savedPrestige=savePrestige();
  updateInspector();updateProgress();draw();updateUI();updatePrestigeUI();refreshStats();
  return {refunded,saved:savedTree&&savedPrestige};
 };
 function updateProgress(){const el=document.getElementById("treeProgress"),balance=document.getElementById("treeGpBalance");if(el)el.textContent=purchasedCount()+" / "+ACTIVE_TOTAL;if(balance)balance.textContent=(typeof format==="function"?format(gp):String(gp))+" GP"}
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
    for(const n of nodes){if(!n.active||!revealed[n.id])continue;const d=Math.hypot(n.x-x,n.y-y);if(d<dist){dist=d;best=n.id}}
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