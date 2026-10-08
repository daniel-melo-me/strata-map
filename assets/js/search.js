/* Busca rápida: procura peças por nome, tecnologia, conteúdo e camada, e também
 * os cartões do zoom dentro do zoom. Funções puras sobre os dados; a caixa de busca fica em app.js. */
window.STRATA = window.STRATA || { styles: {} };

(function(){
/* sem acento e em minúsculas, caractere a caractere, para achar e grifar no texto original */
const fold=c=>c.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const norm=s=>[...s].map(fold).join("");

/* apelidos comuns que não aparecem no texto das peças */
const ALIASES={k8s:"kubernetes",db:"banco",bd:"banco",lb:"balanceador",mq:"fila",auth:"autenticacao",
  ci:"pipeline",cd:"pipeline",iac:"infra como codigo",vm:"maquina virtual",az:"zona",ram:"memoria",
  frontend:"front-end",backend:"back-end"};

const termsOf=q=>norm(q).split(/\s+/).filter(Boolean).map(t=>ALIASES[t]||t);

/* onde procurar numa peça, com peso: achar no nome vale mais que achar no "se cair".
 * label null = nome ou subtítulo (já aparecem no resultado); "" = descrição, sem rótulo */
function nodeFields(v, layer){
  const f=[[v.n,10,null],[v.t,4,null]];
  (v.tech||[]).forEach(t=>f.push([t,8,"Tecnologia"]));
  (v.inside||[]).forEach(([a,b])=>{f.push([a,6,"Por dentro"]); f.push([b,2,"Por dentro: "+a]);});
  f.push([v.what,2,""]);
  if(v.host) f.push([v.host,2,"Onde pode rodar"]);
  f.push([layer.n,3,"Camada"]);
  f.push([v.fail,1,"Se cair"]);
  return f;
}

/* trecho curto em volta do termo, com o termo marcado por \u0001 ... \u0002 */
function snippet(text, at, len, room){
  room=room||60;
  let a=Math.max(0, at-room/2), b=Math.min(text.length, at+len+room);
  if(a>0) a=text.indexOf(" ", a)+1 || a;
  const out=text.slice(a, at)+"\u0001"+text.slice(at, at+len)+"\u0002"+text.slice(at+len, b);
  return (a>0?"… ":"")+out+(b<text.length?" …":"");
}
const markName=(name, terms)=>{
  const at=norm(name).indexOf(terms[0]);
  return at>=0 ? snippet(name, at, terms[0].length, 999).replace(/^… | …$/g,"") : name;
};

/* todos os termos precisam aparecer em algum campo; devolve a pontuação e o melhor trecho */
function match(fields, terms){
  const fs=fields.filter(x=>x[0]).map(([text,w,label])=>({text,w,label,n:norm(text)}));
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
    if(!hit) return null;
    score+=hit.w;
    /* para o trecho, prefere o que achou fora do nome: é o que explica por que o resultado apareceu */
    const ctx=h=>h.f.label!==null;
    if(!best||(ctx(hit)&&(!ctx(best)||hit.w>best.w))) best=hit;
  }
  return {score, best};
}
const sorted=r=>r.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));

STRATA.searchNodes=function(style, layers, query){
  const terms=termsOf(query); if(!terms.length) return [];
  const results=[];
  Object.entries(style.nodes).forEach(([id,v])=>{
    const layer=layers.find(l=>l.id===v.l), m=match(nodeFields(v, layer), terms);
    if(!m) return;
    results.push({kind:"node", id, score:m.score, layer, name:markName(v.n, terms),
      label:m.best.f.label||"",
      detail:m.best.f.label!==null ? snippet(m.best.f.text, m.best.at, m.best.len) : v.t});
  });
  return sorted(results);
};

/* Cartões do zoom. path é o nível que mostra o cartão; hl é o cartão a destacar nele. */
STRATA.searchZoom=function(style, layers, zoom, query){
  const terms=termsOf(query); if(!terms.length||!zoom) return [];
  const results=[];
  const exFields=ex=>ex?[[ex[0],2,"Exemplo"],[ex[1],2,"Exemplo"]]:[];
  function add(id, v, layer, path, hl, crumbs, name, text, fields){
    const m=match(fields, terms); if(!m) return;
    results.push({kind:"zoom", id, path, hl, crumbs, score:m.score, layer, name:markName(name, terms),
      label:m.best.f.label||"",
      detail:m.best.f.label!==null ? snippet(m.best.f.text, m.best.at, m.best.len) : text});
  }
  Object.entries(style.nodes).forEach(([id,v])=>{
    const z=zoom[id]; if(!z) return;
    const layer=layers.find(l=>l.id===v.l);
    (v.inside||[]).forEach(([item],i1)=>{
      const l2=z[item]; if(!l2) return;
      add(id, v, layer, [id,i1], null, [v.n], item, l2.what, [[item,8,null],[l2.what,3,""],...exFields(l2.ex)]);
      l2.kids.forEach(([kn,kt,sub],i2)=>{
        add(id, v, layer, sub?[id,i1,i2]:[id,i1], sub?null:kn, [v.n,item], kn, kt,
          [[kn,9,null],[kt,3,""],...(sub?[[sub.what,3,""],...exFields(sub.ex)]:[])]);
        if(sub) sub.kids.forEach(([ln,lt])=>
          add(id, v, layer, [id,i1,i2], ln, [v.n,item,kn], ln, lt, [[ln,9,null],[lt,3,""]]));
      });
    });
  });
  return sorted(results);
};
})();
