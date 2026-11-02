/** Calcul de jours de calendrier (« AAAA-MM-JJ »), sans dépendance : partagé par la progression, la mesure et le calendrier. */

/** Date du jour dans le fuseau local, « AAAA-MM-JJ » : un jour de calendrier, pas 24 heures. */
export function jourLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Ajoute des jours de calendrier à une date « AAAA-MM-JJ » (midi : à l'abri des changements d'heure). */
export function ajouterJours(j: string, n: number): string {
  const [a, m, d] = j.split("-").map(Number);
  return jourLocal(new Date(a, m - 1, d + n, 12));
}

/** Nombre de jours de calendrier entre deux dates « AAAA-MM-JJ » (b − a) ; négatif si b précède a. */
export function ecartJours(a: string, b: string): number {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}
