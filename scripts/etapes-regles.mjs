// Règles de classement des ressources en trois temps (docs/SPEC-FICHE-COMPETENCE.md, CD-05). Pures : aucune lecture de fichier.
export const ETAPES = ["commencer", "approfondir", "aller-plus-loin"];
export const MAX_COMMENCER = 3;

/** Le titre annonce une introduction (pour commencer). */
export const TITRE_INTRODUCTION = /(\bintro|d[ée]buter|d[ée]butant|\bbases?\b|\b101\b|pas à pas|pas a pas|comment ça marche|basics|fundamentals|for beginners|getting started|prise en main|premiers pas|crash ?course|for dummies)/i;

/** Étape initiale d'une ressource, avant le plafond par compétence. */
export function etapeInitiale(ressource) {
  const { type, nom = "" } = ressource;
  if (["certif", "livre", "retour-experience", "spec"].includes(type)) return "aller-plus-loin";
  if (["doc", "opensource", "libre"].includes(type)) return "approfondir";
  if (["cours", "video"].includes(type)) return TITRE_INTRODUCTION.test(nom) ? "commencer" : "approfondir";
  return "approfondir";
}

const RANG_ACCES = { gratuit: 0, freemium: 1, payant: 2 };
const RANG_LANGUE = { fr: 0, en: 1 };

/** Priorité d'une ressource « pour commencer » : gratuite d'abord, puis en français. */
export const prioriteCommencer = (r) => (RANG_ACCES[r.acces] ?? 3) * 10 + (RANG_LANGUE[r.langue] ?? 2);

/**
 * Classe toutes les ressources d'une compétence (réunies, dédoublonnées par adresse ou nom) :
 * au plus MAX_COMMENCER « commencer » (les mieux placées), les autres passent en « approfondir ».
 * Renvoie une Map clé de ressource -> étape.
 */
export function classerCompetence(ressources) {
  const cle = (r) => r.url ?? r.nom;
  const uniques = new Map();
  for (const r of ressources) if (!uniques.has(cle(r))) uniques.set(cle(r), r);
  const resultat = new Map();
  const candidats = [];
  for (const [k, r] of uniques) {
    const e = etapeInitiale(r);
    resultat.set(k, e);
    if (e === "commencer") candidats.push([k, r]);
  }
  candidats.sort((a, b) => prioriteCommencer(a[1]) - prioriteCommencer(b[1]));
  for (const [k] of candidats.slice(MAX_COMMENCER)) resultat.set(k, "approfondir");
  return resultat;
}
