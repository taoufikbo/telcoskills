import { graphlib, layout } from "@dagrejs/dagre";

/** Le minimum d'une roadmap dont la carte a besoin. */
export type RoadmapCarte = { id: string; noeuds: { id: string; titre: string; prerequis: string[] }[] };

export type NoeudDispose = {
  id: string;
  titre: string;
  lignes: string[];
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
  surChemin: boolean;
  cible: boolean;
  /** Toutes les compétences de la carte à maîtriser avant celle-ci (prérequis transitifs). */
  amont: string[];
  /** Heures d'étude estimées pour la compétence et tout son amont ; absent sans estimation fournie. */
  heures?: number;
};
export type AreteDisposee = { de: string; a: string; d: string; surChemin: boolean };

/** Disposition calculée au build : sérialisable, passée telle quelle au composant (dagre n'est jamais envoyé au navigateur). */
export type Disposition = {
  roadmapId: string;
  largeur: number;
  hauteur: number;
  noeuds: NoeudDispose[];
  aretes: AreteDisposee[];
  /** Le plus long chemin de prérequis jusqu'à la cible, du premier pas à la cible. */
  chemin: { id: string; titre: string }[];
  cible: { id: string; titre: string };
  /** Point de départ de la personne (diagnostic), quand la carte est la sienne. */
  depart?: { id: string; titre: string };
};

export const LARGEUR_NOEUD = 136;
const PADDING_X = 10;
const LIGNE = 14;
const PADDING_Y = 8;
/** Chasse de la police à chasse fixe à 11 px (environ 0,6 em) : sert à couper les libellés sans les tronquer. */
const CHASSE = 6.6;
export const CARACTERES_PAR_LIGNE = Math.floor((LARGEUR_NOEUD - 2 * PADDING_X) / CHASSE);

/** Coupe un libellé en lignes, aux espaces ; un mot trop long est coupé net. Aucun texte n'est retiré. */
export function couperLibelle(texte: string, max = CARACTERES_PAR_LIGNE): string[] {
  const lignes: string[] = [];
  let courante = "";
  const pousser = () => {
    if (courante) lignes.push(courante);
    courante = "";
  };
  for (const entier of texte.split(/\s+/).filter(Boolean)) {
    let mot = entier;
    while (mot.length > max) {
      pousser();
      lignes.push(mot.slice(0, max));
      mot = mot.slice(max);
    }
    if (courante && courante.length + 1 + mot.length > max) pousser();
    courante = courante ? `${courante} ${mot}` : mot;
  }
  pousser();
  return lignes;
}

function ancetres(roadmap: RoadmapCarte, ids: string[]): Set<string> {
  const parId = new Map(roadmap.noeuds.map((n) => [n.id, n]));
  const vus = new Set<string>();
  const visiter = (id: string) => {
    if (vus.has(id) || !parId.has(id)) return;
    vus.add(id);
    parId.get(id)!.prerequis.forEach(visiter);
  };
  ids.forEach(visiter);
  return vus;
}

function cheminLePlusLong(roadmap: RoadmapCarte, cible: string, depart?: string): string[] {
  const parId = new Map(roadmap.noeuds.map((n) => [n.id, n]));
  // Avec un départ : le chemin ne passe que par des compétences qui s'appuient sur lui, et commence donc par lui.
  const admis = (id: string) => !depart || ancetres(roadmap, [id]).has(depart);
  const memo = new Map<string, string[]>();
  const depuis = (id: string): string[] => {
    const connu = memo.get(id);
    if (connu) return connu;
    const meilleur = (parId.get(id)?.prerequis ?? []).filter((p) => parId.has(p) && admis(p)).map(depuis).sort((a, b) => b.length - a.length)[0] ?? [];
    const chemin = [...meilleur, id];
    memo.set(id, chemin);
    return chemin;
  };
  return depuis(cible);
}

