// Génère content/roadmaps/parcours-sylva.json (usage : node scripts/generer-parcours-sylva.mjs .). Faits tirés de sylva-core (README, environment-values, kustomize-units)
// et de la documentation officielle (sources du portail sur GitLab), lues le 2026-11-02.
import fs from "node:fs";
const racine = process.argv[2];
const archi = JSON.parse(fs.readFileSync(`${racine}/content/roadmaps/architecte-caas-telco.json`, "utf8"));
const DOC = (p) => `https://gitlab.com/sylva-projects/sylva-projects.gitlab.io/-/blob/main/website/docs/${p}.md`;
const DEVZONE = (p) => `https://gitlab.com/sylva-projects/sylva-projects.gitlab.io/-/blob/main/website/devzone/${p}.md`;
const CORE = "https://gitlab.com/sylva-projects/sylva-core";
const doc = (nom, p) => ({ type: "opensource", nom: `Documentation Sylva : ${nom}`, url: DOC(p), acces: "gratuit", langue: "en", auteur: "Projet Sylva" });

const B = {
  socle: "Socle Kubernetes et GitOps",
  comprendre: "Comprendre Sylva",
  deployer: "Déployer une plateforme Sylva",
  operer: "Opérer la plateforme",
  telco: "Charges télécom",
};

const partages = {
  linux: B.socle, conteneurs: B.socle, "k8s-archi": B.socle, helm: B.socle, gitops: B.socle,
  "obs-metrics": B.operer, "obs-logs": B.operer, "sec-supply": B.operer,
  cni: B.telco, multus: B.telco, sriov: B.telco, "perf-hugepages": B.telco, "perf-profile": B.telco,
};

