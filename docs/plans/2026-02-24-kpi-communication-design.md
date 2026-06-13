# KPI Communication — Design Document

**Date**: 2026-02-24
**Status**: Approved
**Module**: CommunicationKPI (sous-item sidebar separe)

---

## Decisions de design

| Decision | Choix |
|----------|-------|
| Saisie metriques | Dans PostDetail existant (section conditionnelle si published) |
| Attribution leads | Compteur simple (leads_count + revenue dans post_metrics) |
| Navigation | Sous-item sidebar separe "KPI Communication" |
| Architecture data | Hybride : vues materialisees + calcul client filtres dynamiques |

---

## 1. Schema de donnees

### Table `post_metrics`

```sql
CREATE TABLE post_metrics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  -- Metriques engagement
  impressions     int DEFAULT 0,
  reach           int DEFAULT 0,
  engagement      int DEFAULT 0,
  clicks          int DEFAULT 0,
  shares          int DEFAULT 0,
  comments_count  int DEFAULT 0,
  saves           int DEFAULT 0,
  -- Metriques business
  leads_count     int DEFAULT 0,
  revenue         numeric(12,2) DEFAULT 0,
  -- Calculees
  engagement_rate numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0
    THEN (engagement::numeric / impressions * 100)
    ELSE 0 END
  ) STORED,
  performance_score numeric(5,2),
  -- Meta
  source          text DEFAULT 'manual' CHECK (source IN ('manual','linkedin_api','meta_api')),
  measured_at     timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(post_id)
);
```

### Performance Score Formula

```
performance_score =
  (engagement_rate * 0.3) +
  (LEAST(leads_count * 20, 50) * 0.4) +
  (LEAST(revenue / 100, 50) * 0.3)
```

Score normalise 0-100. Ponderation : 30% engagement, 40% leads, 30% revenue.

---

## 2. Vues materialisees

### `kpi_monthly_overview`

Agregation mensuelle par plateforme, type, responsable :
- posts_count, total_impressions, total_reach, total_engagement
- total_clicks, total_leads, total_revenue
- avg_engagement_rate, avg_performance_score
- roi_per_post (revenue / posts_count)

### `kpi_daily_metrics`

Agregation journaliere pour graphiques ligne :
- day, platform
- impressions, reach, engagement, leads_count, revenue

### `kpi_top_posts`

Top posts tries par performance_score DESC :
- Jointure posts + post_metrics
- Limite aux posts published

---

## 3. Trigger de refresh

`AFTER INSERT OR UPDATE ON post_metrics` → refresh concurrent des 3 vues.

---

## 4. Index

```sql
CREATE INDEX idx_post_metrics_post_id ON post_metrics(post_id);
CREATE INDEX idx_post_metrics_source ON post_metrics(source);
CREATE INDEX idx_posts_published_at ON posts(published_at) WHERE status = 'published';
-- Index uniques pour REFRESH CONCURRENTLY
CREATE UNIQUE INDEX ON kpi_monthly_overview(month, platform, type, responsible_user_id);
CREATE UNIQUE INDEX ON kpi_daily_metrics(day, platform);
CREATE UNIQUE INDEX ON kpi_top_posts(id);
```

---

## 5. Composants Frontend

```
src/modules/CommunicationKPI/
├── index.tsx
├── CommunicationKPIPage.tsx
├── types.ts
├── hooks/
│   ├── useKPIOverview.ts
│   ├── useKPIDailyMetrics.ts
│   ├── useKPITopPosts.ts
│   └── useKPIFilters.ts
└── components/
    ├── KPIFiltersBar.tsx
    ├── KPIOverviewCards.tsx
    ├── LinkedInChart.tsx
    ├── InstagramChart.tsx
    ├── LeadsRevenueChart.tsx
    ├── TypeBreakdownChart.tsx
    └── TopPostsTable.tsx
```

### Sidebar

Nouveau sous-item dans section "Communication" :
```typescript
{ id: 'communication-kpi', label: 'KPI Communication', icon: BarChart3,
  permission: 'can_view_communication', description: 'Analytique & performance' }
```

### Filtres globaux

- Periode : 7j / 30j / 90j / 12 mois
- Plateforme : Toutes / LinkedIn / Instagram / Newsletter
- Type : Tous / Agence / Perso / Client
- Responsable : Tous / liste users

### 6 cartes overview

| Carte | Calcul |
|-------|--------|
| Posts publies (mois) | COUNT posts published |
| Impressions totales | SUM impressions |
| Engagement rate moyen | AVG engagement_rate |
| Leads generes | SUM leads_count |
| CA genere | SUM revenue |
| ROI contenu | revenue / posts_count |

Chaque carte : valeur + tendance vs mois precedent.

### Charts (Recharts)

- **LinkedIn** : LineChart — impressions + engagement_rate (dual Y-axis)
- **Instagram** : LineChart — reach + engagement
- **Leads & Revenue** : ComposedChart — bars leads + ligne revenue
- **Type breakdown** : BarChart groupe — agence/perso/client x leads/CA/perf

### Top 10 Table

Colonnes triables : Titre, Plateforme, Type, Engagement Rate, Leads, CA, Performance Score.

---

## 6. PostDetail — Section Metriques

- Visible si `status === 'published'`
- Champs : impressions, reach, engagement, clicks, shares, comments, saves, leads, revenue
- Upsert dans `post_metrics`
- engagement_rate calcule automatiquement (GENERATED)
- performance_score recalcule par trigger

---

## 7. Scalabilite API future

- `source` distingue manual / linkedin_api / meta_api
- Edge Function cron futur : fetch API → insert post_metrics avec source API
- Trigger refresh regenere vues automatiquement
- Table `social_api_settings` creee au moment de l'integration
