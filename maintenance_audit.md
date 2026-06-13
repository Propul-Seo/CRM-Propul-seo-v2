# Audit de taille des fichiers

> Généré le 2026-02-24 17:55 par `scripts/audit-lines.mjs`

## Résumé

| Métrique | Valeur |
|----------|--------|
| Fichiers scannés | 391 |
| Fichiers > 250 lignes effectives | 40 |
| — component | 20 |
| — lib | 11 |
| — page | 9 |

## Top 30 (par lignes effectives)

| # | Fichier | Eff. | Total | Cat. | Suggestion |
|---|---------|------|-------|------|------------|
| 1 | `src/modules/ContactDetailsBotOne/index.tsx` | 631 | 685 | page | Extraire les sections en sous-composants + hooks custom |
| 2 | `src/types/database.ts` | 629 | 630 | lib | Découper en modules plus petits (barrel export) |
| 3 | `src/modules/ClientDetails/SimpleClientDetailsWithSync.tsx` | 575 | 617 | page | Extraire les sections en sous-composants + hooks custom |
| 4 | `src/modules/Settings/components/ArchiveManager.tsx` | 568 | 626 | page | Extraire les sections en sous-composants + hooks custom |
| 5 | `src/services/supabaseService.ts` | 549 | 676 | lib | Découper en modules plus petits (barrel export) |
| 6 | `src/components/calendar/MobileCalendar.tsx` | 515 | 610 | component | Diviser en sous-composants atomiques |
| 7 | `src/components/auth/SupabaseAuth.tsx` | 500 | 542 | component | Extraire hooks / sous-composants |
| 8 | `src/components/calendar/EventModal.tsx` | 448 | 490 | component | Extraire hooks / sous-composants |
| 9 | `src/modules/Contacts/index.tsx` | 443 | 476 | page | Extraire la logique dans des hooks custom |
| 10 | `src/modules/CRM/KanbanPipeline.tsx` | 427 | 457 | page | Extraire la logique dans des hooks custom |
| 11 | `src/hooks/useCRMBotOne.ts` | 425 | 509 | lib | Séparer les responsabilités dans des fichiers dédiés |
| 12 | `src/components/dialogs/ProjectDialog.tsx` | 420 | 442 | component | Extraire hooks / sous-composants |
| 13 | `src/components/mobile/MobileContactPreview.tsx` | 408 | 448 | component | Extraire hooks / sous-composants |
| 14 | `src/modules/ProjectDetails/index.tsx` | 393 | 434 | page | Extraire la logique dans des hooks custom |
| 15 | `src/modules/ClientDetails/SimpleClientDetails.tsx` | 390 | 434 | page | Extraire la logique dans des hooks custom |
| 16 | `src/components/crm/bot-one/CRMBotOneKanban.tsx` | 386 | 442 | component | Extraire hooks / sous-composants |
| 17 | `src/modules/ProjectsManager/index.tsx` | 373 | 410 | page | Extraire la logique dans des hooks custom |
| 18 | `src/components/layout/Sidebar.tsx` | 371 | 400 | component | Extraire hooks / sous-composants |
| 19 | `src/hooks/useCRMColumns.ts` | 351 | 444 | lib | Séparer les responsabilités dans des fichiers dédiés |
| 20 | `src/components/calendar/SimpleCalendar.tsx` | 345 | 385 | component | Extraire hooks / sous-composants |
| 21 | `src/components/mobile/MobileContactList.tsx` | 340 | 376 | component | Extraire hooks / sous-composants |
| 22 | `src/components/crm/bot-one/ColumnManager.tsx` | 335 | 361 | component | Extraire hooks / sous-composants |
| 23 | `src/components/dialogs/LeadDialog.tsx` | 332 | 360 | component | Extraire hooks / sous-composants |
| 24 | `src/components/crm/bot-one/CRMBotOneTable.tsx` | 331 | 360 | component | Extraire hooks / sous-composants |
| 25 | `src/components/ui/chart.tsx` | 326 | 363 | component | Extraire hooks / sous-composants |
| 26 | `src/modules/ClientDetails/index.tsx` | 324 | 346 | page | Extraire la logique dans des hooks custom |
| 27 | `src/types/supabase-types.ts` | 317 | 369 | lib | Séparer les responsabilités dans des fichiers dédiés |
| 28 | `src/store/types.ts` | 312 | 346 | lib | Séparer les responsabilités dans des fichiers dédiés |
| 29 | `src/hooks/useTeamChatSimple.ts` | 306 | 397 | lib | Séparer les responsabilités dans des fichiers dédiés |
| 30 | `src/components/mobile/MobileContactCard.tsx` | 297 | 349 | component | Extraire hooks / sous-composants |

## Tous les fichiers > 250 lignes effectives

