# Paliers cibles : brouillon et contrôles

Généré le 2026-11-03 par `scripts/paliers-controles.mjs` à partir de `reports/paliers-grille.json`. **Brouillon non validé : rien n'est publié ni branché sur le site.**

## Hypothèses à valider

| Palier | Définition |
|---|---|
| 1 | Dire à quoi ça sert et situer le composant ou le pattern dans l'architecture |
| 2 | Palier 1 + voir comment l'utiliser (lire une configuration, suivre un exemple) |
| 3 | Avoir suivi le parcours : le faire soi-même en lab |
| 4 | Diagnostiquer et arbitrer : dépanner, choisir entre alternatives, dire quand ne pas l'utiliser |
| 5 | Concevoir et transmettre : dimensionner, composer des patterns, écrire la décision |

Investissement par compétence (léger, moyen, long) selon le niveau de difficulté et le palier visé, sans durée en heures :

| Palier | Fondamental | Intermédiaire | Avancé |
|---|---|---|---|
| 1 | léger | léger | léger |
| 2 | léger | léger | moyen |
| 3 | léger | moyen | long |
| 4 | moyen | long | long |
| 5 | long | long | long |

## Synthèse par parcours

| Parcours | Compétences | Investissement aujourd'hui (tout au palier 3) | Investissement au palier cible | Répartition des paliers |
|---|---|---|---|---|
| architecte-caas-telco | 61 | 10 légers · 25 moyens · 26 longs (43 % longs) | **14 légers · 22 moyens · 25 longs (41 % longs)** | P1: 1 · P2: 14 · P3: 28 · P4: 15 · P5: 3 |
| devops-integrateur-nf | 51 | 15 légers · 23 moyens · 13 longs (25 % longs) | **33 légers · 13 moyens · 5 longs (10 % longs)** | P1: 7 · P2: 31 · P3: 13 · P4: 0 · P5: 0 |
| ia-agentique-telco | 38 | 6 légers · 16 moyens · 16 longs (42 % longs) | **14 légers · 16 moyens · 8 longs (21 % longs)** | P1: 4 · P2: 12 · P3: 19 · P4: 3 · P5: 0 |
| ingenieur-caas-telco | 63 | 12 légers · 29 moyens · 22 longs (35 % longs) | **30 légers · 26 moyens · 7 longs (11 % longs)** | P1: 14 · P2: 21 · P3: 27 · P4: 1 · P5: 0 |
| integrateur-nf-5gc | 36 | 4 légers · 13 moyens · 19 longs (53 % longs) | **14 légers · 15 moyens · 7 longs (19 % longs)** | P1: 5 · P2: 14 · P3: 16 · P4: 1 · P5: 0 |
| parcours-sylva | 28 | 5 légers · 13 moyens · 10 longs (36 % longs) | **17 légers · 10 moyens · 1 longs (4 % longs)** | P1: 4 · P2: 17 · P3: 7 · P4: 0 · P5: 0 |
| sre-exploitation-telco | 44 | 11 légers · 24 moyens · 9 longs (20 % longs) | **20 légers · 17 moyens · 7 longs (16 % longs)** | P1: 2 · P2: 17 · P3: 21 · P4: 4 · P5: 0 |

## Grille à valider (un palier par bloc)

### architecte-caas-telco : Architecte cloud / CaaS telco

*Rôle : Choisit, dimensionne et documente ; arbitre entre alternatives.*

