import { type FormEvent, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../components/Button/Button'
import { useAuth } from '../context/AuthContext'
import styles from './AuthPage.module.css'

export function ProfilePage() {
  const { user, getAccessToken } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const token = getAccessToken()
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data.error ?? 'Failed to change password')
      }
    } catch {
      setError('Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Profile</h1>

        <div className={styles.form}>
          <div className={styles.field}>
            <span className={styles.label}>Username</span>
            <span>{user?.username}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Email</span>
            <span>{user?.email}</span>
          </div>
        </div>

        <hr
          style={{
            margin: 'var(--space-6) 0',
            border: 'none',
            borderTop: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
          }}
        />

        <h2 className={styles.title} style={{ fontSize: 'var(--font-size-lg)' }}>
          Change Password
        </h2>

        <form className={styles.form} onSubmit={handleChangePassword}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="currentPassword">
              Current Password
            </label>
            <input
              id="currentPassword"
              className={styles.input}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="newPassword">
              New Password
            </label>
            <input
              id="newPassword"
              className={styles.input}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.successMessage}>Password changed successfully</div>}

          <div className={styles.actions}>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>

        <Link to="/" className={styles.backLink}>
          Back to home
        </Link>
      </div>
    </main>
  )
}
