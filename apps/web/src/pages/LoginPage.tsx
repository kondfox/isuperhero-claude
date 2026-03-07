import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../components/Button/Button'
import { useAuth } from '../context/AuthContext'
import styles from './AuthPage.module.css'

export function LoginPage() {
  const { login, error, loading, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/')
    }
  }, [isLoggedIn, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await login(username.trim(), password)
  }

  if (isLoggedIn) return null

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Log In</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.actions}>
            <Button type="submit" size="large" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </div>
        </form>
        <Link to="/forgot-password" className={styles.link}>
          Forgot password?
        </Link>
        <Link to="/register" className={styles.link}>
          Don't have an account? Register
        </Link>
      </div>
    </main>
  )
}
