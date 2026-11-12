/* Strata Map: render do mapa, painel de detalhes, eixos, personas, jornada, modo falha, busca e zoom.
 * Os dados vêm de assets/js/data/ (window.STRATA). */
(function(){
const {layers:LAYERS, personas:PERSONAS, axes:AX, styles}=window.STRATA;
/* estilos do mais simples ao mais distribuído; estilos novos entram no fim */
const STYLE_ORDER=["monolito","microsservicos","serverless"];
const STYLE_IDS=[...STYLE_ORDER.filter(id=>styles[id]),...Object.keys(styles).filter(id=>!STYLE_ORDER.includes(id))];
/* estilo escolhido pela URL (?estilo=serverless); sem parâmetro, o mais simples: o monólito */
const askedStyle=new URLSearchParams(location.search).get("estilo");
const STYLE_ID=styles[askedStyle]?askedStyle:STYLE_IDS[0], STYLE=styles[STYLE_ID];
const N=STYLE.nodes, E=STYLE.edges, JOURNEY=STYLE.journey;
/* jornada contada pela Ana (curta, para iniciantes) ou com todos os passos técnicos */
const TOUR=STYLE.tour&&STYLE.tour.length?STYLE.tour:JOURNEY;
/* explicação em níveis (data/niveis.js): [em uma frase, analogia], com sobreposição por estilo */
const LV=STRATA.levels||{base:{}};
const levelOf=id=>(LV[STYLE_ID]&&LV[STYLE_ID][id])||LV.base[id]||null;
/* modo apresentação (?apresentar): para projetar em sala; os links internos mantêm o modo */
const params=new URLSearchParams(location.search), PRESENT=params.has("apresentar");
const styleHref=id=>`?estilo=${id}${PRESENT?"&apresentar":""}`;
if(PRESENT){
  document.body.classList.add("present");
  const out=document.createElement("a"); out.className="present-exit"; out.href=`?estilo=${STYLE_ID}`; out.textContent="Sair do modo apresentação";
  document.body.appendChild(out);
}
/* zoom dentro do zoom (data/zoom.js): uma peça tem zoom se algum item do "por dentro" tem */
const Z=STRATA.zoom||{};
const zoomOf=(id,name)=>Z[id]&&Z[id][name]||null;
const hasZoom=id=>(N[id].inside||[]).some(([n])=>zoomOf(id,n));
/* expandir: toda peça abre um painel, então todas levam o ícone */
const ICON_EXPAND=`<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_LENS=`<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M11 11l3.5 3.5M7 4.5v5M4.5 7h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;

/* ---------- render ---------- */
const map=document.getElementById("map"), wires=document.getElementById("wires"), packets=document.getElementById("packets");
const panel=document.getElementById("panel"), announce=document.getElementById("announce");
const SVGNS="http://www.w3.org/2000/svg";
const layerIdx={}; LAYERS.forEach((l,i)=>layerIdx[l.id]=i);
const el={};
const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* tema: sistema, claro ou escuro; a escolha fica guardada no navegador */
const THEME_KEY="strata-theme", themeBtns=[...document.querySelectorAll("[data-theme-opt]")];
const themeMetas=[...document.querySelectorAll('meta[name="theme-color"]')], THEME_BG={light:"#F7F8FA",dark:"#0B1015"};
function applyTheme(t){
  const root=document.documentElement;
  if(t==="light"||t==="dark") root.dataset.theme=t; else{ delete root.dataset.theme; t="system"; }
  themeBtns.forEach(b=>b.setAttribute("aria-checked",String(b.dataset.themeOpt===t)));
  /* forçado, a barra do navegador acompanha; no sistema, cada meta vale para o seu modo */
  themeMetas.forEach(m=>m.setAttribute("content",t==="system"?THEME_BG[/dark/.test(m.media)?"dark":"light"]:THEME_BG[t]));
  try{ t==="system"?localStorage.removeItem(THEME_KEY):localStorage.setItem(THEME_KEY,t); }catch(_){}
}
themeBtns.forEach(b=>b.onclick=()=>applyTheme(b.dataset.themeOpt));
applyTheme(document.documentElement.dataset.theme||"system");

const styleSel=document.getElementById("styleSel");
STYLE_IDS.forEach(id=>styleSel.add(new Option(styles[id].name,id,false,id===STYLE_ID)));
styleSel.onchange=()=>{
  const u=new URL(location.href); u.searchParams.set("estilo",styleSel.value); u.hash=""; location.href=u.href;
};
const totalMs=JOURNEY.reduce((a,x)=>a+x[3],0);
document.getElementById("playHint").textContent=TOUR!==JOURNEY
  ?`A história da Ana: ${TOUR.length} passos, do toque à resposta, em ~${totalMs} ms. Quem quiser vê todos os ${JOURNEY.length}.`
  :`A jornada: ${JOURNEY.length} passos, do toque à resposta, em ~${totalMs} ms.`;
const pad=n=>String(n).padStart(2,"0");

/* testemunho: as camadas em miniatura, como uma amostra de solo */
const core=document.getElementById("core");
LAYERS.forEach((L,i)=>{
  const li=document.createElement("li"); li.className="l"+(i+1);
  const n=Object.values(N).filter(v=>v.l===L.id).length;
  li.innerHTML=`<button><span class="depth">${pad(i+1)}</span>${L.n}<span class="count">${n} ${n===1?"peça":"peças"}</span></button>`;
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
    b.innerHTML=`<i class="ax-dot"></i><i class="f-badge"></i><b>${v.n}</b><span>${v.t}</span><i class="z-mark" title="Abrir a peça">${ICON_EXPAND}</i>`;
    b.addEventListener("click",()=>fail.on?breakNode(id):state.sel===id?closePanel():select(id));
    nodes.appendChild(b); el[id]=b;
  });
  map.appendChild(sec);
});

/* primeira visita: o primeiro card pulsa e diz que abre, até a pessoa abrir alguma peça */
const SEEN_KEY="strata-seen";
let seen=false; try{ seen=localStorage.getItem(SEEN_KEY)==="1"; }catch(_){}
const firstNode=el[Object.keys(el)[0]];
if(!seen&&firstNode) firstNode.classList.add("hint-pulse");
function markSeen(){
  if(seen) return; seen=true;
  if(firstNode) firstNode.classList.remove("hint-pulse");
  try{ localStorage.setItem(SEEN_KEY,"1"); }catch(_){}
}
const mobile=window.matchMedia("(max-width: 680px)");
/* progresso: quais peças deste estilo a pessoa já abriu (só no navegador dela) */
const EXP_KEY="strata-explored-"+STYLE_ID;
let explored=new Set();
try{ explored=new Set((JSON.parse(localStorage.getItem(EXP_KEY)||"[]")||[]).filter(id=>N[id])); }catch(_){}
explored.forEach(id=>el[id].classList.add("seen"));
function markExplored(id){
  if(explored.has(id)) return;
  explored.add(id); el[id].classList.add("seen");
  try{ localStorage.setItem(EXP_KEY,JSON.stringify([...explored])); }catch(_){}
}

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
  placeLabels();
}
/* rótulos das linhas: procura ao longo da curva um ponto livre de cards e de outros rótulos.
   Sem ponto livre, o rótulo some (as conexões continuam listadas no painel). */
