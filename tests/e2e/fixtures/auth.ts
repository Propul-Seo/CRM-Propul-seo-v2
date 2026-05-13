import { test as base, expect, type Page } from '@playwright/test'

export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ page }, use) => {
    const email = process.env.E2E_ADMIN_EMAIL
    const password = process.env.E2E_ADMIN_PASSWORD
    if (!email || !password) {
      throw new Error('E2E_ADMIN_EMAIL et E2E_ADMIN_PASSWORD doivent être définis dans .env.test')
    }

    await page.goto('/')
    // LoginPage (src/components/auth/LoginPage.tsx) : labels non associés via htmlFor,
    // on cible donc via type=email et type=password.
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(password)
    await page.getByRole('button', { name: /se connecter|connexion|sign in/i }).click()

    // Attendre que la sidebar soit visible (preuve que l'auth a marché).
    // Premier login peut être lent (Supabase + bootstrap modules lazy).
    await expect(page.getByText(/V3 Preview|Personnel/i).first()).toBeVisible({ timeout: 30_000 })

    await use(page)
  },
})

export { expect }
