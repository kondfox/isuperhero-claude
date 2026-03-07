import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'

const STORAGE_KEY = 'isuperhero_auth'

function TestConsumer() {
  const {
    user,
    isLoggedIn,
    loading,
    error,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    getAccessToken,
    clearError,
  } = useAuth()

  const [registerResult, setRegisterResult] = useState<boolean | null>(null)

  return (
    <div>
      <span data-testid="logged-in">{String(isLoggedIn)}</span>
      <span data-testid="loading">{String(loading)}</span>
      {user && <span data-testid="username">{user.username}</span>}
      {user && <span data-testid="user-id">{user.id}</span>}
      {user && <span data-testid="user-email">{user.email}</span>}
      {error && <span data-testid="error">{error}</span>}
      <span data-testid="access-token">{getAccessToken() ?? ''}</span>
      {registerResult !== null && (
        <span data-testid="register-result">{String(registerResult)}</span>
      )}
      <button
        type="button"
        data-testid="register-btn"
        onClick={async () => {
          const result = await register('test@example.com', 'TestUser', 'password123')
          setRegisterResult(result)
        }}
      >
        Register
      </button>
      <button
        type="button"
        data-testid="login-btn"
        onClick={() => login('TestUser', 'password123')}
      >
        Login
      </button>
      <button type="button" data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      <button
        type="button"
        data-testid="forgot-btn"
        onClick={() => forgotPassword('test@example.com')}
      >
        Forgot
      </button>
      <button
        type="button"
        data-testid="reset-btn"
        onClick={() => resetPassword('token123', 'newpass123')}
      >
        Reset
      </button>
      <button type="button" data-testid="clear-error-btn" onClick={clearError}>
        Clear Error
      </button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

afterEach(() => {
  localStorage.clear()
})

describe('AuthContext', () => {
  it('starts not logged in with empty localStorage', () => {
    renderWithProvider()
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false')
    expect(screen.queryByTestId('username')).not.toBeInTheDocument()
    expect(screen.getByTestId('access-token')).toHaveTextContent('')
  })

  it('restores from localStorage on mount', () => {
    const saved = {
      accessToken: 'token-abc',
      refreshToken: 'refresh-abc',
      user: { id: 'uuid-1', username: 'Alice', email: 'alice@example.com' },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    renderWithProvider()
    expect(screen.getByTestId('logged-in')).toHaveTextContent('true')
    expect(screen.getByTestId('username')).toHaveTextContent('Alice')
    expect(screen.getByTestId('user-id')).toHaveTextContent('uuid-1')
    expect(screen.getByTestId('user-email')).toHaveTextContent('alice@example.com')
    expect(screen.getByTestId('access-token')).toHaveTextContent('token-abc')
  })

  it('register() calls correct API and returns true on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () =>
        Promise.resolve({
          message: 'Registration successful. Check your email to activate your account.',
        }),
    })

    renderWithProvider()
    const user = userEvent.setup()
    await user.click(screen.getByTestId('register-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('register-result')).toHaveTextContent('true')
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        username: 'TestUser',
        password: 'password123',
      }),
    })

    // Should NOT be logged in after register (needs email activation)
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false')
  })

  it('register() sets error on 409', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'Email already registered', code: 'DUPLICATE_EMAIL' }),
    })

    renderWithProvider()
    const user = userEvent.setup()
    await user.click(screen.getByTestId('register-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Email already registered')
    })
    expect(screen.getByTestId('register-result')).toHaveTextContent('false')
  })

  it('login() stores tokens and user', async () => {
    const loginResponse = {
      accessToken: 'jwt-access',
      refreshToken: 'jwt-refresh',
      user: { id: 'uuid-2', username: 'Bob', email: 'bob@example.com' },
    }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(loginResponse),
    })

    renderWithProvider()
    const user = userEvent.setup()
    await user.click(screen.getByTestId('login-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('logged-in')).toHaveTextContent('true')
    })
    expect(screen.getByTestId('username')).toHaveTextContent('Bob')
    expect(screen.getByTestId('user-id')).toHaveTextContent('uuid-2')
    expect(screen.getByTestId('access-token')).toHaveTextContent('jwt-access')

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.accessToken).toBe('jwt-access')
    expect(stored.refreshToken).toBe('jwt-refresh')
    expect(stored.user.username).toBe('Bob')

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'TestUser', password: 'password123' }),
    })
  })

  it('login() sets error on 401', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () =>
        Promise.resolve({ error: 'Invalid username or password', code: 'INVALID_CREDENTIALS' }),
    })

    renderWithProvider()
    const user = userEvent.setup()
    await user.click(screen.getByTestId('login-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid username or password')
    })
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false')
  })

  it('login() sets error on 403', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () =>
        Promise.resolve({
          error: 'Please activate your account first. Check your email for the activation link.',
          code: 'ACCOUNT_NOT_ACTIVATED',
        }),
    })

    renderWithProvider()
    const user = userEvent.setup()
    await user.click(screen.getByTestId('login-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Please activate your account first')
    })
  })

  it('logout() clears everything', async () => {
    const saved = {
      accessToken: 'token-abc',
      refreshToken: 'refresh-abc',
      user: { id: 'uuid-1', username: 'Alice', email: 'alice@example.com' },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    renderWithProvider()
    expect(screen.getByTestId('logged-in')).toHaveTextContent('true')

    const user = userEvent.setup()
    await user.click(screen.getByTestId('logout-btn'))

    expect(screen.getByTestId('logged-in')).toHaveTextContent('false')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(screen.getByTestId('access-token')).toHaveTextContent('')
  })

  it('getAccessToken() returns token from state', () => {
    const saved = {
      accessToken: 'my-token',
      refreshToken: 'my-refresh',
      user: { id: 'uuid-1', username: 'Alice', email: 'alice@example.com' },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    renderWithProvider()
    expect(screen.getByTestId('access-token')).toHaveTextContent('my-token')
  })

  it('ignores corrupted localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json')
    renderWithProvider()
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false')
  })

  it('ignores localStorage data missing required fields', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: 'abc' }))
    renderWithProvider()
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false')
  })

  it('forgotPassword() calls correct API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          message: "If that email is registered, we've sent a password reset link.",
        }),
    })

    renderWithProvider()
    const user = userEvent.setup()
    await user.click(screen.getByTestId('forgot-btn'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })
    })
  })

  it('resetPassword() calls correct API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ message: 'Password has been reset successfully' }),
    })

    renderWithProvider()
    const user = userEvent.setup()
    await user.click(screen.getByTestId('reset-btn'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'token123', password: 'newpass123' }),
      })
    })
  })

  it('clearError() clears the error state', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () =>
        Promise.resolve({ error: 'Invalid username or password', code: 'INVALID_CREDENTIALS' }),
    })

    renderWithProvider()
    const user = userEvent.setup()
    await user.click(screen.getByTestId('login-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('clear-error-btn'))
    expect(screen.queryByTestId('error')).not.toBeInTheDocument()
  })

  it('sets error when fetch throws (network error)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'))

    renderWithProvider()
    const user = userEvent.setup()
    await user.click(screen.getByTestId('login-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network failure')
    })
  })
})
