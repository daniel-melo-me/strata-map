/* Strata Map: render do mapa, painel de detalhes, eixos, personas, jornada e modo falha.
 * Os dados vêm de assets/js/data/ (window.STRATA). */
(function(){
const {layers:LAYERS, personas:PERSONAS, axes:AX, styles}=window.STRATA;
const STYLE=Object.values(styles)[0];
const N=STYLE.nodes, E=STYLE.edges, JOURNEY=STYLE.journey;

/* ---------- render ---------- */
const map=document.getElementById("map"), wires=document.getElementById("wires"), packets=document.getElementById("packets");
const panel=document.getElementById("panel"), announce=document.getElementById("announce");
const SVGNS="http://www.w3.org/2000/svg";
const layerIdx={}; LAYERS.forEach((l,i)=>layerIdx[l.id]=i);
const el={};
const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.getElementById("styleName").textContent=STYLE.name;
const totalMs=JOURNEY.reduce((a,x)=>a+x[3],0);
document.getElementById("playHint").textContent=`${JOURNEY.length} passos em ~${totalMs} ms`;
const pad=n=>String(n).padStart(2,"0");

/* testemunho: as camadas em miniatura, como uma amostra de solo */
const core=document.getElementById("core");
LAYERS.forEach((L,i)=>{
  const li=document.createElement("li"); li.className="l"+(i+1);
  li.innerHTML=`<button><span class="depth">${pad(i+1)}</span>${L.n}</button>`;
  li.querySelector("button").onclick=()=>focusLayer(i);
  core.appendChild(li);
});

/* clique numa faixa: desce até a camada e acende as peças dela por alguns segundos */
let focusTimer=null;
function focusLayer(i){
  clearFocus();
  const sec=document.querySelector(".layer.l"+(i+1));
  sec.classList.add("is-focus"); map.classList.add("has-focus");
  sec.scrollIntoView({block:"start",behavior:reduce?"auto":"smooth"});
  focusTimer=setTimeout(clearFocus,3500);
}
function clearFocus(){
  clearTimeout(focusTimer);
  map.classList.remove("has-focus");
  map.querySelectorAll(".layer.is-focus").forEach(x=>x.classList.remove("is-focus"));
}

/* o pacote desce pelo testemunho, acendendo cada faixa por onde passa */
const pulse=document.querySelector(".core-pulse"), rows=[...core.children];
let pi=-1;
function dive(){
  if(reduce||document.hidden) return;
  pi=(pi+1)%(rows.length+2);
  rows.forEach((r,k)=>r.classList.toggle("lit",k===pi));
  if(pi<rows.length){
    const r=rows[pi]; pulse.style.opacity=1;
    pulse.style.transform=`translateY(${r.offsetTop+r.offsetHeight/2}px)`;
  }else if(pi===rows.length) pulse.style.opacity=0;
  else{pulse.style.transition="none"; pulse.style.transform=`translateY(${rows[0].offsetTop+rows[0].offsetHeight/2}px)`; pulse.offsetWidth; pulse.style.transition="";}
}
setInterval(dive,600);

LAYERS.forEach((L,i)=>{
  const sec=document.createElement("section"); sec.className="layer l"+(i+1);
  sec.innerHTML=`<div class="layer-head"><span class="depth">${pad(i+1)}</span><h2>${L.n}</h2><p>${L.q}</p></div><div class="nodes"></div>`;
  const nodes=sec.querySelector(".nodes");
  Object.entries(N).filter(([,v])=>v.l===L.id).forEach(([id,v])=>{
    const b=document.createElement("button"); b.className="node"; b.dataset.id=id;
    Object.keys(v.ax||{}).forEach(k=>b.classList.add("ax-"+k));
    b.innerHTML=`<i class="ax-dot"></i><i class="f-badge"></i><b>${v.n}</b><span>${v.t}</span>`;
    b.addEventListener("click",()=>fail.on?breakNode(id):state.sel===id?closePanel():select(id));
    nodes.appendChild(b); el[id]=b;
  });
  map.appendChild(sec);
});

/* wires */
E.forEach(e=>{
  const p=document.createElementNS(SVGNS,"path");
  p.setAttribute("class","wire "+e[2]+(reduce?"":" flow")+(e[2]==="run"?" hidden":""));
  wires.appendChild(p);
  const t=document.createElementNS(SVGNS,"text"); t.setAttribute("class","wlabel"); t.textContent=e[3];
  wires.appendChild(t);
  e.path=p; e.label=t;
});

/* Posição relativa ao mapa via offsets, que ignoram transforms de hover e destaque. */
function box(id){
  const node=el[id]; let x=0,y=0,n=node;
  while(n&&n!==map){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent;}
  const w=node.offsetWidth,h=node.offsetHeight;
  return {x,y,w,h,cx:x+w/2,cy:y+h/2};
}
function layout(){
  wires.setAttribute("width",map.scrollWidth); wires.setAttribute("height",map.scrollHeight);
  packets.setAttribute("width",map.scrollWidth); packets.setAttribute("height",map.scrollHeight);
  E.forEach(e=>{
    const a=box(e[0]), b=box(e[1]); let d, lx, ly;
    if(Math.abs(a.cy-b.cy)<a.h*0.6){
      const x1=a.cx,y1=a.y,x2=b.cx,y2=b.y,lift=Math.min(70,26+Math.abs(x2-x1)*0.12);
      d=`M${x1},${y1} C${x1},${y1-lift} ${x2},${y2-lift} ${x2},${y2}`; lx=(x1+x2)/2; ly=Math.min(y1,y2)-lift*0.75;
    }else{
      const down=a.cy<b.cy, x1=a.cx, y1=down?a.y+a.h:a.y, x2=b.cx, y2=down?b.y:b.y+b.h, k=(y2-y1)*0.5;
      d=`M${x1},${y1} C${x1},${y1+k} ${x2},${y2-k} ${x2},${y2}`; lx=(x1+x2)/2; ly=(y1+y2)/2;
    }
    e.path.setAttribute("d",d); e.label.setAttribute("x",lx); e.label.setAttribute("y",ly); e.label.setAttribute("text-anchor","middle");
  });
}
new ResizeObserver(()=>layout()).observe(map);
window.addEventListener("resize",layout);
document.fonts && document.fonts.ready.then(layout);

/* ---------- state ---------- */
const state={sel:null,persona:null,ax:null,runs:false};
function edgesOf(id){return E.filter(e=>(e[0]===id||e[1]===id)&&(state.runs||e[2]!=="run"));}
function refresh(){
  const near=new Set();
  if(state.sel) edgesOf(state.sel).forEach(e=>{near.add(e[0]);near.add(e[1]);});
  Object.entries(el).forEach(([id,b])=>{
    b.classList.toggle("is-sel",id===state.sel);
    b.classList.toggle("is-dim",!!state.sel&&!near.has(id));
    b.classList.toggle("is-off",!!state.persona&&!(N[id].who||[]).includes(state.persona));
  });
  E.forEach(e=>{
    const vis=state.runs||e[2]!=="run";
    e.path.classList.toggle("hidden",!vis);
    const inc=state.sel&&(e[0]===state.sel||e[1]===state.sel)&&vis;
    e.path.classList.toggle("hot",!!inc);
    e.path.classList.toggle("cold",!!state.sel&&!inc);
    e.label.classList.toggle("show",!!inc);
  });
  map.classList.remove("ax-on-seg","ax-on-obs","ax-on-res");
  if(state.ax) map.classList.add("ax-on-"+state.ax);
}

/* ---------- panel ---------- */
function intro(){
  panel.className="panel";
  panel.innerHTML=`<div class="intro">
   <h3>Abra qualquer peça</h3>
   <p>Cada caixa tem um mundo dentro. Ao abrir, você vê do que ela é feita, quem cuida dela, com quem conversa e o que acontece se ela cair.</p>
   <h4>Como ler as linhas</h4>
   <ul class="legend">
    <li><svg width="44" height="10" aria-hidden="true"><line x1="0" y1="5" x2="44" y2="5" stroke="var(--w-net)" stroke-width="3"/></svg>Rede: o caminho físico e de protocolo</li>
    <li><svg width="44" height="10" aria-hidden="true"><line x1="0" y1="5" x2="44" y2="5" stroke="var(--w-sync)" stroke-width="3"/></svg>Chamada síncrona: pede e espera a resposta</li>
    <li><svg width="44" height="10" aria-hidden="true"><line x1="0" y1="5" x2="44" y2="5" stroke="var(--w-async)" stroke-width="3" stroke-dasharray="7 6"/></svg>Evento assíncrono: avisa e segue em frente</li>
    <li><svg width="44" height="10" aria-hidden="true"><line x1="0" y1="5" x2="44" y2="5" stroke="var(--w-run)" stroke-width="3" stroke-dasharray="2 5"/></svg>Onde roda: liga o código ao metal</li>
   </ul>
   <h4>Quanto mais fundo, mais longe do usuário</h4>
   <p>O número de cada faixa é a profundidade. A camada 1 é o que a pessoa vê. A 9 é o meio físico: luz na fibra, eletricidade no cobre e ondas no ar.</p></div>`;
}
function setHash(id){
  try{history.replaceState(null,"",id?"#"+id:location.pathname+location.search);}catch(_){}
}
function closePanel(){
  state.sel=null; refresh(); intro(); setHash(null);
}
function select(id){
  clearFocus(); state.sel=id; refresh(); setHash(id);
  const v=N[id], L=LAYERS[layerIdx[v.l]];
  panel.className="panel open l"+(layerIdx[v.l]+1);
  const nb=edgesOf(id).map(e=>{const o=e[0]===id?e[1]:e[0];return `<button data-go="${o}">${N[o].n}<small>${e[3]}</small></button>`;}).join("");
  const axn=Object.entries(v.ax||{}).map(([k,t])=>`<div class="axnote ${k}"><b>${AX[k][0]}:</b> ${t}</div>`).join("");
  panel.innerHTML=`<button class="close" aria-label="Fechar">×</button>
   <span class="layer-tag">Camada ${layerIdx[v.l]+1}: ${L.n}</span>
   <h3>${v.n}</h3><p class="what">${v.what}</p>
   <h4>Por dentro</h4><ul class="zoom">${v.inside.map(s=>`<li><b>${s[0]}</b><span>${s[1]}</span></li>`).join("")}</ul>
   ${v.tech?`<h4>Tecnologias reais</h4><div class="tags">${v.tech.map(t=>`<span class="tag">${t}</span>`).join("")}</div>`:""}
   ${v.host?`<h4>Onde pode rodar</h4><p>${v.host}</p>`:""}
   <h4>Quem cuida</h4><div class="row who">${(v.who||[]).map(p=>`<button class="chip" data-persona="${p}" aria-pressed="${state.persona===p}">${PERSONAS[p][0]}</button>`).join("")}</div>
   <h4>Se cair</h4><div class="fail">${v.fail}</div>
   ${STYLE.failure?`<button class="btn-break" data-break>${ICON_BOLT}Derrubar esta peça e ver a cascata</button>`:""}
   ${axn?`<h4>Eixos que passam por aqui</h4>${axn}`:""}
   ${nb?`<h4>Conversa com</h4><div class="near">${nb}</div>`:""}`;
  panel.querySelector(".close").onclick=closePanel;
  const brk=panel.querySelector("[data-break]"); if(brk) brk.onclick=()=>breakNode(id);
  panel.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>goTo(b.dataset.go));
  panel.querySelectorAll("[data-persona]").forEach(b=>b.onclick=()=>setPersona(state.persona===b.dataset.persona?null:b.dataset.persona));
  panel.scrollTop=0;
  announce.textContent=`Aberto: ${v.n}, camada ${layerIdx[v.l]+1}.`;
}
function goTo(id){
  select(id);
  el[id].scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});
}

