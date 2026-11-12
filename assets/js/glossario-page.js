/* Página do glossário: lista os termos de data/glossario.js em ordem alfabética, com filtro,
 * índice por letra e link para a peça em cada estilo onde ela existe. */
(function(){
const {glossary:GL, styles}=window.STRATA;
const ORDER=["monolito","microsservicos","serverless"];
const ids=[...ORDER.filter(id=>styles[id]),...Object.keys(styles).filter(id=>!ORDER.includes(id))];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const fold=s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const letterOf=t=>fold(t)[0].toUpperCase();

const terms=Object.entries(GL).sort((a,b)=>a[1].t.localeCompare(b[1].t,"pt-BR",{sensitivity:"base"}));
const list=document.getElementById("glist"), letters=document.getElementById("gletters");
const groups=new Map();
terms.forEach(([gid,g])=>{ const L=letterOf(g.t); if(!groups.has(L)) groups.set(L,[]); groups.get(L).push([gid,g]); });

list.innerHTML=[...groups].map(([L,items])=>`<section class="gl-group" data-letter="${L}" id="letra-${L}">
  <h2>${L}</h2>
  ${items.map(([gid,g])=>{
    const where=g.node?ids.filter(sid=>styles[sid].nodes[g.node]):[];
    return `<article class="gl-item" id="${gid}" data-q="${esc(fold([g.t,...(g.alt||[]),g.d].join(" ")))}">
      <h3>${esc(g.t)}</h3>
      ${g.alt&&g.alt.length?`<p class="gl-alt">Também aparece como: ${g.alt.map(esc).join(", ")}</p>`:""}
      <p>${esc(g.d)}</p>
      ${where.length?`<p class="gl-where">Ver no mapa: ${where.map(sid=>`<a href="index.html?estilo=${sid}#${g.node}">${esc(styles[sid].nodes[g.node].n)} em ${esc(styles[sid].name)}</a>`).join("")}</p>`:""}
    </article>`;}).join("")}
</section>`).join("");
letters.innerHTML=[...groups.keys()].map(L=>`<a href="#letra-${L}">${L}</a>`).join("");

const q=document.getElementById("gq"), empty=document.getElementById("gempty");
q.addEventListener("input",()=>{
  const term=fold(q.value.trim()); let any=false;
  list.querySelectorAll(".gl-group").forEach(sec=>{
    let shown=0;
    sec.querySelectorAll(".gl-item").forEach(it=>{ const on=!term||it.dataset.q.includes(term); it.hidden=!on; if(on) shown++; });
    sec.hidden=!shown; if(shown) any=true;
  });
  empty.hidden=any;
});

/* chegou por um link do mapa (glossario.html#dns): destaca o termo */
function highlight(){
  const t=location.hash&&document.getElementById(decodeURIComponent(location.hash.slice(1)));
  list.querySelectorAll(".gl-item.hit").forEach(x=>x.classList.remove("hit"));
  if(t&&t.classList.contains("gl-item")){ t.classList.add("hit"); t.scrollIntoView({block:"center"}); }
}
window.addEventListener("hashchange",highlight); highlight();
})();
