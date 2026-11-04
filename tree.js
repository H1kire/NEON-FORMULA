// FORMULA ASCENT — 3,886-node procedural branching upgrade network
(() => {
 const TOTAL=3886,nodes=[];
 for(let id=0;id<TOTAL;id++){
  const depth=Math.floor(Math.log2(id+1)),first=Math.pow(2,depth)-1,pos=id-first,count=Math.pow(2,depth);
  const spread=9200/count,noise=Math.sin(id*1.71)*spread*.24+Math.cos(id*.37)*spread*.09;
  const x=(pos+.5)*spread-4600+noise,y=depth*108+Math.sin(id*.23)*17;
  nodes.push({id,depth,parent:id===0?-1:Math.floor((id-1)/2),maxLevel:1+((id*17+depth*7)%5),level:0,x,y,cost:Math.floor(250*Math.pow(1.055,depth)*(1+(id%7)*.035)),effect:1+((id*13)%5)*.0025});
 }
 try{const saved=JSON.parse(localStorage.getItem("faTree")||"[]");saved.forEach(v=>{if(nodes[v.id])nodes[v.id].level=Math.min(nodes[v.id].maxLevel,Math.max(0,Number(v.level)||0))})}catch{}
 let selected=-1,scale=.7,offsetX=0,offsetY=35,drag=null,initialized=false,canvas,ctx,cachedMultiplier=1;
 const recalc=()=>{cachedMultiplier=1;for(const n of nodes)if(n.level)cachedMultiplier*=Math.pow(n.effect,n.level)};
 recalc();
 const purchasedCount=()=>nodes.reduce((sum,n)=>sum+(n.level>=n.maxLevel?1:0),0);
 window.treePurchasedCount=purchasedCount;window.treeProductionMultiplier=()=>cachedMultiplier;
 function persist(){localStorage.setItem("faTree",JSON.stringify(nodes.filter(n=>n.level>0).map(n=>({id:n.id,level:n.level}))))}
 function nodeCost(n){return Math.ceil(n.cost*Math.pow(1.55,n.level))}
 function available(n){return n.parent===-1||nodes[n.parent].level>=nodes[n.parent].maxLevel}
 function canBuy(n){return available(n)&&n.level<n.maxLevel&&gp>=nodeCost(n)}
 function status(n){return n.level>=n.maxLevel?"purchased":available(n)?"available":"locked"}
 function canvasSize(){if(!canvas)return;const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(r.width*dpr));canvas.height=Math.max(1,Math.floor(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
 function draw(){
  if(!ctx||!canvas)return;const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);ctx.fillStyle="#090f13";ctx.fillRect(0,0,w,h);
  const left=-offsetX/scale,top=-offsetY/scale,right=left+w/scale,bottom=top+h/scale;
  ctx.save();ctx.translate(offsetX,offsetY);ctx.scale(scale,scale);
  ctx.strokeStyle="rgba(120,157,144,.07)";ctx.lineWidth=1/scale;
  for(let x=Math.floor(left/200)*200;x<right;x+=200){ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke()}
  for(let y=Math.floor(top/200)*200;y<bottom;y+=200){ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke()}
  for(const n of nodes){if(n.parent<0)continue;const p=nodes[n.parent];if(n.x<left-80||n.x>right+80||n.y<top-80||n.y>bottom+80)continue;ctx.strokeStyle=n.level>0?"rgba(107,216,207,.45)":available(n)?"rgba(184,243,107,.22)":"rgba(95,113,109,.12)";ctx.lineWidth=1.15;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(n.x,n.y);ctx.stroke()}
  for(const n of nodes){if(n.x<left-40||n.x>right+40||n.y<top-40||n.y>bottom+40)continue;const s=status(n),r=n.id===selected?7:4.2;ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);ctx.fillStyle=s==="purchased"?"#6bd8cf":s==="available"?"#b8f36b":"#35443f";ctx.fill();if(s==="available"||n.id===selected){ctx.strokeStyle=s==="available"?"rgba(184,243,107,.45)":"rgba(107,216,207,.75)";ctx.lineWidth=1.2;ctx.stroke()}if(n.id===selected){ctx.beginPath();ctx.arc(n.x,n.y,12,0,Math.PI*2);ctx.strokeStyle="rgba(107,216,207,.55)";ctx.stroke()}}
  ctx.restore();
 }
 function updateInspector(){
  const n=nodes[selected],id=document.querySelector(".inspector-id"),title=document.querySelector("#treeInspector h3"),desc=document.querySelector("#treeInspector p"),level=document.getElementById("nodeLevel"),cost=document.getElementById("nodeCost"),btn=document.getElementById("nodeBuy");
  if(!n){id.textContent="NODE —";title.textContent=tr("selectNode");desc.textContent=tr("selectNodeDesc");level.textContent="0 / 1";cost.textContent="—";btn.disabled=true;btn.textContent=tr("selectNode");return}
  id.textContent="NODE #"+String(n.id+1).padStart(4,"0")+" · DEPTH "+n.depth;
  title.textContent=["Catalyst","Exponent","Matrix","Resonance","Singularity"][n.id%5]+" Node";
  const effect=((n.effect-1)*100).toFixed(2)+"%";
  desc.textContent=tr("nodeEffect")+" +"+effect+" per level. "+(n.parent<0?"Root node.":"Requires node #"+(n.parent+1)+" to be maxed.");
  level.textContent=n.level+" / "+n.maxLevel;cost.textContent=(typeof format==="function"?format(nodeCost(n)):String(nodeCost(n)))+" GP";
  btn.disabled=!canBuy(n);btn.textContent=n.level>=n.maxLevel?tr("maxed"):!available(n)?tr("lockedText"):gp<nodeCost(n)?tr("notEnough"):tr("buy");
 }
 window.refreshTreeLanguage=updateInspector;
 window.buyTreeNode=()=>{const n=nodes[selected];if(!n||!canBuy(n))return;gp-=nodeCost(n);savePrestige();n.level++;FA_META.stats.purchases++;recalc();persist();saveMeta();updateInspector();updateProgress();draw();updateUI();refreshStats()};
 function updateProgress(){const el=document.getElementById("treeProgress");if(el)el.textContent=purchasedCount()+" / "+TOTAL}
 function centerRoot(){if(!canvas)return;scale=.72;offsetX=canvas.clientWidth/2;offsetY=45;draw()}
 window.initUpgradeTree=()=>{
  if(initialized){canvasSize();draw();return}initialized=true;canvas=document.getElementById("treeCanvas");ctx=canvas.getContext("2d");
  canvas.addEventListener("pointerdown",e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,ox:offsetX,oy:offsetY,moved:false}});
  canvas.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;offsetX=drag.ox+dx;offsetY=drag.oy+dy;draw()});
  canvas.addEventListener("pointerup",e=>{if(!drag)return;if(!drag.moved){const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left-offsetX)/scale,y=(e.clientY-r.top-offsetY)/scale;let best=-1,dist=17/scale;for(const n of nodes){const d=Math.hypot(n.x-x,n.y-y);if(d<dist){dist=d;best=n.id}}selected=best;updateInspector();draw()}drag=null});
  canvas.addEventListener("pointercancel",()=>drag=null);
  canvas.addEventListener("wheel",e=>{e.preventDefault();const r=canvas.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,wx=(mx-offsetX)/scale,wy=(my-offsetY)/scale;scale=Math.max(.2,Math.min(2.5,scale*(e.deltaY<0?1.12:.89)));offsetX=mx-wx*scale;offsetY=my-wy*scale;draw()},{passive:false});
  window.addEventListener("resize",canvasSize);document.getElementById("nodeBuy").addEventListener("click",window.buyTreeNode);
  canvasSize();centerRoot();updateInspector();updateProgress();
 };
 window.treeZoom=dir=>{if(!initialized)return;const cx=canvas.clientWidth/2,cy=canvas.clientHeight/2,wx=(cx-offsetX)/scale,wy=(cy-offsetY)/scale;scale=Math.max(.2,Math.min(2.5,scale*(dir>0?1.18:.85)));offsetX=cx-wx*scale;offsetY=cy-wy*scale;draw()};
 window.treeResetView=()=>{centerRoot();updateInspector()};
 window.refreshTree=()=>{if(!initialized||!document.getElementById("page-tree").classList.contains("active"))return;draw();updateInspector();updateProgress()};
 updateProgress();
})();