/* ---------- controls ---------- */
const psel=document.getElementById("personas"), pline=document.getElementById("personaLine");
Object.entries(PERSONAS).forEach(([k,v])=>psel.add(new Option(v[0],k)));
psel.onchange=()=>setPersona(psel.value||null);
function setPersona(k){
  if(k&&fail.on) exitFail();
  state.persona=k; psel.value=k||"";
  psel.closest(".select").classList.toggle("on",!!k);
  document.querySelectorAll("#panel [data-persona]").forEach(c=>c.setAttribute("aria-pressed",String(c.dataset.persona===k)));
  if(k){const n=Object.values(N).filter(v=>(v.who||[]).includes(k)).length;
    pline.innerHTML=`<b>${PERSONAS[k][0]}:</b> ${PERSONAS[k][1]} Atua em ${n} peças do mapa, acesas abaixo.`;}
  else pline.textContent="";
  refresh();
}
const banner=document.getElementById("banner");
document.querySelectorAll("#axes .chip").forEach(b=>b.onclick=()=>{
  if(fail.on) exitFail();
  const k=b.dataset.ax; state.ax=state.ax===k?null:k;
  document.querySelectorAll("#axes .chip").forEach(c=>c.setAttribute("aria-pressed",String(c.dataset.ax===state.ax)));
  if(state.ax){banner.innerHTML=`<b>${AX[k][0]}.</b> ${AX[k][1]}`;banner.classList.add("on");} else banner.classList.remove("on");
  refresh();
});
const runsBtn=document.getElementById("runs");
runsBtn.onclick=()=>{
  state.runs=!state.runs; runsBtn.setAttribute("aria-pressed",String(state.runs));
  if(state.sel) select(state.sel); else refresh();
};

