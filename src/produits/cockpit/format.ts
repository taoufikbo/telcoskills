const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « 14 mars 2027 » à partir de « 2027-03-14 ». */
export function formaterArrivee(jour: string): string {
  const [a, m, d] = jour.split("-").map(Number);
  return `${d === 1 ? "1er" : d} ${MOIS[m - 1]} ${a}`;
}

/** « 1 semaine », « 26 semaines » ; au-delà de 52 semaines, on ajoute l'ordre de grandeur en mois. */
export function libelleSemaines(n: number): string {
  const base = `${n} semaine${n > 1 ? "s" : ""}`;
  return n > 52 ? `${base} (environ ${Math.round(n / 4.35)} mois)` : base;
}
