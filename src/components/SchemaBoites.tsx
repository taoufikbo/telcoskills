import type { Segment } from "@/lib/pratique-schema";

type Props = NonNullable<Segment["schema"]>;

const L = 128;
const H = 46;
const ESPACE = 44;

/** Coupe un libellé en lignes de 18 caractères au plus, aux espaces. */
function lignes(texte: string): string[] {
  const mots = texte.split(" ");
  const out: string[] = [];
  for (const m of mots) {
    const derniere = out[out.length - 1];
    if (derniere !== undefined && (derniere + " " + m).length <= 18) out[out.length - 1] = derniere + " " + m;
    else out.push(m);
  }
  return out.slice(0, 3);
}

/** Petit schéma boîtes et flèches d'un segment : des boîtes en ligne, des flèches entre elles (courbes quand elles sautent une boîte). */
export default function SchemaBoites({ alt, boites, fleches }: Props) {
  const largeur = boites.length * L + (boites.length - 1) * ESPACE;
  const haut = 34;
  const x = (i: number) => i * (L + ESPACE);
  return (
    <svg viewBox={`0 ${-haut} ${largeur} ${H + haut * 2}`} role="img" aria-label={alt} className="h-auto w-full max-w-2xl">
      <defs>
        <marker id="pointe" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="var(--bord)" />
        </marker>
      </defs>
      {fleches.map(([a, b], i) => {
        const adjacent = Math.abs(a - b) === 1;
        if (adjacent) {
          const [x1, x2] = a < b ? [x(a) + L, x(b)] : [x(a), x(b) + L];
          return <line key={i} x1={x1} y1={H / 2} x2={x2} y2={H / 2} stroke="var(--bord)" strokeWidth="1.4" markerEnd="url(#pointe)" />;
        }
        const haut_ = a < b;
        const y0 = haut_ ? 0 : H;
        const cy = haut_ ? -haut : H + haut;
        const xa = x(a) + L / 2;
        const xb = x(b) + L / 2;
        return <path key={i} d={`M${xa},${y0} Q${(xa + xb) / 2},${cy} ${xb},${y0}`} fill="none" stroke="var(--bord)" strokeWidth="1.4" markerEnd="url(#pointe)" />;
      })}
      {boites.map((b, i) => {
        const l = lignes(b);
        return (
          <g key={`${b}-${i}`}>
            <rect x={x(i)} y={0} width={L} height={H} rx={6} fill="var(--surface)" stroke="var(--bord)" strokeWidth="1.2" />
            <text x={x(i) + L / 2} y={H / 2 - ((l.length - 1) * 6.5) + 4} textAnchor="middle" fontSize="11" fill="var(--fg)" style={{ fontFamily: "var(--font-mono)" }}>
              {l.map((t, k) => (
                <tspan key={k} x={x(i) + L / 2} dy={k === 0 ? 0 : 13}>
                  {t}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
