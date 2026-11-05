// FORMULA ASCENT — 3,886-node chaotic multi-link upgrade network
(() => {
 const TOTAL=3886,nodes=[],edges=[],edgeKeys=new Set();
 let seed=0xFA2026;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 // Eight wave branches: sine and cosine-shaped curves in four directions
 // from the XY origin (0°, 45°, 90°, 135°). The cosine wave is shifted so
 // that it also begins at the origin instead of starting at its maximum.
 const positions=[],graphPositions=[];
 positions.push({x:0,y:0});
 const directionCount=4,wavesPerDirection=2;
 const waveAmplitude=145,waveLength=2200;
 const waveFrequency=Math.PI*2/waveLength;
 const alongStep=24,firstDistance=100;
 for(let id=1;id<TOTAL;id++){
  const slot=id-1,family=slot%(directionCount*wavesPerDirection);
  const step=Math.floor(slot/(directionCount*wavesPerDirection));
  const direction=Math.floor(family/wavesPerDirection);
  const waveType=family%wavesPerDirection;
  const angle=direction*Math.PI/4;
  const distance=firstDistance+step*alongStep;
  const phase=distance*waveFrequency;
  const displacement=waveAmplitude*(waveType===0?Math.sin(phase):1-Math.cos(phase));
  const x=distance*Math.cos(angle)-displacement*Math.sin(angle);
  const y=distance*Math.sin(angle)+displacement*Math.cos(angle);
  positions.push({x,y});
 }
 // Preserve the previous graph topology by using the previous coordinates
 // only for nearest-neighbor selection; displayed coordinates are the waves above.
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
  if(id===0)return "square";
  const roll=random();
  return roll<.58?"circle":roll<.82?"triangle":roll<.94?"square":"pentagon";
 };
 for(let id=0;id<TOTAL;id++){
  const type=typeFor(id);
  // Node IDs advance round-robin through the eight sine/cosine wave branches.
  const x=positions[id].x,y=positions[id].y;
  const maxLevel=type==="square"?1:type==="triangle"?10:type==="pentagon"?5:2+Math.floor(random()*99);
  const effect=type==="pentagon"?1.5+random():type==="triangle"?1.05+random()*.1:type==="circle"?1.002+random()*.023:1;
  const cost=type==="square"?1:type==="pentagon"?100000:type==="triangle"?1000:100;
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
 const MIN_SCALE=.0001,MAX_SCALE=2.5;
 let selected=-1,scale=.28,offsetX=0,offsetY=0,drag=null,initialized=false,canvas,ctx,cachedMultiplier=1,lastTreeRefresh=0;
 const recalc=()=>{cachedMultiplier=1;for(const n of nodes)if(n.level&&n.effect>1)cachedMultiplier*=Math.pow(n.effect,n.level)};
 recalc();
 const purchasedCount=()=>nodes.reduce((sum,n)=>sum+(n.level>=n.maxLevel?1:0),0);
 window.treePurchasedCount=purchasedCount;window.treeProductionMultiplier=()=>cachedMultiplier;
 function persist(){return FAStorage.setJSON("faTree",nodes.filter(n=>n.level>0).map(n=>({id:n.id,level:n.level})))}
 function nodeCost(n){return n.id===0?1:Math.ceil(n.cost*Math.pow(1.55,n.level))}
 // The first content node is the only active purchase in this initial tree release.
 function available(n){return n.id===0&&n.level<n.maxLevel}
 function canBuy(n){return available(n)&&gp>=nodeCost(n)}
 function status(n){return n.level>=n.maxLevel?"purchased":available(n)?"available":"locked"}
 function edgeOpen(a,b){return status(nodes[a])!=="locked"&&status(nodes[b])!=="locked"}
 function selectedPath(){
  if(selected<0)return new Set();
  const previous=new Int32Array(TOTAL);previous.fill(-1);
  const queue=[0];previous[0]=0;
  for(let q=0;q<queue.length;q++){
   const id=queue[q];if(id===selected)break;
   for(const next of nodes[id].links){
    if(previous[next]!==-1||!edgeOpen(id,next))continue;
    previous[next]=id;queue.push(next);
   }
  }
  const path=new Set();
  if(previous[selected]===-1)return path;
  let current=selected;while(current!==0){const parent=previous[current];path.add(Math.min(current,parent)+":"+Math.max(current,parent));current=parent}
  return path;
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
  const bluePath=selectedPath(),fade=Math.max(.22,Math.min(1,scale/.28));
  for(const [a,b] of edges){
   const p=nodes[a],n=nodes[b];
   if(!edgeOpen(a,b))continue;
   if((p.x<left-30&&n.x<left-30)||(p.x>right+30&&n.x>right+30)||(p.y<top-30&&n.y<top-30)||(p.y>bottom+30&&n.y>bottom+30))continue;
   const key=a+":"+b,isBlue=bluePath.has(key)||(a===selected&&status(n)==="available")||(b===selected&&status(p)==="available");
   const alpha=fade*(isBlue?.9:.72);
   ctx.save();ctx.lineCap="round";ctx.lineWidth=(isBlue?2.25:1.5)/scale;
   ctx.strokeStyle="rgba("+(isBlue?"75,151,255,":"105,226,157,")+alpha+")";
   ctx.shadowColor=isBlue?"rgba(65,139,255,.95)":"rgba(87,231,145,.8)";
   ctx.shadowBlur=(isBlue?13:9)/scale;
   ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(n.x,n.y);ctx.stroke();ctx.restore();
  }
  for(const n of nodes){
   if(n.x<left-40||n.x>right+40||n.y<top-40||n.y>bottom+40)continue;
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
  id.textContent="NODE #"+String(n.id+1).padStart(4,"0")+" · "+typeName.toUpperCase()+" · "+n.links.length+" LINKS";
  title.textContent=n.id===0?tr("nodeRootTitle"):typeName+" "+tr("nodeUpgrade");
  desc.textContent=n.id===0?tr("nodeRootDesc"):tr("nodeFutureDesc")+" "+tr("nodeLimit")+" "+shapeLimit+".";
  level.textContent=n.level+" / "+n.maxLevel;
  cost.textContent=(typeof format==="function"?format(nodeCost(n)):String(nodeCost(n)))+" GP";
  btn.disabled=!canBuy(n);btn.textContent=n.level>=n.maxLevel?tr("maxed"):!available(n)?tr("lockedText"):gp<nodeCost(n)?tr("notEnough"):tr("buy");
 }
 window.refreshTreeLanguage=updateInspector;
 window.buyTreeNode=()=>{
  const n=nodes[selected];if(!n||!canBuy(n))return;
  gp-=nodeCost(n);savePrestige();n.level++;FA_META.stats.purchases++;recalc();persist();saveMeta();updateInspector();updateProgress();draw();updateUI();refreshStats();
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
    for(const n of nodes){const d=Math.hypot(n.x-x,n.y-y);if(d<dist){dist=d;best=n.id}}
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