| Bloc | Palier | Compétences | Dont exceptions | Investissement | Raison |
|---|---|---|---|---|---|
| Fondations | **2** | 4 | 1 | 3 l · 1 m · 0 L | Présupposés ; le palier 2 évite un trou avec les prérequis directs. |
| Kubernetes et OpenShift | **3** | 14 | 3 | 4 l · 5 m · 5 L | Il faut avoir pratiqué pour arbitrer. |
| Réseau telco | **3** | 7 | 3 | 0 l · 5 m · 2 L | Le réseau est le point dur des choix d'architecture. |
| Performance et dimensionnement | **3** | 4 | 2 | 0 l · 0 m · 4 L | Comprendre les leviers de performance ; seul le dimensionnement est un livrable de l architecte. |
| Stockage et virtualisation | **3** | 5 | 4 | 2 l · 1 m · 2 L | Choisir entre alternatives suppose de les avoir vues fonctionner. |
| Résilience et exploitabilité | **3** | 5 | 3 | 0 l · 2 m · 3 L | Connaître les mécanismes ; les arbitrages portent sur la reprise et la conception de l observabilité. |
| Sécurité et conformité | **2** | 11 | 6 | 4 l · 5 m · 2 L | Intégrer les exigences ; la conformité détaillée est portée par la sécurité. |
| Cœur 5G et CNF | **3** | 5 | 3 | 0 l · 2 m · 3 L | Comprendre la charge pour concevoir la plateforme. |
| Conception et gouvernance | **4** | 6 | 5 | 1 l · 1 m · 4 L | Cœur du rôle : décider et justifier ; la conception complète (P5) est réservée aux livrables. |

Exceptions : `ocp-multicluster` → P4 (Choix de topologie.) ; `ocp-rds` → P4 (Choix de profil de référence.) ; `distrib-alt` → P4 (Comparaison d'alternatives.) ; `dpdk` → P2 (Savoir quand c'est nécessaire, sans le mettre en œuvre.) ; `sctp-flux` → P2 (Savoir l'exposer, sans le détailler.) ; `archi-reseau-support` → P4 (Décision structurante.) ; `dimensionnement` → P5 (Livrable du rôle.) ; `stockage-dr` → P4 (Arbitrage reprise / coût.) ; `openstack` → P2 (Alternative à situer.) ; `sec-durcissement` → P3 (Exigence structurante de l'architecture.) ; `sec-reseau` → P3 (Segmentation décidée à la conception.) ; `reg-souverainete` → P4 (Arbitre les choix d'hébergement.) ; `reg-risque` → P3 (Revu après second avis : Contribue à EBIOS, ne le pilote pas) ; `matrice-exigences` → P4 (Outil d'arbitrage.) ; `reseau-ip` → P4 (Remonté : prérequis direct de hld-lld (palier 5)) ; `ha-geo` → P4 (Arbitrage de topologie.) ; `pra-rpo-rto` → P4 (Arbitrage reprise / coût.) ; `observabilite-design` → P4 (Conception de l observabilité.) ; `reg-anssi` → P3 (Référentiel dont dépendent les arbitrages de souveraineté et de risque.) ; `hld-lld` → P5 (Livrable du rôle.) ; `adr` → P5 (Livrable du rôle.) ; `cout-energie` → P2 (Intégrer le critère, sans le modéliser.) ; `cycle-vie-plateforme` → P3 (Comprendre pour planifier.) ; `certifs` → P1 (Information.) ; `nfv-etsi` → P2 (Revu après second avis : Culture et vocabulaire, situer dans l'architecture) ; `sec-5g` → P2 (Revu après second avis : Situer l'architecture de sécurité 5G) ; `cnf-onboarding` → P4 (Remonté : prérequis direct de dimensionnement (palier 5)) ; `ceph` → P4 (Remonté : prérequis direct de dimensionnement (palier 5)) ; `perf-profile` → P4 (Remonté : prérequis direct de dimensionnement (palier 5)) ; `reg-rgpd` → P3 (Remonté : prérequis direct de reg-souverainete (palier 4))

### devops-integrateur-nf : Intégrateur DevOps : acculturation aux NF

*Rôle : Profil DevOps qui apprend le domaine télécom pour intégrer des NF : acculturation, packaging, CI/CD.*

| Bloc | Palier | Compétences | Dont exceptions | Investissement | Raison |
|---|---|---|---|---|---|
| Acculturation télécom | **2** | 6 | 0 | 6 l · 0 m · 0 L | Comprendre le vocabulaire et dialoguer avec les experts. |
| Socle plateforme | **2** | 7 | 0 | 7 l · 0 m · 0 L | Acquis DevOps à vérifier. |
| Réseau pour DevOps | **1** | 5 | 1 | 5 l · 0 m · 0 L | Savoir pourquoi le réseau telco est différent. |
| Cœur 5G pour non-spécialistes | **2** | 9 | 1 | 8 l · 1 m · 0 L | Lire un flux, sans le dépanner. |
| Packaging, livraison et documentation | **3** | 7 | 1 | 0 l · 5 m · 2 L | Cœur du métier. |
| CI/CD et tests | **3** | 6 | 0 | 0 l · 3 m · 3 L | Cœur du métier. |
| Exploitation et observabilité | **2** | 6 | 0 | 3 l · 3 m · 0 L | Comprendre ce qu'on livre en production. |
| Sécurité et conformité | **1** | 5 | 2 | 4 l · 1 m · 0 L | Connaître les exigences. |

