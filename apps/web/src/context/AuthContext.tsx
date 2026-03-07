import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react'

const STORAGE_KEY = 'isuperhero_auth'

export interface AuthUser {
  id: string
  username: string
  email: string
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface StoredAuth extends AuthTokens {
  user: AuthUser
}

export interface AuthContextValue {
  user: AuthUser | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null
  register: (email: string, username: string, password: string) => Promise<boolean>
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  getAccessToken: () => string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadFromStorage(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      typeof parsed.accessToken === 'string' &&
      typeof parsed.refreshToken === 'string' &&
      parsed.user &&
      typeof parsed.user.id === 'string' &&
      typeof parsed.user.username === 'string' &&
      typeof parsed.user.email === 'string'
    ) {
      return parsed as StoredAuth
    }
    return null
  } catch {
    return null
  }
}

function saveToStorage(data: StoredAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [storedAuth] = useState(() => loadFromStorage())
  const [user, setUser] = useState<AuthUser | null>(storedAuth?.user ?? null)
  const [tokens, setTokens] = useState<AuthTokens | null>(
    storedAuth
      ? { accessToken: storedAuth.accessToken, refreshToken: storedAuth.refreshToken }
      : null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tokensRef = useRef(tokens)
  tokensRef.current = tokens

  const clearAuthState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    setTokens(null)
    tokensRef.current = null
  }, [])

  const register = useCallback(
    async (email: string, username: string, password: string): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Registration failed')
          return false
        }
        return true
      } catch (err) {
        setError((err as Error).message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        return
      }
      const newTokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }
      const newUser: AuthUser = data.user
      saveToStorage({ ...newTokens, user: newUser })
      setTokens(newTokens)
      tokensRef.current = newTokens
      setUser(newUser)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearAuthState()
    setError(null)
  }, [clearAuthState])

  const forgotPassword = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Request failed')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Reset failed')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const getAccessToken = useCallback((): string | null => {
    return tokensRef.current?.accessToken ?? null
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: user !== null,
        loading,
        error,
        register,
        login,
        logout,
        forgotPassword,
        resetPassword,
        getAccessToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export async function authFetch(
  url: string,
  options: RequestInit = {},
  getToken: () => string | null,
  refreshTokens: () => Promise<AuthTokens | null>,
  onUnauthorized: () => void,
): Promise<Response> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    const newTokens = await refreshTokens()
    if (newTokens) {
      headers.set('Authorization', `Bearer ${newTokens.accessToken}`)
      res = await fetch(url, { ...options, headers })
    } else {
      onUnauthorized()
    }
  }

  return res
}

export { AuthContext }
