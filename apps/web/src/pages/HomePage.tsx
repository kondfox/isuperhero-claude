import { Link } from 'react-router'
import { Button } from '../components/Button/Button'
import styles from './HomePage.module.css'

export function HomePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>iSuperhero Online</h1>
      <p className={styles.subtitle}>
        Develop your SuperAbilities, explore the Cosmos, and tame monsters in this real-time
        multiplayer adventure!
      </p>
      <div className={styles.actions}>
        <Button size="large" asChild>
          <Link to="/lobby?mode=create">Create Room</Link>
        </Button>
        <Button variant="secondary" size="large" asChild>
          <Link to="/lobby?mode=join">Join Room</Link>
        </Button>
      </div>
    </main>
  )
}