const LABEL_AT=[.5,.4,.6,.3,.7,.2,.8,.12,.88];
function placeLabels(){
  const shown=E.filter(e=>e.label.classList.contains("show"));
  if(!shown.length) return;
  const pad=6, rects=Object.keys(el).map(id=>{const b=box(id); return {x:b.x-pad,y:b.y-pad,w:b.w+2*pad,h:b.h+2*pad};});
  const hit=(r,q)=>r.x<q.x+q.w&&r.x+r.w>q.x&&r.y<q.y+q.h&&r.y+r.h>q.y;
  const placed=[];
  shown.forEach(e=>{
    const t=e.label, L=e.path.getTotalLength(); t.classList.remove("off");
    const ok=LABEL_AT.some(f=>{
      const pt=e.path.getPointAtLength(L*f);
      t.setAttribute("x",pt.x); t.setAttribute("y",pt.y+4);
      const bb=t.getBBox(), r={x:bb.x-4,y:bb.y-3,w:bb.width+8,h:bb.height+6};
      if(rects.some(q=>hit(r,q))||placed.some(q=>hit(r,q))) return false;
      placed.push(r); return true;
    });
    if(!ok) t.classList.add("off");
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
  placeLabels(); moreState();
}

/* ---------- panel ---------- */
const LEGEND={
  net:["","Rede: o caminho físico e de protocolo"],
  sync:["","Chamada síncrona: pede e espera a resposta"],
  mem:["","Chamada em memória: função chamando função, sem rede"],
  async:["7 6","Evento assíncrono: avisa e segue em frente"],
  run:["2 5","Onde roda: liga o código ao metal"]
};
function intro(){
  const types=new Set(E.map(e=>e[2]));
  const seg=STYLE_IDS.map(id=>`<a href="${styleHref(id)}"${id===STYLE_ID?' aria-current="true"':""}>${styles[id].name}</a>`).join("");
  const total=Object.keys(N).length, done=explored.size;
  panel.className="panel";
  panel.innerHTML=`<div class="intro">
   ${STYLE.desc?`<div class="style-note"><span class="layer-tag">Estilo: ${STYLE.name}</span><p>${STYLE.desc}</p><p class="style-seg-note">O mesmo sistema, montado de outro jeito em cada estilo. Troque e compare o que muda:</p><nav class="style-seg" aria-label="Estilo arquitetural">${seg}</nav></div>`:""}
   <div class="progress"><div class="pg-bar" aria-hidden="true"><i style="width:${Math.round(done/total*100)}%"></i></div>
    <p>${done?`Você explorou <b>${done} de ${total}</b> peças deste estilo.`:`São <b>${total} peças</b> neste estilo. As que você abrir ganham um ✓ no mapa.`}</p></div>
   <h3>Abra qualquer peça</h3>
   <p>Cada caixa tem um mundo dentro. Ao abrir, você vê do que ela é feita, quem cuida dela, com quem conversa e o que acontece se ela cair.</p>
   <p class="hint-expand"><span aria-hidden="true">${ICON_EXPAND}</span>Toque em qualquer caixa para abrir. Dentro do painel, ${ICON_LENS}<b>Entrar na peça</b> desce mais um nível.</p>
   <h4>Como ler as linhas</h4>
   <ul class="legend">${Object.entries(LEGEND).filter(([k])=>types.has(k)).map(([k,[dash,txt]])=>
    `<li><svg width="44" height="10" aria-hidden="true"><line x1="0" y1="5" x2="44" y2="5" stroke="var(--w-${k})" stroke-width="3"${dash?` stroke-dasharray="${dash}"`:""}/></svg>${txt}</li>`).join("")}</ul>
   <h4>Quanto mais fundo, mais longe do usuário</h4>
   <p>O número de cada faixa é a profundidade. A camada 1 é o que a pessoa vê. A 9 é o meio físico: luz na fibra, eletricidade no cobre e ondas no ar.</p></div>`;
}
function setHash(id){
  try{history.replaceState(null,"",id?"#"+id:location.pathname+location.search);}catch(_){}
}
function closePanel(){
  state.sel=null; refresh(); intro(); setHash(null);
}
/* ---------- glossário: o primeiro uso de cada termo num painel vira um botão com a definição ---------- */
const GL=STRATA.glossary||{};
/* siglas (duas ou mais maiúsculas) só casam escritas igual; palavras comuns casam sem diferenciar */
const GL_CS=new Map(), GL_CI=new Map();
Object.entries(GL).forEach(([gid,g])=>[g.t,...(g.alt||[])].forEach(f=>{
  if((f.match(/[A-Z]/g)||[]).length>=2) GL_CS.set(f,gid); else GL_CI.set(f.toLowerCase(),gid);
}));
const reOf=(forms,flags)=>forms.length?new RegExp(`(^|[^\\p{L}\\p{N}])(${forms.sort((a,b)=>b.length-a.length).map(f=>f.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})(?=$|[^\\p{L}\\p{N}])`,flags):null;
const RE_CS=reOf([...GL_CS.keys()],"gu"), RE_CI=reOf([...GL_CI.keys()],"giu");
/* termos que não ganham link no painel de uma peça: os que apontam para ela mesma */
const glossSkip=id=>new Set(Object.entries(GL).filter(([,g])=>g.node===id||(N[id]&&g.t.toLowerCase()===N[id].n.toLowerCase())).map(([gid])=>gid));
function glossLinker(skip){
  const used=new Set(skip||[]), parts=[];
  const sub=(m,pre,form)=>{
    const gid=GL_CS.get(form)||GL_CI.get(form.toLowerCase());
    if(!gid||used.has(gid)) return m;
    used.add(gid); parts.push(`<button type="button" class="term" data-g="${gid}">${form}</button>`);
    return pre+"\u0003"+(parts.length-1)+"\u0004";
  };
  return text=>{
    if(!text) return "";
    let h=esc(text);
    if(RE_CS) h=h.replace(RE_CS,sub);
    if(RE_CI) h=h.replace(RE_CI,sub);
    return h.replace(/\u0003(\d+)\u0004/g,(_,i)=>parts[+i]);
  };
}
/* o balão de definição: fica dentro do zoom quando o termo está lá (o zoom é um dialog modal) */
const gpop=document.createElement("div"); gpop.className="gpop"; gpop.setAttribute("role","dialog"); gpop.hidden=true;
let gpopFrom=null;
function openTerm(btn){
  const gid=btn.dataset.g, g=GL[gid]; if(!g) return;
  (btn.closest("dialog")||document.body).appendChild(gpop);
  const canOpen=g.node&&N[g.node]&&g.node!==state.sel;
  gpop.setAttribute("aria-label",g.t);
  gpop.innerHTML=`<b>${esc(g.t)}</b><p>${esc(g.d)}</p><div class="gpop-act">${canOpen?`<button type="button" data-gnode="${g.node}">Abrir ${esc(N[g.node].n)} →</button>`:""}<a href="glossario.html#${gid}">Ver no glossário</a></div>`;
  gpop.hidden=false; gpopFrom=btn;
  const r=btn.getBoundingClientRect(), w=Math.min(320,innerWidth-24);
  gpop.style.width=w+"px";
  gpop.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2))+"px";
  const below=r.bottom+8, h=gpop.offsetHeight;
  gpop.style.top=(below+h>innerHeight-12&&r.top-h-8>12?r.top-h-8:below)+"px";
  const go=gpop.querySelector("[data-gnode]");
  if(go) go.onclick=()=>{ const id=go.dataset.gnode; closeTerm(); if(zv.open) closeZoom(true); if(fail.on) exitFail(); goTo(id); };
  gpop.querySelector("a,button").focus({preventScroll:true});
}
function closeTerm(){ if(gpop.hidden) return; gpop.hidden=true; if(gpopFrom&&gpopFrom.isConnected) gpopFrom.focus({preventScroll:true}); gpopFrom=null; }
document.addEventListener("click",e=>{
  const t=e.target.closest(".term");
  if(t){ e.preventDefault(); gpop.hidden||gpopFrom!==t?openTerm(t):closeTerm(); return; }
  if(!gpop.hidden&&!gpop.contains(e.target)) closeTerm();
});
window.addEventListener("scroll",()=>{ if(!gpop.hidden&&!gpop.closest("dialog")) closeTerm(); },{passive:true});
/* o balão é fixo na tela: se o conteúdo rola, ele fecharia longe do termo */
panel.addEventListener("scroll",()=>{ if(!gpop.hidden) closeTerm(); },{passive:true});
document.getElementById("zvBody").addEventListener("scroll",()=>{ if(!gpop.hidden) closeTerm(); },{passive:true,capture:true});

