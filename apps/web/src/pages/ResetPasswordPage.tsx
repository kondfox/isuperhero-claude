import { type FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '../components/Button/Button'
import styles from './AuthPage.module.css'

export function ResetPasswordPage() {
  const [submitting, setSubmitting] = useState(false)
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }
    if (!token) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setValidationError(data.error ?? 'Invalid or expired reset link')
      }
    } catch {
      setValidationError('Invalid or expired reset link')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Password Reset</h1>
          <p className={styles.successMessage}>Password has been reset successfully</p>
          <Link to="/login" className={styles.link}>
            Log in
          </Link>
        </div>
      </main>
    )
  }

  if (!token) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Password Reset</h1>
          <p className={styles.error}>Invalid or expired reset link</p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Reset Password</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="newPassword">
              New Password
            </label>
            <input
              id="newPassword"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {validationError && <div className={styles.error}>{validationError}</div>}
          <div className={styles.actions}>
            <Button type="submit" size="large" disabled={submitting}>
              {submitting ? 'Resetting...' : 'Reset Password'}
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