Exceptions : `pieges-reseau` → P2 (Évite les erreurs fréquentes.) ; `deploiement-lab` → P3 (Mise en pratique centrale.) ; `sec-supply` → P2 (Lié à la livraison.) ; `sec-secrets` → P2 (Geste de pipeline.) ; `etsi-sol` → P2 (Revu après second avis : Lire les descripteurs, norme rarement manipulée)

### ia-agentique-telco : IA, agents et inférence sur plateforme télécom

*Rôle : Héberge et opère des charges IA (inférence, agents) sur la plateforme télécom.*

| Bloc | Palier | Compétences | Dont exceptions | Investissement | Raison |
|---|---|---|---|---|---|
| Prérequis plateforme | **2** | 3 | 2 | 2 l · 1 m · 0 L | Présupposés. |
| Fondations IA | **2** | 3 | 2 | 2 l · 1 m · 0 L | Comprendre sans entraîner. |
| Inférence | **3** | 5 | 2 | 1 l · 1 m · 3 L | Cœur du rôle. |
| Plateforme GPU | **2** | 4 | 3 | 0 l · 2 m · 2 L | Exploiter ce qui est configuré. |
| Agents et outils | **3** | 5 | 3 | 3 l · 1 m · 1 L | Cœur du rôle. |
| RAG et données | **2** | 3 | 2 | 0 l · 3 m · 0 L | Comprendre l'architecture. |
| LLMOps et observabilité | **2** | 4 | 2 | 0 l · 4 m · 0 L | Suivre un service IA. |
| Sécurité et conformité IA | **1** | 5 | 4 | 3 l · 1 m · 1 L | Connaître les risques et obligations. |
| IA pour le réseau télécom | **2** | 6 | 4 | 3 l · 2 m · 1 L | Cas d'usage à situer. |

