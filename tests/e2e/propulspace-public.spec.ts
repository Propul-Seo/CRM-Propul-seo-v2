import { test, expect } from '@playwright/test'

test.describe('Propulspace public', () => {
  test('le diagnostic public charge et valide la première étape', async ({ page }) => {
    await page.goto('/diagnostic', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: /quel est votre besoin/i })).toBeVisible()
    await expect(page.getByText(/site vitrine/i)).toBeVisible()
    await expect(page.getByText(/erp \/ outil métier/i)).toBeVisible()

    await page.getByRole('button', { name: /suivant/i }).click()
    await expect(page.getByRole('alert')).toContainText(/sélectionnez un type de projet/i)
  })

  test('la page de confirmation est accessible', async ({ page }) => {
    await page.goto('/diagnostic-envoye', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: /diagnostic enregistré/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /réserver un appel maintenant/i })).toHaveAttribute(
      'href',
      /calendly\.com\/team-propulseo-site\/30min/,
    )
  })
})
