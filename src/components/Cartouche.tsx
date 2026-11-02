/** Cartouche : bandeau d'identification d'une page (domaine, niveau, version…), comme sur un plan d'architecte. */
export default function Cartouche({ titre, lignes, children }: { titre?: string; lignes: [string, string | number][]; children?: React.ReactNode }) {
  return (
    <aside className="cartouche" aria-label={titre ?? "Fiche"}>
      <dl>
        {lignes.map(([cle, valeur]) => (
          <div key={cle} className="contents">
            <dt>{cle}</dt>
            <dd>{valeur}</dd>
          </div>
        ))}
      </dl>
      {children && <div className="border-t p-3" style={{ borderColor: "var(--filet)" }}>{children}</div>}
    </aside>
  );
}