Exceptions : `gpu-operator` → P3 (Point d'entrée de la plateforme GPU.) ; `ia-sec-owasp` → P2 (Risque spécifique aux agents.) ; `tel-agent-noc` → P3 (Cas d'usage phare.) ; `ag-a2a` → P1 (Revu après second avis : Protocole émergent, situer sans pratiquer) ; `ag-frameworks` → P2 (Revu après second avis : Fournis par les développeurs, lire un exemple suffit) ; `tel-nwdaf` → P1 (Revu après second avis : Fonction cœur 5G hors périmètre opérationnel direct) ; `tel-camara` → P1 (Revu après second avis : API d'ouverture, situer sans opérer) ; `k8s-workloads` → P3 (Revu après second avis (écart de rangs) : déploie les serveurs d inférence) ; `obs-metrics` → P3 (Revu après second avis (écart de rangs) : branche les métriques d inférence) ; `ia-modeles-ouverts` → P3 (Revu après second avis (écart de rangs) : choix de modèles et licences récurrent) ; `ia-quantification` → P3 (Revu après second avis (écart de rangs) : arbitrage qualité / mémoire GPU) ; `inf-vllm` → P4 (Revu après second avis (écart de rangs) : régler et diagnostiquer le moteur d inférence) ; `inf-bench` → P4 (Revu après second avis (écart de rangs) : décisions de dimensionnement chiffrées) ; `gpu-partage` → P3 (Revu après second avis (écart de rangs) : MIG et partage à pratiquer) ; `gpu-ordonnancement` → P3 (Revu après second avis (écart de rangs) : quotas à pratiquer) ; `ag-garde-fous` → P4 (Revu après second avis (écart de rangs) : responsabilité d opérateur : arbitrer droits et validations) ; `rag-bases` → P3 (Revu après second avis (écart de rangs) : monter un RAG pour l héberger) ; `rag-vectoriel` → P3 (Revu après second avis (écart de rangs) : choisir et opérer la base) ; `llmops-gateway` → P3 (Revu après second avis (écart de rangs) : quotas et bascule à pratiquer) ; `llmops-obs` → P3 (Revu après second avis (écart de rangs) : diagnostic de latence en exploitation) ; `sec-supply` → P3 (Revu après second avis (écart de rangs) : vérifier la provenance des modèles hébergés) ; `reg-souverainete` → P2 (Revu après second avis (écart de rangs) : choix d hébergement à appliquer) ; `reg-ia-anssi` → P2 (Revu après second avis (écart de rangs) : lire et appliquer) ; `tel-aiops` → P3 (Revu après second avis (écart de rangs) : outil de diagnostic à mettre en œuvre)

### ingenieur-caas-telco : Ingénieur CaaS telco

*Rôle : Construit et exploite la plateforme CaaS ; pas l'arbitre des choix d'architecture.*

| Bloc | Palier | Compétences | Dont exceptions | Investissement | Raison |
|---|---|---|---|---|---|
| Fondations | **2** | 5 | 2 | 5 l · 0 m · 0 L | Présupposés du métier : on doit les reconnaître et les lire, pas les réapprendre. |
| Kubernetes cœur | **3** | 6 | 1 | 4 l · 1 m · 1 L | Outil quotidien : il faut le pratiquer en lab. |
| Plateforme CaaS / OpenShift | **3** | 6 | 1 | 1 l · 2 m · 3 L | Cœur du métier : installer, opérer, mettre à jour. |
| Réseau telco | **3** | 6 | 0 | 0 l · 3 m · 3 L | Spécificité telco de la plateforme (Multus, SR-IOV) : à pratiquer. |
| Performance temps réel | **2** | 2 | 0 | 0 l · 2 m · 0 L | Savoir lire et appliquer un profil de performance fourni. |
| Stockage | **2** | 2 | 0 | 1 l · 1 m · 0 L | Utiliser le stockage fourni ; la conception revient à l'architecte. |
| Virtualisation | **2** | 3 | 3 | 2 l · 1 m · 0 L | Utiliser, pas concevoir. |
| Automatisation | **3** | 4 | 1 | 0 l · 4 m · 0 L | Le levier principal du métier. |
| Observabilité | **3** | 4 | 1 | 1 l · 3 m · 0 L | On ne peut pas opérer sans voir. |
| Sécurité | **2** | 5 | 1 | 3 l · 2 m · 0 L | Appliquer les durcissements ; expertise sécurité hors rôle. |
| Réglementation France et Europe | **1** | 11 | 0 | 11 l · 0 m · 0 L | 11 compétences : savoir ce qui s'applique et d'où viennent les exigences ; la conformité est portée par le RSSI. |
| CNF et 5G Core | **2** | 4 | 0 | 1 l · 3 m · 0 L | Comprendre la charge qu'on héberge, sans l'intégrer. |
| Résilience et exploitation | **2** | 2 | 1 | 0 l · 2 m · 0 L | Connaître les mécanismes de reprise. |
| Design et dimensionnement | **2** | 3 | 1 | 1 l · 2 m · 0 L | Contribuer aux dossiers, sans les porter. |

Exceptions : `linux` → P3 (Base de tout dépannage.) ; `conteneurs` → P3 (Prérequis direct de Kubernetes.) ; `k8s-troubleshoot` → P4 (Diagnostiquer est le cœur du métier.) ; `kubevirt` → P3 (Demande forte dans ce rôle.) ; `sec-secrets` → P3 (Geste quotidien.) ; `incident-astreinte` → P3 (Pratique d'exploitation.) ; `certifs` → P1 (Information, pas apprentissage.) ; `distrib-alt` → P2 (Revu après second avis : Culture comparative, pas exploitation quotidienne) ; `openstack` → P1 (Revu après second avis : Culture de migration, pas de pratique) ; `nfv-etsi` → P1 (Revu après second avis : Contexte historique, situer seulement) ; `operators-dev` → P2 (Revu après second avis : Lire un opérateur, développement hors rôle) ; `obs-telemetry` → P2 (Revu après second avis : Spécialisé, lire et suivre un exemple)

### integrateur-nf-5gc : Intégrateur NF, domaine 5GC

*Rôle : Intègre des fonctions réseau d'éditeurs sur la plateforme : procédures 5G, recette, multi-éditeurs.*

| Bloc | Palier | Compétences | Dont exceptions | Investissement | Raison |
|---|---|---|---|---|---|
| Fondations 5G | **3** | 4 | 1 | 4 l · 0 m · 0 L | Langage du métier. |
| Fonctions du cœur 5G | **3** | 6 | 2 | 0 l · 6 m · 0 L | Cœur du métier. |
| Procédures et interconnexion | **3** | 5 | 3 | 2 l · 3 m · 0 L | Cœur du métier. |
| Plateforme et CNF | **2** | 6 | 0 | 4 l · 2 m · 0 L | Consommer la plateforme, sans l'exploiter. |
| Tests et validation | **3** | 4 | 0 | 0 l · 1 m · 3 L | Livrable du rôle. |
| Exploitation et supervision | **2** | 4 | 0 | 1 l · 3 m · 0 L | Diagnostiquer une NF, sans être SRE. |
| Sécurité et conformité | **1** | 3 | 0 | 3 l · 0 m · 0 L | Connaître les exigences à respecter. |
| Intégration multi-éditeurs | **3** | 4 | 1 | 0 l · 0 m · 4 L | Cœur du métier. |

Exceptions : `pcf-chf` → P2 (Fonction avancée, moins fréquente.) ; `slicing` → P2 (Fonction avancée.) ; `sepp` → P1 (Revu après second avis : Interconnexion hors périmètre d'intégration courante) ; `interfonctionnement-4g` → P2 (Contexte de migration.) ; `ims-voix` → P1 (Périmètre voisin.) ; `multi-editeurs` → P4 (Arbitrer entre comportements d'éditeurs.) ; `identifiants` → P2 (Revu après second avis : Lire SUPI/SUCI/DNN dans traces et configurations suffit)

### parcours-sylva : Parcours Sylva : la pile cloud télécom open source

*Rôle : Déploie et opère une plateforme Sylva (pile open source telco).*

| Bloc | Palier | Compétences | Dont exceptions | Investissement | Raison |
|---|---|---|---|---|---|
| Socle Kubernetes et GitOps | **2** | 5 | 0 | 5 l · 0 m · 0 L | Présupposés. |
| Comprendre Sylva | **3** | 4 | 1 | 2 l · 2 m · 0 L | Cœur du parcours. |
| Déployer une plateforme Sylva | **3** | 5 | 2 | 0 l · 5 m · 0 L | Cœur du parcours. |
| Opérer la plateforme | **2** | 8 | 2 | 5 l · 2 m · 1 L | Opérer au quotidien sans être expert de chaque brique. |
| Charges télécom | **2** | 6 | 3 | 5 l · 1 m · 0 L | Comprendre les besoins des charges. |

Exceptions : `sylva-metal3` → P2 (Spécialisé.) ; `sylva-suse` → P2 (Spécialisé.) ; `sylva-upgrade` → P3 (Opération critique.) ; `sec-supply` → P1 (Sensibilisation.) ; `perf-hugepages` → P1 (Savoir le demander.) ; `perf-profile` → P1 (Savoir le demander.) ; `sriov` → P1 (Savoir le demander.) ; `sylva-projet` → P2 (Remonté : prérequis direct de sylva-architecture (palier 3))

### sre-exploitation-telco : SRE / exploitation telco cloud (NOC, astreinte)

*Rôle : Garde la plateforme debout : observer, diagnostiquer, répondre aux incidents, améliorer.*

| Bloc | Palier | Compétences | Dont exceptions | Investissement | Raison |
|---|---|---|---|---|---|
| Fondations | **2** | 6 | 1 | 6 l · 0 m · 0 L | Présupposés. |
| Kubernetes en exploitation | **3** | 7 | 2 | 5 l · 1 m · 1 L | Outil de diagnostic quotidien. |
| Plateforme CaaS | **2** | 2 | 0 | 1 l · 1 m · 0 L | Opérer ce qui est installé par d'autres. |
| Réseau de la plateforme | **2** | 3 | 1 | 2 l · 0 m · 1 L | Comprendre pour dépanner. |
| Observabilité et alerting | **3** | 6 | 1 | 1 l · 5 m · 0 L | Cœur du métier. |
| Incidents et astreinte | **4** | 4 | 1 | 0 l · 0 m · 4 L | Diagnostiquer et arbitrer sous pression. |
| Fiabilité et résilience | **2** | 5 | 2 | 1 l · 3 m · 1 L | Connaître les mécanismes ; pratiquer ciblé. |
| Exploitation des NF et du 5G Core | **2** | 2 | 1 | 0 l · 2 m · 0 L | Lire l'état d'une NF. |
| Changement et automatisation | **3** | 5 | 0 | 0 l · 5 m · 0 L | Réduire le travail manuel est un objectif du rôle. |
| Sécurité et conformité d'exploitation | **1** | 4 | 2 | 4 l · 0 m · 0 L | Réagir aux alertes de sécurité sans être l'équipe sécurité. |

Exceptions : `sre-slo` → P3 (Langage commun du rôle.) ; `k8s-troubleshoot` → P4 (Diagnostic.) ; `depannage-reseau-telco` → P3 (Dépannage pratiqué.) ; `obs-telemetry` → P2 (Avancé, après les bases.) ; `postmortem` → P3 (Pratique d'équipe.) ; `chaos` → P3 (Pratique du rôle.) ; `capacite` → P3 (Pratique du rôle.) ; `procedures-5g-diagnostic` → P3 (Diagnostic de première ligne.) ; `gestion-vulns` → P2 (Suivre les correctifs.) ; `sec-detection` → P2 (Lire les alertes.) ; `k8s-rbac` → P2 (Revu après second avis : Lire les droits; conception relève de l'ingénierie)

## Contrôles automatiques

- **Cohérence de la grille** : aucune alerte.
- **Prérequis** (un prérequis direct ciblé 2 paliers sous la compétence qui en dépend) : 0 cas.
- **Compétences partagées dont le palier diffère de 2 ou plus selon le rôle** : 19 cas (la raison doit se lire dans la grille de chaque rôle).
  - `reseau-ip` : architecte-caas-telco P4, devops-integrateur-nf P1, ingenieur-caas-telco P2, sre-exploitation-telco P2
  - `distrib-alt` : architecte-caas-telco P4, ingenieur-caas-telco P2
  - `cni` : architecte-caas-telco P3, devops-integrateur-nf P1, ingenieur-caas-telco P3, parcours-sylva P2, sre-exploitation-telco P2
  - `multus` : architecte-caas-telco P3, devops-integrateur-nf P1, ingenieur-caas-telco P3, parcours-sylva P2, sre-exploitation-telco P2
  - `sriov` : architecte-caas-telco P3, devops-integrateur-nf P1, ingenieur-caas-telco P3, parcours-sylva P1
  - `perf-hugepages` : architecte-caas-telco P3, ingenieur-caas-telco P2, parcours-sylva P1
  - `perf-profile` : architecte-caas-telco P4, ingenieur-caas-telco P2, parcours-sylva P1
  - `dimensionnement` : architecte-caas-telco P5, ingenieur-caas-telco P2
  - `ceph` : architecte-caas-telco P4, ingenieur-caas-telco P2, sre-exploitation-telco P2
  - `stockage-dr` : architecte-caas-telco P4, ingenieur-caas-telco P2, sre-exploitation-telco P2
  - `ha-geo` : architecte-caas-telco P4, ingenieur-caas-telco P2, sre-exploitation-telco P2
  - `sec-durcissement` : architecte-caas-telco P3, ingenieur-caas-telco P2, sre-exploitation-telco P1
  - `sec-supply` : architecte-caas-telco P2, devops-integrateur-nf P2, ia-agentique-telco P3, ingenieur-caas-telco P2, parcours-sylva P1
  - `reg-anssi` : architecte-caas-telco P3, ingenieur-caas-telco P1
  - `reg-rgpd` : architecte-caas-telco P3, ingenieur-caas-telco P1
  - `reg-souverainete` : architecte-caas-telco P4, ia-agentique-telco P2, ingenieur-caas-telco P1
  - `reg-risque` : architecte-caas-telco P3, ingenieur-caas-telco P1
  - `cnf-onboarding` : architecte-caas-telco P4, ingenieur-caas-telco P2
  - `hld-lld` : architecte-caas-telco P5, ingenieur-caas-telco P2
- **Preuve du palier 2** (segment pratique dans content/pratique) : 116 compétences au palier 2 sans segment pratique, dont la preuve est donc à définir.
- **Paliers 4 et 5** (preuve hors site : cas de panne ou d'arbitrage corrigé, livrable) : 27 compétences concernées.

## Échantillon à relire (15 compétences, tirage reproductible)

Question pour chaque ligne : « un professionnel de ce rôle devrait-il atteindre ce palier, ni plus ni moins ? ». Seuil proposé : 13 sur 15 jugés justes ; sinon on corrige les règles et on retire un échantillon.

| # | Parcours | Compétence | Niveau | Palier proposé | Origine | Justification | Juste ? |
|---|---|---|---|---|---|---|---|
| 1 | architecte-caas-telco | Ceph / Rook / ODF (`ceph`) | intermediaire | **P4** | exception | Remonté : prérequis direct de dimensionnement (palier 5) | |
| 2 | devops-integrateur-nf | Cycle de vie d'une NF selon ETSI NFV (SOL, CSAR, CNF) (`etsi-sol`) | avance | **P2** | exception | Revu après second avis : Lire les descripteurs, norme rarement manipulée | |
| 3 | ia-agentique-telco | Observabilité des applications d'IA (`llmops-obs`) | intermediaire | **P3** | exception | Revu après second avis (écart de rangs) : diagnostic de latence en exploitation | |
| 4 | ingenieur-caas-telco | Télécoms 101 (4G/5G, cœur de réseau) (`telco-101`) | fondamental | **P2** | bloc | Présupposés du métier : on doit les reconnaître et les lire, pas les réapprendre. | |
| 5 | integrateur-nf-5gc | Réglementation France et Europe applicable au 5GC (`reglementation-5gc`) | avance | **P1** | bloc | Connaître les exigences à respecter. | |
| 6 | parcours-sylva | Prometheus, Alertmanager, Thanos (`obs-metrics`) | intermediaire | **P2** | bloc | Opérer au quotidien sans être expert de chaque brique. | |
| 7 | sre-exploitation-telco | Git et CI/CD (`git-ci`) | fondamental | **P2** | bloc | Présupposés. | |
| 8 | architecte-caas-telco | Exploitation de CNF : scaling, upgrade, panne (`cnf-ops`) | avance | **P3** | bloc | Comprendre la charge pour concevoir la plateforme. | |
| 9 | devops-integrateur-nf | Workloads : Pods, Deployments, StatefulSets, Jobs (`k8s-workloads`) | fondamental | **P2** | bloc | Acquis DevOps à vérifier. | |
| 10 | ia-agentique-telco | Évaluation continue des modèles (`llmops-eval`) | avance | **P2** | bloc | Suivre un service IA. | |
| 11 | sre-exploitation-telco | Stockage Kubernetes : PV, PVC, StorageClass (`k8s-stockage`) | fondamental | **P3** | bloc | Outil de diagnostic quotidien. | |
| 12 | ingenieur-caas-telco | Exploitation de CNF : scaling, upgrade, panne (`cnf-ops`) | avance | **P2** | bloc | Comprendre la charge qu'on héberge, sans l'intégrer. | |
| 13 | integrateur-nf-5gc | Intégration multi-éditeurs et interopérabilité (`multi-editeurs`) | avance | **P4** | exception | Arbitrer entre comportements d'éditeurs. | |
| 14 | integrateur-nf-5gc | Dossier d'intégration : schémas, flux, plan d'adressage (`dossier-integration`) | avance | **P3** | bloc | Cœur du métier. | |
| 15 | ia-agentique-telco | Déployer des modèles avec KServe (`inf-kserve`) | intermediaire | **P3** | bloc | Cœur du rôle. | |
