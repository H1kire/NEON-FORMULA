// FORMULA ASCENT — GLYPH access, conversion and panel navigation
(() => {
  const tabs = ["converter", "inventory", "upgrades", "synthesis"];
  const CONVERSION_DURATION = 5000;
  const MIN_GP_CONVERSION = 1000;
  const MIN_GS_CONVERSION = 1000;
  const MIN_CONVERSION = 1000;
  const $ = id => document.getElementById(id);
  const formatValue = value => typeof format === "function"
    ? format(value)
    : Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const formatConversionValue = value => {
    const formatted = formatValue(value);
    if (Number.isInteger(value)) {
      return formatted.replace(/([.,]\d)0+(?=[A-Za-z]|$)/, "$1").replace(/[.,]0(?=[A-Za-z]|$)/, "");
    }
    if (value < 1e6) {
      const locale = typeof FA_META !== "undefined" && FA_META.language === "ru" ? "ru-RU" : "en-US";
      return value.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    return formatted.replace(/([.,]\d)\d+(?=[A-Za-z]|$)/, "$1");
  };

  const renderConversionFormula = () => {
    if (typeof FAFormula !== "object" || typeof FAFormula.render !== "function") return;
    FAFormula.render("glyphConversionFormula", String.raw`\mathrm{GS}=\frac{1}{2}\left[\left(1+\frac{\mathrm{GP}}{1000}\right)^2-1\right]`);
    FAFormula.render("glyphConversionParameters", String.raw`i=1\quad\cdot\quad v=1\quad\cdot\quad k=1`);
    FAFormula.render("glyphFragmentConversionFormula", String.raw`\mathrm{GF}=\frac{1}{2}\left[\left(1+\frac{\mathrm{GS}}{1000}\right)^2-1\right]`);
    FAFormula.render("glyphFragmentConversionParameters", String.raw`i=1\quad\cdot\quad v=1\quad\cdot\quad k=1`);
  };

  window.calculateGlyphShardReward = amount => {
    const input = Number(amount);
    if (!Number.isFinite(input) || input < MIN_GP_CONVERSION) return 0;
    const x = input / 1000;
    const result = 0.5 * ((1 + x) ** 2 - 1) * (typeof window.getGlyphGsGainMultiplier === "function" ? window.getGlyphGsGainMultiplier() : 1);
    return Number.isFinite(result) ? result : Number.MAX_VALUE;
  };

  window.calculateGlyphFragmentReward = amount => {
    const input = Number(amount);
    if (!Number.isFinite(input) || input < MIN_GS_CONVERSION) return 0;
    const x = input / 1000;
    const result = 0.5 * ((1 + x) ** 2 - 1);
    return Number.isFinite(result) ? result : Number.MAX_VALUE;
  };

  window.showGlyphTab = tab => {
    if (!tabs.includes(tab) || !(typeof window.isGlyphsUnlocked === "function" && window.isGlyphsUnlocked())) return;
    document.querySelectorAll("[data-glyph-tab]").forEach(button => {
      button.classList.toggle("active", button.dataset.glyphTab === tab);
      button.setAttribute("aria-selected", button.dataset.glyphTab === tab ? "true" : "false");
    });
    document.querySelectorAll("[data-glyph-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.glyphPanel === tab);
      panel.hidden = panel.dataset.glyphPanel !== tab;
    });
  };

  window.refreshGlyphsAccess = () => {
    const unlocked = typeof window.isGlyphsUnlocked === "function" && window.isGlyphsUnlocked();
    const nav = $("glyphsNav");
    const page = $("page-glyphs");
    if (nav) {
      nav.hidden = !unlocked;
      nav.disabled = !unlocked;
      nav.classList.toggle("locked-nav", !unlocked);
    }
    if (!unlocked && page?.classList.contains("active") && typeof window.navigate === "function") {
      window.navigate("tree");
    }
    return unlocked;
  };

  function updateGpToGsConverter() {
    const input = $("glyphGpInput");
    const button = $("glyphConvertButton");
    const maxButton = $("glyphGpMax");
    const preview = $("glyphGsPreview");
    const gpBalance = $("glyphGpBalance");
    const gsBalance = $("glyphGsBalance");
    const fill = $("glyphProgressFill");
    const percent = $("glyphProgressPercent");
    const track = $("glyphProgressTrack");
    const status = $("glyphProgressStatus");
    const time = $("glyphProgressTime");
    if (!input || !button) return;

    const balance = Math.max(0, Number(gp) || 0);
    const active = glyphOperationStartedAt > 0;
    const requested = Math.floor(Number(input.value));
    const valid = Number.isFinite(requested) && requested >= MIN_CONVERSION && requested <= balance;
    const reward = valid ? window.calculateGlyphShardReward(requested) : 0;
    if (preview) preview.textContent = valid ? formatConversionValue(reward) + " GS" : "— GS";
    if (gpBalance) gpBalance.textContent = formatValue(balance) + " GP";
    if (gsBalance) gsBalance.textContent = formatValue(glyphShards) + " GS";
    const headerGsBalance = $("glyphHeaderGsBalance");
    if (headerGsBalance) headerGsBalance.textContent = formatValue(glyphShards);
    input.max = String(Math.floor(balance));
    input.disabled = active;
    button.disabled = active || !valid;
    if (maxButton) maxButton.disabled = active || balance < MIN_CONVERSION;

    let progress = 0;
    let remaining = CONVERSION_DURATION;
    if (active) {
      const elapsed = Math.max(0, Date.now() - glyphOperationStartedAt);
      progress = Math.min(1, elapsed / CONVERSION_DURATION);
      remaining = Math.max(0, CONVERSION_DURATION - elapsed);
    }
    if (fill) fill.style.width = (progress * 100).toFixed(2) + "%";
    if (percent) percent.textContent = Math.floor(progress * 100) + "%";
    if (track) track.setAttribute("aria-valuenow", String(Math.floor(progress * 100)));
    if (status) {
      const key = active ? "glyphsConverting" : balance >= MIN_CONVERSION ? "glyphsReady" : "glyphsNeedMoreGp";
      status.textContent = typeof tr === "function" ? tr(key) : (active ? "CONVERTING" : "READY");
    }
    if (time) time.textContent = active ? (remaining / 1000).toFixed(1) + " s" : "5.0 s";
  }

  function updateGsToGfConverter() {
    const input = $("glyphGsInput");
    const button = $("glyphGsConvertButton");
    const maxButton = $("glyphGsMax");
    const preview = $("glyphGfPreview");
    const gsBalance = $("glyphGsAvailableBalance");
    const gfBalance = $("glyphGfBalance");
    const fill = $("glyphGsProgressFill");
    const percent = $("glyphGsProgressPercent");
    const track = $("glyphGsProgressTrack");
    const status = $("glyphGsProgressStatus");
    const time = $("glyphGsProgressTime");
    if (!input || !button) return;

    const balance = Math.max(0, Number(glyphShards) || 0);
    const active = glyphGsOperationStartedAt > 0;
    const requested = Math.floor(Number(input.value));
    const valid = Number.isFinite(requested) && requested >= MIN_CONVERSION && requested <= balance;
    const reward = valid ? window.calculateGlyphFragmentReward(requested) : 0;
    if (preview) preview.textContent = valid ? formatConversionValue(reward) + " GF" : "— GF";
    if (gsBalance) gsBalance.textContent = formatValue(balance) + " GS";
    if (gfBalance) gfBalance.textContent = formatValue(glyphFragments) + " GF";
    const headerGfBalance = $("glyphHeaderGfBalance");
    if (headerGfBalance) headerGfBalance.textContent = formatValue(glyphFragments);
    if (window.refreshGlyphBalance) window.refreshGlyphBalance();
    input.max = String(Math.floor(balance));
    input.disabled = active;
    button.disabled = active || !valid;
    if (maxButton) maxButton.disabled = active || balance < MIN_CONVERSION;

    let progress = 0;
    let remaining = CONVERSION_DURATION;
    if (active) {
      const elapsed = Math.max(0, Date.now() - glyphGsOperationStartedAt);
      progress = Math.min(1, elapsed / CONVERSION_DURATION);
      remaining = Math.max(0, CONVERSION_DURATION - elapsed);
    }
    if (fill) fill.style.width = (progress * 100).toFixed(2) + "%";
    if (percent) percent.textContent = Math.floor(progress * 100) + "%";
    if (track) track.setAttribute("aria-valuenow", String(Math.floor(progress * 100)));
    if (status) {
      const key = active ? "glyphsConverting" : balance >= MIN_CONVERSION ? "glyphsReady" : "glyphsNeedMoreGs";
      status.textContent = typeof tr === "function" ? tr(key) : (active ? "CONVERTING" : "READY");
    }
    if (time) time.textContent = active ? (remaining / 1000).toFixed(1) + " s" : "5.0 s";
  }

  function finishGpToGsConversion() {
    if (!(glyphOperationStartedAt > 0) || Date.now() - glyphOperationStartedAt < CONVERSION_DURATION) return;
    glyphShards = Math.min(Number.MAX_VALUE, glyphShards + glyphOperationReward);
    glyphOperationStartedAt = 0;
    glyphOperationAmount = 0;
    glyphOperationReward = 0;
    if (typeof savePrestige === "function") savePrestige();
    if (typeof updatePrestigeUI === "function") updatePrestigeUI();
    updateGpToGsConverter();
    updateGsToGfConverter();
  }

  function finishGsToGfConversion() {
    if (!(glyphGsOperationStartedAt > 0) || Date.now() - glyphGsOperationStartedAt < CONVERSION_DURATION) return;
    glyphFragments = Math.min(Number.MAX_VALUE, glyphFragments + glyphGsOperationReward);
    glyphGsOperationStartedAt = 0;
    glyphGsOperationAmount = 0;
    glyphGsOperationReward = 0;
    if (typeof savePrestige === "function") savePrestige();
    updateGsToGfConverter();
  }

  function startGpToGsConversion() {
    const input = $("glyphGpInput");
    if (!input || glyphOperationStartedAt > 0) return;
    const amount = Math.floor(Number(input.value));
    if (!Number.isFinite(amount) || amount < MIN_CONVERSION || amount > gp) return;
    const reward = window.calculateGlyphShardReward(amount);
    if (!(reward > 0)) return;
    gp -= amount;
    glyphOperationAmount = amount;
    glyphOperationReward = reward;
    glyphOperationStartedAt = Date.now();
    if (typeof savePrestige === "function") savePrestige();
    if (typeof updatePrestigeUI === "function") updatePrestigeUI();
    updateGpToGsConverter();
  }

  function startGsToGfConversion() {
    const input = $("glyphGsInput");
    if (!input || glyphGsOperationStartedAt > 0) return;
    const amount = Math.floor(Number(input.value));
    if (!Number.isFinite(amount) || amount < MIN_CONVERSION || amount > glyphShards) return;
    const reward = window.calculateGlyphFragmentReward(amount);
    if (!(reward > 0)) return;
    glyphShards -= amount;
    glyphGsOperationAmount = amount;
    glyphGsOperationReward = reward;
    glyphGsOperationStartedAt = Date.now();
    if (typeof savePrestige === "function") savePrestige();
    updateGpToGsConverter();
    updateGsToGfConverter();
  }

  function bindConverterInput(inputId, buttonId, maxButtonId, getSavedInput, setSavedInput, getBalance, minAmount, start) {
    const input = $(inputId);
    const button = $(buttonId);
    const maxButton = $(maxButtonId);
    if (!input || !button || input.dataset.glyphReady === "1") return;
    input.dataset.glyphReady = "1";
    input.value = String(getSavedInput() || minAmount);
    input.addEventListener("input", () => {
      setSavedInput(Math.max(minAmount, Math.floor(Number(input.value) || minAmount)));
      if (typeof savePrestige === "function") savePrestige();
      updateGpToGsConverter();
      updateGsToGfConverter();
    });
    input.addEventListener("change", () => {
      const amount = Math.floor(Number(input.value));
      if (Number.isFinite(amount) && amount >= minAmount) {
        input.value = String(amount);
        setSavedInput(amount);
        if (typeof savePrestige === "function") savePrestige();
      }
      updateGpToGsConverter();
      updateGsToGfConverter();
    });
    button.addEventListener("click", start);
    maxButton?.addEventListener("click", () => {
      input.value = String(Math.floor(Math.max(0, Number(getBalance()) || 0)));
      setSavedInput(Math.max(minAmount, Math.floor(Number(input.value) || minAmount)));
      if (typeof savePrestige === "function") savePrestige();
      updateGpToGsConverter();
      updateGsToGfConverter();
    });
  }

  window.refreshGlyphConverter = () => {
    renderConversionFormula();
    finishGpToGsConversion();
    finishGsToGfConversion();
    updateGpToGsConverter();
    updateGsToGfConverter();
  };

  window.refreshGlyphsAccess();
  bindConverterInput("glyphGpInput", "glyphConvertButton", "glyphGpMax", () => glyphGpInput, value => { glyphGpInput = value; }, () => gp, MIN_CONVERSION, startGpToGsConversion);
  bindConverterInput("glyphGsInput", "glyphGsConvertButton", "glyphGsMax", () => glyphGsInput, value => { glyphGsInput = value; }, () => glyphShards, MIN_CONVERSION, startGsToGfConversion);
  window.refreshGlyphConverter();
  setInterval(window.refreshGlyphConverter, 50);
  const RARITIES=[
    {key:"common",label:"Common",chance:100,multiplier:1,color:"#a5a8b8",slots:2},
    {key:"uncommon",label:"Uncommon",chance:50,multiplier:1.5,color:"#71d69b",slots:2},
    {key:"rare",label:"Rare",chance:12.5,multiplier:2.5,color:"#65aef5",slots:3},
    {key:"epic",label:"Epic",chance:1.5625,multiplier:3.5,color:"#bd8bff",slots:3},
    {key:"legendary",label:"Legendary",chance:.09765625,multiplier:6,color:"#f2c96d",slots:4},
    {key:"divine",label:"Divine",chance:.0030517578125,multiplier:51,color:"#65e1d2",slots:5},
    {key:"celestial",label:"Celestial",chance:.0000476837158203125,multiplier:501,color:"#72c9ff",slots:6},
    {key:"immortal",label:"Immortal",chance:.0000003725290298461914,multiplier:2501,color:"#ff777f",slots:7}
  ];
  const AION=[
    {id:"ordinaryTime",en:"Ordinary time flow",ru:"Скорость обычного времени",kind:"multiplier",min:1.05,inner:1,max:5},
    {id:"letterCost",en:"Letter cost reduction",ru:"Снижение стоимости букв",kind:"cost",min:1,max:10},
    {id:"formulaTime",en:"Time influence in formulas",ru:"Влияние времени в формулах",kind:"percent",min:1.1,max:1.5},
    {id:"globalSum",en:"Global Sum n bonus",ru:"Бонус к n знака суммы",kind:"percent",min:1,max:25},
    {id:"dilationTime",en:"Non-standard time accumulation",ru:"Накопление нестандартного времени",kind:"multiplier",min:1.05,inner:1,max:2.5},
    {id:"letterValues",en:"Letter values",ru:"Увеличение значений букв",kind:"percent",min:1,max:12.5},
    {id:"gsGain",en:"Glyph Shard gain",ru:"Множитель получения GS",kind:"multiplier",min:1.05,inner:1,max:2}
  ];
  const rng=(a,b)=>Math.min(a,b)+Math.random()*Math.abs(b-a),lang=()=>FA_META?.language==="ru"?"ru":"en";
  const rarityOf=key=>RARITIES.find(x=>x.key===key)||RARITIES[0];
  const rollRarity=()=>{let n=Math.random()*RARITIES.reduce((v,x)=>v+x.chance,0);for(const r of RARITIES){n-=r.chance;if(n<=0)return r}return RARITIES[0]};
  const buildBonus=(d,r)=>{const raw=d.kind==="multiplier"?rng(d.min,rng(d.inner,d.max)):(rng(d.min,d.max)/100);return{id:d.id,baseValue:raw,value:d.kind==="multiplier"?1+(Math.max(1,raw)-1)*r.multiplier:raw*r.multiplier}};
  const effects=()=>{
    const out={ordinaryTime:1,letterCostDivisor:1,formulaTime:0,globalSum:0,dilationTime:1,letterValues:0,gsGain:1,entries:[]};
    const glyph=glyphInventory.find(x=>x.id===glyphEquippedId);if(!glyph)return out;
    for(const b of glyph.bonuses||[]){const d=AION.find(x=>x.id===b.id);if(!d)continue;const v=b.value;
      if(b.id==="ordinaryTime")out.ordinaryTime*=v;
      if(b.id==="letterCost"){const pct=v*100;out.letterCostDivisor*=pct<=99?1/Math.max(.01,1-pct/100):100*(1+(pct-99)/99)}
      if(b.id==="formulaTime")out.formulaTime+=v;if(b.id==="globalSum")out.globalSum+=v;
      if(b.id==="dilationTime")out.dilationTime*=v;if(b.id==="letterValues")out.letterValues+=v;if(b.id==="gsGain")out.gsGain*=v;
      out.entries.push({name:d[lang()],id:b.id,value:d.kind==="multiplier"?"×"+v.toFixed(3):b.id==="letterCost"?(v*100<=99?"−"+(v*100).toFixed(2)+"%":"÷"+(100*(1+(v*100-99)/99)).toFixed(2)):"+"+(v*100).toFixed(2)+"%"});
    }return out;
  };
  window.getGlyphBonuses=effects;
  window.getGlyphCostDivisor=()=>effects().letterCostDivisor;
  window.getGlyphOrdinaryTimeMultiplier=()=>effects().ordinaryTime;
  window.getGlyphFormulaTimeMultiplier=()=>1+effects().formulaTime;
  window.getGlyphGlobalSumPercent=()=>effects().globalSum;
  window.getGlyphDilationTimeMultiplier=()=>effects().dilationTime;
  window.getGlyphLetterValueMultiplier=()=>1+effects().letterValues;
  window.getGlyphGsGainMultiplier=()=>effects().gsGain;
  const name=glyph=>{const rarity=rarityOf(glyph.rarity).label;return lang()==="ru"?"Апостольский глиф Айона — апостол Хроноса ("+rarity+")":"Apostolic Glyph of Aion — Apostle of Chronos ("+rarity+")"};
  const textBonus=b=>{const d=AION.find(x=>x.id===b.id);return d.kind==="multiplier"?"×"+b.value.toFixed(3):b.id==="letterCost"?(b.value*100<=99?"−"+(b.value*100).toFixed(2)+"%":"÷"+(100*(1+(b.value*100-99)/99)).toFixed(2)):"+"+(b.value*100).toFixed(2)+"%"};
  const INVENTORY_CAPACITY=28;
  let inventoryPage=0,dragState=null,dragGhost=null,hoverTooltip=null,dragMoved=false,suppressGlyphClickUntil=0;
  const storedGlyphs=()=>glyphInventory.filter(x=>x.id!==glyphEquippedId);
  const getTooltip=()=>{if(hoverTooltip)return hoverTooltip;hoverTooltip=document.createElement("div");hoverTooltip.className="glyph-hover-tooltip";hoverTooltip.setAttribute("role","tooltip");hoverTooltip.hidden=true;document.body.appendChild(hoverTooltip);return hoverTooltip};
  function placeTooltip(x,y){const tip=getTooltip();const pad=14,rect=tip.getBoundingClientRect();let left=x+16,top=y+16;if(left+rect.width>innerWidth-pad)left=x-rect.width-16;if(top+rect.height>innerHeight-pad)top=y-rect.height-16;tip.style.left=Math.max(pad,left)+"px";tip.style.top=Math.max(pad,top)+"px"}
  function showTooltip(glyph,x,y){if(!glyph)return;const tip=getTooltip(),r=rarityOf(glyph.rarity),ru=lang()==="ru";tip.innerHTML="";tip.style.setProperty("--glyph-rarity-color",r.color);const head=document.createElement("div");head.className="glyph-tooltip-head";const symbol=document.createElement("span");symbol.className="glyph-tooltip-symbol";symbol.textContent="⧖";const nameNode=document.createElement("strong");nameNode.textContent=name(glyph);head.append(symbol,nameNode);tip.appendChild(head);const meta=document.createElement("div");meta.className="glyph-tooltip-meta";meta.textContent=(ru?"Редкость: ":"Rarity: ")+r.label+" · "+(ru?"Уровень ":"Level ")+glyph.level;tip.appendChild(meta);for(const b of glyph.bonuses){const d=AION.find(x=>x.id===b.id);const row=document.createElement("div");row.className="glyph-tooltip-row";const label=document.createElement("span"),value=document.createElement("b");label.textContent=d?.[lang()]||b.id;value.textContent=textBonus(b);row.append(label,value);tip.appendChild(row)}tip.hidden=false;placeTooltip(x??innerWidth/2,y??innerHeight/2)}
  function hideTooltip(){if(hoverTooltip)hoverTooltip.hidden=true}
  function showDetails(id){const glyph=glyphInventory.find(x=>x.id===id),target=$("glyphDetailContent");if(!glyph||!target)return;target.dataset.selected=id;target.innerHTML="";
    const r=rarityOf(glyph.rarity),ru=lang()==="ru",card=document.createElement("div");card.className="glyph-detail-card";card.style.setProperty("--glyph-rarity-color",r.color);
    const title=document.createElement("h4");title.textContent=name(glyph);card.appendChild(title);
    const meta=document.createElement("div");meta.className="glyph-detail-meta";for(const t of [(ru?"Редкость: ":"Rarity: ")+r.label,(ru?"Уровень: ":"Level: ")+glyph.level]){const tag=document.createElement("span");tag.textContent=t;meta.appendChild(tag)}card.appendChild(meta);
    const list=document.createElement("div");list.className="glyph-detail-bonuses";for(const b of glyph.bonuses){const d=AION.find(x=>x.id===b.id),row=document.createElement("div"),label=document.createElement("span"),value=document.createElement("strong");row.className="glyph-detail-bonus";label.textContent=d[lang()];value.textContent=textBonus(b);row.append(label,value);list.appendChild(row)}card.appendChild(list);
    const btn=document.createElement("button");btn.type="button";btn.className="glyph-equip-action";btn.disabled=glyphEquippedId===id;btn.textContent=btn.disabled?(ru?"УЖЕ ЭКИПИРОВАН":"EQUIPPED"):(ru?"ЭКИПИРОВАТЬ":"EQUIP");btn.addEventListener("click",()=>window.equipGlyph(id));card.appendChild(btn);target.appendChild(card);
  }
  function startGlyphDrag(event,id,source,element){if(event.button!==undefined&&event.button!==0)return;if(!glyphInventory.some(x=>x.id===id))return;dragState={id,source,element,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY};dragMoved=false}
  function updateGlyphDrag(event){if(!dragState)return;dragState.x=event.clientX;dragState.y=event.clientY;if(!dragMoved&&Math.hypot(event.clientX-dragState.startX,event.clientY-dragState.startY)<8)return;dragMoved=true;hideTooltip();if(dragState.element)dragState.element.classList.add("glyph-drag-source");if(!dragGhost){dragGhost=document.createElement("div");dragGhost.className="glyph-drag-ghost";document.body.appendChild(dragGhost)}const glyph=glyphInventory.find(x=>x.id===dragState.id);dragGhost.style.setProperty("--glyph-rarity-color",rarityOf(glyph.rarity).color);dragGhost.innerHTML='<span>⧖</span>';dragGhost.style.left=event.clientX+"px";dragGhost.style.top=event.clientY+"px";document.querySelectorAll("[data-glyph-drop]").forEach(x=>x.classList.remove("glyph-drop-ready"));const target=document.elementFromPoint(event.clientX,event.clientY)?.closest("[data-glyph-drop]");if(target)target.classList.add("glyph-drop-ready")}
  function finishGlyphDrag(event){if(!dragState)return;const state=dragState;dragState=null;if(state.element)state.element.classList.remove("glyph-drag-source");document.querySelectorAll("[data-glyph-drop]").forEach(x=>x.classList.remove("glyph-drop-ready"));if(dragGhost){dragGhost.remove();dragGhost=null}if(!dragMoved)return;suppressGlyphClickUntil=Date.now()+350;const target=document.elementFromPoint(event.clientX,event.clientY)?.closest("[data-glyph-drop]");if(!target)return;if(target.dataset.glyphDrop==="equip")window.equipGlyph(state.id);else if(target.dataset.glyphDrop==="discard")window.discardGlyph(state.id);else if(target.dataset.glyphDrop==="storage"&&state.source==="equipped")window.unequipGlyph(state.id)}
  document.addEventListener("pointermove",updateGlyphDrag,{passive:true});document.addEventListener("pointerup",finishGlyphDrag);document.addEventListener("pointercancel",finishGlyphDrag);
  function bindGlyphHover(element,glyph){element.addEventListener("mouseenter",event=>showTooltip(glyph,event.clientX,event.clientY));element.addEventListener("mousemove",event=>{if(hoverTooltip&&!hoverTooltip.hidden)placeTooltip(event.clientX,event.clientY)});element.addEventListener("mouseleave",hideTooltip);element.addEventListener("focus",()=>showTooltip(glyph,element.getBoundingClientRect().right,element.getBoundingClientRect().top));element.addEventListener("blur",hideTooltip);element.addEventListener("pointerdown",event=>startGlyphDrag(event,glyph.id,element.dataset.glyphSource||"inventory",element))}
  function renderGlyphInventory(){
    const grid=$("glyphStorageGrid"),ring=$("glyphEquippedSlots"),detail=$("glyphDetailContent"),aggregate=$("glyphAggregateBonuses"),create=$("glyphCreateButton"),stored=storedGlyphs(),pages=Math.max(1,Math.ceil(stored.length/INVENTORY_CAPACITY));
    inventoryPage=Math.min(inventoryPage,pages-1);
    if(create){create.disabled=glyphFragments<10||stored.length>=INVENTORY_CAPACITY;create.querySelector("strong").textContent="10 GF"}
    const capacity=document.querySelector(".glyph-storage-capacity");if(capacity)capacity.innerHTML=stored.length+' <i>/</i> '+INVENTORY_CAPACITY;
    const pageLabel=$("glyphPageLabel"),prev=$("glyphPrevPage"),next=$("glyphNextPage");if(pageLabel)pageLabel.textContent=(inventoryPage+1)+" / "+pages;if(prev){prev.disabled=inventoryPage===0;prev.setAttribute("aria-label",lang()==="ru"?"Предыдущая страница":"Previous inventory page")}if(next){next.disabled=inventoryPage>=pages-1;next.setAttribute("aria-label",lang()==="ru"?"Следующая страница":"Next inventory page")}
    if(grid){grid.innerHTML="";grid.dataset.glyphDrop="storage";for(let i=0;i<INVENTORY_CAPACITY;i++){const glyph=stored[inventoryPage*INVENTORY_CAPACITY+i],cell=document.createElement("button");cell.type="button";cell.className="glyph-storage-slot"+(glyph?" glyph-filled":"");if(glyph){cell.dataset.glyphSource="inventory";cell.style.setProperty("--glyph-rarity-color",rarityOf(glyph.rarity).color);cell.innerHTML='<span class="glyph-cell-symbol">⧖</span><small class="glyph-cell-level">L'+glyph.level+'</small>';cell.addEventListener("click",()=>{hideTooltip();if(Date.now()>=suppressGlyphClickUntil)showDetails(glyph.id)});bindGlyphHover(cell,glyph)}else cell.innerHTML="<span>"+String(inventoryPage*INVENTORY_CAPACITY+i+1).padStart(2,"0")+"</span>";grid.appendChild(cell)}}
    if(ring){ring.innerHTML='<div class="glyph-hex-ring" aria-hidden="true"></div><div class="glyph-hex-center" aria-hidden="true">⧖</div>';const active=glyphInventory.find(x=>x.id===glyphEquippedId);for(let i=1;i<=6;i++){const slot=document.createElement(i===1?"button":"div");if(i===1)slot.type="button";slot.className="glyph-equip-slot "+(i===1?"unlocked":"locked");if(i===1){slot.dataset.glyphDrop="equip";if(active){slot.classList.add("has-glyph");slot.style.setProperty("--glyph-rarity-color",rarityOf(active.rarity).color);slot.innerHTML='<span class="glyph-equipped-symbol">⧖</span><small>01</small>';slot.addEventListener("click",()=>{hideTooltip();if(Date.now()>=suppressGlyphClickUntil)showDetails(active.id)});bindGlyphHover(slot,active);slot.dataset.glyphSource="equipped"}else slot.innerHTML='<span>✧</span><small>01</small>'}else slot.innerHTML='<span>⌑</span><small>'+String(i).padStart(2,"0")+"</small>";ring.appendChild(slot)}}
    const active=glyphInventory.find(x=>x.id===glyphEquippedId),fx=effects();
    if(aggregate){aggregate.innerHTML="";if(!active){aggregate.textContent=lang()==="ru"?"Экипированный глиф отсутствует.":"No glyph is equipped."}else{const source=document.createElement("p");source.className="glyph-aggregate-source";source.textContent=name(active);aggregate.appendChild(source);for(const b of fx.entries){const row=document.createElement("div"),label=document.createElement("span"),val=document.createElement("strong");row.className="glyph-aggregate-row";label.textContent=b.name;val.textContent=b.value;row.append(label,val);aggregate.appendChild(row)}}}
    if(detail&&!detail.dataset.selected)detail.innerHTML='<div class="glyph-detail-empty"><span>⧖</span><p>'+(lang()==="ru"?"Создай или выбери глиф, чтобы посмотреть его свойства.":"Create or select a glyph to inspect its properties.")+"</p></div>";
  }
  window.createGlyph=()=>{if(glyphFragments<10||storedGlyphs().length>=INVENTORY_CAPACITY)return false;const r=rollRarity(),pool=AION.slice(),bonuses=[];for(let i=0;i<r.slots;i++)bonuses.push(buildBonus(pool.splice(Math.floor(Math.random()*pool.length),1)[0],r));glyphFragments-=10;const glyph={id:"glyph-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),deity:"Chronos",apostle:"Aion",symbol:"⧖",rarity:r.key,level:1,bonuses,createdAt:Date.now()};glyphInventory.push(glyph);if(!glyphEquippedId)glyphEquippedId=glyph.id;savePrestige();renderGlyphInventory();showDetails(glyph.id);if(typeof updatePrestigeUI==="function")updatePrestigeUI();return true};
  window.equipGlyph=id=>{if(!glyphInventory.some(x=>x.id===id))return false;glyphEquippedId=id;inventoryPage=0;savePrestige();renderGlyphInventory();showDetails(id);return true};
  window.unequipGlyph=id=>{if(glyphEquippedId!==id||storedGlyphs().length>=INVENTORY_CAPACITY)return false;glyphEquippedId=null;savePrestige();renderGlyphInventory();showDetails(id);return true};
  window.discardGlyph=id=>{const glyph=glyphInventory.find(x=>x.id===id);if(!glyph)return false;const prompt=lang()==="ru"?"Утилизировать этот глиф без возможности восстановления?":"Discard this glyph permanently?";if(typeof confirm==="function"&&!confirm(prompt))return false;glyphInventory=glyphInventory.filter(x=>x.id!==id);if(glyphEquippedId===id)glyphEquippedId=null;const detail=$("glyphDetailContent");if(detail)delete detail.dataset.selected;savePrestige();renderGlyphInventory();if(typeof updatePrestigeUI==="function")updatePrestigeUI();return true};
  $("glyphCreateButton")?.addEventListener("click",()=>window.createGlyph());
  window.refreshGlyphInventory=renderGlyphInventory;window.refreshGlyphBalance=()=>{const b=$("glyphCreateButton");if(b){b.disabled=glyphFragments<10||storedGlyphs().length>=INVENTORY_CAPACITY;b.querySelector("strong").textContent="10 GF"}};$("glyphPrevPage")?.addEventListener("click",()=>{inventoryPage=Math.max(0,inventoryPage-1);renderGlyphInventory()});$("glyphNextPage")?.addEventListener("click",()=>{inventoryPage=Math.min(Math.max(0,Math.ceil(storedGlyphs().length/INVENTORY_CAPACITY)-1),inventoryPage+1);renderGlyphInventory()});renderGlyphInventory();

})();
