# Guide des bonnes pratiques — Suivi des deals (CRM ERP)

> Propul'SEO CRM · Version 2 · Mis à jour le 2026-04-05

---

## Sommaire

1. [Pipeline et étapes clés](#1-pipeline-et-étapes-clés)
2. [Créer un deal correctement](#2-créer-un-deal-correctement)
3. [Suivre les activités](#3-suivre-les-activités)
4. [Gérer le Kanban au quotidien](#4-gérer-le-kanban-au-quotidien)
5. [Filtrer et retrouver ses deals](#5-filtrer-et-retrouver-ses-deals)
6. [Surveiller les KPIs (Dashboard V2)](#6-surveiller-les-kpis-dashboard-v2)
7. [Règles d'équipe](#7-règles-déquipe)
8. [Erreurs fréquentes à éviter](#8-erreurs-fréquentes-à-éviter)

---

## 1. Pipeline et étapes clés

Le CRM ERP utilise un pipeline en **4 colonnes Kanban**. Chaque deal progresse de gauche à droite.

| Étape | Signification | Quand avancer ? |
|-------|--------------|-----------------|
| **Leads contactés** | Premier contact établi (email, appel, LinkedIn) | Dès qu'un prospect a été contacté pour la première fois |
| **RDV effectués** | Au moins un rendez-vous a eu lieu | Après un appel de découverte ou une visio confirmée |
| **En attente** | Devis envoyé ou décision en cours | Proposition commerciale transmise, on attend retour |
| **Signés** | Contrat signé / deal gagné | Signature reçue, facturation peut démarrer |

> **Règle d'or** : un deal ne reste jamais plus de **7 jours** dans une colonne sans activité enregistrée.

---

## 2. Créer un deal correctement

### Champs obligatoires (à remplir dès la création)

| Champ | Pourquoi c'est important |
|-------|--------------------------|
| **Nom de l'entreprise** | Identification principale du deal dans le Kanban |
| **Nom du contact** | Point de contact humain — évite les confusions si plusieurs personnes |
| **Email** | Canal de relance prioritaire |
| **Source** | Comprendre d'où viennent les meilleurs deals (SEO, referral, LinkedIn…) |
| **Responsable (assignee)** | Sans assignation, le deal apparaît en alerte jaune → il sera mal suivi |

### Champs optionnels mais recommandés

- **Téléphone** — utile pour les relances rapides via Ringover
- **Notes initiales** — contexte de la prise de contact (besoin, budget, timing)

### À ne pas faire
- Créer un deal sans l'assigner immédiatement
- Laisser le champ "source" vide (données KPI faussées)
- Dupliquer un contact déjà existant dans les Contacts → vérifier d'abord

---

## 3. Suivre les activités

Chaque interaction avec un prospect **doit être enregistrée** dans la fiche du deal. C'est ce qui met à jour le champ `last_activity_at` et détermine l'ordre d'affichage dans le Kanban (les deals les plus récents en haut).

### Types d'activités disponibles

| Type | Quand l'utiliser |
|------|-----------------|
| **Appel** (`call`) | Appel téléphonique passé ou reçu |
| **Email** (`email`) | Email envoyé ou réponse reçue |
| **Réunion** (`meeting`) | Visio, rendez-vous physique, démo produit |
| **Note** (`note`) | Information interne (contexte, décision, point de vigilance) |
| **Tâche** (`task`) | Action à faire liée à ce deal (relance prévue, devis à envoyer) |

### Bonnes pratiques pour les activités

1. **Enregistrer immédiatement après l'interaction** — pas 3 jours après
2. **Être précis dans le contenu** : au lieu de "appelé", écrire "Appelé Jean-Marc, intéressé par la prestation SEO locale, budget ~2k€/mois, rappel prévu jeudi"
3. **Utiliser le type "Note"** pour les infos stratégiques (objections, concurrents cités, timing)
4. **Utiliser le type "Tâche"** pour les prochaines étapes concrètes

---

## 4. Gérer le Kanban au quotidien

### Routine recommandée (10 min/jour)

1. **Ouvrir le Kanban** en début de journée
2. **Filtrer par "Mes deals"** (filtre par assignee = soi-même)
3. **Identifier les deals sans activité récente** (ceux en bas de colonne = les plus anciens)
4. **Déplacer les deals** qui ont progressé depuis la veille
5. **Ajouter une activité** pour chaque deal contacté ce jour

### Utilisation du drag & drop

- Faire glisser une carte d'une colonne à l'autre pour changer le statut
- Le changement est **immédiat et sauvegardé** en base
- Si le déplacement est accidentel : rouvrir le deal et corriger le statut dans le formulaire

### Lecture des compteurs de colonne

Chaque colonne affiche :
- **Nombre total** de deals dans l'étape
- **Répartition assignés / non assignés** (badge jaune = non assigné = à traiter en priorité)

---

## 5. Filtrer et retrouver ses deals

### Recherche textuelle

La barre de recherche filtre en temps réel sur :
- Nom de l'entreprise
- Nom du contact
- Email
- Téléphone

Elle est **insensible aux accents** et à la casse → "elie" trouve "Élie".

### Filtre par responsable

- **"Tous les leads"** — vue manager, tous les deals de l'équipe
- **Sélection d'un membre** — vue individuelle pour le suivi 1:1
- **"Non assignés"** — deals orphelins à réattribuer en priorité

### Combinaison des filtres

Les deux filtres (recherche + responsable) sont cumulatifs. Exemple : chercher "Décathlon" dans les deals de Marie.

---

## 6. Surveiller les KPIs (Dashboard V2)

Le **Dashboard V2** offre une vue temps réel sur l'état du pipeline.

### Widget KPI Stats

| Métrique | Ce qu'elle mesure | Seuil d'alerte |
|----------|-------------------|----------------|
| **Leads actifs** | Deals en statut prospect/devis | < 5 = pipeline trop faible |
| **Projets actifs** | Projets en cours (post-signature) | À corréler avec leads signés |
| **Tâches du jour** | Tâches deadline = aujourd'hui | > 5 = journée surchargée |
| **CA du mois** | Revenus enregistrés ce mois | Comparer avec objectif mensuel |

### Widget Actions prioritaires

Ce widget remonte automatiquement :
- Tâches en retard liées aux deals
- Emails Gmail non répondus (prospects en attente de réponse)

> Traiter ce widget **chaque matin** avant d'ouvrir le Kanban.

### Widget Réunions à venir

Affiche les prochains rendez-vous du calendrier. Vérifier que chaque RDV deal a bien une fiche dans le CRM ERP.

---

## 7. Règles d'équipe

### Attribution des deals
- **Tout deal doit avoir un responsable** dès sa création
- En cas d'absence du responsable, **réassigner temporairement** plutôt que de laisser non assigné
- Le manager peut filtrer par "non assignés" chaque lundi pour nettoyer

### Collaboration sur un deal
- Les **notes** servent à la transmission d'info interne (visible par toute l'équipe)
- Ne pas modifier les activités d'un collègue sans le prévenir
- Si un deal change de responsable, ajouter une **note de passation** avec le contexte complet

### Fréquence de mise à jour recommandée

| Rôle | Fréquence |
|------|-----------|
| Commercial | Mise à jour quotidienne des activités |
| Manager | Revue hebdomadaire du Kanban complet |
| Toute l'équipe | Déplacement de colonne le jour même du changement de statut |

---

## 8. Erreurs fréquentes à éviter

| Erreur | Conséquence | Solution |
|--------|-------------|----------|
| Deal créé sans assignee | Badge jaune, invisibilité dans le suivi individuel | Toujours assigner à la création |
| Pas d'activité pendant > 7 jours | Deal perdu dans le bruit, relance oubliée | Utiliser une activité "Tâche" pour planifier la prochaine relance |
| Changer le statut sans ajouter d'activité | Historique incomplet, impossible de comprendre la progression | Toujours ajouter une activité quand on déplace une carte |
| Source laissée vide | Données KPI sur l'origine des deals faussées | Remplir dès la création (website, referral, LinkedIn, appel entrant…) |
| Dupliquer un deal existant | Double comptage dans les KPIs | Rechercher avant de créer |
| Notes trop vagues ("appelé", "mail envoyé") | Perte de contexte lors des relances ou passations | Détailler : qui, quoi dit, quelle suite |

---

## Annexe — Sources disponibles recommandées

Pour le champ **Source**, utiliser des valeurs cohérentes en équipe :

- `website` — formulaire du site propulseo-site.com
- `referral` — recommandation d'un client ou partenaire
- `linkedin` — prospection ou inbound LinkedIn
- `appel_entrant` — appel reçu directement
- `partenaire` — apporteur d'affaires
- `evenement` — salon, conférence, networking
- `cold_email` — campagne d'emailing sortant

---

*Ce guide est un document vivant — le mettre à jour dès que le workflow évolue.*