/* fontes de um fato: refs = [[rótulo, url], ...], na peça ou num nível do zoom */
const ICON_EXT=`<svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5h5v5M9.5 2.5 3 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const refLinks=refs=>(refs||[]).map(([t,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}${ICON_EXT}<span class="sr-only"> (abre em nova aba)</span></a>`).join("");
/* "Para ir além" lembra a escolha: quem abriu uma vez continua vendo aberto */
const DEEP_KEY="strata-deep";
const deepOpen=()=>{ try{ return localStorage.getItem(DEEP_KEY)==="1"; }catch(_){ return false; } };
function select(id){
  clearFocus(); markSeen(); markExplored(id); closeTerm(); state.sel=id; refresh(); setHash(id);
  const v=N[id], L=LAYERS[layerIdx[v.l]], lv=levelOf(id), G=glossLinker(glossSkip(id));
  panel.className="panel open l"+(layerIdx[v.l]+1);
  const nb=edgesOf(id).map(e=>{const o=e[0]===id?e[1]:e[0];return `<button data-go="${o}">${N[o].n}<small>${e[3]}</small></button>`;}).join("");
  const axn=Object.entries(v.ax||{}).map(([k,t])=>`<div class="axnote ${k}"><b>${AX[k][0]}:</b> ${G(t)}</div>`).join("");
  /* nível 1: em uma frase e como funciona; nível 2, recolhido: o conteúdo técnico */
  panel.innerHTML=`<button class="close" aria-label="Fechar">×</button>
   <span class="layer-tag">Camada ${layerIdx[v.l]+1}: ${L.n}</span>
   <h3>${v.n}</h3>
   ${lv?`<p class="lv-um">${G(lv[0])}</p><div class="lv-ana"><span>Como funciona</span><p>${esc(lv[1])}</p></div>`:`<p class="what">${G(v.what)}</p>`}
   <h4>Quem cuida</h4><div class="row who">${(v.who||[]).map(p=>`<button class="chip" data-persona="${p}" aria-pressed="${state.persona===p}">${PERSONAS[p][0]}</button>`).join("")}</div>
   <h4>Se cair</h4><div class="fail">${G(v.fail)}</div>
   ${STYLE.failure?`<button class="btn-break" data-break>${ICON_BOLT}Derrubar esta peça e ver a cascata</button>`:""}
   <details class="deeper"${deepOpen()?" open":""}>
    <summary><b>Para ir além</b><span>Por dentro, tecnologias reais, onde roda e fontes</span></summary>
    ${lv?`<p class="what">${G(v.what)}</p>`:""}
    <h4 class="h-zoom">Por dentro${hasZoom(id)?`<button class="btn-zoom" data-zoom>${ICON_LENS}Entrar na peça</button>`:""}</h4>
    <ul class="zoom">${v.inside.map((s,i)=>zoomOf(id,s[0])
      ?`<li><button class="zoom-item" data-zi="${i}"><b>${s[0]}</b><span>${s[1]}</span><i aria-hidden="true">→</i></button></li>`
      :`<li><b>${s[0]}</b><span>${G(s[1])}</span></li>`).join("")}</ul>
    ${v.tech?`<h4>Tecnologias reais</h4><div class="tags">${v.tech.map(t=>`<span class="tag">${t}</span>`).join("")}</div>`:""}
    ${v.host?`<h4>Onde pode rodar</h4><p>${G(v.host)}</p>`:""}
    ${axn?`<h4>Eixos que passam por aqui</h4>${axn}`:""}
    ${v.refs?`<h4>Fontes</h4><div class="refs">${refLinks(v.refs)}</div>`:""}
   </details>
   ${nb?`<h4>Conversa com</h4><div class="near">${nb}</div>`:""}`;
  panel.querySelector(".close").onclick=closePanel;
  panel.querySelector("details.deeper").addEventListener("toggle",e=>{ try{ localStorage.setItem(DEEP_KEY,e.target.open?"1":"0"); }catch(_){} });
  const zb=panel.querySelector("[data-zoom]"); if(zb) zb.onclick=()=>openZoom([id]);
  panel.querySelectorAll("[data-zi]").forEach(b=>b.onclick=()=>openZoom([id,+b.dataset.zi]));
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
/* "Mais visões": abaixo de 1400px os eixos e o "onde roda" ficam num menu; o ponto avisa que há visão ligada */
const moreBtn=document.getElementById("moreBtn"), moreViews=document.getElementById("moreViews");
function setMore(open){ moreViews.classList.toggle("open",open); moreBtn.setAttribute("aria-expanded",String(open)); }
moreBtn.onclick=e=>{ e.stopPropagation(); setMore(!moreViews.classList.contains("open")); };
document.addEventListener("click",e=>{ if(moreViews.classList.contains("open")&&!moreViews.contains(e.target)) setMore(false); });
function moreState(){
  moreBtn.classList.toggle("has-on",!!state.ax||state.runs);
  moreBtn.style.setProperty("--more-c",state.ax?`var(--${state.ax})`:"var(--w-run)");
}
const runsBtn=document.getElementById("runs");
runsBtn.onclick=()=>{
  state.runs=!state.runs; runsBtn.setAttribute("aria-pressed",String(state.runs));
  if(state.sel) select(state.sel); else refresh();
};

/* ---------- packets ---------- */
function findEdge(a,b){return E.find(e=>(e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a));}
function send(a,b,color,dur,r,cls){
  return new Promise(res=>{
    const c=document.createElementNS(SVGNS,"circle"); c.setAttribute("r",r||6); if(cls) c.setAttribute("class",cls); c.setAttribute("fill",color); c.setAttribute("stroke","var(--card)"); c.setAttribute("stroke-width","2");
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
const COLORS={net:"var(--w-net)",sync:"var(--w-sync)",mem:"var(--w-mem)",async:"var(--w-async)",run:"var(--w-run)"};
function ambient(){
  if(reduce||jr.on||fail.on||document.hidden||mobile.matches) return;
  const pool=E.filter(e=>e[2]!=="run"||state.runs);
  const e=pool[Math.floor(Math.random()*pool.length)];
  const rev=e[2]!=="async"&&Math.random()<.4;
  send(rev?e[1]:e[0],rev?e[0]:e[1],COLORS[e[2]],1600+Math.random()*900,4);
}
setInterval(ambient,700);

/* ---------- journey ---------- */
const narr=document.getElementById("narr"), nText=document.getElementById("nText"), nStep=document.getElementById("nStep"), nMs=document.getElementById("nMs"), nBar=document.getElementById("nBar"), nPause=document.getElementById("nPause");
const nQuiz=document.getElementById("nQuiz"), nEnd=document.getElementById("nEnd"), nMode=document.getElementById("nMode");
/* história da Ana (padrão) ou todos os passos técnicos; a escolha fica guardada */
const TOUR_KEY="strata-tour";
let fullMode=false; try{ fullMode=localStorage.getItem(TOUR_KEY)==="full"; }catch(_){}
let J=TOUR, LAST=TOUR.length-1;
function setMode(full){
  fullMode=full&&TOUR!==JOURNEY? true : false;
  J=fullMode?JOURNEY:TOUR; LAST=J.length-1;
  nMode.hidden=TOUR===JOURNEY;
  nMode.textContent=fullMode?"Ver a história da Ana":`Ver todos os ${JOURNEY.length} passos`;
  try{ localStorage.setItem(TOUR_KEY,fullMode?"full":"ana"); }catch(_){}
}
const jr={on:false,i:0,paused:false,done:false,timer:null,delay:null};
function clearActive(){
  Object.values(el).forEach(b=>b.classList.remove("is-active"));
  E.forEach(e=>e.path.classList.remove("j-hot"));
  packets.querySelectorAll(".jpkt").forEach(c=>c.remove());
}
/* rola para que as peças do passo fiquem entre a barra e a caixa de narração; se não couberem juntas, mostra o destino */
function revealStep(a,b){
  const ra=el[a].getBoundingClientRect(), rb=el[b].getBoundingClientRect();
  const barH=document.querySelector(".controls").offsetHeight;
  const limit=narr.classList.contains("on")?narr.getBoundingClientRect().top:innerHeight;
  const room=limit-barH-24, top=Math.min(ra.top,rb.top), bottom=Math.max(ra.bottom,rb.bottom);
  const [t,h]=bottom-top<=room?[top,bottom-top]:[rb.top,rb.height];
  window.scrollTo({top:Math.max(0,scrollY+t-barH-12-Math.max(0,(room-h)/2)),behavior:reduce?"auto":"smooth"});
}
/* tempo de leitura: passos curtos andam rápido, os longos dão tempo de ler */
const readMs=text=>Math.min(8000,Math.max(1400,text.length*40));
function clearTimers(){clearTimeout(jr.timer);clearTimeout(jr.delay);}
function setPaused(p){jr.paused=p; jr.done=false; nPause.textContent=p?"Continuar":"Pausar";}
/* fim: um resumo do que a mensagem atravessou e um convite para o próximo passo */
function finish(){
  jr.paused=true; jr.done=true; nPause.textContent="Repetir";
  const ids=new Set(JOURNEY.flatMap(x=>[x[0],x[1]])), lay=new Set([...ids].map(id=>N[id].l));
  const ms=JOURNEY.reduce((a,x)=>a+x[3],0);
  const below=LAYERS.filter(L=>!lay.has(L.id)).map(L=>L.n.toLowerCase());
  nText.innerHTML=`${TOUR!==JOURNEY&&!fullMode?"A mensagem da Ana":"A mensagem"} passou por <b>${ids.size} peças</b> em <b>${lay.size} das ${LAYERS.length} camadas</b>, em cerca de <b>${ms} ms</b>.`
    +(below.length?` As outras camadas (${below.join(", ")}) estão por baixo de tudo: ligue “Onde cada coisa roda” para ver o que sustenta cada peça.`:"");
  const next=STYLE_IDS[STYLE_IDS.indexOf(STYLE_ID)+1];
  nEnd.innerHTML=(TOUR!==JOURNEY?`<button type="button" data-mode>${fullMode?"Ver a história da Ana":`Ver todos os ${JOURNEY.length} passos`}</button>`:"")
    +(next?`<a href="${styleHref(next)}">Agora veja o mesmo clique em ${styles[next].name} →</a>`:"");
  nEnd.hidden=false;
  const m=nEnd.querySelector("[data-mode]"); if(m) m.onclick=()=>{ setMode(!fullMode); setPaused(false); showStep(0); };
}
/* pergunta do passo: aparece quando o pacote chega; a jornada espera a resposta */
function showQuiz(q){
  setPaused(true);
  nQuiz.innerHTML=`<p class="q-p">${esc(q.p)}</p><div class="q-o">${q.o.map((o,k)=>`<button type="button" data-k="${k}">${esc(o)}</button>`).join("")}</div><p class="q-why" hidden></p>`;
  nQuiz.hidden=false;
  nQuiz.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{
    const k=+b.dataset.k, ok=k===q.c;
    nQuiz.querySelectorAll("[data-k]").forEach(x=>{ x.disabled=true; if(+x.dataset.k===q.c) x.classList.add("right"); });
    if(!ok) b.classList.add("wrong");
    const why=nQuiz.querySelector(".q-why"); why.hidden=false;
    why.innerHTML=`<b>${ok?"Isso!":"Quase."}</b> ${esc(q.why)}`;
    nPause.focus({preventScroll:true});
  });
}
/* o pacote segue as peças do meio (via), uma linha por vez */
async function sendPath(path,dur,token){
  const hops=path.length-1, each=reduce?10:Math.max(260,dur/hops);
  for(let k=0;k<hops;k++){
    if(token!==jr.token) return false;
    const e=findEdge(path[k],path[k+1]);
    await send(path[k],path[k+1],e?COLORS[e[2]]:"var(--w-net)",each,9,"jpkt");
  }
  return token===jr.token;
}
function showStep(i){
  clearTimers(); jr.i=i; jr.done=false; const s=J[i], extra=s[4]||{};
  const ms=J.slice(0,i+1).reduce((a,x)=>a+x[3],0);
  nStep.textContent=`Passo ${i+1} de ${J.length}`; nMs.textContent=`${ms} ms desde o toque`;
  nText.textContent=s[2]; nBar.style.width=((i+1)/J.length*100)+"%";
  nQuiz.hidden=true; nQuiz.innerHTML=""; nEnd.hidden=true;
  clearActive(); el[s[0]].classList.add("is-active"); el[s[1]].classList.add("is-active");
  revealStep(s[0],s[1]);
  const path=[s[0],...(extra.via||[]),s[1]];
  for(let k=0;k<path.length-1;k++){ const e=findEdge(path[k],path[k+1]); if(e) e.path.classList.add("j-hot"); }
  const token=jr.token=(jr.token||0)+1;
  jr.delay=setTimeout(()=>{ sendPath(path,1000,token).then(alive=>{
    if(!alive||!jr.on||jr.i!==i) return;
    if(extra.p){ showQuiz(extra); return; }
    if(jr.paused) return;
    if(i<LAST) jr.timer=setTimeout(()=>showStep(i+1),readMs(s[2]));
    else finish();
  });},reduce?0:250);
}
function startJourney(){
  if(fail.on) exitFail();
  if(state.sel) closePanel();
  clearFocus(); setMode(fullMode); jr.on=true; setPaused(false); narr.classList.add("on");
  /* respiro no fim do mapa: as peças das últimas camadas também precisam subir acima da caixa */
  document.body.classList.add("jr-on"); showStep(0);
}
nMode.onclick=()=>{ setMode(!fullMode); setPaused(false); showStep(0); };
function stopJourney(){jr.on=false;jr.token=(jr.token||0)+1;clearTimers();narr.classList.remove("on");document.body.classList.remove("jr-on");clearActive();}
function jump(i){setPaused(true); showStep(i);}
document.querySelectorAll("[data-play]").forEach(b=>b.onclick=startJourney);
document.getElementById("nStop").onclick=stopJourney;
document.getElementById("nNext").onclick=()=>{if(jr.i<LAST) jump(jr.i+1);};
document.getElementById("nPrev").onclick=()=>{if(jr.i>0) jump(jr.i-1);};
/* a barra de progresso pula para o ponto clicado */
document.getElementById("nBarWrap").onclick=e=>{
  const r=e.currentTarget.getBoundingClientRect();
  jump(Math.min(LAST,Math.max(0,Math.floor((e.clientX-r.left)/r.width*J.length))));
};
/* no celular, arrastar a caixa para os lados avança ou volta */
let swipeX=null;
narr.addEventListener("touchstart",e=>{ swipeX=e.touches[0].clientX; },{passive:true});
narr.addEventListener("touchend",e=>{
  if(swipeX===null) return; const dx=e.changedTouches[0].clientX-swipeX; swipeX=null;
  if(dx<-40&&jr.i<LAST) jump(jr.i+1); else if(dx>40&&jr.i>0) jump(jr.i-1);
},{passive:true});
nPause.onclick=()=>{
  if(jr.done){setPaused(false); showStep(0); return;}
  /* com a pergunta na tela, Continuar segue para o próximo passo */
  if(jr.paused){
    setPaused(false);
    if(jr.i<LAST) showStep(jr.i+1); else finish();
  }else{setPaused(true); clearTimers();}
};
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&!gpop.hidden){ e.preventDefault(); closeTerm(); return; }
  if(search.open||zv.open) return;
  if(e.key==="Escape"){
    if(moreViews.classList.contains("open")) setMore(false);
    else if(jr.on) stopJourney(); else if(fail.on) exitFail(); else if(state.sel) closePanel();
    return;
  }
  /* setas navegam pela jornada, fora de campos e selects */
  if(jr.on&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){
    if(e.key==="ArrowRight"){ e.preventDefault(); if(jr.i<LAST) jump(jr.i+1); }
    else if(e.key==="ArrowLeft"){ e.preventDefault(); if(jr.i>0) jump(jr.i-1); }
  }
});

