import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { sendActivationEmail, sendPasswordResetEmail } from './email'

describe('email', () => {
  const originalAppUrl = process.env.APP_URL
  const originalSmtpHost = process.env.SMTP_HOST
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

  beforeAll(() => {
    process.env.APP_URL = 'http://localhost:5173'
    // Ensure SMTP is not configured so we hit the console log path
    delete process.env.SMTP_HOST
  })

  afterEach(() => {
    consoleSpy.mockClear()
  })

  afterAll(() => {
    process.env.APP_URL = originalAppUrl
    process.env.SMTP_HOST = originalSmtpHost
    consoleSpy.mockRestore()
  })

  it('sendActivationEmail logs to console when SMTP is not configured', async () => {
    await sendActivationEmail('alice@example.com', 'alice', 'abc123token')

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Email] Activation link for alice:'),
    )
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('/activate?token=abc123token'))
  })

  it('sendPasswordResetEmail logs to console when SMTP is not configured', async () => {
    await sendPasswordResetEmail('bob@example.com', 'bob', 'reset123token')

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Email] Password reset link for bob:'),
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('/reset-password?token=reset123token'),
    )
  })
})
