import { test, expect } from './fixtures/auth'

/**
 * Vérifie le détail projet V3 sur le projet Lolett (ID stable en BDD) :
 * - Page charge avec sidebar gauche, tabs centre, sidebar droite
 * - Section "À propos" affiche les infos
 * - Modale d'édition s'ouvre
 */
const LOLETT_ID = 'd570010a-553f-4171-88a2-ecb637a4663e'

test.describe('Détail projet V3 (Lolett)', () => {
  test('la page charge avec les 3 colonnes', async ({ adminPage: page }) => {
    await page.goto(`/projets-v3-preview/${LOLETT_ID}`)

    // Header avec badge V3 Preview
    await expect(page.getByText(/V3 Preview/i).first()).toBeVisible({ timeout: 10_000 })

    // Nom du projet visible dans la sidebar gauche
    await expect(page.getByRole('heading', { name: /lolett/i })).toBeVisible()

    // Section À propos visible
    await expect(page.getByText(/à propos/i).first()).toBeVisible()
  })

  test('la modale "Modifier le projet" s\'ouvre et a un champ Date de début', async ({
    adminPage: page,
  }) => {
    await page.goto(`/projets-v3-preview/${LOLETT_ID}`)

    await page.getByRole('button', { name: /modifier le projet/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Le champ "Date de début" doit exister
    await expect(page.getByText(/date de début/i)).toBeVisible()

    // Fermer
    await page.getByRole('button', { name: /fermer/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3_000 })
  })

  test('la tab Production charge la liste de tâches', async ({ adminPage: page }) => {
    await page.goto(`/projets-v3-preview/${LOLETT_ID}?tab=production`)

    // Header "Progression globale"
    await expect(page.getByText(/progression globale/i)).toBeVisible({ timeout: 10_000 })
  })
})
