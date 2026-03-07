import { type FormEvent, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../components/Button/Button'
import { useAuth } from '../context/AuthContext'
import styles from './AuthPage.module.css'

export function ForgotPasswordPage() {
  const { forgotPassword, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await forgotPassword(email.trim())
    setSent(true)
  }

  if (sent) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Check Your Email</h1>
          <p className={styles.successMessage}>
            If that email is registered, we've sent a password reset link.
          </p>
          <Link to="/login" className={styles.backLink}>
            Back to login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Forgot Password</h1>
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
          <div className={styles.actions}>
            <Button type="submit" size="large" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </form>
        <Link to="/login" className={styles.backLink}>
          Back to login
        </Link>
      </div>
    </main>
  )
}
