type ProjetMinimal = {
  titre: string;
  resume: string;
  contexte: string;
  roles: { id: string; libelle: string; description: string }[];
  phases: { id: string; titre: string; objectif: string; livrables: string[] }[];
};

/**
 * Le projet fil rouge tel qu'il est servi dans le HTML, sans JavaScript : titre, rôles, phases avec objectif et livrables.
 * Repli de la frontière `Suspense` de la vue interactive (qui lit l'adresse et n'est rendue que dans le navigateur).
 */
export default function ProjetStatique({ projet }: { projet: ProjetMinimal }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{projet.titre}</h1>
        <p className="max-w-3xl">{projet.resume}</p>
        <p className="max-w-3xl text-sm text-slate-700 dark:text-slate-300">{projet.contexte}</p>
      </header>
      <section aria-labelledby="roles-statiques">
        <h2 id="roles-statiques" className="mb-2 text-xl font-bold">
          Les rôles
        </h2>
        <ul className="space-y-1 text-sm">
          {projet.roles.map((r) => (
            <li key={r.id}>
              <strong>{r.libelle}</strong> : {r.description}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="phases-statiques">
        <h2 id="phases-statiques" className="mb-2 text-xl font-bold">
          Les phases
        </h2>
        <ol className="space-y-4">
          {projet.phases.map((p, i) => (
            <li key={p.id} id={`phase-${p.id}`}>
              <h3 className="font-bold">
                Phase {i + 1} : {p.titre}
              </h3>
              <p className="text-sm">{p.objectif}</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {p.livrables.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
