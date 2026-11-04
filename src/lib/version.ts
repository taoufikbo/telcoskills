/**
 * Version du site : numéro de package.json et commit déployé, injectés au build par next.config.ts.
 * Hors Vercel (développement, build local), le commit est absent : on n'affiche que le numéro.
 */
export function libelleVersion(version: string | undefined = process.env.NEXT_PUBLIC_VERSION, commit: string | undefined = process.env.NEXT_PUBLIC_COMMIT): string {
  if (!version) return "";
  return commit ? `v${version} · ${commit}` : `v${version}`;
}
