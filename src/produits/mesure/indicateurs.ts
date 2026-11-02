/**
 * Les indicateurs de rétention, calculés à partir des événements de mesure (METRICS.md).
 * Fichier sans dépendance : il sert aussi au script `scripts/indicateurs.ts`, qui lit un export d'événements.
 */
export type EvenementMesure = { name: string; data?: Record<string, string | number | boolean> };

/** En dessous de ce nombre d'événements, un taux n'est pas interprétable (±18 points à 95 % pour 30 observations autour de 50 %). */
export const SEUIL_FIABLE = 30;

export type Taux = {
  /** Observations (dénominateur). */
  n: number;
  /** Succès (numérateur). */
  k: number;
  taux: number | null;
  /** Intervalle de confiance à 95 % (méthode de Wilson). */
  ic95: [number, number] | null;
  /** Vrai à partir de SEUIL_FIABLE observations. */
  fiable: boolean;
};

export function taux(k: number, n: number): Taux {
  if (n === 0) return { n, k, taux: null, ic95: null, fiable: false };
  const z = 1.96;
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const marge = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return { n, k, taux: p, ic95: [Math.max(0, centre - marge), Math.min(1, centre + marge)], fiable: n >= SEUIL_FIABLE };
}

const nom = (e: EvenementMesure, n: string) => e.name === n;
const vrai = (e: EvenementMesure, cle: string) => e.data?.[cle] === true;
const nombre = (e: EvenementMesure, cle: string) => (typeof e.data?.[cle] === "number" ? (e.data[cle] as number) : null);

/** Intervalle de chaque boîte, en jours : la révision d'une compétence en boîte k teste sa rétention après cet intervalle. */
export const RETENTION_PAR_BOITE = { "J+1": 1, "J+3": 2, "J+7": 3, "J+21": 4 } as const;

/** Une révision de plus de 2 jours de retard ne mesure plus « J+7 » mais un intervalle plus long : on l'écarte de l'indicateur. */
export const RETARD_MAX_JOURS = 2;

export type Indicateurs = {
  /** `recall_success` / `recall_attempt`, premier essai de la compétence. */
  rappelPremierEssai: Taux;
  /** Part de réussite des révisions, par intervalle ; « J+7 » est la vraie mesure de rétention. */
  retention: Record<keyof typeof RETENTION_PAR_BOITE, Taux>;
  /** Proxy de « reviennent pour une révision échue » : premières révisions du jour / navigateurs-jours avec une révision due affichée. */
  retourRevision: Taux & { anomalie: boolean };
  /** Délai (jours) entre la première visite et la première compétence « acquis (testé) », parmi ceux qui y arrivent. */
  delaiPremiereAcquisition: { n: number; mediane: number | null; dansLesSeptJours: Taux };
};

export function calculerIndicateurs(evenements: EvenementMesure[]): Indicateurs {
  const tentatives = evenements.filter((e) => nom(e, "recall_attempt") && vrai(e, "premierEssai"));
  const reussites = evenements.filter((e) => nom(e, "recall_success") && vrai(e, "premierEssai"));

  const revisions = evenements.filter((e) => nom(e, "review_done"));
  const retention = Object.fromEntries(
    (Object.entries(RETENTION_PAR_BOITE) as [keyof typeof RETENTION_PAR_BOITE, number][]).map(([cle, boite]) => {
      const dans = revisions.filter((e) => nombre(e, "boite") === boite && (nombre(e, "retard") ?? 0) <= RETARD_MAX_JOURS);
      return [cle, taux(dans.filter((e) => vrai(e, "ok")).length, dans.length)];
    }),
  ) as Indicateurs["retention"];

  const affichees = evenements.filter((e) => nom(e, "review_due_shown")).length;
  const faites = revisions.filter((e) => vrai(e, "premiereDuJour")).length;
  const retour = taux(Math.min(faites, affichees), affichees);

  const delais = evenements
    .filter((e) => nom(e, "node_done") && vrai(e, "premiere"))
    .map((e) => nombre(e, "delaiJours"))
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b);
  const mediane = delais.length === 0 ? null : delais.length % 2 ? delais[(delais.length - 1) / 2] : (delais[delais.length / 2 - 1] + delais[delais.length / 2]) / 2;

  return {
    rappelPremierEssai: taux(reussites.length, tentatives.length),
    retention,
    retourRevision: { ...retour, anomalie: faites > affichees },
    delaiPremiereAcquisition: { n: delais.length, mediane, dansLesSeptJours: taux(delais.filter((d) => d <= 7).length, delais.length) },
  };
}
