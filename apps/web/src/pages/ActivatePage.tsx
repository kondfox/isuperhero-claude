import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import styles from './AuthPage.module.css'

export function ActivatePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error')
  const [errorMessage, setErrorMessage] = useState(
    token ? '' : 'Invalid or expired activation link',
  )

  useEffect(() => {
    if (!token) return

    let cancelled = false

    async function activate() {
      try {
        const res = await fetch('/api/auth/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (cancelled) return
        if (res.ok) {
          setStatus('success')
        } else {
          const data = await res.json()
          setErrorMessage(data.error ?? 'Invalid or expired activation link')
          setStatus('error')
        }
      } catch {
        if (cancelled) return
        setErrorMessage('Invalid or expired activation link')
        setStatus('error')
      }
    }

    activate()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Account Activation</h1>
        {status === 'loading' && (
          <p className={styles.successMessage}>Activating your account...</p>
        )}
        {status === 'success' && (
          <>
            <p className={styles.successMessage}>Account activated successfully</p>
            <Link to="/login" className={styles.link}>
              Log in
            </Link>
          </>
        )}
        {status === 'error' && <p className={styles.error}>{errorMessage}</p>}
      </div>
    </main>
  )
}
