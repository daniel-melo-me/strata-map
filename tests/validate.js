/* Validação do conteúdo do Strata Map. Roda sem dependências: node tests/validate.js
 * Confere se peças, conexões, jornadas, modo falha, zoom e busca se referenciam corretamente,
 * e se os arquivos citados no index.html existem. Sai com código 1 se houver erro. */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
/* Set: a mesma falha pode aparecer duas vezes (peça reaproveitada entre estilos, arquivo citado em duas tags) */
const errors = new Set(), warnings = new Set();
const err = m => errors.add(m), warn = m => warnings.add(m);
const isStr = s => typeof s === "string" && s.trim().length > 0;
/* fontes: [[rótulo, url https], ...] */
const checkRefs = (refs, p) => {
  if (refs === undefined) return;
  if (!Array.isArray(refs) || !refs.length) return err(`${p}: "refs" deve ser uma lista não vazia`);
  refs.forEach((r, i) => {
    if (!Array.isArray(r) || r.length !== 2 || !isStr(r[0])) err(`${p}: fonte ${i} deve ser [rótulo, url]`);
    else if (!/^https:\/\/[^\s"<>]+$/.test(r[1])) err(`${p}: fonte ${i} com url inválida (${r[1]})`);
  });
};

/* ---------- páginas: arquivos locais, versões e ordem dos scripts ---------- */
/* sem o ?v= de versão (tools/versionar.js) */
const noQuery = u => u.replace(/[?#].*$/, "");
const { versionar, pages } = require(path.join(ROOT, "tools/versionar.js"));
const PAGES = Object.fromEntries(pages().map(f => [f, fs.readFileSync(path.join(ROOT, f), "utf8")]));
for (const [page, src] of Object.entries(PAGES)) {
  const refs = [
    ...[...src.matchAll(/<script src="([^"]+)"/g)].map(m => noQuery(m[1])),
    ...[...src.matchAll(/<link [^>]*href="([^"]+)"/g)].map(m => noQuery(m[1])),
    ...[...src.matchAll(/content="https:\/\/strata\.dancode\.com\.br\/([^"]+)"/g)].map(m => m[1]),
    ...[...src.matchAll(/<a [^>]*href="([^"#?:]+\.html)[^"]*"/g)].map(m => m[1])
  ].filter(r => !/^(https?:)?\/\//.test(r));
  for (const r of refs) if (!fs.existsSync(path.join(ROOT, r))) err(`${page} cita ${r}, que não existe`);
  /* cada arquivo local precisa da versão do conteúdo atual, senão o cache mistura versões depois do deploy */
  const stale = versionar(src).changed;
  if (stale.length) err(`${page} com versão desatualizada de ${stale.join(", ")}: rode node tools/versionar.js`);
}
const html = PAGES["index.html"];
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => noQuery(m[1]));

const ORDER = ["data/base.js", "data/microsservicos.js", "data/monolito.js", "data/serverless.js", "data/niveis.js", "data/glossario.js", "data/zoom.js", "failure.js", "search.js", "app.js"];
const pos = ORDER.map(f => scripts.findIndex(s => s.endsWith(f)));
pos.forEach((p, i) => { if (p < 0) err(`index.html não carrega ${ORDER[i]}`); });
for (let i = 1; i < pos.length; i++)
  if (pos[i] >= 0 && pos[i - 1] >= 0 && pos[i] < pos[i - 1]) err(`index.html carrega ${ORDER[i]} antes de ${ORDER[i - 1]}`);

/* ---------- carrega os dados como o navegador carrega ---------- */
global.window = global;
for (const f of ORDER.slice(0, 9)) require(path.join(ROOT, "assets/js", f));
const { layers, personas, axes, styles, zoom, levels, glossary, simulateFailure, searchNodes, searchZoom } = global.STRATA;

const layerIds = new Set(layers.map(l => l.id));
if (layerIds.size !== layers.length) err("há camadas com id repetido");
layers.forEach(l => { if (!isStr(l.n) || !isStr(l.q)) err(`camada ${l.id} sem nome ou descrição`); });

const EDGE_TYPES = new Set(["net", "sync", "async", "run", "mem"]);
const EFFECTS = new Set(["para", "degrada", "fila", "muda"]);
const GUARD_EFFECTS = new Set(["nada", "degrada"]);

/* ---------- cada estilo ---------- */
for (const [sid, st] of Object.entries(styles)) {
  const N = st.nodes, at = `[${sid}]`;
  if (!isStr(st.name)) err(`${at} estilo sem nome`);
  if (!isStr(st.desc)) warn(`${at} estilo sem descrição`);

  for (const [id, v] of Object.entries(N)) {
    const p = `${at} peça ${id}`;
    if (!/^[a-z][a-z0-9]*$/.test(id)) err(`${p}: o id deve começar com letra e ter só letras minúsculas e números (vai no link)`);
    if (!layerIds.has(v.l)) err(`${p}: camada "${v.l}" não existe`);
    for (const k of ["n", "t", "what", "fail"]) if (!isStr(v[k])) err(`${p}: campo "${k}" vazio`);
    if (!Array.isArray(v.inside) || !v.inside.length) err(`${p}: "inside" vazio`);
    else v.inside.forEach((x, i) => { if (!isStr(x[0]) || !isStr(x[1])) err(`${p}: item ${i} do "inside" incompleto`); });
    const names = (v.inside || []).map(x => x[0]);
    if (new Set(names).size !== names.length) err(`${p}: itens do "inside" com nome repetido`);
    if (!Array.isArray(v.who) || !v.who.length) err(`${p}: sem "who"`);
    (v.who || []).forEach(w => { if (!personas[w]) err(`${p}: persona "${w}" não existe`); });
    Object.keys(v.ax || {}).forEach(k => { if (!axes[k]) err(`${p}: eixo "${k}" não existe`); });
    /* quem cuida precisa bater com os eixos: peça marcada com segurança tem Segurança da informação */
    if (v.ax && v.ax.seg && !(v.who || []).includes("si")) err(`${p}: tem o eixo de segurança, mas Segurança da informação não está em "who"`);
    if (v.tech && (!Array.isArray(v.tech) || !v.tech.every(isStr))) err(`${p}: "tech" inválido`);
    checkRefs(v.refs, p);
  }

  const seen = new Set();
  st.edges.forEach(([a, b, type, label], i) => {
    const p = `${at} conexão ${i} (${a} → ${b})`;
    if (!N[a]) err(`${p}: origem não existe`);
    if (!N[b]) err(`${p}: destino não existe`);
    if (!EDGE_TYPES.has(type)) err(`${p}: tipo "${type}" inválido`);
    if (!isStr(label)) err(`${p}: sem rótulo`);
    const key = [a, b, type].join("|");
    if (seen.has(key)) warn(`${p}: repetida`); seen.add(key);
  });
  const linked = new Set(st.edges.flatMap(e => [e[0], e[1]]));
  Object.keys(N).forEach(id => { if (!linked.has(id)) warn(`${at} peça ${id} não tem nenhuma conexão`); });

  st.journey.forEach(([a, b, text, ms], i) => {
    const p = `${at} passo ${i + 1} da jornada`;
    if (!N[a] || !N[b]) err(`${p}: peça ${!N[a] ? a : b} não existe`);
    if (!isStr(text)) err(`${p}: sem narração`);
    if (typeof ms !== "number" || ms < 0) err(`${p}: milissegundos inválidos`);
  });

  /* história da Ana: mesmas peças, mesma soma de milissegundos da jornada, rota por linhas que existem */
  if (st.tour) {
    const hasEdge = (a, b) => st.edges.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
    st.tour.forEach(([a, b, text, ms, extra], i) => {
      const p = `${at} passo ${i + 1} da história da Ana`;
      if (!N[a] || !N[b]) err(`${p}: peça ${!N[a] ? a : b} não existe`);
      if (!isStr(text)) err(`${p}: sem narração`);
      if (typeof ms !== "number" || ms < 0) err(`${p}: milissegundos inválidos`);
      if (extra === undefined) return;
      if (extra.via !== undefined && (!Array.isArray(extra.via) || !extra.via.every(v => N[v]))) err(`${p}: "via" com peça que não existe`);
      const route = [a, ...(extra.via || []), b];
      for (let k = 0; k < route.length - 1; k++)
        if (N[route[k]] && N[route[k + 1]] && !hasEdge(route[k], route[k + 1])) warn(`${p}: ${route[k]} → ${route[k + 1]} sem linha no mapa (o pacote vai reto)`);
      if (extra.p !== undefined) {
        if (!isStr(extra.p) || !isStr(extra.why)) err(`${p}: pergunta sem enunciado ou explicação`);
        if (!Array.isArray(extra.o) || extra.o.length !== 3 || !extra.o.every(isStr)) err(`${p}: a pergunta precisa de 3 opções`);
        if (!Number.isInteger(extra.c) || extra.c < 0 || extra.c > 2) err(`${p}: índice da resposta certa inválido`);
      }
    });
    const sum = l => l.reduce((x, s) => x + s[3], 0);
    if (sum(st.tour) !== sum(st.journey)) err(`${at} a história da Ana soma ${sum(st.tour)} ms e a jornada ${sum(st.journey)} ms`);
  } else warn(`${at} sem história da Ana (tour)`);

  /* explicação em níveis: toda peça precisa de frase e analogia */
  for (const id of Object.keys(N)) {
    const lv = (levels[sid] && levels[sid][id]) || levels.base[id];
    if (!lv) err(`${at} peça ${id} sem explicação em níveis (data/niveis.js)`);
    else if (!Array.isArray(lv) || lv.length !== 2 || !lv.every(isStr)) err(`${at} níveis de ${id}: deve ser [frase, analogia]`);
  }

  const f = st.failure;
  if (f) {
    f.deps.forEach(([a, b, eff, why, extra], i) => {
      const p = `${at} dependência ${i} (${a} ← ${b})`;
      if (!N[a]) err(`${p}: dependente não existe`);
      if (!N[b]) err(`${p}: dependência não existe`);
      if (!EFFECTS.has(eff)) err(`${p}: efeito "${eff}" inválido`);
      if (!isStr(why)) err(`${p}: sem motivo`);
      if (extra !== undefined && extra !== "raiz") err(`${p}: 5º campo deve ser "raiz"`);
    });
    for (const [id, g] of Object.entries(f.guards || {})) {
      if (!N[id]) err(`${at} redundância de ${id}: peça não existe`);
      if (g[0] !== null && !N[g[0]]) err(`${at} redundância de ${id}: quem segura (${g[0]}) não existe`);
      if (!isStr(g[1])) err(`${at} redundância de ${id}: sem texto`);
      if (!GUARD_EFFECTS.has(g[2])) err(`${at} redundância de ${id}: efeito "${g[2]}" inválido`);
    }
    (f.samples || []).forEach(id => { if (!N[id]) err(`${at} sugestão de queda ${id} não existe`); });

    for (const id of Object.keys(N)) for (const red of [true, false]) {
      try {
        const r = simulateFailure(st, id, red);
        if (!["stop", "degr", "ok"].includes(r.user)) err(`${at} queda de ${id}: veredito "${r.user}" inválido`);
        for (const [k, x] of Object.entries(r.nodes)) {
          if (!N[k]) err(`${at} queda de ${id}: marcou ${k}, que não existe`);
          if (k !== id && !isStr(x.why)) err(`${at} queda de ${id}: ${k} sem motivo`);
        }
      } catch (e) { err(`${at} queda de ${id} (redundância ${red}): ${e.message}`); }
    }
  } else warn(`${at} sem modo falha`);

  /* busca: cada peça precisa aparecer em primeiro ao buscar o próprio nome */
  for (const [id, v] of Object.entries(N)) {
    try {
      const r = searchNodes(st, layers, v.n);
      if (!r.length || r[0].id !== id) warn(`${at} buscar "${v.n}" não traz ${id} em primeiro`);
    } catch (e) { err(`${at} busca por "${v.n}": ${e.message}`); }
  }
  try { searchZoom(st, layers, zoom, "banco"); } catch (e) { err(`${at} busca no zoom: ${e.message}`); }
}

/* ---------- níveis sem peça ---------- */
for (const [scope, map] of Object.entries(levels)) for (const id of Object.keys(map)) {
  const owners = scope === "base" ? Object.values(styles) : styles[scope] ? [styles[scope]] : [];
  if (scope !== "base" && !styles[scope]) err(`níveis: estilo "${scope}" não existe`);
  else if (!owners.some(s => s.nodes[id])) err(`níveis ${scope} › ${id}: peça não existe`);
}

/* ---------- glossário ---------- */
const forms = new Map();
for (const [gid, g] of Object.entries(glossary)) {
  const p = `glossário ${gid}`;
  if (!/^[a-z][a-z0-9]*$/.test(gid)) err(`${p}: id deve ter só letras minúsculas e números (vai no link)`);
  if (!isStr(g.t) || !isStr(g.d)) err(`${p}: termo ou definição vazios`);
  if (g.alt !== undefined && (!Array.isArray(g.alt) || !g.alt.every(isStr))) err(`${p}: "alt" inválido`);
  if (g.node !== undefined && !Object.values(styles).some(s => s.nodes[g.node])) err(`${p}: peça ${g.node} não existe em nenhum estilo`);
  for (const f of [g.t, ...(g.alt || [])]) {
    const k = f.toLowerCase();
    if (forms.has(k)) err(`${p}: a forma "${f}" já é de ${forms.get(k)}`); else forms.set(k, gid);
  }
}

/* ---------- links para o mapa nas páginas de apoio (professores, glossário) ---------- */
for (const [page, src] of Object.entries(PAGES)) {
  if (page === "index.html") continue;
  for (const m of src.matchAll(/href="index\.html\?([^"#]*)(?:#([^"]*))?"/g)) {
    const q = new URLSearchParams(m[1].replace(/&amp;/g, "&")), hash = m[2] || "", link = `${page}: index.html?${m[1]}${hash ? "#" + hash : ""}`;
    const sid = q.get("estilo"), st = styles[sid];
    if (q.has("estilo") && !st) { err(`${link}: estilo "${sid}" não existe`); continue; }
    if (q.has("papel") && !personas[q.get("papel")]) err(`${link}: papel "${q.get("papel")}" não existe`);
    const N = (st || styles[Object.keys(styles)[0]]).nodes;
    if (!hash) continue;
    const zm = hash.match(/^zoom-([a-z][a-z0-9]*)((?:-\d+){0,2})$/);
    if (zm) {
      const [id, ...ix] = [zm[1], ...zm[2].split("-").filter(Boolean).map(Number)];
      const v = N[id], l2 = v && ix.length ? zoom[id] && zoom[id][(v.inside[ix[0]] || [])[0]] : v;
      if (!v || (ix.length && !l2) || (ix.length > 1 && !(l2.kids[ix[1]] && l2.kids[ix[1]][2]))) err(`${link}: zoom não existe`);
    } else {
      const id = hash.replace(/^falha-/, "");
      if (!N[id]) err(`${link}: peça ${id} não existe nesse estilo`);
      if (hash.startsWith("falha-") && !(st || {}).failure) err(`${link}: estilo sem modo falha`);
    }
  }
}

/* ---------- zoom dentro do zoom ---------- */
const isEx = ex => ex === undefined || (Array.isArray(ex) && ex.length === 2 && ex.every(isStr));
function checkLevel(z, p, depth) {
  if (!isStr(z.what)) err(`${p}: sem "what"`);
  if (!isEx(z.ex)) err(`${p}: "ex" deve ser [rótulo, código]`);
  checkRefs(z.refs, p);
  if (!Array.isArray(z.kids) || !z.kids.length) { err(`${p}: sem cartões`); return; }
  z.kids.forEach(([n, t, sub], i) => {
    if (!isStr(n) || !isStr(t)) err(`${p}: cartão ${i} incompleto`);
    if (sub) {
      if (depth >= 3) err(`${p} › ${n}: passa de 3 níveis`);
      else checkLevel(sub, `${p} › ${n}`, depth + 1);
    }
  });
}
let items = 0, covered = 0;
for (const [id, z] of Object.entries(zoom)) {
  const owners = Object.entries(styles).filter(([, s]) => s.nodes[id]);
  if (!owners.length) { err(`zoom de ${id}: peça não existe em nenhum estilo`); continue; }
  for (const [name, level] of Object.entries(z)) {
    if (!owners.some(([, s]) => (s.nodes[id].inside || []).some(x => x[0] === name)))
      err(`zoom ${id} › ${name}: nenhum item do "inside" tem esse nome`);
    checkLevel(level, `zoom ${id} › ${name}`, 2);
  }
}
for (const [sid, st] of Object.entries(styles)) for (const [id, v] of Object.entries(st.nodes))
  for (const [name] of v.inside || []) {
    items++;
    if (zoom[id] && zoom[id][name]) covered++;
    else warn(`[${sid}] ${id} › ${name} ainda não tem zoom`);
  }

/* ---------- resultado ---------- */
const summary = Object.entries(styles).map(([sid, s]) =>
  `${sid}: ${Object.keys(s.nodes).length} peças, ${s.edges.length} conexões, ${s.journey.length} passos (Ana: ${s.tour ? s.tour.length : 0}, ${s.tour ? s.tour.filter(t => t[4] && t[4].p).length : 0} perguntas), ${s.failure ? s.failure.deps.length : 0} dependências`).join("\n  ");
console.log(`Strata Map\n  ${summary}\n  zoom: ${covered} de ${items} itens\n  glossário: ${Object.keys(glossary).length} termos; páginas: ${Object.keys(PAGES).join(", ")}`);
warnings.forEach(w => console.log("aviso: " + w));
errors.forEach(e => console.log("ERRO: " + e));
if (errors.size) { console.log(`\n${errors.size} erro(s).`); process.exit(1); }
console.log(`\nTudo certo${warnings.size ? `, com ${warnings.size} aviso(s)` : ""}.`);