/* ---------- packets ---------- */
function findEdge(a,b){return E.find(e=>(e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a));}
function send(a,b,color,dur,r){
  return new Promise(res=>{
    const c=document.createElementNS(SVGNS,"circle"); c.setAttribute("r",r||6); c.setAttribute("fill",color); c.setAttribute("stroke","var(--card)"); c.setAttribute("stroke-width","2");
    packets.appendChild(c);
    const e=findEdge(a,b); const usePath=e&&!e.path.classList.contains("hidden");
    const A=box(a),B=box(b); const L=usePath?e.path.getTotalLength():0; const fwd=usePath&&e[0]===a;
    const t0=performance.now();
    function step(now){
      const t=Math.min(1,(now-t0)/dur); const s=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
      let x,y;
      if(usePath){const p=e.path.getPointAtLength(fwd?s*L:(1-s)*L);x=p.x;y=p.y;}
      else{x=A.cx+(B.cx-A.cx)*s;y=A.cy+(B.cy-A.cy)*s;}
      c.setAttribute("cx",x);c.setAttribute("cy",y);
      if(t<1) requestAnimationFrame(step); else {c.remove();res();}
    }
    requestAnimationFrame(step);
  });
}
/* ambient life */
const COLORS={net:"var(--w-net)",sync:"var(--w-sync)",async:"var(--w-async)",run:"var(--w-run)"};
function ambient(){
  if(reduce||jr.on||fail.on||document.hidden) return;
  const pool=E.filter(e=>e[2]!=="run"||state.runs);
  const e=pool[Math.floor(Math.random()*pool.length)];
  const rev=e[2]!=="async"&&Math.random()<.4;
  send(rev?e[1]:e[0],rev?e[0]:e[1],COLORS[e[2]],1600+Math.random()*900,4);
}
setInterval(ambient,700);

