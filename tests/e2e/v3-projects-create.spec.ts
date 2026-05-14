import { test, expect } from './fixtures/auth'

/**
 * Vérifie la création d'un projet V3 via le bouton "Nouveau projet".
 * Le projet doit apparaître immédiatement dans la colonne Planification.
 */
test.describe('Projets V3 — création via modale', () => {
  test('le bouton "Nouveau projet" ouvre la modale et crée un projet', async ({
    adminPage: page,
  }) => {
    await page.goto('/projets-en-cours')
    await expect(page.getByRole('heading', { name: /projets en cours/i })).toBeVisible()

    const projectName = `Test E2E ${Date.now()}`

    // Clic sur "+ Nouveau projet"
    await page.getByRole('button', { name: /nouveau projet/i }).click()

    // Modale ouverte
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: /nouveau projet/i }).last()).toBeVisible()

    // Remplir le formulaire
    await page.getByPlaceholder(/nom du projet/i).fill(projectName)
    // Nouveaux types de prestation V3 : Communication / ERP / Site Web
    await page.getByRole('button', { name: 'Site Web' }).click()

    // Soumettre
    await page.getByRole('button', { name: /créer le projet/i }).click()

    // Modale fermée
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 })

    // Projet visible dans la liste (on cible la première occurrence ; le toast
    // est rendu dans un container Sonner séparé donc 2 matches au moment du succès).
    await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 5_000 })
  })
})
