import { test, expect } from './fixtures/auth'

// Nécessite une session admin (team@propulseo-site.com / E2E_ADMIN_EMAIL).
// L'auth est gérée par la fixture `adminPage` (tests/e2e/fixtures/auth.ts) :
// login programmatique via E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (.env.test).
// Si ces variables ne sont pas définies, la suite est ignorée (pas d'échec parasite).
const hasAdminCreds = Boolean(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD)

test.describe('Back-office Propul\'Space', () => {
  test.skip(!hasAdminCreds, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD non définis (.env.test)')

  test('le dashboard /admin/propulspace redirige vers /clients et se charge', async ({
    adminPage: page,
  }) => {
    await page.goto('/admin/propulspace')
    await expect(page).toHaveURL(/\/admin\/propulspace\/clients/)
    await expect(page.getByText('Clients & portails')).toBeVisible()
  })

  test('ouvrir un client affiche les onglets', async ({ adminPage: page }) => {
    await page.goto('/admin/propulspace/clients')
    // Chaque client est un <button> dont le sous-titre est l'email du portail (contient « @ »).
    const firstRow = page.locator('button', { hasText: '@' }).first()
    if (await firstRow.count()) {
      await firstRow.click()
      await expect(page.getByRole('link', { name: 'Factures' })).toBeVisible()
    }
  })
})
