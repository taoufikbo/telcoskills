// Vérifie, après `next build`, que les pages roadmap et projet contiennent leur contenu **dans le HTML visible** (hors scripts),
// c'est-à-dire sans exécuter de JavaScript : ce que voit curl, un moteur de recherche ou une personne sans JavaScript.
// Les données JSON embarquées dans les balises <script> ne comptent pas : c'est l'erreur qui avait fait croire, à tort,
// que ces pages étaient rendues côté serveur (voir reports/rendu-serveur.md).
// Usage : node node_modules/next/dist/bin/next build && node scripts/verifier-rendu-pages.mjs
// (pour l'instance publique : NEXT_PUBLIC_INSTANCE=public pour le build ; le script détecte les pages présentes)
import fs from "node:fs";
import path from "node:path";

const racine = path.resolve(import.meta.dirname, "..");
const app = path.join(racine, ".next", "server", "app");
const decoder = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
const visible = (html) => decoder(html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");

const echecs = [];
let pages = 0;

// Roadmaps : tous les titres de compétence et leurs résumés
for (const f of fs.readdirSync(path.join(racine, "content", "roadmaps")).filter((x) => x.endsWith(".json"))) {
  const r = JSON.parse(fs.readFileSync(path.join(racine, "content", "roadmaps", f), "utf8"));
  const candidats = [path.join(app, `${r.id}.html`), path.join(app, "ressources", "roadmaps", `${r.id}.html`)];
  const fichier = candidats.find((c) => fs.existsSync(c));
  if (!fichier) continue;
  pages++;
  const t = visible(fs.readFileSync(fichier, "utf8"));
  const sans = r.noeuds.filter((n) => !t.includes(n.titre) || !t.includes(n.resume.slice(0, 40)));
  if (!t.includes(r.titre)) echecs.push(`${r.id} : titre absent`);
  if (sans.length) echecs.push(`${r.id} : ${sans.length}/${r.noeuds.length} compétences absentes du HTML visible (ex. « ${sans[0].titre} »)`);
}

// Projet fil rouge : titre, rôles, phases
for (const f of fs.readdirSync(path.join(racine, "content", "projets")).filter((x) => x.endsWith(".json"))) {
  const p = JSON.parse(fs.readFileSync(path.join(racine, "content", "projets", f), "utf8"));
  const candidats = [path.join(app, "projets", `${p.id}.html`), path.join(app, "ressources", "projet-fil-rouge.html")];
  const fichier = candidats.find((c) => fs.existsSync(c));
  if (!fichier) continue;
  pages++;
  const t = visible(fs.readFileSync(fichier, "utf8"));
  const phases = p.phases.filter((x) => !t.includes(x.titre));
  const roles = p.roles.filter((x) => !t.includes(x.libelle));
  if (!t.includes(p.titre)) echecs.push(`${p.id} : titre absent`);
  if (phases.length) echecs.push(`${p.id} : ${phases.length}/${p.phases.length} phases absentes du HTML visible`);
  if (roles.length) echecs.push(`${p.id} : ${roles.length}/${p.roles.length} rôles absents du HTML visible`);
}

console.log(`${pages} pages vérifiées (roadmaps et projet), ${echecs.length} en échec.`);
for (const e of echecs) console.log(`  - ${e}`);
if (pages === 0) {
  console.error("Aucune page trouvée : lancer d'abord `next build`.");
  process.exit(1);
}
process.exit(echecs.length ? 1 : 0);
