import { type FormEvent, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../components/Button/Button'
import { useAuth } from '../context/AuthContext'
import styles from './AuthPage.module.css'

export function RegisterPage() {
  const { register, error, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await register(email.trim(), username.trim(), password)
    if (result) {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Registration Successful</h1>
          <p className={styles.successMessage}>
            Check your email at <strong>{email}</strong> to activate your account.
          </p>
          <Link to="/login" className={styles.link}>
            Go to Login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Account</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
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
              minLength={8}
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.actions}>
            <Button type="submit" size="large" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
        <Link to="/login" className={styles.link}>
          Already have an account? Log in
        </Link>
      </div>
    </main>
  )
}
