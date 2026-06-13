import { test, expect } from './fixtures/auth'

/**
 * Vérifie que les routes Communication V3 chargent bien les modules V2 wirés.
 */
test.describe('Communication V3 — wiring vers modules V2', () => {
  test('/communication-v3/production charge sans erreur', async ({ adminPage: page }) => {
    await page.goto('/communication-v3/production')
    await expect(page).toHaveURL(/\/communication-v3\/production/)
    // Pas de crash, le DOM se monte
    await expect(page.locator('main').first()).toBeVisible()
  })

  test('/communication-v3/kpi charge sans erreur', async ({ adminPage: page }) => {
    await page.goto('/communication-v3/kpi')
    await expect(page).toHaveURL(/\/communication-v3\/kpi/)
    await expect(page.locator('main').first()).toBeVisible()
  })
})
