// Écrit le champ `cible` dans content/roadmaps/*.json pour les paliers VALIDÉS par l'auteur dans reports/paliers-grille.json
// (case de bloc ou exception portant "valide": true). Rien d'autre n'est modifié ; un palier non validé n'est jamais écrit.
// Usage : node scripts/appliquer-paliers.mjs [--ecrire]   (sans --ecrire : simple compte rendu)
import fs from "node:fs";
import path from "node:path";

const racine = path.resolve(import.meta.dirname, "..");
const ecrire = process.argv.includes("--ecrire");
const grille = JSON.parse(fs.readFileSync(path.join(racine, "reports", "paliers-grille.json"), "utf8"));
let poses = 0, ignores = 0;

for (const [id, g] of Object.entries(grille.roadmaps)) {
  const fichier = path.join(racine, "content", "roadmaps", `${id}.json`);
  const texte = fs.readFileSync(fichier, "utf8");
  const roadmap = JSON.parse(texte);
  for (const n of roadmap.noeuds) {
    const src = g.exceptions?.[n.id] ?? g.blocs[n.bloc];
    if (src?.valide === true) {
      if (n.cible !== src.palier) { n.cible = src.palier; poses++; }
    } else {
      ignores++;
    }
  }
  if (ecrire) fs.writeFileSync(fichier, JSON.stringify(roadmap, null, 2) + (texte.endsWith("\n") ? "\n" : ""));
}
console.log(`${poses} palier(s) validé(s) à écrire, ${ignores} nœud(s) sans validation (ignorés)${ecrire ? " : écrit." : " : simulation, rien écrit."}`);
