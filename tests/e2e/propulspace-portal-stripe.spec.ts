import { test, expect } from './fixtures/auth'

// E2E paiement Stripe (portail Propul'Space).
// Étape 1 (active) : l'admin crée + envoie une facture, le numéro PS-… apparaît.
// Étape 2 (à compléter) : bascule en session client + redirection Stripe checkout,
// quand un compte client de test et les secrets Stripe test seront disponibles.
// La suite est ignorée tant que E2E_STRIPE_TEST + E2E_TEST_PROJECT_ID ne sont pas posés,
// afin de ne jamais échouer dans un environnement sans secrets Stripe.
const hasStripeTest = !!process.env.E2E_STRIPE_TEST && !!process.env.E2E_TEST_PROJECT_ID

test.describe('Facturation portail (E2E Stripe)', () => {
  test.skip(!hasStripeTest, 'Nécessite E2E_STRIPE_TEST + E2E_TEST_PROJECT_ID + secrets Stripe test posés')

  test('admin crée+envoie une facture, le numéro PS- apparaît', async ({ adminPage }) => {
    const projectId = process.env.E2E_TEST_PROJECT_ID!
    await adminPage.goto(`/admin/propulspace/clients/${projectId}/factures`)
    await adminPage.getByRole('button', { name: /Nouvelle facture/ }).click()
    await adminPage.getByPlaceholder('Désignation').fill('Prestation test E2E')
    await adminPage.getByPlaceholder('€ HT').fill('100')
    await adminPage.getByRole('button', { name: /Créer/ }).click()
    await adminPage.getByRole('button', { name: /Envoyer/ }).first().click()
    await expect(adminPage.getByText(/PS-/)).toBeVisible()
    // Étape suivante (bascule session client + redirection Stripe) : à compléter
    // quand un compte client de test + les secrets Stripe test seront disponibles.
  })
})
