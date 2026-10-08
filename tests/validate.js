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

/* ---------- index.html: arquivos locais e ordem dos scripts ---------- */
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const refs = [
  ...scripts,
  ...[...html.matchAll(/<link [^>]*href="([^"]+)"/g)].map(m => m[1]),
  ...[...html.matchAll(/content="https:\/\/strata\.dancode\.com\.br\/([^"]+)"/g)].map(m => m[1])
].filter(r => !/^(https?:)?\/\//.test(r));
for (const r of refs) if (!fs.existsSync(path.join(ROOT, r))) err(`index.html cita ${r}, que não existe`);

const ORDER = ["data/base.js", "data/microsservicos.js", "data/monolito.js", "data/zoom.js", "failure.js", "search.js", "app.js"];
const pos = ORDER.map(f => scripts.findIndex(s => s.endsWith(f)));
pos.forEach((p, i) => { if (p < 0) err(`index.html não carrega ${ORDER[i]}`); });
for (let i = 1; i < pos.length; i++)
  if (pos[i] >= 0 && pos[i - 1] >= 0 && pos[i] < pos[i - 1]) err(`index.html carrega ${ORDER[i]} antes de ${ORDER[i - 1]}`);

/* ---------- carrega os dados como o navegador carrega ---------- */
global.window = global;
for (const f of ORDER.slice(0, 6)) require(path.join(ROOT, "assets/js", f));
const { layers, personas, axes, styles, zoom, simulateFailure, searchNodes, searchZoom } = global.STRATA;

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
    if (v.tech && (!Array.isArray(v.tech) || !v.tech.every(isStr))) err(`${p}: "tech" inválido`);
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

/* ---------- zoom dentro do zoom ---------- */
const isEx = ex => ex === undefined || (Array.isArray(ex) && ex.length === 2 && ex.every(isStr));
function checkLevel(z, p, depth) {
  if (!isStr(z.what)) err(`${p}: sem "what"`);
  if (!isEx(z.ex)) err(`${p}: "ex" deve ser [rótulo, código]`);
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
  `${sid}: ${Object.keys(s.nodes).length} peças, ${s.edges.length} conexões, ${s.journey.length} passos, ${s.failure ? s.failure.deps.length : 0} dependências`).join("\n  ");
console.log(`Strata Map\n  ${summary}\n  zoom: ${covered} de ${items} itens`);
warnings.forEach(w => console.log("aviso: " + w));
errors.forEach(e => console.log("ERRO: " + e));
if (errors.size) { console.log(`\n${errors.size} erro(s).`); process.exit(1); }
console.log(`\nTudo certo${warnings.size ? `, com ${warnings.size} aviso(s)` : ""}.`);