/* ---------- journey ---------- */
const narr=document.getElementById("narr"), nText=document.getElementById("nText"), nStep=document.getElementById("nStep"), nMs=document.getElementById("nMs"), nBar=document.getElementById("nBar"), nPause=document.getElementById("nPause");
const LAST=JOURNEY.length-1;
const jr={on:false,i:0,paused:false,done:false,timer:null,delay:null};
function clearActive(){Object.values(el).forEach(b=>b.classList.remove("is-active"));}
function clearTimers(){clearTimeout(jr.timer);clearTimeout(jr.delay);}
function setPaused(p){jr.paused=p; jr.done=false; nPause.textContent=p?"Continuar":"Pausar";}
function finish(){jr.paused=true; jr.done=true; nPause.textContent="Repetir";}
function showStep(i){
  clearTimers(); jr.i=i; const s=JOURNEY[i];
  const ms=JOURNEY.slice(0,i+1).reduce((a,x)=>a+x[3],0);
  nStep.textContent=`Passo ${i+1} de ${JOURNEY.length}`; nMs.textContent=`${ms} ms desde o toque`;
  nText.textContent=s[2]; nBar.style.width=((i+1)/JOURNEY.length*100)+"%";
  clearActive(); el[s[0]].classList.add("is-active"); el[s[1]].classList.add("is-active");
  el[s[1]].scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});
  const e=findEdge(s[0],s[1]); const color=e?COLORS[e[2]]:"var(--w-net)";
  jr.delay=setTimeout(()=>{ send(s[0],s[1],color,reduce?10:1100,9).then(()=>{
    if(!jr.on||jr.paused||jr.i!==i) return;
    if(i<LAST) jr.timer=setTimeout(()=>showStep(i+1),2000);
    else finish();
  });},reduce?0:450);
}
function startJourney(){
  if(fail.on) exitFail();
  if(state.sel) closePanel();
  clearFocus(); jr.on=true; setPaused(false); narr.classList.add("on"); showStep(0);
}
function stopJourney(){jr.on=false;clearTimers();narr.classList.remove("on");clearActive();}
function jump(i){setPaused(true); showStep(i);}
document.querySelectorAll("[data-play]").forEach(b=>b.onclick=startJourney);
document.getElementById("nStop").onclick=stopJourney;
document.getElementById("nNext").onclick=()=>{if(jr.i<LAST) jump(jr.i+1);};
document.getElementById("nPrev").onclick=()=>{if(jr.i>0) jump(jr.i-1);};
nPause.onclick=()=>{
  if(jr.done){setPaused(false); showStep(0); return;}
  if(jr.paused){
    setPaused(false);
    if(jr.i<LAST) showStep(jr.i+1); else finish();
  }else{setPaused(true); clearTimers();}
};
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(jr.on)stopJourney();else if(fail.on)exitFail();else if(state.sel)closePanel();}});

