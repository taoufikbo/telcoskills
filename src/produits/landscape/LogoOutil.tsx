/** Deux lettres pour un outil sans logo : initiales de ses mots, ou ses deux premières lettres. */
export function monogramme(nom: string): string {
  const mots = nom.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return (mots.length > 1 ? mots[0][0] + mots[1][0] : (mots[0] ?? "?").slice(0, 2)).toUpperCase();
}

/**
 * Logo d'un outil sur une pastille claire (les logos de marque sont dessinés pour un fond clair, y compris en thème sombre).
 * Décoratif : le nom de l'outil est toujours écrit à côté. Sans logo, un monogramme tient la place.
 */
export default function LogoOutil({ nom, logo, taille = 20 }: { nom: string; logo?: string; taille?: number }) {
  const style = { width: taille, height: taille };
  if (!logo)
    return (
      <span aria-hidden="true" style={{ ...style, fontSize: Math.round(taille * 0.46) }} className="inline-flex shrink-0 items-center justify-center rounded-md bg-slate-200 font-bold leading-none text-slate-700">
        {monogramme(nom)}
      </span>
    );
  return (
    <span aria-hidden="true" style={style} className="inline-flex shrink-0 items-center justify-center rounded-md bg-white p-[3px]">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG statique, rien à optimiser */}
      <img src={logo} alt="" width={taille} height={taille} loading="lazy" className="h-full w-full object-contain" />
    </span>
  );
}
