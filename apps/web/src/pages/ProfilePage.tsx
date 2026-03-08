import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../components/Button/Button'
import { useAuth } from '../context/AuthContext'
import styles from './AuthPage.module.css'
import profileStyles from './ProfilePage.module.css'

interface GameHistoryEntry {
  gameId: string
  roomCode: string
  startedAt: string
  finishedAt: string | null
  rank: number | null
  monstersCount: number
  won: boolean
}

function GameHistory({ userId }: { userId: string }) {
  const [games, setGames] = useState<GameHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/players/${userId}/history`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json() as Promise<{ games: GameHistoryEntry[] }>
      })
      .then((data) => {
        setGames(data.games)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [userId])

  if (loading) return <p className={profileStyles.muted}>Loading game history...</p>

  if (games.length === 0) return <p className={profileStyles.muted}>No games played yet</p>

  const wins = games.filter((g) => g.won).length
  const totalMonsters = games.reduce((sum, g) => sum + g.monstersCount, 0)

  return (
    <>
      <div className={profileStyles.statsRow}>
        <div className={profileStyles.stat}>
          <span className={profileStyles.statValue}>{games.length}</span>
          <span className={profileStyles.statLabel}>Games</span>
        </div>
        <div className={profileStyles.stat}>
          <span className={profileStyles.statValue}>{wins}</span>
          <span className={profileStyles.statLabel}>Wins</span>
        </div>
        <div className={profileStyles.stat}>
          <span className={profileStyles.statValue}>{totalMonsters}</span>
          <span className={profileStyles.statLabel}>Monsters</span>
        </div>
      </div>

      <table className={profileStyles.historyTable}>
        <thead>
          <tr>
            <th>Room</th>
            <th>Result</th>
            <th>Rank</th>
            <th>Monsters</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.gameId}>
              <td>{game.roomCode}</td>
              <td className={game.won ? profileStyles.win : profileStyles.loss}>
                {game.won ? 'Win' : 'Loss'}
              </td>
              <td>{game.rank ?? '-'}</td>
              <td>{game.monstersCount}</td>
              <td>{game.finishedAt ? new Date(game.finishedAt).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

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

        <hr
          style={{
            margin: 'var(--space-6) 0',
            border: 'none',
            borderTop: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
          }}
        />

        <h2 className={styles.title} style={{ fontSize: 'var(--font-size-lg)' }}>
          Game History
        </h2>

        {user && <GameHistory userId={user.id} />}

        <Link to="/" className={styles.backLink}>
          Back to home
        </Link>
      </div>
    </main>
  )
}
