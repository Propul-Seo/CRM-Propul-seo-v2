import { test as base, expect, type Page } from '@playwright/test'

export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ page }, use) => {
    const email = process.env.E2E_ADMIN_EMAIL
    const password = process.env.E2E_ADMIN_PASSWORD
    if (!email || !password) {
      throw new Error('E2E_ADMIN_EMAIL et E2E_ADMIN_PASSWORD doivent être définis dans .env.test')
    }

    await page.goto('/')
    // LoginPage attend des champs email + password, et un bouton submit
    await page.getByLabel(/e-?mail/i).fill(email)
    await page.getByLabel(/mot de passe|password/i).fill(password)
    await page.getByRole('button', { name: /se connecter|connexion|sign in/i }).click()

    // Attendre que la sidebar admin soit visible (preuve que l'auth a marché)
    await expect(page.getByText('Personnel')).toBeVisible({ timeout: 10_000 })

    await use(page)
  },
})

export { expect }
