import { INSTANCE } from "./instance";

/**
 * Adresse publique du site : variable explicite, sinon l'adresse canonique de l'instance (telcoskills.com pour le site public),
 * sinon le domaine de production Vercel, sinon le développement local.
 */
export const BASE_SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  INSTANCE.url ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const urlAbsolue = (chemin: string) => new URL(chemin, BASE_SITE).toString();