const propres = [
  {
    id: "sylva-projet", titre: "Le projet Sylva : une pile cloud télécom commune", bloc: B.comprendre, niveau: "fondamental", prerequis: [],
    resume: "Projet de Linux Foundation Europe annoncé en novembre 2022 avec Deutsche Telekom, Ericsson, Nokia, Orange, Telecom Italia, Telefónica et Vodafone : un cadre logiciel cloud-native commun pour les réseaux d'opérateurs, une implémentation de référence (sylva-core, licence Apache 2.0) et un programme de validation des fonctions réseau.",
    ressources: [
      { type: "opensource", nom: "sylva-core : dépôt de la pile (licence Apache 2.0)", url: CORE, acces: "gratuit", langue: "en", auteur: "Projet Sylva" },
      { type: "doc", nom: "Linux Foundation Europe annonce le projet Sylva (communiqué, novembre 2022)", url: "https://www.linuxfoundation.org/press/linux-foundation-europe-announces-project-sylva-to-create-open-source-telco-cloud-software-framework-to-complement-open-networking-momentum", acces: "gratuit", langue: "en", auteur: "The Linux Foundation" },
      { type: "retour-experience", nom: "PowerDNS : validation d'une CNF au centre de validation d'Orange", url: "https://blog.powerdns.com/powerdns-achieves-sylva-project-validation", acces: "gratuit", langue: "en", auteur: "PowerDNS" },
    ],
  },
  {
    id: "sylva-architecture", titre: "Cluster de gestion, clusters de charge et units", bloc: B.comprendre, niveau: "fondamental", prerequis: ["sylva-projet", "k8s-archi"],
    resume: "Un cluster de gestion, déployé depuis une VM de bootstrap, crée et gère de façon déclarative des clusters de charge qui hébergent les CNF. Chaque cluster est composé d'« units », des composants open source obligatoires ou optionnels (Rancher, Keycloak, Harbor, Vault, Flux, Thanos…). Deux rôles : l'opérateur d'infrastructure et l'opérateur des charges.",
    ressources: [doc("vue d'ensemble de la solution", "getting-started/solution-overview"), doc("aperçu technique", "_Design/01-technical-overview")],
  },
  {
    id: "cluster-api", titre: "Cluster API : le cycle de vie des clusters", bloc: B.comprendre, niveau: "intermediaire", prerequis: ["k8s-archi"],
    resume: "Gérer des clusters Kubernetes avec Kubernetes : des ressources déclaratives décrivent les clusters, des fournisseurs d'infrastructure et d'amorçage les réalisent. Sylva s'en sert pour tous ses clusters, y compris le cluster de gestion.",
    ressources: [
      { type: "opensource", nom: "Cluster API : documentation officielle", url: "https://cluster-api.sigs.k8s.io/", acces: "gratuit", langue: "en", auteur: "Kubernetes SIG Cluster Lifecycle" },
      doc("aperçu technique (cycle de vie des clusters)", "_Design/01-technical-overview"),
    ],
  },
  {
    id: "sylva-units", titre: "Le chart sylva-units : activer et configurer des units", bloc: B.comprendre, niveau: "intermediaire", prerequis: ["helm", "gitops", "sylva-architecture"],
    resume: "Un chart Helm maison transforme chaque unit en ressources Flux (GitRepository, HelmRepository, OCIRepository, Kustomization, HelmRelease) selon le contexte (bootstrap, gestion, charge) et les fournisseurs choisis. On active, désactive et règle les units dans values.yaml ; Kustomize adapte les manifestes sans les modifier.",
    ressources: [
      { type: "opensource", nom: "sylva-core : README (pile Sylva et structure du dépôt)", url: `${CORE}/-/blob/main/README.md`, acces: "gratuit", langue: "en", auteur: "Projet Sylva" },
      doc("units", "configuration/units"),
      { type: "opensource", nom: "Flux : documentation officielle", url: "https://fluxcd.io/flux/", acces: "gratuit", langue: "en", auteur: "CNCF" },
    ],
  },
  {
    id: "sylva-bootstrap", titre: "VM de bootstrap et prérequis du déploiement", bloc: B.deployer, niveau: "intermediaire", prerequis: ["linux", "sylva-units"],
    resume: "La VM de bootstrap (Ubuntu 22.04 LTS recommandée, 4 vCPU, 8 Go de mémoire et 16 conseillés, 40 Go de disque) doit joindre l'API de l'infrastructure ou les BMC (IPMI, Redfish), Internet et les réseaux utiles ; les noms d'hôtes *.sylva doivent être résolus par le DNS.",
    ressources: [doc("prérequis", "configuration/prerequisites")],
  },
  {
    id: "sylva-fournisseurs", titre: "Fournisseurs d'infrastructure et distributions Kubernetes", bloc: B.deployer, niveau: "intermediaire", prerequis: ["cluster-api"],
    resume: "Les valeurs d'exemple de sylva-core combinent trois distributions (kubeadm, RKE2, Canonical Kubernetes) et des fournisseurs Cluster API : OpenStack (CAPO), bare metal avec Metal3 (CAPM3), vSphere (CAPV), OpenNebula (CAPONE) et Docker (CAPD) pour les essais. On part du dossier qui correspond à sa cible.",
    ressources: [
      { type: "opensource", nom: "sylva-core : valeurs d'exemple par distribution et fournisseur", url: `${CORE}/-/tree/main/environment-values`, acces: "gratuit", langue: "en", auteur: "Projet Sylva" },
      doc("fournisseurs", "configuration/providers"),
    ],
  },
  {
    id: "sylva-metal3", titre: "Bare metal avec Metal3 (CAPM3)", bloc: B.deployer, niveau: "avance", prerequis: ["sylva-fournisseurs", "linux"],
    resume: "Provisionner des serveurs physiques par leur BMC (IPMI ou Redfish) avec Metal3 et le fournisseur Cluster API CAPM3. Sylva déploie aussi des clusters OKD sur bare metal par ce fournisseur.",
    ressources: [
      { type: "opensource", nom: "Sylva, espace développeurs : Metal3", url: DEVZONE("03-developer-perspectives/00-relevant-units/metal3"), acces: "gratuit", langue: "en", auteur: "Projet Sylva" },
      doc("déploiement de clusters OKD", "runtime-operations/cli-workload-cluster-operations/okd-deployment"),
    ],
  },
  {
    id: "sylva-suse", titre: "La variante SUSE de Sylva : SL Micro, RKE2, Rancher, Longhorn, NeuVector", bloc: B.deployer, niveau: "avance", prerequis: ["sylva-fournisseurs"],
    resume: "Une partie des composants de sylva-core vient des dépôts SUSE et Rancher : RKE2 (fournisseur Cluster API), Rancher et Rancher Turtles, Longhorn, NeuVector, Metal3 maintenu par SUSE, opérateur SR-IOV et KubeVirt de SUSE Edge. Le dépôt susetelcocloud aligne Sylva 1.7 sur SUSE Edge 3.6 : SUSE Linux Micro 6.2 configuré par Ignition, images construites avec KIWI et Edge Image Builder, charts et images de registry.suse.com.",
    ressources: [
      { type: "opensource", nom: "Projet Sylva : variante SUSE Telco Cloud (susetelcocloud)", url: "https://gitlab.com/sylva-projects/third-party-integrations/susetelcocloud", acces: "gratuit", langue: "en", auteur: "Projet Sylva" },
      { type: "opensource", nom: "Rapport d'alignement Sylva 1.7 / SUSE Edge 3.6", url: "https://gitlab.com/sylva-projects/third-party-integrations/susetelcocloud/-/blob/main/mgmt/mgmt_stc3.6_sylva1.7.md", acces: "gratuit", langue: "en", auteur: "Projet Sylva" },
      { type: "opensource", nom: "sylva-core : liste des units et origine de leurs charts", url: "https://gitlab.com/sylva-projects/sylva-core/-/blob/main/charts/sylva-units/units-description.md", acces: "gratuit", langue: "en", auteur: "Projet Sylva" },
    ],
  },
  {
    id: "sylva-installation", titre: "Déployer et valider le cluster de gestion", bloc: B.deployer, niveau: "intermediaire", prerequis: ["sylva-bootstrap", "sylva-fournisseurs"],
    resume: "bootstrap.sh crée un cluster temporaire qui déploie le cluster de gestion ; apply.sh installe ou met à jour ses units. On valide ensuite : nœuds Ready, pods de Rancher, Flux, Harbor, Vault et Keycloak en marche, points d'entrée exposés.",
    ressources: [doc("démarrage rapide", "getting-started/quickstart"), doc("installation", "installation/installation"), doc("validation", "installation/validation")],
  },
  {
    id: "sylva-clusters-charge", titre: "Créer des clusters de charge : du script à SylvaWorkloadCluster", bloc: B.operer, niveau: "avance", prerequis: ["sylva-installation", "gitops"],
    resume: "Avant Sylva 1.6, un cluster de charge se créait avec apply-workload-cluster.sh. Depuis la 1.6, on déclare une ressource SylvaWorkloadCluster, réconciliée depuis un dépôt Git propre à l'équipe, avec des valeurs par défaut fournies par l'administrateur (SylvaUnitsReleasePresets).",
    ressources: [doc("clusters de charge en GitOps", "runtime-operations/gitops-workload-cluster-operations/overview"), doc("ajouter un cluster de charge (script)", "runtime-operations/cli-workload-cluster-operations/addition")],
  },
  {
    id: "sylva-upgrade", titre: "Monter de version Kubernetes", bloc: B.operer, niveau: "avance", prerequis: ["sylva-clusters-charge"],
    resume: "Une version de Sylva prend en charge plusieurs versions de Kubernetes (par exemple 1.29 à 1.31 pour Sylva 1.4). On monte d'une version mineure à la fois, en vérifiant la version de chaque nœud avant et après.",
    ressources: [doc("montée de version Kubernetes", "runtime-operations/cli-workload-cluster-operations/upgrade-kubernetes")],
  },
  {
    id: "sylva-services", titre: "Les services de la plateforme : Rancher, Keycloak, Harbor, Vault, Flux, Thanos", bloc: B.operer, niveau: "intermediaire", prerequis: ["sylva-installation"],
    resume: "Après le déploiement, la plateforme expose ses interfaces sous des noms d'hôtes en .sylva (rancher.sylva, keycloak.sylva, vault.sylva, harbor.sylva, flux.sylva, thanos.sylva) : savoir les joindre, retrouver les identifiants et à quoi sert chacun.",
    ressources: [doc("services disponibles", "post-deployment/available-services")],
  },
  {
    id: "sylva-observabilite", titre: "Journaux et supervision dans Sylva", bloc: B.operer, niveau: "intermediaire", prerequis: ["sylva-services", "obs-logs", "obs-metrics"],
    resume: "Dans chaque cluster, la pile rancher-logging (Fluent Bit, Fluentd) collecte les journaux ; Loki les centralise dans le cluster de gestion, consultables dans Grafana. La supervision se règle dans les sections logging et monitoring de values.yaml.",
    ressources: [doc("journaux et supervision", "configuration/advanced/logging-monitoring/README")],
  },
  {
    id: "sylva-securite", titre: "Sécurité : signatures d'images, PKI, NeuVector, SBOM, WireGuard", bloc: B.operer, niveau: "avance", prerequis: ["sylva-services", "sec-supply"],
    resume: "La section security de values.yaml règle un émetteur de certificats externe (par exemple Vault), la vérification des signatures d'images (cosign), le chiffrement WireGuard de Calico, l'analyse NeuVector et l'opérateur SBOM. Des politiques Kyverno font partie des units.",
    ressources: [doc("sécurité", "configuration/advanced/security/README"), { type: "opensource", nom: "Sylva, espace développeurs : signatures d'images avec cosign", url: DEVZONE("03-developer-perspectives/01-security/cosign"), acces: "gratuit", langue: "en", auteur: "Projet Sylva" }],
  },
  {
    id: "sylva-node-classes", titre: "Classes de nœuds : generic, intensive, SR-IOV", bloc: B.telco, niveau: "avance", prerequis: ["perf-hugepages", "perf-profile", "sriov", "sylva-clusters-charge"],
    resume: "Une classe de nœud regroupe les réglages d'un type de charge : generic (sans HugePages ni CPU pinning), intensive (HugePages, CPU manager statique) ou SR-IOV (HugePages, SR-IOV, CPU pinning, NUMA, isolation des CPU système). Réservé aux clusters RKE2 ; l'isolation des CPU ajoute nohz_full, irqaffinity et reservedSystemCPUs.",
    ressources: [doc("classes de nœuds", "configuration/advanced/node-classes/README"), doc("isolation des CPU", "configuration/advanced/node-classes/cpu-isolation")],
  },
];

