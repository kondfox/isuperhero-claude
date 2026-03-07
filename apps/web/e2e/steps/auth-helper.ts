import type { Page } from '@playwright/test'

/**
 * Registers, activates, and logs in a user via API, then injects auth into localStorage.
 * Shared across auth.steps.ts, multiplayer.steps.ts, and game.steps.ts.
 */
export async function loginViaApi(page: Page, username: string): Promise<void> {
  const email = `${username}@e2e-test.com`
  const password = 'testpassword123'

  // Register (ignore 409 if already registered)
  const regRes = await page.request.post('/api/auth/register', {
    data: { email, username, password },
  })

  if (regRes.status() === 201) {
    // New user — activate via test API
    const tokenRes = await page.request.get(
      `/api/test/activation-token?email=${encodeURIComponent(email)}`,
    )
    const { token } = await tokenRes.json()
    await page.request.post('/api/auth/activate', { data: { token } })
  }
  // If 409, user already exists — just login

  // Login
  const loginRes = await page.request.post('/api/auth/login', {
    data: { username, password },
  })
  const loginData = await loginRes.json()

  // Inject into localStorage
  await page.goto('/')
  await page.evaluate((data) => {
    localStorage.setItem(
      'isuperhero_auth',
      JSON.stringify({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      }),
    )
  }, loginData)

  // Reload to pick up the auth state
  await page.reload()
}
