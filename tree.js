// FORMULA ASCENT — 3,886-node procedural upgrade network
(() => {
  const TOTAL=3886, BRANCHES=10, PER_BRANCH=[389,389,389,389,388,388,388,388,389,389];
  const nodes=[];let cursor=0;
  for(let b=0;b<BRANCHES;b++){
    for(let j=0;j<PER_BRANCH[b];j++){
      const id=cursor++,maxLevel=1+((id*17+b*7)%5),parent=j===0?-1:id-1;
      const angle=Math.sin((j+1)*1.71+b*2.33),jitter=Math.cos((j+3)*.83+b*1.4);
      nodes.push({id,branch:b,step:j,parent,maxLevel,level:0,x:b*260+angle*58+jitter*20,y:j*25+Math.sin(j*.31+b)*13,cost:Math.floor(250*Math.pow(1.035,j)*(1+b*.13)),effect:1+((id*13)%5)*.0025});
    }
  }
  const saved=(()=>{try{return JSON.parse(localStorage.getItem("faTree")||"[]")}catch{return[]}})();
  saved.forEach(v=>{if(nodes[v.id])nodes[v.id].level=Math.min(nodes[v.id].maxLevel,Math.max(0,Number(v.level)||0))});
  let selected=-1,scale=.72,offsetX=0,offsetY=0,drag=null,initialized=false,canvas,ctx;
  const purchasedCount=()=>nodes.reduce((n,x)=>n+(x.level>=x.maxLevel?1:0),0);
  window.treePurchasedCount=purchasedCount;
  function persist(){localStorage.setItem("faTree",JSON.stringify(nodes.filter(n=>n.level>0).map(n=>({id:n.id,level:n.level}))));}
  function nodeCost(n){return Math.ceil(n.cost*Math.pow(1.55,n.level))}
  function available(n){return n.parent===-1||nodes[n.parent].level>=nodes[n.parent].maxLevel}
  function canBuy(n){return available(n)&&n.level<n.maxLevel&&value>=nodeCost(n)}
  function status(n){return n.level>=n.maxLevel?"purchased":available(n)?"available":"locked"}
  function canvasSize(){if(!canvas)return;const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(rect.width*dpr));canvas.height=Math.max(1,Math.floor(rect.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
  function draw(){
    if(!ctx||!canvas)return;const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);ctx.fillStyle="#090f13";ctx.fillRect(0,0,w,h);
    const left=-offsetX/scale,top=-offsetY/scale,right=left+w/scale,bottom=top+h/scale;
    ctx.save();ctx.translate(offsetX,offsetY);ctx.scale(scale,scale);
    ctx.strokeStyle="rgba(120,157,144,.08)";ctx.lineWidth=1/scale;
    for(let x=Math.floor(left/100)*100;x<right;x+=100){ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke()}
    for(let y=Math.floor(top/100)*100;y<bottom;y+=100){ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke()}
    // Branch backbones and node links
    ctx.lineWidth=1.1;
    for(const n of nodes){if(n.parent<0)continue;const p=nodes[n.parent];if(n.x<left-100||n.x>right+100||n.y<top-100||n.y>bottom+100)continue;const a=status(n),b=status(p);ctx.strokeStyle=n.level>0?"rgba(107,216,207,.43)":available(n)?"rgba(184,243,107,.18)":"rgba(95,113,109,.11)";ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(n.x,n.y);ctx.stroke()}
    for(const n of nodes){if(n.x<left-40||n.x>right+40||n.y<top-40||n.y>bottom+40)continue;const s=status(n),r=n.id===selected?7:4.1;ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);ctx.fillStyle=s==="purchased"?"#6bd8cf":s==="available"?"#b8f36b":"#35443f";ctx.fill();if(s==="available"||n.id===selected){ctx.strokeStyle=s==="available"?"rgba(184,243,107,.4)":"rgba(107,216,207,.7)";ctx.lineWidth=1.2;ctx.stroke()}if(n.id===selected){ctx.beginPath();ctx.arc(n.x,n.y,12,0,Math.PI*2);ctx.strokeStyle="rgba(107,216,207,.5)";ctx.stroke()}}
    ctx.restore();
  }
  function updateInspector(){
    const n=nodes[selected],id=document.querySelector(".inspector-id"),title=document.querySelector("#treeInspector h3"),desc=document.querySelector("#treeInspector p"),level=document.getElementById("nodeLevel"),cost=document.getElementById("nodeCost"),btn=document.getElementById("nodeBuy");
    if(!n){id.textContent="NODE —";title.textContent=window.t("selectNode");desc.textContent=window.t("selectNodeDesc");level.textContent="0 / 1";cost.textContent="—";btn.disabled=true;btn.textContent=window.t("selectNode");return}
    id.textContent="NODE #"+String(n.id+1).padStart(4,"0")+" · BRANCH "+(n.branch+1);
    title.textContent=["Catalyst","Exponent","Matrix","Resonance","Singularity"][n.id%5]+" Node";
    const effect=(n.effect*100).toFixed(2)+"%";
    desc.textContent=(window.t("nodeEffects")||"Production multiplier")+" +"+effect+" per level. "+(n.parent<0?"First node in this branch.":"Requires node #"+(n.parent+1)+" to be maxed.");
    level.textContent=n.level+" / "+n.maxLevel;cost.textContent=window.format?window.format(nodeCost(n)):String(nodeCost(n));
    btn.disabled=!canBuy(n);btn.textContent=n.level>=n.maxLevel?window.t("maxed"):!available(n)?window.t("lockedText"):value<nodeCost(n)?window.t("notEnough"):window.t("buy");
  }
  window.refreshTreeLanguage=updateInspector;
  window.buyTreeNode=()=>{
    const n=nodes[selected];if(!n||!canBuy(n))return;const c=nodeCost(n);value-=c;n.level++;FA_META.stats.purchases++;persist();saveMeta();updateInspector();updateProgress();draw();updateUI();refreshStats?.();
  };
  function updateProgress(){const e=document.getElementById("treeProgress");if(e)e.textContent=purchasedCount()+" / "+TOTAL}
  function fit(){if(!canvas)return;const w=canvas.clientWidth;offsetX=25;offsetY=24;scale=Math.min(.78,w/2700);draw()}
  window.initUpgradeTree=()=>{
    if(initialized){canvasSize();draw();return}initialized=true;canvas=document.getElementById("treeCanvas");ctx=canvas.getContext("2d");
    canvas.addEventListener("pointerdown",e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,ox:offsetX,oy:offsetY,moved:false}});
    canvas.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;offsetX=drag.ox+dx;offsetY=drag.oy+dy;draw()});
    canvas.addEventListener("pointerup",e=>{if(!drag)return;if(!drag.moved){const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left-offsetX)/scale,y=(e.clientY-r.top-offsetY)/scale;let best=-1,dist=16/scale;for(const n of nodes){const d=Math.hypot(n.x-x,n.y-y);if(d<dist){dist=d;best=n.id}}selected=best;updateInspector();draw()}drag=null});
    canvas.addEventListener("pointercancel",()=>drag=null);
    canvas.addEventListener("wheel",e=>{e.preventDefault();const r=canvas.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,worldX=(mx-offsetX)/scale,worldY=(my-offsetY)/scale;scale=Math.max(.25,Math.min(2.4,scale*(e.deltaY<0?1.12:.89)));offsetX=mx-worldX*scale;offsetY=my-worldY*scale;draw()},{passive:false});
    window.addEventListener("resize",canvasSize);document.getElementById("nodeBuy").addEventListener("click",window.buyTreeNode);
    canvasSize();fit();updateInspector();updateProgress();
  };
  window.treeZoom=dir=>{if(!initialized)return;const cx=canvas.clientWidth/2,cy=canvas.clientHeight/2,wx=(cx-offsetX)/scale,wy=(cy-offsetY)/scale;scale=Math.max(.25,Math.min(2.4,scale*(dir>0?1.18:.85)));offsetX=cx-wx*scale;offsetY=cy-wy*scale;draw()};
  window.treeResetView=()=>{fit();updateInspector()};
  window.refreshTree=()=>{if(!initialized)return;draw();updateInspector();updateProgress()};
  updateProgress();
})();