const ids = new Set([...Object.keys(partages), ...propres.map((n) => n.id)]);
const noeuds = [];
for (const [id, bloc] of Object.entries(partages)) {
  const n = archi.noeuds.find((x) => x.id === id);
  if (!n) throw new Error(`nœud partagé absent : ${id}`);
  const { demande, ...reste } = n;
  noeuds.push({ ...reste, bloc, prerequis: n.prerequis.filter((p) => ids.has(p)) });
}
for (const n of propres) {
  for (const p of n.prerequis) if (!ids.has(p)) throw new Error(`${n.id} : prérequis inconnu ${p}`);
  noeuds.push(n);
}
const ordreBlocs = Object.values(B);
noeuds.sort((a, b) => ordreBlocs.indexOf(a.bloc) - ordreBlocs.indexOf(b.bloc));

const roadmap = {
  id: "parcours-sylva",
  titre: "Parcours Sylva : la pile cloud télécom open source",
  type: "competence",
  presentation: "Pour l'ingénieur ou l'architecte qui doit déployer ou opérer une plateforme Sylva : du socle Kubernetes et GitOps au cluster de gestion, aux clusters de charge et aux réglages des nœuds pour les fonctions réseau.",
  version: "0.1",
  provenance: { type: "editoriale" },
  source: "Rédaction éditoriale à partir du dépôt sylva-core (README, valeurs d'exemple, units) et de la documentation officielle du projet Sylva, lus le 2026-11-02. Ce n'est pas une formation officielle Sylva ; le champ 'demande' n'est pas renseigné.",
  legende_demande: archi.legende_demande,
  blocs: ordreBlocs,
  noeuds,
};
fs.writeFileSync(`${racine}/content/roadmaps/parcours-sylva.json`, JSON.stringify(roadmap, null, 2) + "\n");
console.log(`${noeuds.length} compétences (${propres.length} propres à Sylva), ${ordreBlocs.length} blocs`);
