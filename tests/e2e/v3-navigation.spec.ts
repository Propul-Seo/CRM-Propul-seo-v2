import { test, expect } from './fixtures/auth'

/**
 * Vérifie la nouvelle structure de sidebar V3 :
 * - Section "V3 Preview" présente
 * - Les routes principales V3 répondent (200)
 */
test.describe('Navigation V3 — sidebar et routes', () => {
  test('section "V3 Preview" est visible et accessible', async ({ adminPage: page }) => {
    await expect(page.getByText(/V3 Preview/i)).toBeVisible()
  })

  test('les routes V3 répondent toutes', async ({ adminPage: page }) => {
    const routes = [
      { path: '/leads-v3', expectedText: /leads/i },
      { path: '/projets-en-cours', expectedText: /projets en cours/i },
      { path: '/projets-v3-termines', expectedText: /projets termin/i },
    ]

    for (const route of routes) {
      await page.goto(route.path)
      await expect(page).toHaveURL(new RegExp(route.path))
      await expect(page.getByText(route.expectedText).first()).toBeVisible({ timeout: 10_000 })
    }
  })
})
