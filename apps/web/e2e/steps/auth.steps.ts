import { createBdd } from 'playwright-bdd'
import { loginViaApi } from './auth-helper'

const { Given, When } = createBdd()

// === Navigation ===

Given('I am on the registration page', async ({ page }) => {
  await page.goto('/register')
})

Given('I am on the login page', async ({ page }) => {
  await page.goto('/login')
})

Given('I am on the forgot password page', async ({ page }) => {
  await page.goto('/forgot-password')
})

Given('I navigate to {string}', async ({ page }, path: string) => {
  await page.goto(path)
})

// === Auth setup helpers ===

Given(
  'a registered user with email {string} and username {string}',
  async ({ page }, email: string, username: string) => {
    // Ignore 409 if already registered from a previous run
    await page.request.post('/api/auth/register', {
      data: { email, username, password: 'password123' },
    })
  },
)

Given(
  'an activated user {string} with email {string} and password {string}',
  async ({ page }, username: string, email: string, password: string) => {
    const regRes = await page.request.post('/api/auth/register', {
      data: { email, username, password },
    })
    if (regRes.status() === 201) {
      const tokenRes = await page.request.get(
        `/api/test/activation-token?email=${encodeURIComponent(email)}`,
      )
      const { token } = await tokenRes.json()
      await page.request.post('/api/auth/activate', { data: { token } })
    }
    // If 409, user already exists and is activated
  },
)

// === Registration helpers ===

When('I register with a unique email and username', async ({ page }) => {
  const suffix = Date.now().toString(36)
  await page.getByLabel('Email').fill(`reg_${suffix}@test.com`)
  await page.getByLabel('Username').fill(`reg_${suffix}`)
  await page.getByLabel('Password').fill('password123')
})

// === Activation ===

let freshUserEmail = ''

Given('a freshly registered user for activation', async ({ page }) => {
  const suffix = Date.now().toString(36)
  freshUserEmail = `activate_${suffix}@test.com`
  await page.request.post('/api/auth/register', {
    data: { email: freshUserEmail, username: `activate_${suffix}`, password: 'password123' },
  })
})

When('I visit the activation link for the fresh user', async ({ page }) => {
  const tokenRes = await page.request.get(
    `/api/test/activation-token?email=${encodeURIComponent(freshUserEmail)}`,
  )
  const { token } = await tokenRes.json()
  await page.goto(`/activate?token=${token}`)
})

When('I visit the activation link for {string}', async ({ page }, email: string) => {
  const tokenRes = await page.request.get(
    `/api/test/activation-token?email=${encodeURIComponent(email)}`,
  )
  const { token } = await tokenRes.json()
  await page.goto(`/activate?token=${token}`)
})

// === Password reset ===

Given('a password reset has been requested for {string}', async ({ page }, email: string) => {
  await page.request.post('/api/auth/forgot-password', { data: { email } })
})

When('I visit the reset password link for {string}', async ({ page }, email: string) => {
  const tokenRes = await page.request.get(
    `/api/test/reset-token?email=${encodeURIComponent(email)}`,
  )
  const { token } = await tokenRes.json()
  await page.goto(`/reset-password?token=${token}`)
})

// === Session management ===

Given('I am logged in as {string}', async ({ page }, username: string) => {
  await loginViaApi(page, username)
})

Given('I am not logged in', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.removeItem('isuperhero_auth')
  })
  await page.reload()
})
