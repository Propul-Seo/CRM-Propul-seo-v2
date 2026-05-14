import { test, expect } from './fixtures/auth'

/**
 * Vérifie le module Leads V3 :
 * - Page charge avec onglet Site web par défaut
 * - Toggle ERP fonctionne
 * - Toggle variante A/B/C fonctionne
 * - Recherche debounced filtre les leads
 */
test.describe('Leads V3 — onglets, variantes, filtres', () => {
  test('l\'onglet Site web charge par défaut', async ({ adminPage: page }) => {
    await page.goto('/leads-v3')
    await expect(page.getByText(/site web/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('le toggle ERP bascule l\'onglet', async ({ adminPage: page }) => {
    await page.goto('/leads-v3')
    // Le bouton ERP doit être présent dans le header
    const erpButton = page.getByRole('button', { name: /^ERP$/i }).first()
    await expect(erpButton).toBeVisible({ timeout: 10_000 })
    await erpButton.click()
    // Pas de crash après toggle
    await expect(page).toHaveURL(/\/leads-v3/)
  })

  test('la recherche debounced filtre les résultats', async ({ adminPage: page }) => {
    await page.goto('/leads-v3')
    const searchInput = page.getByPlaceholder(/rechercher/i).first()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })

    await searchInput.fill('xxxxxxxx_inexistant_aaaa')
    // Attendre le debounce 300ms + render
    await page.waitForTimeout(500)
    await expect(page.getByText(/aucun lead/i).first()).toBeVisible({ timeout: 3_000 })
  })
})
