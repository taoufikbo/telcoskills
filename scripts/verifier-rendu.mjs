// Vérifie, après `next build` de l'instance publique, que chaque page de compétence contient son texte dans le HTML
// servi (et non seulement dans le JavaScript), ainsi qu'une balise canonical et des données structurées.
// Usage : NEXT_PUBLIC_INSTANCE=public node node_modules/next/dist/bin/next build && node scripts/verifier-rendu.mjs
import fs from "node:fs";
import path from "node:path";

const racine = path.resolve(import.meta.dirname, "..");
const app = path.join(racine, ".next", "server", "app", "ressources", "roadmaps");
if (!fs.existsSync(app)) {
  console.error("Aucune page générée : lancer d'abord le build avec NEXT_PUBLIC_INSTANCE=public.");
  process.exit(1);
}

const decoder = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
const texte = (html) => decoder(html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");

const dossier = path.join(racine, "content", "roadmaps");
let verifiees = 0;
const echecs = [];
for (const f of fs.readdirSync(dossier).filter((x) => x.endsWith(".json"))) {
  const r = JSON.parse(fs.readFileSync(path.join(dossier, f), "utf8"));
  for (const n of r.noeuds) {
    const fichier = path.join(app, r.id, `${n.id}.html`);
    if (!fs.existsSync(fichier)) {
      echecs.push(`${r.id}/${n.id} : page absente`);
      continue;
    }
    const html = fs.readFileSync(fichier, "utf8");
    const t = texte(html);
    const manques = [];
    if (!t.includes(n.titre)) manques.push("titre");
    if (!t.includes(n.resume.slice(0, 40))) manques.push("résumé");
    if (!/<link rel="canonical" href="[^"]+"/.test(html)) manques.push("canonical");
    if (!html.includes('"@type":"LearningResource"')) manques.push("JSON-LD");
    if (!/<h1[^>]*>/.test(html)) manques.push("h1");
    for (const x of n.ressources.filter((y) => y.url)) if (!html.includes(x.url.replace(/&/g, "&amp;"))) manques.push(`lien ${x.url}`);
    verifiees++;
    if (manques.length) echecs.push(`${r.id}/${n.id} : manque ${manques.join(", ")}`);
  }
}
console.log(`${verifiees} pages de compétence vérifiées, ${echecs.length} en échec.`);
for (const e of echecs.slice(0, 40)) console.log(`  - ${e}`);
process.exit(echecs.length ? 1 : 0);
