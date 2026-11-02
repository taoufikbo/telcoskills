/** La mesure d'audience existe-t-elle sur ce site ? Seulement en production, sur l'instance publique, avec NEXT_PUBLIC_ANALYTICS=vercel. Sinon, rien à consentir. */
export function mesureActive(refonte: boolean): boolean {
  return refonte && process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ANALYTICS === "vercel";
}
