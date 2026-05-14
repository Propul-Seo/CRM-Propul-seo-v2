# Tests E2E

Tests end-to-end via Playwright, ciblant le dev server local sur `http://localhost:5174`.

## Setup

1. Copier le template de credentials :
   ```bash
   cp .env.test.example .env.test
   ```

2. Renseigner dans `.env.test` :
   ```
   E2E_ADMIN_EMAIL=lyestriki@yahoo.fr
   E2E_ADMIN_PASSWORD=<ton mot de passe admin>
   ```

   Ne jamais commiter `.env.test` — il est dans `.gitignore`.

3. Installer Playwright si pas déjà fait :
   ```bash
   npx playwright install chromium
   ```

## Lancer les tests

```bash
# Run headless (CI mode)
npm run test:e2e

# Run en mode UI interactif (debug)
npm run test:e2e:ui
```

Le dev server démarre automatiquement si pas déjà actif (config `webServer.reuseExistingServer: true`).

## Couverture actuelle

- `agency-vault.spec.ts` — Coffre-fort agence : login → navigation → CRUD → recherche → suppression.
