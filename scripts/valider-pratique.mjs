// Marque « valide » les contenus de pratique (content/pratique/*.json) que l'auteur a relus.
// Usage : node scripts/valider-pratique.mjs [--ecrire] [identifiant-de-noeud ...]
//   sans identifiant : tous les contenus ; sans --ecrire : simple compte rendu, rien n'est écrit.
// Un contenu « brouillon » n'atteint jamais un visiteur : tout build de production le retire (src/lib/pratique.ts).
import fs from "node:fs";
import path from "node:path";

const racine = path.resolve(import.meta.dirname, "..");
const dossier = path.join(racine, "content", "pratique");
const args = process.argv.slice(2);
const ecrire = args.includes("--ecrire");
const ids = args.filter((a) => !a.startsWith("--"));
let sections = 0;
let fichiers = 0;

for (const f of fs.readdirSync(dossier).filter((x) => x.endsWith(".json")).sort()) {
  const id = f.replace(/\.json$/, "");
  if (ids.length > 0 && !ids.includes(id)) continue;
  const texte = fs.readFileSync(path.join(dossier, f), "utf8");
  const p = JSON.parse(texte);
  let n = 0;
  for (const s of [p.questionPrealable, p.fiche, p.contenu, p.pourquoi, ...(p.rappel ?? [])]) {
    if (s && s.statut !== "valide") {
      s.statut = "valide";
      n++;
    }
  }
  if (n === 0) continue;
  fichiers++;
  sections += n;
  console.log(`${id} : ${n} section(s) à valider`);
  if (ecrire) fs.writeFileSync(path.join(dossier, f), JSON.stringify(p, null, 2) + (texte.endsWith("\n") ? "\n" : ""));
}
console.log(`${sections} section(s) dans ${fichiers} fichier(s)${ecrire ? " : marquées valides." : " : simulation, rien écrit."}`);