/* ---------- modo falha ---------- */
const ICON_BOLT=`<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M8.2 1 3 8h3.6L5.8 13 11 6H7.4z" fill="currentColor"/></svg>`;
const F_LABEL={down:"caiu",stop:"parou",degr:"degrada",frozen:"congela",hold:"segura"};
const F_GROUPS=[["stop","Param junto"],["degr","Degradam"],["frozen","Congelam: só as mudanças param"],["hold","Seguram o tranco"]];
const F_USER={
  stop:"Para o usuário, o sistema está fora do ar.",
  degr:"O usuário percebe: algo fica lento, falha ou chega atrasado.",
  ok:"O usuário nem percebe."
};
const F_SAMPLES=["oltp","kafka","notificacoes","k8s","dns","datacenter"];
const fail={on:false,root:null,red:true,timers:[]};
const failBtn=document.getElementById("failBtn");
if(!STYLE.failure) failBtn.hidden=true;
failBtn.onclick=()=>fail.on?exitFail():enterFail();

function enterFail(){
  if(jr.on) stopJourney();
  clearFocus(); setPersona(null);
  state.ax=null; document.querySelectorAll("#axes .chip").forEach(c=>c.setAttribute("aria-pressed","false"));
  state.sel=null; refresh();
  fail.on=true; failBtn.setAttribute("aria-pressed","true"); map.classList.add("fail-on");
  banner.innerHTML=`<b>Modo falha.</b> Toque numa peça para derrubá-la e veja a cascata.
    <span class="f-legend">${["down","stop","degr","frozen","hold"].map(k=>`<span class="f-${k}"><i></i>${k==="hold"?"segura o tranco":F_LABEL[k]}</span>`).join("")}</span>`;
  banner.classList.add("on");
  failIntro();
}
function exitFail(){
  clearFailMarks();
  fail.on=false; fail.root=null; failBtn.setAttribute("aria-pressed","false"); map.classList.remove("fail-on");
  banner.classList.remove("on"); setHash(null); intro();
}
function clearFailMarks(){
  fail.timers.forEach(clearTimeout); fail.timers=[];
  map.classList.remove("f-active");
  Object.values(el).forEach(b=>{b.classList.remove("f-in","f-down","f-stop","f-degr","f-frozen","f-hold"); b.querySelector(".f-badge").textContent="";});
  E.forEach(e=>e.path.classList.remove("f-hot","f-down","f-stop","f-degr","f-frozen","f-hold"));
}
function redSwitch(){
  return `<button class="switch f-red" aria-pressed="${fail.red}"><i aria-hidden="true"></i>Com redundância</button>`;
}
function bindRed(){
  panel.querySelector(".f-red").onclick=()=>{fail.red=!fail.red; fail.root?breakNode(fail.root):failIntro();};
}
function failIntro(){
  panel.className="panel open";
  panel.innerHTML=`<button class="close" aria-label="Sair do modo falha">×</button>
   <span class="layer-tag f-tag">Modo falha</span>
   <h3>O que cai junto?</h3>
   <p class="what">Escolha uma peça para derrubar. A queda se espalha por quem depende dela: alguns param, outros só degradam, e as filas seguram o tranco.</p>
   ${redSwitch()}
   <p class="f-note">Ligada, mostra a produção real: réplicas, failover e várias zonas. Desligada, mostra por que elas existem.</p>
   <h4>Comece por aqui</h4>
   <div class="near">${F_SAMPLES.filter(k=>N[k]).map(k=>`<button data-break="${k}">${N[k].n}<small>${LAYERS[layerIdx[N[k].l]].n}</small></button>`).join("")}</div>`;
  panel.querySelector(".close").onclick=exitFail;
  panel.querySelectorAll("[data-break]").forEach(b=>b.onclick=()=>breakNode(b.dataset.break));
  bindRed(); panel.scrollTop=0;
}
function breakNode(id){
  if(!fail.on) enterFail();
  clearFailMarks(); fail.root=id; setHash("falha-"+id);
  const r=STRATA.simulateFailure(STYLE,id,fail.red);
  map.classList.add("f-active");
  Object.entries(r.nodes).sort((a,b)=>a[1].wave-b[1].wave).forEach(([nid,info])=>{
    const apply=()=>{
      const b=el[nid]; b.classList.add("f-in","f-"+info.s); b.querySelector(".f-badge").textContent=F_LABEL[info.s];
      const e=info.cause&&findEdge(info.cause,nid);
      if(e) e.path.classList.add("f-hot","f-"+info.s);
      if(info.cause&&!reduce) send(info.cause,nid,`var(--f-${info.s})`,450,5);
    };
    if(reduce||!info.wave) apply(); else fail.timers.push(setTimeout(apply,info.wave*550));
  });
  failReport(id,r);
  el[id].scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});
  const n=Object.keys(r.nodes).length-1;
  announce.textContent=`${N[id].n} caiu. ${n?n+" peças afetadas.":"Nenhuma outra peça afetada."} ${F_USER[r.user]}`;
}
function failReport(id,r){
  const v=N[id], g=STYLE.failure.guards[id];
  const groups=F_GROUPS.map(([s,title])=>{
    const items=Object.entries(r.nodes).filter(([k,x])=>k!==id&&x.s===s).sort((a,b)=>a[1].wave-b[1].wave);
    if(!items.length) return "";
    return `<h4 class="f-h f-${s}"><i></i>${title} <span>${items.length}</span></h4>
      <ul class="f-list">${items.map(([k,x])=>`<li><button data-go="${k}"><b>${N[k].n}</b><span>${x.why}</span></button></li>`).join("")}</ul>`;
  }).join("");
  const res=v.ax&&v.ax.res;
  panel.className="panel open l"+(layerIdx[v.l]+1);
  panel.innerHTML=`<button class="close" aria-label="Sair do modo falha">×</button>
   <span class="layer-tag f-tag">Modo falha · Camada ${layerIdx[v.l]+1}</span>
   <h3>${v.n} caiu</h3>
   <div class="f-verdict f-u-${r.user}">${F_USER[r.user]}</div>
   ${redSwitch()}
   ${g?(fail.red?`<div class="f-guard"><b>Quem segura:</b> ${g[1]}</div>`:`<p class="f-note">Sem redundância, nada segura a queda. Ligue a chave para ver como a produção se protege.</p>`)
      :`<p class="f-note">Aqui a redundância não evita a queda: o cenário é a peça inteira fora do ar.</p>`}
   <h4>O que acontece</h4><div class="fail">${v.fail}</div>
   ${groups||`<p class="f-note">Nenhuma outra peça é afetada.</p>`}
   ${res&&!g?`<h4>Como se proteger</h4><div class="axnote res"><b>Resiliência:</b> ${res}</div>`:""}
   <div class="row f-actions"><button data-reset>Derrubar outra peça</button><button data-exit>Sair do modo falha</button></div>`;
  panel.querySelector(".close").onclick=exitFail;
  panel.querySelector("[data-exit]").onclick=exitFail;
  panel.querySelector("[data-reset]").onclick=()=>{clearFailMarks(); fail.root=null; setHash(null); failIntro();};
  panel.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>el[b.dataset.go].scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"}));
  bindRed(); panel.scrollTop=0;
}

/* ---------- deep link: #id abre a peça; #falha-id derruba ---------- */
function fromHash(){
  const id=decodeURIComponent(location.hash.slice(1));
  if(id.startsWith("falha-")&&N[id.slice(6)]&&STYLE.failure) breakNode(id.slice(6));
  else if(N[id]&&state.sel!==id) goTo(id);
}
window.addEventListener("hashchange",fromHash);

intro(); refresh(); layout(); fromHash();
})();
