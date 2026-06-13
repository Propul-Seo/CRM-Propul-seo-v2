# Roadmap V3 — Propul'SEO CRM

Chaque sprint = une session. Démarrer avec `/token-saver début` et terminer avec `/token-saver fin`.

---

## Sprint 1 — Session 1 ✅ (plan rédigé)

**Features :** F2 (Prochaine action Kanban) + F5 (Automatisations changement de statut)

**Plan :** `docs/superpowers/plans/2026-04-05-sprint1-next-action-automations.md`

**Livrable :** Badge "prochaine action" sur les cartes Kanban + tâches/journal auto au drag & drop

---

## Sprint 2 — Session 2

**Features :** F4 (Enrichissement SIRET/Pappers) + F6 (Dashboard "Mois en cours")

**À planifier en début de session avec `/token-saver début` puis rédiger le plan.**

### F4 — Enrichissement SIRET automatique
- Champ SIRET dans le formulaire de création projet
- Auto-fill via Pappers API (côté serveur, clé `PAPPERS_API_KEY`)
- Badge "Données enrichies via Pappers"
- Colonnes Supabase : `siret`, `company_data` (JSONB), `company_enriched_at`

### F6 — Vue "Mois en cours"
- 4 metric cards : CA encaissé, CA en attente, projets urgents, projets inactifs
- Liste "À livrer dans 14j" + liste "Sans activité depuis 7j"
- Refresh auto toutes les 5 min
- Nouveau module dans la navigation principale

---

## Sprint 3 — Session 3

**Feature :** F1 (Résumé IA automatique de la fiche client)

**Dépend des données accumulées en Sprint 1-2 (journal, checklist, statut).**

### F1 — Résumé IA
- Bouton "Résumer avec IA" dans l'onglet Vue d'ensemble
- Appel Claude API `claude-sonnet-4-6` (côté serveur uniquement — Edge Function Supabase)
- 3 blocs : Situation actuelle · Action en cours · Prochain jalon
- Persisté en base : `ai_summary` (JSONB), `ai_summary_generated_at`
- Badge "Généré il y a Xh" + bouton "Régénérer" si > 24h

---

## Sprint 4 — Session 4

**Feature :** F3 (Mini-portail client lecture seule)

**Plus complexe — RLS Supabase + page publique + design client-facing.**

### F3 — Portail client
- Bouton "Partager avec le client" → génère un token UUID
- URL publique : `/portal/[token]` (accessible sans auth)
- Contenu : statut pipeline, score complétude, prochaine action, checklist simplifiée, documents partagés, factures envoyées/payées
- RLS Supabase avec `portal_token` + `portal_enabled`
- Bouton "Désactiver le lien"

---

## Variables d'environnement à ajouter

| Sprint | Variable | Usage |
|--------|----------|-------|
| 2 | `PAPPERS_API_KEY` | Enrichissement SIRET |
| 3 | `ANTHROPIC_API_KEY` | Déjà présente (V2) |
| 4 | `VITE_APP_URL` | Construction URLs portail |

---

## Ordre de dépendances

```
Sprint 1 → Sprint 3 (F1 dépend du journal/checklist)
Sprint 1 → Sprint 4 (F3 affiche next_action de F2)
Sprint 2 → indépendant
Sprint 4 → indépendant mais bénéficie de F2 + F1
```
