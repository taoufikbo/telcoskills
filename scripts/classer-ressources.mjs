// Pose le champ `etape` (commencer, approfondir, aller-plus-loin) sur toutes les ressources : roadmaps et catalogue d'apprentissage.
// Règles : scripts/etapes-regles.mjs. Usage : node scripts/classer-ressources.mjs [--ecrire]  (sans --ecrire : compte rendu seulement).
import fs from "node:fs";
import path from "node:path";
import { classerCompetence } from "./etapes-regles.mjs";

const racine = path.resolve(import.meta.dirname, "..");
const ecrire = process.argv.includes("--ecrire");
const dossier = path.join(racine, "content", "roadmaps");
const fichierCatalogue = path.join(racine, "content", "ressources", "apprentissage.json");

const roadmaps = fs.readdirSync(dossier).filter((f) => f.endsWith(".json")).sort().map((f) => ({ f, texte: fs.readFileSync(path.join(dossier, f), "utf8") }));
for (const r of roadmaps) r.json = JSON.parse(r.texte);
const texteCatalogue = fs.readFileSync(fichierCatalogue, "utf8");
const catalogue = JSON.parse(texteCatalogue);

// Toutes les ressources d'une compétence, partout (copies des roadmaps et catalogue).
const parNoeud = new Map();
const ajouter = (id, ref) => parNoeud.set(id, [...(parNoeud.get(id) ?? []), ref]);
for (const r of roadmaps) for (const n of r.json.noeuds) for (const res of n.ressources) ajouter(n.id, res);
for (const e of catalogue.ressources) for (const id of e.noeuds) ajouter(id, e);

const compte = { commencer: 0, approfondir: 0, "aller-plus-loin": 0 };
for (const [id, refs] of parNoeud) {
  const classement = classerCompetence(refs);
  for (const ref of refs) ref.etape = classement.get(ref.url ?? ref.nom);
}
for (const r of roadmaps) for (const n of r.json.noeuds) for (const res of n.ressources) compte[res.etape]++;
console.log("Dans les roadmaps :", compte, "| catalogue :", catalogue.ressources.length, "entrées");
if (ecrire) {
  for (const r of roadmaps) fs.writeFileSync(path.join(dossier, r.f), JSON.stringify(r.json, null, 2) + (r.texte.endsWith("\n") ? "\n" : ""));
  fs.writeFileSync(fichierCatalogue, JSON.stringify(catalogue, null, 2) + (texteCatalogue.endsWith("\n") ? "\n" : ""));
  console.log("écrit.");
} else console.log("simulation, rien écrit.");
