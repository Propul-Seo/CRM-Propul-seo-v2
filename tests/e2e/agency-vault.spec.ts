import { test, expect } from './fixtures/auth'

const TEST_LABEL = `E2E Test ${Date.now()}`

test.describe('Coffre-fort agence', () => {
  test('admin peut naviguer, ajouter, voir déchiffré, et supprimer un accès', async ({ adminPage: page }) => {
    // 1. Naviguer via sidebar
    await page.getByRole('link', { name: /coffre-fort/i }).click()
    await expect(page).toHaveURL(/\/coffre-fort$/)
    await expect(page.getByRole('heading', { name: /coffre-fort agence/i })).toBeVisible()

    // 2. Ouvrir modal ajout
    await page.getByRole('button', { name: /^ajouter$/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // 3. Remplir le formulaire
    await page.getByLabel(/label/i).fill(TEST_LABEL)
    // catégorie dev
    await page.locator('select').first().selectOption('dev')
    await page.getByLabel(/^login$/i).fill('test@example.com')
    await page.getByLabel(/mot de passe/i).fill('secret-e2e-123')
    await page.getByLabel(/^notes$/i).fill('Note de test E2E')
    await page.getByRole('button', { name: /^créer$/i }).click()

    // 4. Modal fermée + item visible
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText(TEST_LABEL)).toBeVisible({ timeout: 5_000 })

    // 5. Le password est masqué par défaut, mais l'item est dans la catégorie "Développement"
    await expect(page.getByText('Développement')).toBeVisible()

    // 6. Tester la recherche
    await page.getByPlaceholder(/rechercher/i).fill('E2E Test')
    await expect(page.getByText(TEST_LABEL)).toBeVisible()
    await page.getByPlaceholder(/rechercher/i).fill('')

    // 7. Supprimer l'item
    const itemContainer = page.locator('div', { hasText: TEST_LABEL }).first()
    await itemContainer.getByTitle('Supprimer').click()
    await page.getByRole('button', { name: /^supprimer$/i }).click()
    await expect(page.getByText(TEST_LABEL)).not.toBeVisible({ timeout: 5_000 })
  })
})
