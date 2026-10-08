/* Modo falha: calcula quem para, degrada, congela ou segura o tranco quando uma peça cai.
 * Função pura sobre os dados do estilo (style.failure); o desenho fica em app.js. */
window.STRATA = window.STRATA || { styles: {} };

STRATA.simulateFailure=function(style, root, redundancy){
  const N=style.nodes, {deps, guards}=style.failure;
  const RANK={down:5, stop:4, hold:3, degr:2, frozen:1};
  const out={}, prop={};
  const queue=[];
  function mark(id, s, cause, why, wave, propagateAs){
    const cur=out[id];
    if(!cur || RANK[s]>RANK[cur.s]) out[id]={s, cause, why, wave};
    const p=propagateAs||s;
    if((p==="stop"||p==="degr") && RANK[p]>(RANK[prop[id]]||0)){ prop[id]=p; queue.push(id); }
  }

  out[root]={s:"down", wave:0};
  const guard=redundancy && guards[root];
  if(guard && guard[2]==="nada"){
    if(guard[0]) out[guard[0]]={s:"hold", cause:root, why:guard[1], wave:1};
    return finish();
  }
  if(guard){
    if(guard[0]) out[guard[0]]={s:"hold", cause:root, why:guard[1], wave:1};
    prop[root]="degr";
  }else prop[root]="stop";
  queue.push(root);

  while(queue.length){
    const x=queue.shift(), px=prop[x], w=out[x].wave+1;
    deps.forEach(([a, b, eff, why, onlyRoot])=>{
      if(b!==x || a===root || (onlyRoot && x!==root)) return;
      const held=out[a] && out[a].s==="hold";
      if(px==="stop"){
        if(eff==="para") mark(a, "stop", x, why, w);
        else if(eff==="degrada"||eff==="fila") mark(a, "degr", x, why, w);
        else if(eff==="muda") mark(a, "frozen", x, why, w);
      }else if(eff==="para"||eff==="degrada"){
        const reason=x===root&&guard ? `sente a queda até ${N[x].n} se recuperar` : `sente as falhas ou a lentidão de ${N[x].n}`;
        if(held) mark(a, "hold", x, out[a].why, out[a].wave, "degr");
        else mark(a, "degr", x, reason, w);
      }
    });
    /* fila: se o consumidor parou, quem guarda os eventos é a fila */
    if(px==="stop") deps.forEach(([a, b, eff])=>{
      if(a===x && eff==="fila" && !out[b]) mark(b, "hold", x, `guarda o que não foi entregue até ${N[x].n} voltar`, w);
    });
  }
  return finish();

  function finish(){
    const u=out.usuario ? out.usuario.s : null;
    return {nodes:out, guard:guard||null, user:u==="down"||u==="stop" ? "stop" : u==="degr" ? "degr" : "ok"};
  }
};
