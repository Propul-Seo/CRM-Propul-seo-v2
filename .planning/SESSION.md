# Session State — 2026-05-13 (autonomous mode)

## Branch
**preview/v3-ux-overhaul** (exception V3 isolée, pas de push, commits locaux uniquement)

## Plan E2E V3 — Progression

- [x] **Phase 0** — Commit safe + tag `v3-pre-autonomous-session` (commit 9146b62)
- [x] **Phase 1** — Sidebar rename V2 BETA → V3 PREVIEW + routes (commit 4ab1ac6)
- [x] **Phase 2** — Projets V3 Terminés, module dédié vue liste (commit 7ff1181)
- [x] **Phase 3** — Communication V3 wiring (livré en Phase 1, routes pointent vers V2)
- [x] **Phase 4** — Leads V3 + 3 variantes UX + optimistic DnD (commit c3ed12a)
- [ ] **Phase 5** — Documents projet preview (PDF/images/vidéo/Office) [GROS MORCEAU]
- [ ] **Phase 6** — Audit onglets restants détail projet (Accès, Brief, Sidebar contact)
- [ ] **Phase 7** — Token-saver fin + SESSION.md final

## Bonus retenu (si temps)
- Convertir lead → projet en 1 clic (bouton sur cards signées)

## Règles de la session
- **Reviewer strict** : block critical/high avant suite, signale uniquement (dev corrige)
- **Hybride contexte** : subagents isolés pour Phase 4 et 5 ; main agent pour le reste
- **Blocage** = stop + documenter ici + passer à la suite
- **Pas de push** sous aucun prétexte
- **Pas de suppression V1/V2** : tout est additif
- **Source données** : mêmes tables que V1 (pas de migration)
- **Stop auto** si contexte > 75% ou 3 critical consécutifs

## Blockers
Aucun pour le moment.

## Key context
- Login admin : lyestriki@yahoo.fr
- Dev server : http://localhost:5174
- Tag de retour si désastre : `git reset --hard v3-pre-autonomous-session`
- Sidebar actuelle : sections PERSONNEL, V2 BETA, PROJETS, CRM V1, FINANCE, SYSTÈME (à rename V2 BETA → V3 PREVIEW)
