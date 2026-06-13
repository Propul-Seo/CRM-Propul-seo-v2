import { test, expect } from './fixtures/auth'

/**
 * Vérifie la page Projets V3 Terminés :
 * - Liste s'affiche
 * - Recherche filtre
 */
test.describe('Projets V3 Terminés', () => {
  test('la page liste les projets terminés et la recherche filtre', async ({
    adminPage: page,
  }) => {
    await page.goto('/projets-v3-termines')

    await expect(page.getByRole('heading', { name: /projets termin/i })).toBeVisible()

    // Recherche
    const searchInput = page.getByPlaceholder(/rechercher par nom/i)
    await searchInput.fill('xxxxxxxx_inexistant')

    // Au moins l'empty state apparaît (aucun projet ne matche)
    await expect(page.getByText(/aucun projet termin/i)).toBeVisible({ timeout: 3_000 })

    // Reset
    await searchInput.fill('')
  })
})
