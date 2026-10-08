/* Busca rápida: procura peças por nome, tecnologia, conteúdo e camada.
 * Função pura sobre os dados do estilo; a caixa de busca fica em app.js. */
window.STRATA = window.STRATA || { styles: {} };

(function(){
/* sem acento e em minúsculas, caractere a caractere, para achar e grifar no texto original */
const fold=c=>c.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const norm=s=>[...s].map(fold).join("");

/* apelidos comuns que não aparecem no texto das peças */
const ALIASES={k8s:"kubernetes",db:"banco",bd:"banco",lb:"balanceador",mq:"fila",auth:"autenticacao",
  ci:"pipeline",cd:"pipeline",iac:"infra como codigo",vm:"maquina virtual",az:"zona",ram:"memoria",
  frontend:"front-end",backend:"back-end"};

/* onde procurar, com peso: achar no nome vale mais que achar no "se cair".
 * label null = nome ou subtítulo (já aparecem no resultado); "" = descrição, sem rótulo */
function fields(v, layer){
  const f=[[v.n,10,null],[v.t,4,null]];
  (v.tech||[]).forEach(t=>f.push([t,8,"Tecnologia"]));
  (v.inside||[]).forEach(([a,b])=>{f.push([a,6,"Por dentro"]); f.push([b,2,"Por dentro: "+a]);});
  f.push([v.what,2,""]);
  if(v.host) f.push([v.host,2,"Onde pode rodar"]);
  f.push([layer.n,3,"Camada"]);
  f.push([v.fail,1,"Se cair"]);
  return f.filter(x=>x[0]);
}

/* trecho curto em volta do termo, com o termo marcado por \u0001 ... \u0002 */
function snippet(text, at, len, room){
  room=room||60;
  let a=Math.max(0, at-room/2), b=Math.min(text.length, at+len+room);
  if(a>0) a=text.indexOf(" ", a)+1 || a;
  const out=text.slice(a, at)+"\u0001"+text.slice(at, at+len)+"\u0002"+text.slice(at+len, b);
  return (a>0?"… ":"")+out+(b<text.length?" …":"");
}

STRATA.searchNodes=function(style, layers, query){
  const terms=norm(query).split(/\s+/).filter(Boolean).map(t=>ALIASES[t]||t);
  if(!terms.length) return [];
  const results=[];
  Object.entries(style.nodes).forEach(([id,v])=>{
    const layer=layers.find(l=>l.id===v.l);
    const fs=fields(v, layer).map(([text,w,label])=>({text,w,label,n:norm(text)}));
    let score=0, best=null;
    for(const t of terms){
      let hit=null;
      for(const f of fs){
        const at=f.n.indexOf(t);
        if(at<0) continue;
        const starts=at===0||/[^a-z0-9]/.test(f.n[at-1]), ends=!/[a-z0-9]/.test(f.n[at+t.length]||"");
        const w=f.w*(starts?1.5:1)*(starts&&ends?1.4:1)+(f.n===t?5:0);
        if(!hit||w>hit.w) hit={f,at,w,len:t.length};
      }
      if(!hit) return;
      score+=hit.w;
      /* para o trecho, prefere o que achou fora do nome: é o que explica por que a peça apareceu */
      const ctx=h=>h.f.label!==null;
      if(!best||(ctx(hit)&&(!ctx(best)||hit.w>best.w))) best=hit;
    }
    const nameHit=norm(v.n).indexOf(terms[0]);
    results.push({
      id, score, layer,
      name:nameHit>=0 ? snippet(v.n, nameHit, terms[0].length, 999).replace(/^… | …$/g,"") : v.n,
      label:best.f.label||"",
      detail:best.f.label!==null ? snippet(best.f.text, best.at, best.len) : v.t
    });
  });
  return results.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
};
})();
