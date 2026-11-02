import next from "eslint-config-next";

/**
 * Frontière des produits (src/produits/<nom>/) : un produit ne s'utilise que par son entrée publique (index.ts).
 * Hors d'un produit, importer un de ses fichiers internes est une erreur ; dans un produit, on ne remonte pas
 * vers un autre dossier par chemin relatif (on passe par « @/lib/… » ou « @/produits/<autre> »).
 */
const INTERNE_PRODUIT = {
  group: ["@/produits/*/*", "**/produits/*/*"],
  message: "Un produit s'importe par son entrée publique : « @/produits/<nom> », jamais un de ses fichiers internes.",
};

const config = [
  ...next,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: [INTERNE_PRODUIT] }] },
  },
  {
    files: ["src/produits/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            INTERNE_PRODUIT,
            { group: ["../*"], message: "Un produit ne remonte pas hors de son dossier : utiliser « @/lib/… » ou « @/produits/<autre> »." },
          ],
        },
      ],
    },
  },
];

/** Visualisations : elles reçoivent la progression en lecture seule, elles n'accèdent jamais au stockage. */
const VISUALISATIONS = ["carte-heros", "liste", "metro", "arbre", "objectif", "cockpit"];
config.push({
  files: VISUALISATIONS.map((v) => `src/produits/${v}/**/*.{ts,tsx}`),
  rules: {
    "no-restricted-globals": [
      "error",
      { name: "localStorage", message: "Une visualisation n'accède pas au stockage : la progression lui est passée en entrée." },
      { name: "sessionStorage", message: "Une visualisation n'accède pas au stockage." },
    ],
    "no-restricted-imports": [
      "error",
      {
        patterns: [INTERNE_PRODUIT, { group: ["../*"], message: "Un produit ne remonte pas hors de son dossier." }],
        paths: [
          {
            name: "@/produits/progression",
            importNames: ["usePratique", "useProgression", "useDues"],
            message: "Une visualisation reçoit la progression en entrée : elle ne la lit pas elle-même.",
          },
          { name: "@/produits/parcours", message: "Une visualisation n'accède pas au stockage." },
        ],
      },
    ],
  },
});

export default config;
