# CRM Beta V2 — Redesign par prestation

**Date :** 2026-04-09  
**Statut :** Validé  
**Basé sur :** Plaquettes commerciales Propul'SEO (Site Web & SEO, ERP Sur Mesure, Accompagnement Communication)

---

## 1. Vision

Refondre le CRM Beta V2 autour des **3 prestations réelles** de Propul'SEO, avec un module dédié par pôle dans la sidebar, chacun avec son kanban, sa fiche projet métier et ses KPIs. Un Dashboard global agrège les 3 pôles.

---

## 2. Architecture globale

### Sidebar Beta V2
```
📊 Dashboard V2          ← agrège les 3 pôles
🌐 Site Web & SEO        ← module dédié
⚙️  ERP Sur Mesure       ← module dédié
📱 Communication         ← module dédié
```

### Règle commune à tous les modules
- Kanban avec colonnes propres au pôle
- Fiche projet avec onglets : **Infos** | **Brief** | **Checklist** | **Journal** | **Facturation**
- Onglet "Brief" : champs dynamiques selon le type de prestation
- Onglet "Checklist" : pré-rempli selon le type, étapes personnalisables (ajout/suppression)
- Bandeau KPIs en haut du module

---

## 3. Dashboard V2 (global)

**Métriques affichées :**
- CA total signé (mois en cours)
- CA ventilé par pôle : Site Web | ERP | Communication
- Nb projets actifs par pôle
- Projets signés ce mois (tous pôles)
- MRR Communication (somme des abonnements actifs)
- Taux de conversion global : leads → signés

---

## 4. Module Site Web & SEO

### Kanban — colonnes
`Prospect → Devis envoyé → Signé → En production → Livré → Perdu`

### Onglet Brief — champs spécifiques
| Champ | Type | Valeurs |
|-------|------|---------|
| Pack | select | Starter · Professionnel · Entreprise · Sur mesure |
| Nb pages | number | auto selon pack (1 / 5 / 10 / libre) |
| Budget | number | auto selon pack (1480 / 1980 / 2980 / devis) |
| Niveau SEO | select | Basique · Avancé · Premium |
| URL site final | text | — |
| Plateforme | text | ex: WordPress, Webflow… |

### Checklist pré-remplie
1. Brief client reçu
2. Maquette créée
3. Maquette validée client
4. Développement
5. SEO technique implémenté
6. Contenu intégré
7. Tests responsive & performance
8. Mise en ligne
9. Formation plateforme de modifications
10. Livraison finale + demande avis client

### KPIs bandeau haut
- CA signé ce mois | CA livré | Nb projets actifs | Pack le plus vendu

---

## 5. Module ERP Sur Mesure

### Kanban — colonnes
`Prospect → Analyse besoins → Devis envoyé → Signé → En développement → Recette → Livré → Perdu`

### Onglet Brief — champs spécifiques
| Champ | Type | Valeurs |
|-------|------|---------|
| Modules sélectionnés | multi-select | Gestion commerciale · CRM & suivi client · Gestion de projets · Stocks & logistique · Suivi financier · Multi-utilisateurs · Tableaux de bord · Connexions API · Module sur mesure |
| Nb utilisateurs | number | — |
| Budget estimé | number | devis libre |
| Outils à intégrer | text | ex: Stripe, Shopify, Notion… |
| URL déploiement | text | — |

### Checklist pré-remplie
1. Audit besoins client
2. Cahier des charges rédigé
3. CDC validé client
4. Maquettes UX validées
5. Base de données conçue
6. Modules développés
7. Intégrations API configurées
8. Tests & corrections
9. Formation utilisateurs
10. Déploiement production
11. Recette signée client

### KPIs bandeau haut
- CA signé | CA livré | Nb modules moyen par projet | Nb projets en développement

---

## 6. Module Communication

### Kanban — colonnes
`Prospect → Brief créatif → Devis envoyé → Signé → En production → Actif → Terminé → Perdu`

> La colonne **"Actif"** est permanente pour les abonnements en cours.

### Types de contrat
- **Abonnement Instagram** (récurrent mensuel)
- **Branding** (one-shot)
- **Photos & Vidéos** (one-shot)

