import { Link } from 'react-router'
import { Button } from '../components/Button/Button'
import styles from './HomePage.module.css'

export function LobbyPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Lobby</h1>
      <p className={styles.subtitle}>Room creation and joining will be added in the next update.</p>
      <Button variant="secondary" asChild>
        <Link to="/">Back to Home</Link>
      </Button>
    </main>
  )
}