/* ---------- busca (⌘K, Ctrl+K ou /) ---------- */
const search=document.getElementById("search"), q=document.getElementById("q"), results=document.getElementById("results");
const SUGGEST=["Kafka","JWT","B-tree","Kubernetes","DNS","Pix","failover","anycast"];
const isMac=/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent);
document.getElementById("searchKbd").textContent=isMac?"⌘K":"Ctrl K";
let hits=[], cur=0;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const mark=s=>esc(s).replace(/\u0001/g,"<mark>").replace(/\u0002/g,"</mark>");

function openSearch(){
  if(search.open) return;
  if(jr.on) stopJourney();
  search.showModal(); q.value=""; renderResults(); q.focus();
}
function renderResults(){
  const text=q.value.trim();
  if(!text){
    hits=[]; q.removeAttribute("aria-activedescendant");
    results.innerHTML=`<li class="r-empty">Experimente:<span class="r-sugs">${SUGGEST.map(s=>`<button type="button" data-sug="${s}">${s}</button>`).join("")}</span></li>`;
    results.querySelectorAll("[data-sug]").forEach(b=>b.onclick=()=>{q.value=b.dataset.sug; renderResults(); q.focus();});
    return;
  }
  /* peças primeiro; depois os cartões do zoom. Uma peça que só apareceu pelo "por dentro"
     sai da lista quando o próprio cartão daquele item também apareceu */
  const zoomHits=STRATA.searchZoom(STYLE,LAYERS,Z,text).slice(0,8);
  const nodeHits=STRATA.searchNodes(STYLE,LAYERS,text)
    .filter(h=>!(h.label.startsWith("Por dentro")&&zoomHits.some(z=>z.id===h.id))).slice(0,6);
  hits=[...nodeHits,...zoomHits].map(h=>({...h,href:null}));
  /* termos que só existem em outro estilo levam para lá */
  Object.entries(styles).forEach(([sid,s])=>{
    if(sid===STYLE_ID) return;
    STRATA.searchNodes(s,LAYERS,text).filter(h=>!N[h.id]).slice(0,3)
      .forEach(h=>hits.push({...h,href:`?estilo=${sid}#${h.id}`,styleName:s.name}));
  });
  cur=0;
  if(!hits.length){results.innerHTML=`<li class="r-empty">Nada encontrado para “${esc(text)}”.</li>`; q.removeAttribute("aria-activedescendant"); return;}
  let other=false, inner=false;
  results.innerHTML=hits.map((h,i)=>{
    let head="";
    if(h.href&&!other){ other=true; head=`<li class="r-sep" role="presentation">Em outros estilos</li>`; }
    else if(h.kind==="zoom"&&!inner){ inner=true; head=`<li class="r-sep" role="presentation">Por dentro das peças</li>`; }
    const li=layerIdx[h.layer.id]+1;
    const meta=h.href?`${esc(h.styleName)} →`:h.kind==="zoom"?`${ICON_LENS}${esc(h.crumbs.join(" › "))}`:`${pad(li)} ${esc(h.layer.n)}`;
    return head+`<li role="option" id="r-${i}" class="r l${li}${h.kind==="zoom"?" r-zoom":""}" data-i="${i}">
      <span class="r-dot" aria-hidden="true"></span>
      <span class="r-body"><b>${mark(h.name)}</b><small>${h.label?`<em>${esc(h.label)}:</em> `:""}${mark(h.detail)}</small></span>
      <span class="r-meta">${meta}</span></li>`;
  }).join("");
  results.querySelectorAll(".r").forEach(r=>{
    r.onclick=()=>choose(+r.dataset.i);
    r.onmousemove=()=>{if(cur!==+r.dataset.i) setCur(+r.dataset.i);};
  });
  setCur(0);
}
function setCur(i){
  cur=i;
  results.querySelectorAll(".r").forEach(r=>r.setAttribute("aria-selected",String(+r.dataset.i===i)));
  q.setAttribute("aria-activedescendant","r-"+i);
  const r=document.getElementById("r-"+i); if(r) r.scrollIntoView({block:"nearest"});
}
function choose(i){
  const h=hits[i]; if(!h) return;
  search.close();
  if(h.href){location.href=h.href; return;}
  if(zv.open) closeZoom(true);
  if(fail.on) exitFail();
  goTo(h.id);
  if(h.kind==="zoom") openZoom(h.path, h.hl);
}
q.addEventListener("input",renderResults);
q.addEventListener("keydown",e=>{
  if(e.key==="ArrowDown"&&hits.length){e.preventDefault(); setCur((cur+1)%hits.length);}
  else if(e.key==="ArrowUp"&&hits.length){e.preventDefault(); setCur((cur-1+hits.length)%hits.length);}
  else if(e.key==="Enter"){e.preventDefault(); choose(cur);}
});
search.addEventListener("click",e=>{if(e.target===search) search.close();});
document.getElementById("searchBtn").onclick=openSearch;
document.addEventListener("keydown",e=>{
  const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if((e.key==="k"||e.key==="K")&&(e.metaKey||e.ctrlKey)){e.preventDefault(); search.open?search.close():openSearch();}
  else if(e.key==="/"&&!typing&&!search.open){e.preventDefault(); openSearch();}
});

