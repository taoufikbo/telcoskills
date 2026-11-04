import { EtatNoeudSchema, EtatPratiqueSchema, type EtatNoeud, type EtatPratique } from "./etat";

/**
 * Sauvegarde sans compte : l'état de pratique complet (statuts, dates de révision, parcours) tient dans un paramètre d'adresse
 * `?etat=p1.<contenu>`. Rien n'est envoyé à un serveur ; le lien est la sauvegarde.
 * Format compact, uniquement des caractères sûrs dans une adresse ([a-z0-9._~-]) :
 *   p1.<création>_<compétences>_<parcours>_<hors parcours>_<somme de contrôle>
 * La somme de contrôle de fin fait refuser un lien coupé à la copie (sans elle, un lien tronqué se lirait comme un état partiel).
 *   compétence = id.vu.boîte.réussi.échéance.dernier.tentatives.déclaré[.palier]   (dates en jours depuis 2024-01-01, base 36 ; le palier n'est écrit que s'il existe, donc les liens d'avant restent lus)
 * Un ancien lien (`?etat=<roadmap>~…`) reste lu par `progression.ts`.
 */
export const PREFIXE_LIEN = "p1.";

const ORIGINE = Date.UTC(2024, 0, 1);
const versJours = (j: string) => {
  const [a, m, d] = j.split("-").map(Number);
  return Math.round((Date.UTC(a, m - 1, d) - ORIGINE) / 86_400_000).toString(36);
};
const depuisJours = (n: string) => new Date(ORIGINE + parseInt(n, 36) * 86_400_000).toISOString().slice(0, 10);
const optJours = (j?: string) => (j ? versJours(j) : "");

/** FNV-1a 32 bits, en base 36 : détecte une coupure ou une faute de frappe, ne protège de rien d'autre. */
function somme(texte: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

export const estLienEtat = (texte: string | null | undefined): texte is string => !!texte && texte.startsWith(PREFIXE_LIEN);

export function encoderLienEtat(etat: EtatPratique): string {
  const noeuds = Object.entries(etat.noeuds).map(([id, n]) =>
    [id, optJours(n.vu), n.boite ?? "", optJours(n.reussi), optJours(n.echeance), n.dernier === "ok" ? "o" : n.dernier === "echec" ? "e" : "", n.tentatives ?? "", n.declare ? "1" : "", ...(n.palier ? [n.palier] : [])].join("."),
  );
  const hors = Object.entries(etat.horsParcours).map(([roadmap, ids]) => [roadmap, ...ids].join("."));
  const corps = [versJours(etat.creeLe), noeuds.join("~"), etat.parcours.join("~"), hors.join("~")].join("_");
  return `${PREFIXE_LIEN}${corps}_${somme(corps)}`;
}

/** Lit un lien ; lève une Error au message affichable s'il est tronqué ou n'est pas de cette application. */
export function decoderLienEtat(texte: string): EtatPratique {
  try {
    const sections = texte.slice(PREFIXE_LIEN.length).split("_");
    const controle = sections.pop();
    if (sections.length !== 4 || controle !== somme(sections.join("_"))) throw new Error("format");
    const [cree, noeudsBrut, parcoursBrut, horsBrut] = sections;
    const noeuds: Record<string, EtatNoeud> = {};
    for (const t of noeudsBrut ? noeudsBrut.split("~") : []) {
      const [id, vu, boite, reussi, echeance, dernier, tentatives, declare, palier, ...surplus] = t.split(".");
      if (!id || surplus.length > 0) throw new Error("format");
      noeuds[id] = {
        ...(vu ? { vu: depuisJours(vu) } : {}),
        ...(boite ? { boite: Number(boite) as 1 | 2 | 3 | 4 } : {}),
        ...(reussi ? { reussi: depuisJours(reussi) } : {}),
        ...(echeance ? { echeance: depuisJours(echeance) } : {}),
        ...(dernier ? { dernier: dernier === "o" ? ("ok" as const) : ("echec" as const) } : {}),
        ...(tentatives ? { tentatives: Number(tentatives) } : {}),
        ...(declare ? { declare: true as const } : {}),
        ...(palier ? { palier: Number(palier) } : {}),
      };
    }
    const horsParcours: Record<string, string[]> = {};
    for (const t of horsBrut ? horsBrut.split("~") : []) {
      const [roadmap, ...ids] = t.split(".");
      horsParcours[roadmap] = ids;
    }
    return EtatPratiqueSchema.parse({ version: 1, creeLe: depuisJours(cree), migre: true, declares: 0, messageMigrationVu: true, noeuds, parcours: parcoursBrut ? parcoursBrut.split("~") : [], horsParcours });
  } catch {
    throw new Error("Ce lien de sauvegarde est illisible (peut-être coupé à la copie).");
  }
}

/** Le meilleur état de deux versions d'une même compétence : la preuve la plus récente d'abord, puis la plus avancée. */
function meilleurSansPalier(a: EtatNoeud, b: EtatNoeud): EtatNoeud {
  if (a.boite && !b.boite) return a;
  if (b.boite && !a.boite) return b;
  if (a.boite && b.boite) {
    const ra = a.reussi ?? "";
    const rb = b.reussi ?? "";
    if (ra !== rb) return ra > rb ? a : b;
    return a.boite >= b.boite ? a : b;
  }
  return (a.vu ?? "9") <= (b.vu ?? "9") ? a : b;
}

/** Idem, et le palier déclaré le plus haut des deux est conservé (on ne perd pas un palier en important une sauvegarde). */
function meilleur(a: EtatNoeud, b: EtatNoeud): EtatNoeud {
  const gagnant = meilleurSansPalier(a, b);
  const palier = Math.max(a.palier ?? 0, b.palier ?? 0);
  return palier > 0 ? { ...gagnant, palier } : gagnant;
}

/**
 * Fusionne une sauvegarde importée dans l'état local **sans rien supprimer** : pour chaque compétence on garde la version
 * la plus avancée (acquise avant vue, réussite la plus récente). « Mon parcours » local reste en tête.
 */
export function fusionnerEtats(local: EtatPratique, importe: EtatPratique): EtatPratique {
  const noeuds: Record<string, EtatNoeud> = { ...local.noeuds };
  for (const [id, n] of Object.entries(importe.noeuds)) noeuds[id] = id in noeuds ? meilleur(noeuds[id], n) : n;
  const horsParcours: Record<string, string[]> = { ...local.horsParcours };
  for (const [r, ids] of Object.entries(importe.horsParcours)) horsParcours[r] = [...new Set([...(horsParcours[r] ?? []), ...ids])];
  return {
    ...local,
    creeLe: local.creeLe < importe.creeLe ? local.creeLe : importe.creeLe,
    noeuds,
    parcours: [...local.parcours, ...importe.parcours.filter((x) => !local.parcours.includes(x))],
    horsParcours,
  };
}

/** Nombre de compétences portées par un état (pour le dire avant de fusionner). */
export const nombreDeCompetences = (etat: EtatPratique) => Object.keys(etat.noeuds).length;