| Fichier | Eff. | Total | Cat. | Suggestion |
|---------|------|-------|------|------------|
| `src/modules/ContactDetailsBotOne/index.tsx` | 631 | 685 | page | Extraire les sections en sous-composants + hooks custom |
| `src/types/database.ts` | 629 | 630 | lib | Découper en modules plus petits (barrel export) |
| `src/modules/ClientDetails/SimpleClientDetailsWithSync.tsx` | 575 | 617 | page | Extraire les sections en sous-composants + hooks custom |
| `src/modules/Settings/components/ArchiveManager.tsx` | 568 | 626 | page | Extraire les sections en sous-composants + hooks custom |
| `src/services/supabaseService.ts` | 549 | 676 | lib | Découper en modules plus petits (barrel export) |
| `src/components/calendar/MobileCalendar.tsx` | 515 | 610 | component | Diviser en sous-composants atomiques |
| `src/components/auth/SupabaseAuth.tsx` | 500 | 542 | component | Extraire hooks / sous-composants |
| `src/components/calendar/EventModal.tsx` | 448 | 490 | component | Extraire hooks / sous-composants |
| `src/modules/Contacts/index.tsx` | 443 | 476 | page | Extraire la logique dans des hooks custom |
| `src/modules/CRM/KanbanPipeline.tsx` | 427 | 457 | page | Extraire la logique dans des hooks custom |
| `src/hooks/useCRMBotOne.ts` | 425 | 509 | lib | Séparer les responsabilités dans des fichiers dédiés |
| `src/components/dialogs/ProjectDialog.tsx` | 420 | 442 | component | Extraire hooks / sous-composants |
| `src/components/mobile/MobileContactPreview.tsx` | 408 | 448 | component | Extraire hooks / sous-composants |
| `src/modules/ProjectDetails/index.tsx` | 393 | 434 | page | Extraire la logique dans des hooks custom |
| `src/modules/ClientDetails/SimpleClientDetails.tsx` | 390 | 434 | page | Extraire la logique dans des hooks custom |
| `src/components/crm/bot-one/CRMBotOneKanban.tsx` | 386 | 442 | component | Extraire hooks / sous-composants |
| `src/modules/ProjectsManager/index.tsx` | 373 | 410 | page | Extraire la logique dans des hooks custom |
| `src/components/layout/Sidebar.tsx` | 371 | 400 | component | Extraire hooks / sous-composants |
| `src/hooks/useCRMColumns.ts` | 351 | 444 | lib | Séparer les responsabilités dans des fichiers dédiés |
| `src/components/calendar/SimpleCalendar.tsx` | 345 | 385 | component | Extraire hooks / sous-composants |
| `src/components/mobile/MobileContactList.tsx` | 340 | 376 | component | Extraire hooks / sous-composants |
| `src/components/crm/bot-one/ColumnManager.tsx` | 335 | 361 | component | Extraire hooks / sous-composants |
| `src/components/dialogs/LeadDialog.tsx` | 332 | 360 | component | Extraire hooks / sous-composants |
| `src/components/crm/bot-one/CRMBotOneTable.tsx` | 331 | 360 | component | Extraire hooks / sous-composants |
| `src/components/ui/chart.tsx` | 326 | 363 | component | Extraire hooks / sous-composants |
| `src/modules/ClientDetails/index.tsx` | 324 | 346 | page | Extraire la logique dans des hooks custom |
| `src/types/supabase-types.ts` | 317 | 369 | lib | Séparer les responsabilités dans des fichiers dédiés |
| `src/store/types.ts` | 312 | 346 | lib | Séparer les responsabilités dans des fichiers dédiés |
| `src/hooks/useTeamChatSimple.ts` | 306 | 397 | lib | Séparer les responsabilités dans des fichiers dédiés |
| `src/components/mobile/MobileContactCard.tsx` | 297 | 349 | component | Extraire hooks / sous-composants |
| `src/hooks/useContacts.ts` | 291 | 357 | lib | Séparer les responsabilités dans des fichiers dédiés |
| `src/hooks/useRealtimeAccounting.ts` | 291 | 357 | lib | Séparer les responsabilités dans des fichiers dédiés |
| `src/components/prospect-activities/ProspectActivitiesSection.tsx` | 289 | 341 | component | Extraire hooks / sous-composants |
| `src/types/index.ts` | 280 | 337 | lib | Séparer les responsabilités dans des fichiers dédiés |
| `src/components/prospect-activities/ActivityForm.tsx` | 276 | 315 | component | Extraire hooks / sous-composants |
| `src/components/notifications/GlobalNotifications.tsx` | 273 | 316 | component | Extraire hooks / sous-composants |
| `src/components/dialogs/ClientDialog.tsx` | 272 | 295 | component | Extraire hooks / sous-composants |
| `src/components/crm/bot-one/SimpleRecordModal.tsx` | 268 | 289 | component | Extraire hooks / sous-composants |
| `src/components/notifications/ChatNotifications.tsx` | 264 | 316 | component | Extraire hooks / sous-composants |
| `src/hooks/useActivities.ts` | 257 | 335 | lib | Séparer les responsabilités dans des fichiers dédiés |

## Méthodologie

- **Lignes totales** : comptage brut des lignes du fichier
- **Lignes effectives** : lignes non vides, hors commentaires (`//` et `/* ... */`)
- Le calcul des commentaires bloc utilise une machine à états simple (flag in-comment). Les cas limites (commentaires dans des chaînes de caractères, template literals) ne sont pas gérés — suffisant pour un outil d'audit.
- Extensions scannées : .ts, .tsx, .js, .jsx
- Répertoire scanné : `src/`
