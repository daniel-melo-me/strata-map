/* Versiona os arquivos locais citados nas páginas HTML da raiz (index, glossário, professores):
 * cada src/href em assets/ ganha ?v=<hash do conteúdo>.
 * Assim o navegador nunca junta um HTML novo com JS ou CSS antigo depois de um deploy
 * (o GitHub Pages guarda tudo em cache por 10 minutos). Só os arquivos que mudaram trocam de versão.
 *   node tools/versionar.js           atualiza as páginas
 *   node tools/versionar.js --check   só confere; sai com código 1 se alguma versão estiver velha */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const REF = /((?:src|href)=")(assets\/[^"?#]+)(?:\?v=[0-9a-f]*)?(")/g;

const hashOf = file => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, file))).digest("hex").slice(0, 10);

/* devolve o html com as versões em dia e a lista do que mudou */
function versionar(html) {
  const changed = [];
  const out = html.replace(REF, (all, pre, file, post) => {
    if (!fs.existsSync(path.join(ROOT, file))) return all; /* o validador acusa o arquivo que falta */
    const next = `${pre}${file}?v=${hashOf(file)}${post}`;
    if (next !== all) changed.push(file);
    return next;
  });
  return { html: out, changed };
}

/* as páginas publicadas: todo .html da raiz */
const pages = () => fs.readdirSync(ROOT).filter(f => f.endsWith(".html")).sort();

module.exports = { versionar, pages };

if (require.main === module) {
  const check = process.argv.includes("--check");
  let stale = [];
  for (const page of pages()) {
    const file = path.join(ROOT, page);
    const { html, changed } = versionar(fs.readFileSync(file, "utf8"));
    if (!changed.length) continue;
    stale.push(`${page}: ${changed.join(", ")}`);
    if (!check) fs.writeFileSync(file, html);
  }
  if (check) {
    if (stale.length) { console.log("Versões desatualizadas:\n  " + stale.join("\n  ") + "\nRode: node tools/versionar.js"); process.exit(1); }
    console.log("Versões em dia.");
  } else console.log(stale.length ? "Versionados:\n  " + stale.join("\n  ") : "Nada mudou.");
}