/* ---------- modo falha ---------- */
const ICON_BOLT=`<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M8.2 1 3 8h3.6L5.8 13 11 6H7.4z" fill="currentColor"/></svg>`;
const F_LABEL={down:"caiu",stop:"parou",degr:"degrada",frozen:"congela",hold:"segura"};
const F_GROUPS=[["stop","Param junto"],["degr","Degradam"],["frozen","Congelam: só as mudanças param"],["hold","Seguram o tranco"]];
const F_USER={
  stop:"Para o usuário, o sistema está fora do ar.",
  degr:"O usuário percebe: algo fica lento, falha ou chega atrasado.",
  ok:"O usuário nem percebe."
};
const F_SAMPLES=(STYLE.failure&&STYLE.failure.samples)||["oltp","kafka","notificacoes","k8s","dns","datacenter"];
const fail={on:false,root:null,red:true,timers:[],guess:true};
/* desafio: antes de ver a cascata, a pessoa aposta no que o usuário vai perceber (guardado no navegador) */
const GUESS_KEY="strata-guess";
try{ fail.guess=localStorage.getItem(GUESS_KEY)!=="0"; }catch(_){}
const F_GUESS=[["ok","Nada: tudo continua normal"],["degr","Algo fica lento, falha ou chega atrasado"],["stop","O sistema sai do ar para ela"]];
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
  const sw=panel.querySelector(".f-red");
  if(sw) sw.onclick=()=>{fail.red=!fail.red; fail.root?breakNode(fail.root,{reveal:true}):failIntro();};
}
function failIntro(){
  panel.className="panel open";
  panel.innerHTML=`<button class="close" aria-label="Sair do modo falha">×</button>
   <span class="layer-tag f-tag">Modo falha</span>
   <h3>O que cai junto?</h3>
   <p class="what">Escolha uma peça para derrubar. A queda se espalha por quem depende dela: alguns param, outros só degradam, e as filas seguram o tranco.</p>
   ${redSwitch()}
   <p class="f-note">Ligada, mostra a produção real: réplicas, failover e várias zonas. Desligada, mostra por que elas existem.</p>
   <button class="switch f-guess-sw" aria-pressed="${fail.guess}"><i aria-hidden="true"></i>Tentar adivinhar antes</button>
   <p class="f-note">Antes da cascata, você aposta no que a pessoa usando o app vai perceber.</p>
   <h4>Comece por aqui</h4>
   <div class="near">${F_SAMPLES.filter(k=>N[k]).map(k=>`<button data-break="${k}">${N[k].n}<small>${LAYERS[layerIdx[N[k].l]].n}</small></button>`).join("")}</div>`;
  panel.querySelector(".close").onclick=exitFail;
  panel.querySelectorAll("[data-break]").forEach(b=>b.onclick=()=>breakNode(b.dataset.break));
  const gs=panel.querySelector(".f-guess-sw");
  gs.onclick=()=>{ fail.guess=!fail.guess; gs.setAttribute("aria-pressed",String(fail.guess)); try{ localStorage.setItem(GUESS_KEY,fail.guess?"1":"0"); }catch(_){} };
  bindRed(); panel.scrollTop=0;
}
/* a pergunta do desafio: só a peça derrubada aparece no mapa até a resposta */
function failGuess(id){
  const v=N[id];
  map.classList.add("f-active");
  el[id].classList.add("f-in","f-down"); el[id].querySelector(".f-badge").textContent=F_LABEL.down;
  panel.className="panel open l"+(layerIdx[v.l]+1);
  panel.innerHTML=`<button class="close" aria-label="Sair do modo falha">×</button>
   <span class="layer-tag f-tag">Modo falha · Desafio</span>
   <h3>${v.n} caiu</h3>
   <p class="what">Antes de ver a cascata: o que você acha que a pessoa usando o app vai perceber?</p>
   <div class="f-guess">${F_GUESS.map(([k,t])=>`<button type="button" data-guess="${k}">${t}</button>`).join("")}</div>
   <p class="f-note">${fail.red?"Considerando a produção real, com réplicas, failover e várias zonas.":"Considerando um sistema sem redundância nenhuma."}</p>
   <button class="f-skip" type="button" data-skip>Pular e ver a cascata</button>`;
  panel.querySelector(".close").onclick=exitFail;
  panel.querySelectorAll("[data-guess]").forEach(b=>b.onclick=()=>breakNode(id,{reveal:true,guess:b.dataset.guess}));
  panel.querySelector("[data-skip]").onclick=()=>breakNode(id,{reveal:true});
  panel.scrollTop=0;
  el[id].scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});
  announce.textContent=`${v.n} caiu. O que você acha que o usuário vai perceber?`;
}
function breakNode(id,opt){
  opt=opt||{};
  markSeen();
  if(!fail.on) enterFail();
  clearFailMarks(); fail.root=id; setHash("falha-"+id);
  if(fail.guess&&!opt.reveal){ failGuess(id); return; }
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
  failReport(id,r,opt.guess);
  el[id].scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});
  const n=Object.keys(r.nodes).length-1;
  announce.textContent=`${N[id].n} caiu. ${n?n+" peças afetadas.":"Nenhuma outra peça afetada."} ${F_USER[r.user]}`;
}
function failReport(id,r,guess){
  const v=N[id], g=STYLE.failure.guards[id];
  const groups=F_GROUPS.map(([s,title])=>{
    const items=Object.entries(r.nodes).filter(([k,x])=>k!==id&&x.s===s).sort((a,b)=>a[1].wave-b[1].wave);
    if(!items.length) return "";
    return `<h4 class="f-h f-${s}"><i></i>${title} <span>${items.length}</span></h4>
      <ul class="f-list">${items.map(([k,x])=>`<li><button data-go="${k}"><b>${N[k].n}</b><span>${x.why}</span></button></li>`).join("")}</ul>`;
  }).join("");
  const res=v.ax&&v.ax.res;
  /* a mesma queda nos outros estilos que têm essa peça */
  const compare=Object.entries(styles).filter(([sid,s])=>sid!==STYLE_ID&&s.failure&&s.nodes[id]).map(([sid,s])=>{
    const u=STRATA.simulateFailure(s,id,fail.red).user;
    return `<a class="f-compare f-u-${u}" href="${styleHref(sid)}#falha-${id}"><span>E em ${s.name}?</span>${F_USER[u]} <b>Ver →</b></a>`;
  }).join("");
  panel.className="panel open l"+(layerIdx[v.l]+1);
  panel.innerHTML=`<button class="close" aria-label="Sair do modo falha">×</button>
   <span class="layer-tag f-tag">Modo falha · Camada ${layerIdx[v.l]+1}</span>
   <h3>${v.n} caiu</h3>
   ${guess?`<div class="f-result ${guess===r.user?"right":"wrong"}"><b>${guess===r.user?"Você acertou.":"Não foi dessa vez."}</b> Sua aposta: ${F_GUESS.find(g=>g[0]===guess)[1].toLowerCase()}.</div>`:""}
   <div class="f-verdict f-u-${r.user}">${F_USER[r.user]}</div>
   ${compare}
   ${g?redSwitch()+(fail.red?`<div class="f-guard"><b>Quem segura:</b> ${g[1]}</div>`:`<p class="f-note">Sem redundância, nada segura a queda. Ligue a chave para ver como a produção se protege.</p>`)
      :`<p class="f-note">Esta peça não tem réplica nem desvio que segure a queda: o cenário é ela inteira fora do ar.</p>`}
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

/* ---------- zoom dentro do zoom ---------- */
const zv=document.getElementById("zoomView"), zvCrumbs=document.getElementById("zvCrumbs"), zvBody=document.getElementById("zvBody"), zvBack=document.getElementById("zvBack");
let zpath=[];
/* ztop: o nível visível. Os outros filhos de zvBody estão saindo, numa animação.
   zClose: fecha o zoom de vez enquanto a animação de saída está no meio. */
let ztop=null, zClose=null;
/* encerra a transição em andamento: só o nível atual fica, sem recorte */
function zSettle(){
  [...zvBody.children].forEach(s=>{ if(s!==ztop){ s.getAnimations().forEach(a=>a.cancel()); s.remove(); } });
  if(ztop) ztop.getAnimations().forEach(a=>a.cancel());
}

/* o conteúdo de um nível: [peça], [peça, item], [peça, item, subitem] */
function zLevel(path){
  const [id,i1,i2]=path, v=N[id];
  if(path.length===1) return {title:v.n, what:v.what, refs:v.refs,
    cards:v.inside.map(([n,t])=>{const z=zoomOf(id,n); return {n,t,kids:z?z.kids.length:0};})};
  const l2=zoomOf(id,v.inside[i1][0]);
  if(path.length===2) return {title:v.inside[i1][0], what:l2.what, ex:l2.ex, refs:l2.refs,
    cards:l2.kids.map(([n,t,sub])=>({n,t,kids:sub?sub.kids.length:0}))};
  const k=l2.kids[i2];
  return {title:k[0], what:k[2].what, ex:k[2].ex, refs:k[2].refs, cards:k[2].kids.map(([n,t])=>({n,t,kids:0}))};
}
function validPath(p){
  try{ if(!N[p[0]]) return false; const L=zLevel(p); return !!(L&&L.what); }catch(_){ return false; }
}
function zStage(path, hl){
  const L=zLevel(path), v=N[path[0]], li=layerIdx[v.l]+1, G=glossLinker(glossSkip(path[0]));
  const st=document.createElement("div"); st.className="zv-stage";
  st.innerHTML=`<div class="zv-in">
    <p class="zv-depth">Camada ${li} · ${LAYERS[li-1].n}<span class="zv-dots" aria-label="Nível ${path.length} de 3">${[1,2,3].map(n=>`<i class="${n<=path.length?"on":""}"></i>`).join("")}</span></p>
    <h2 tabindex="-1">${L.title}</h2>
    <p class="zv-what">${G(L.what)}</p>
    ${L.ex?`<figure class="zv-ex"><figcaption>${esc(L.ex[0])}</figcaption><pre><code>${esc(L.ex[1])}</code></pre></figure>`:""}
    <div class="zv-grid">${L.cards.map((c,i)=>c.kids
      ?`<button class="zv-card can${c.n===hl?" zv-hit":""}" data-i="${i}"><b>${c.n}</b><span>${c.t}</span><em>${ICON_LENS}${c.kids} partes por dentro</em></button>`
      :`<div class="zv-card${c.n===hl?" zv-hit":""}"><b>${c.n}</b><span>${G(c.t)}</span></div>`).join("")}</div>
    ${L.refs?`<div class="refs zv-refs"><span>Fontes</span>${refLinks(L.refs)}</div>`:""}
  </div>`;
  st.querySelectorAll(".zv-card.can").forEach(c=>c.onclick=()=>zoomTo([...path,+c.dataset.i],c));
  return st;
}
function zCrumbs(path){
  const v=N[path[0]], names=[v.n];
  if(path.length>1) names.push(v.inside[path[1]][0]);
  if(path.length>2) names.push(zoomOf(path[0],v.inside[path[1]][0]).kids[path[2]][0]);
  zvCrumbs.innerHTML=`<button data-up="0">Mapa</button>`+names.map((n,i)=>i===names.length-1
    ?`<span aria-current="page">${n}</span>`:`<button data-up="${i+1}">${n}</button>`).join("");
  zvCrumbs.querySelectorAll("[data-up]").forEach(b=>b.onclick=()=>zoomUp(+b.dataset.up));
  /* um nível acima; no primeiro nível, volta ao mapa */
  const up=path.length>1?names[names.length-2]:"o mapa";
  zvBack.setAttribute("aria-label",`Voltar para ${up}`);
  zvBack.querySelector("span").textContent=path.length>1?"Voltar":"Voltar ao mapa";
}
/* recorte que começa no retângulo de origem e abre até a tela inteira */
function clipFrom(r, box){
  return `inset(${r.top-box.top}px ${box.right-r.right}px ${box.bottom-r.bottom}px ${r.left-box.left}px round 14px)`;
}
const Z_EASE={duration:480,easing:"cubic-bezier(.2,.75,.2,1)"};
/* retângulo da peça na tela; se ela estiver fora (a rolagem ainda não chegou), o zoom parte do centro */
function nodeRect(id){
  const r=el[id].getBoundingClientRect(), vw=innerWidth, vh=innerHeight;
  if(r.bottom>0&&r.top<vh&&r.right>0&&r.left<vw) return r;
  return {top:vh*.4,bottom:vh*.6,left:vw*.4,right:vw*.6};
}
/* limpa depois da animação; o temporizador garante a limpeza se o evento de fim não vier */
function after(anim, ms, fn){
  let done=false; const run=()=>{ if(!done){ done=true; fn(); } };
  anim.finished.then(run, run); setTimeout(run, ms+80);
}
function zShow(path, st){
  zpath=path; zCrumbs(path); setHash("zoom-"+path.join("-"));
  zv.className="zv l"+(layerIdx[N[path[0]].l]+1);
  st.querySelector("h2").focus({preventScroll:true});
}
/* hl: nome do cartão a destacar, quando o zoom é aberto pela busca */
function openZoom(path, hl){
  if(!validPath(path)) return;
  if(zClose) zClose();
  if(zv.open){ zoomTo(path); return; }
  if(jr.on) stopJourney();
  const st=zStage(path, hl); ztop=st; zvBody.replaceChildren(st);
  zv.showModal(); zShow(path, st);
  if(!reduce){
    const r=nodeRect(path[0]), box=zv.getBoundingClientRect();
    const a=zv.animate([{clipPath:clipFrom(r,box)},{clipPath:"inset(0px 0px 0px 0px round 0px)"}],Z_EASE);
    after(a, Z_EASE.duration, ()=>a.cancel());
  }
  const hit=st.querySelector(".zv-hit"); if(hit) hit.scrollIntoView({block:"center",behavior:"auto"});
}
function zoomTo(path, fromEl){
  if(zClose) return;
  zSettle();
  const old=ztop, st=zStage(path); ztop=st;
  zvBody.appendChild(st); zShow(path, st);
  if(reduce||!fromEl||!old){ zvBody.replaceChildren(st); return; }
  /* o nível que sai não recebe mais cliques: um segundo clique rápido não navega por ele */
  old.inert=true;
  const box=st.getBoundingClientRect();
  old.animate([{opacity:1,transform:"scale(1)"},{opacity:0,transform:"scale(1.06)"}],{duration:380,easing:"ease-in",fill:"forwards"});
  const a=st.animate([{clipPath:clipFrom(fromEl.getBoundingClientRect(),box)},{clipPath:"inset(0px 0px 0px 0px round 0px)"}],Z_EASE);
  after(a, Z_EASE.duration, ()=>{ a.cancel(); if(old.isConnected) old.remove(); });
}
function zoomUp(depth){
  if(zClose) return;
  if(depth<=0){ closeZoom(); return; }
  zSettle();
  const target=zpath.slice(0,depth), child=zpath[depth];
  const cur=ztop, st=zStage(target); ztop=st;
  zvBody.insertBefore(st, cur); zShow(target, st);
  if(reduce||!cur){ if(cur) cur.remove(); return; }
  cur.inert=true;
  const card=st.querySelector(`.zv-card[data-i="${child}"]`), box=cur.getBoundingClientRect();
  const to=card?clipFrom(card.getBoundingClientRect(),box):"inset(50% 50% 50% 50% round 14px)";
  after(cur.animate([{clipPath:"inset(0px 0px 0px 0px round 0px)"},{clipPath:to}],{duration:380,easing:"cubic-bezier(.5,0,.75,0)",fill:"forwards"}),
    380, ()=>cur.remove());
}
function closeZoom(now){
  /* já fechando: Esc ou clique repetido não reinicia a animação; "now" termina na hora */
  if(zClose){ if(now) zClose(); return; }
  const id=zpath[0]; let anim=null;
  const done=()=>{
    if(!zClose) return; zClose=null;
    if(anim) anim.cancel();
    zv.close(); zvBody.replaceChildren(); ztop=null; zpath=[]; setHash(state.sel||null);
  };
  zClose=done;
  if(now||reduce||!el[id]){ done(); return; }
  zSettle();
  const box=zv.getBoundingClientRect();
  anim=zv.animate([{clipPath:"inset(0px 0px 0px 0px round 0px)"},{clipPath:clipFrom(nodeRect(id),box)}],{duration:380,easing:"cubic-bezier(.5,0,.75,0)",fill:"forwards"});
  after(anim, 380, done);
}
document.getElementById("zvClose").onclick=()=>closeZoom();
zvBack.onclick=()=>zoomUp(zpath.length-1);
/* Esc sobe um nível. Depois de vários Esc seguidos o navegador deixa de aceitar o preventDefault
   e fecha o dialog sozinho; o evento "close" garante a mesma limpeza do nosso fechamento. */
zv.addEventListener("cancel",e=>{ if(!e.cancelable) return; e.preventDefault(); if(!gpop.hidden){ closeTerm(); return; } zoomUp(zpath.length-1); });
zv.addEventListener("close",()=>{
  if(zClose){ zClose(); return; }
  if(zv.open||!zpath.length) return;
  zvBody.replaceChildren(); ztop=null; zpath=[]; setHash(state.sel||null);
});

/* ---------- deep link: #id abre a peça; #falha-id derruba; #zoom-id-1-2 abre o zoom ---------- */
function fromHash(){
  const id=decodeURIComponent(location.hash.slice(1));
  const zm=id.match(/^zoom-([a-z][a-z0-9]*)((?:-\d+){0,2})$/);
  if(zm){
    const path=[zm[1],...zm[2].split("-").filter(Boolean).map(Number)];
    if(validPath(path)){ if(fail.on) exitFail(); if(state.sel!==path[0]) goTo(path[0]); openZoom(path); }
    return;
  }
  if(id.startsWith("falha-")&&N[id.slice(6)]&&STYLE.failure) breakNode(id.slice(6));
  /* link de uma peça com o modo falha ligado: sai do modo antes, para não misturar as marcas da queda */
  else if(N[id]&&(state.sel!==id||fail.on)){ if(fail.on) exitFail(); goTo(id); }
}
window.addEventListener("hashchange",fromHash);

intro(); refresh(); layout();
/* ?papel=dba abre o mapa já pelos olhos de um papel (usado nos roteiros para professores) */
if(PERSONAS[params.get("papel")]) setPersona(params.get("papel"));
fromHash();
})();