### Onglet Brief — champs communs
| Champ | Type | Valeurs |
|-------|------|---------|
| Type de contrat | select | Abonnement Instagram · Branding · Photos & Vidéos |
| Budget | number | auto ou libre |
| Date début | date | — |

### Champs si Abonnement Instagram
| Champ | Type | Valeurs |
|-------|------|---------|
| Pack | select | Starter (600€/m) · Premium (900€/m) · Excellence (1400€/m) |
| Nb posts/mois | number | auto : 6 / 8 / 12 |
| Nb réels/mois | number | auto : 0 / 1 / 2 |
| Nb templates | number | auto : 0 / 2 / 4 |
| Plateforme | select | Instagram · LinkedIn · Multi |
| Date renouvellement | date | auto : début +1 mois |
| MRR | number | auto selon pack |

### Champs si Branding ou Photos & Vidéos
| Champ | Type | Valeurs |
|-------|------|---------|
| Budget | number | 1500€ (pré-rempli, modifiable) |
| Date livraison | date | — |

### Checklist pré-remplie — Abonnement Instagram
1. Brief mensuel reçu
2. Calendrier éditorial validé
3. Visuels créés
4. Textes rédigés
5. Validation client
6. Programmation des posts
7. Rapport de performance envoyé

### Checklist pré-remplie — Branding
1. Brief identité reçu
2. Propositions logo x3
3. Logo validé client
4. Charte graphique (couleurs, typographies)
5. Déclinaisons livrées
6. Livraison fichiers sources

### Checklist pré-remplie — Photos & Vidéos
1. Brief tournage reçu
2. Date tournage confirmée
3. Tournage réalisé
4. Sélection photos/vidéos
5. Retouches
6. Livraison base média client

### Onglet "Suivi mensuel" (abonnements uniquement)

Système de **cycles mensuels** dans la fiche projet :

```
📅 Avril 2026        [✅ Terminé]
  ☑ Brief mensuel reçu
  ☑ Calendrier éditorial validé
  ☑ Visuels créés
  ...

📅 Mai 2026          [🔄 En cours]
  ☑ Brief mensuel reçu
  ☐ Calendrier éditorial validé
  ☐ Visuels créés
  ...

[+ Nouveau mois]
```

**Règles :**
- Chaque cycle est créé manuellement via le bouton `+ Nouveau mois` (ou automatiquement au 1er du mois — à décider)
- La checklist de chaque cycle est pré-remplie selon le pack mais entièrement modifiable
- Les cycles passés restent en lecture (historique consultable)
- Un cycle est "Terminé" quand toutes ses étapes sont cochées

### KPIs bandeau haut
- MRR total (abonnements actifs) | Nb abonnés actifs | Pack le plus vendu | CA one-shot ce mois

---

## 7. Champs communs à tous les projets (onglet Infos)

- Nom du projet
- Client (lié à la table `clients`)
- Responsable (assigné à un membre de l'équipe)
- Date de début / Date de fin estimée
- Statut kanban (synchronisé avec la colonne)
- Notes internes

---

## 8. Base de données — évolutions `projects_v2`

### Champ `presta_type` — nouvelles valeurs
```
site_web | erp | communication
```
*(remplace les anciens : web/seo/erp/saas)*

### Nouveaux champs à ajouter
```sql
-- Site Web
pack_web          TEXT  -- starter | professionnel | entreprise | sur_mesure
nb_pages          INT
url_site          TEXT
seo_level         TEXT  -- basique | avancé | premium
plateforme_web    TEXT

-- ERP
modules_erp       TEXT[]  -- array multi-select
nb_utilisateurs   INT
outils_integres   TEXT
url_deploiement   TEXT

-- Communication
type_contrat_comm TEXT  -- abonnement | branding | photos_videos
pack_comm         TEXT  -- starter | premium | excellence
nb_posts_mois     INT
nb_reels_mois     INT
plateforme_comm   TEXT
date_renouvellement DATE
mrr               NUMERIC

-- Cycles mensuels Communication (nouvelle table)
-- Table : comm_monthly_cycles
--   id, project_id, mois (DATE), statut, created_at
-- Table : comm_cycle_tasks
--   id, cycle_id, label, done, position
```

---

## 9. Ce qui est hors scope (V2)

- Intégration automatique calendrier / scheduling posts
- Notifications de renouvellement d'abonnement
- Portail client par prestation
- Reporting PDF automatisé
