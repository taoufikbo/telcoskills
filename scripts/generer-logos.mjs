/**
 * Rassemble les logos des outils du landscape dans public/logos/<id>.svg.
 *   - Simple Icons (paquet npm « simple-icons », domaine public CC0) : le tracé est colorié avec la couleur de la marque.
 *   - Icônes officielles des projets CNCF (dépôt cncf/artwork, licence Apache 2.0) : téléchargées telles quelles.
 * Un outil absent des deux listes n'a pas de logo : l'interface affiche un monogramme. Les marques restent la propriété de leurs titulaires.
 *
 * Usage : node scripts/generer-logos.mjs
 */
import fs from "node:fs";
import path from "node:path";
import * as si from "simple-icons";

const SORTIE = path.join(process.cwd(), "public", "logos");

/** id d'outil (content/landscape.json) → slug Simple Icons. */
const SIMPLE = {
  ansible: "ansible",
  opentofu: "opentofu",
  harbor: "harbor",
  openbao: "openbao",
  falco: "falco",
  trivy: "trivy",
  containerd: "containerd",
  podman: "podman",
  ceph: "ceph",
  rook: "rook",
  cilium: "cilium",
  kubernetes: "kubernetes",
  csi: "kubernetes",
  "cluster-api": "kubernetes",
  openstack: "openstack",
  etcd: "etcd",
  envoy: "envoyproxy",
  istio: "istio",
  helm: "helm",
  "argo-cd": "argo",
  flux: "flux",
  tekton: "tekton",
  "gitlab-ci": "gitlab",
  "robot-framework": "robotframework",
  prometheus: "prometheus",
  grafana: "grafana",
  "fluent-bit": "fluentbit",
  opentelemetry: "opentelemetry",
  jaeger: "jaeger",
  wireshark: "wireshark",
  vllm: "vllm",
  mcp: "modelcontextprotocol",
  "nvidia-gpu-operator": "nvidia",
};

/** id d'outil → chemin de l'icône couleur sous projects/ dans cncf/artwork. */
const CNCF = {
  "cert-manager": "cert-manager/icon/color/cert-manager-icon-color.svg",
  kyverno: "kyverno/icon/color/kyverno-icon-color.svg",
  coredns: "coredns/icon/color/coredns-icon-color.svg",
  kubevirt: "kubevirt/icon/color/kubevirt-icon-color.svg",
  litmus: "litmus/icon/color/litmus-icon-color.svg",
  "cri-o": "crio/icon/color/crio-icon-color.svg",
  kserve: "kserve/icon/color/k-serve-icon-color.svg",
  kueue: "kubernetes/sub-projects/kueue/icon/color/kueue-icon-color.svg",
  metallb: "metallb/icon/color/metallb-icon-color.svg",
  ocm: "open-cluster-management/icon/color/ocm-icon-color.svg",
  "opa-gatekeeper": "open-policy-agent/icon/color/opa-icon-color.svg",
  "operator-framework": "operatorframework/icon/color/operatorframework-icon-color.svg",
};

const parSlug = new Map(Object.values(si).filter((i) => i && i.slug).map((i) => [i.slug, i]));

fs.mkdirSync(SORTIE, { recursive: true });
const ecrits = [];
const absents = [];

for (const [id, slug] of Object.entries(SIMPLE)) {
  const icone = parSlug.get(slug);
  if (!icone) {
    absents.push(`${id} (simple-icons : ${slug})`);
    continue;
  }
  // Le tracé n'a pas de couleur : on lui donne celle de la marque.
  const svg = icone.svg.replace("<svg ", `<svg fill="#${icone.hex}" `);
  fs.writeFileSync(path.join(SORTIE, `${id}.svg`), svg);
  ecrits.push(id);
}

for (const [id, chemin] of Object.entries(CNCF)) {
  const url = `https://raw.githubusercontent.com/cncf/artwork/main/projects/${chemin}`;
  try {
    const res = await fetch(url);
    const texte = await res.text();
    if (!res.ok || !/<svg[\s>]/.test(texte)) throw new Error(`HTTP ${res.status}`);
    fs.writeFileSync(path.join(SORTIE, `${id}.svg`), texte);
    ecrits.push(id);
  } catch (e) {
    absents.push(`${id} (cncf : ${e.message})`);
  }
}

fs.writeFileSync(
  path.join(SORTIE, "LICENCES.md"),
  `# Logos du landscape

- Simple Icons (https://simpleicons.org), domaine public (CC0) : ${Object.keys(SIMPLE).join(", ")}.
- CNCF artwork (https://github.com/cncf/artwork), licence Apache 2.0 : ${Object.keys(CNCF).join(", ")}.

Les logos sont des marques de leurs titulaires, affichés ici pour identifier les projets. Fichiers produits par scripts/generer-logos.mjs.
`,
);

console.log(`${ecrits.length} logos écrits dans public/logos`);
if (absents.length) console.log(`Non écrits : ${absents.join(", ")}`);