/** Dispose le graphe des prérequis des cibles (la dernière est « la » cible). Lève une erreur si une cible n'existe pas. */
export function disposerCarte(roadmap: RoadmapCarte, cibles: string[], options: { heures?: (id: string) => number; depart?: string } = {}): Disposition {
  const parId = new Map(roadmap.noeuds.map((n) => [n.id, n]));
  for (const c of cibles) if (!parId.has(c)) throw new Error(`Carte : la compétence « ${c} » n'existe pas dans « ${roadmap.id} ».`);
  const ids = ancetres(roadmap, cibles);
  const noeuds = roadmap.noeuds.filter((n) => ids.has(n.id));
  const cible = cibles[cibles.length - 1];
  const depart = options.depart && ancetres(roadmap, [cible]).has(options.depart) ? options.depart : undefined;
  const chemin = cheminLePlusLong(roadmap, cible, depart);
  const surChemin = new Set(chemin);
  const areteChemin = new Set(chemin.slice(1).map((id, i) => `${chemin[i]}>${id}`));

  const g = new graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 12, ranksep: 26, marginx: 4, marginy: depart ? 18 : 4 });
  g.setDefaultEdgeLabel(() => ({}));
  const lignes = new Map(noeuds.map((n) => [n.id, couperLibelle(n.titre)]));
  for (const n of noeuds) g.setNode(n.id, { width: LARGEUR_NOEUD, height: lignes.get(n.id)!.length * LIGNE + 2 * PADDING_Y });
  for (const n of noeuds) for (const p of n.prerequis) if (ids.has(p)) g.setEdge(p, n.id);
  layout(g);

  const arrondi = (v: number) => Math.round(v * 10) / 10;
  const { width, height } = g.graph() as { width: number; height: number };
  return {
    roadmapId: roadmap.id,
    largeur: Math.ceil(width),
    hauteur: Math.ceil(height),
    noeuds: noeuds.map((n) => {
      const { x, y, width: l, height: h } = g.node(n.id);
      const amont = [...ancetres(roadmap, [n.id])].filter((id) => id !== n.id);
      const heures = options.heures ? [n.id, ...amont].reduce((s, id) => s + options.heures!(id), 0) : undefined;
      return {
        id: n.id,
        titre: n.titre,
        lignes: lignes.get(n.id)!,
        x: arrondi(x),
        y: arrondi(y),
        largeur: l,
        hauteur: h,
        surChemin: surChemin.has(n.id),
        cible: n.id === cible,
        amont,
        ...(heures !== undefined && { heures }),
      };
    }),
    aretes: g.edges().map((e) => {
      const [a, ...reste] = g.edge(e).points as { x: number; y: number }[];
      return { de: e.v, a: e.w, d: `M${arrondi(a.x)},${arrondi(a.y)} ${reste.map((q) => `L${arrondi(q.x)},${arrondi(q.y)}`).join(" ")}`, surChemin: areteChemin.has(`${e.v}>${e.w}`) };
    }),
    chemin: chemin.map((id) => ({ id, titre: parId.get(id)!.titre })),
    cible: { id: cible, titre: parId.get(cible)!.titre },
    ...(depart && { depart: { id: depart, titre: parId.get(depart)!.titre } }),
  };
}

export const LIGNE_TEXTE = LIGNE;
export const MARGE_TEXTE = { x: PADDING_X, y: PADDING_Y };

/** Taille maximale d'une carte de parcours : au-delà, les libellés deviendraient illisibles dans l'en-tête de l'accueil. */
export const TAILLE_MAX_CARTE = 15;

/**
 * Cible d'une carte qui part d'une compétence : la plus avancée qui s'appuie sur ce départ (le plus grand amont qui le contient),
 * sans dépasser TAILLE_MAX_CARTE compétences ; à égalité, la première dans l'ordre de la roadmap. Le départ lui-même à défaut. Pure.
 */
export function choisirCible(roadmap: RoadmapCarte, depart: string, max = TAILLE_MAX_CARTE): string {
  let meilleure = depart;
  let taille = 0;
  for (const n of roadmap.noeuds) {
    const amont = ancetres(roadmap, [n.id]);
    if (amont.has(depart) && amont.size <= max && amont.size > taille) {
      meilleure = n.id;
      taille = amont.size;
    }
  }
  return meilleure;
}
