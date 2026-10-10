/* Versiona os arquivos locais citados no index.html: cada src/href em assets/ ganha ?v=<hash do conteúdo>.
 * Assim o navegador nunca junta um HTML novo com JS ou CSS antigo depois de um deploy
 * (o GitHub Pages guarda tudo em cache por 10 minutos). Só os arquivos que mudaram trocam de versão.
 *   node tools/versionar.js           atualiza o index.html
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

module.exports = { versionar };

if (require.main === module) {
  const file = path.join(ROOT, "index.html");
  const { html, changed } = versionar(fs.readFileSync(file, "utf8"));
  if (process.argv.includes("--check")) {
    if (changed.length) { console.log("Versões desatualizadas no index.html: " + changed.join(", ") + "\nRode: node tools/versionar.js"); process.exit(1); }
    console.log("Versões em dia.");
  } else {
    fs.writeFileSync(file, html);
    console.log(changed.length ? "Versionados: " + changed.join(", ") : "Nada mudou.");
  }
}
