import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import styles from './LeaderboardPage.module.css'

interface LeaderboardEntry {
  playerId: string
  displayName: string
  gamesPlayed: number
  wins: number
  totalMonsters: number
  bestScore: number
}

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/leaderboard?limit=20')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load leaderboard (${res.status})`)
        return res.json()
      })
      .then((data: { entries: LeaderboardEntry[] }) => {
        setEntries(data.entries)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Leaderboard</h1>

      {loading && <p className={styles.loading}>Loading...</p>}

      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className={styles.empty}>No games played yet</p>
      )}

      {!loading && !error && entries.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Games</th>
              <th>Wins</th>
              <th>Monsters</th>
              <th>Best</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={entry.playerId}>
                <td className={styles.rank}>{i + 1}</td>
                <td>{entry.displayName}</td>
                <td>{entry.gamesPlayed}</td>
                <td>{entry.wins}</td>
                <td>{entry.totalMonsters}</td>
                <td>{entry.bestScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Link to="/" className={styles.backLink} aria-label="Back to home">
        Back to Home
      </Link>
    </main>
  )
}
