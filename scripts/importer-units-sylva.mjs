// Importe la liste officielle des composants (units) de Sylva dans content/sylva-units.json.
// Source : charts/sylva-units/units-description.md de sylva-core (fichier généré par le projet Sylva).
// Usage : node scripts/importer-units-sylva.mjs [fichier-local.md]   (sans argument : lu sur gitlab.com, branche main)
// Seule la section « Units for software components integrated into Sylva » est reprise ; les units internes ne sont pas des logiciels.
import fs from "node:fs";
import path from "node:path";

const SOURCE = "https://gitlab.com/sylva-projects/sylva-core/-/raw/main/charts/sylva-units/units-description.md";
const PAGE = "https://gitlab.com/sylva-projects/sylva-core/-/blob/main/charts/sylva-units/units-description.md";
const racine = path.resolve(import.meta.dirname, "..");

/** Regroupement par fonction : classement éditorial (le reste du contenu vient de la source). Une unit inconnue tombe dans « autres ». */
const FONCTIONS = {
  "cycle-de-vie": ["cabpck", "cabpk", "cabpr", "capd", "capi", "capm3", "capo", "capo-orc", "capone", "capv", "metal3", "metal3-ipam", "rancher-turtles", "okd-openshift-mce", "kunai"],
  gitops: ["flux-system", "flux-webui", "crossplane"],
  reseau: ["calico", "cilium", "multus", "kube-ovn", "sriov-network-operator", "metallb", "ingress-nginx", "traefik", "k8s-gateway", "coredns", "kubemacpool", "multi-networkpolicy-nftables"],
  stockage: ["longhorn", "local-path-provisioner", "cinder-csi", "vsphere-csi-driver", "trident", "ceph-csi-cephfs", "ceph-csi-rbd", "hpe-csi-driver", "nfs-ganesha", "volumesnapshot-controller", "minio-operator", "minio-logging", "minio-monitoring", "rustfs-operator", "cnpg-operator"],
  securite: ["cert-manager", "trust-manager", "kyverno", "policy-reporter", "openbao", "vault-operator", "vault-config-operator", "external-secrets-operator", "keycloak", "keycloak-users-configmap", "oauth2-proxy", "neuvector", "trivy-operator", "sbom-operator", "rancher-compliance"],
  observabilite: ["monitoring", "thanos", "loki", "logging", "metrics-server", "prometheus-pushgateway", "snmp-exporter", "junos-exporter", "alertmanager-jiralert", "alertmanager-snmp-notifier", "ephemeral-storage-exporter", "goldpinger", "kepler"],
  virtualisation: ["kubevirt", "kubevirt-cdi", "nvidia-gpu-operator"],
  resilience: ["velero", "backup-capi-resources", "backup-etcd", "backup-keycloak", "rancher-backup-restore-operator", "rancher-backup-restore-operator-crd", "medik8s-operators", "descheduler"],
  plateforme: ["rancher", "harbor"],
};
const LIBELLES = {
  "cycle-de-vie": "Cycle de vie des clusters (Cluster API)",
  gitops: "GitOps et automatisation",
  reseau: "Réseau",
  stockage: "Stockage et données",
  securite: "Sécurité, identité et secrets",
  observabilite: "Observabilité",
  virtualisation: "Virtualisation et accélération",
  resilience: "Sauvegarde et résilience",
  plateforme: "Gestion de la plateforme",
  autres: "Autres",
};
/** Origine SUSE : le chart ou le manifeste vient d'un dépôt SUSE, Rancher, SUSE Edge ou NeuVector (critère vérifiable sur la source). */
const estSuse = (source) => /rancher\.io|rancher\.com|github\.com\/rancher\/|rancher\.github\.io|suse-edge|suse\.com|neuvector/i.test(source);

const brut = process.argv[2] ? fs.readFileSync(process.argv[2], "utf8") : await (await fetch(SOURCE)).text();
const fonctionDe = new Map(Object.entries(FONCTIONS).flatMap(([f, noms]) => noms.map((n) => [n, f])));
let section = "";
const units = [];
for (const ligne of brut.split("\n")) {
  if (ligne.startsWith("## ")) section = ligne.slice(3).trim();
  if (!section.startsWith("Units for software components integrated into Sylva")) continue;
  const m = ligne.match(/^\| \*\*([^*]+)\*\* \| (.*?) \| ([^|]*) \| (.*?) \| (.*?) \|$/);
  if (!m) continue;
  const [, nom, description, maturite, sourceBrute, version] = m;
  const lien = (sourceBrute.match(/\((https?:\/\/[^)]+|oci:\/\/[^)]+)\)/) ?? [])[1] ?? null;
  units.push({
    id: nom,
    description: description.replace(/<br\/>/g, " ").replace(/\s+/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim(),
    maturite: maturite.trim() || null,
    source: lien,
    version: version.replace(/<br\/>/g, " ; ").trim() || null,
    fonction: fonctionDe.get(nom) ?? "autres",
    suse: estSuse(sourceBrute),
  });
}
if (units.length < 50) throw new Error(`Seulement ${units.length} units lues : format de la source changé ?`);
const sortie = {
  _aide: "Généré par scripts/importer-units-sylva.mjs : ne pas modifier à la main. « fonction » est un classement éditorial ; « suse » : source du chart chez SUSE, Rancher, SUSE Edge ou NeuVector.",
  source: PAGE,
  luLe: new Date().toISOString().slice(0, 10),
  fonctions: LIBELLES,
  units,
};
fs.writeFileSync(path.join(racine, "content", "sylva-units.json"), JSON.stringify(sortie, null, 2) + "\n");
const parFonction = Object.fromEntries(Object.keys(LIBELLES).map((f) => [f, units.filter((u) => u.fonction === f).length]));
console.log(`${units.length} units, dont ${units.filter((u) => u.suse).length} d'origine SUSE/Rancher`, parFonction);
