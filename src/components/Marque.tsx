/** Logotype : trois nœuds reliés, comme un fragment de graphe de dépendances. */
export default function Marque({ taille = 22 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M6.8 6.9 17.2 8.8M6 8.4l3.2 7.4M11.9 16.6l5.4-6.2" />
      <circle cx="5" cy="6.5" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="9.3" r="2.4" />
      <circle cx="10.5" cy="18" r="2.4" />
    </svg>
  );
}
