import { Link } from 'react-router'
import { Button } from '../components/Button/Button'
import { useAuth } from '../context/AuthContext'
import styles from './HomePage.module.css'

function GuestHome() {
  return (
    <>
      <h1 className={styles.title}>iSuperhero Online</h1>
      <p className={styles.subtitle}>
        Develop your SuperAbilities, explore the Cosmos, and tame monsters in this real-time
        multiplayer adventure!
      </p>
      <div className={styles.actions}>
        <Button size="large" asChild>
          <Link to="/login">Log In</Link>
        </Button>
        <Button variant="secondary" size="large" asChild>
          <Link to="/register">Register</Link>
        </Button>
      </div>
    </>
  )
}

function LoggedInHome() {
  const { user, logout } = useAuth()

  return (
    <>
      <h1 className={styles.title}>iSuperhero Online</h1>
      <p className={styles.welcome}>
        Welcome back, <strong>{user?.username}</strong>
      </p>
      <div className={styles.actions}>
        <Button size="large" asChild>
          <Link to="/lobby?mode=create">Create Room</Link>
        </Button>
        <Button variant="secondary" size="large" asChild>
          <Link to="/lobby?mode=join">Join Room</Link>
        </Button>
      </div>
      <div className={styles.bottomLinks}>
        <Link to="/leaderboard" className={styles.link} aria-label="View leaderboard">
          Leaderboard
        </Link>
        <Link to="/profile" className={styles.link}>
          Profile
        </Link>
        <button type="button" className={styles.logoutBtn} onClick={logout}>
          Log Out
        </button>
      </div>
    </>
  )
}

export function HomePage() {
  const { isLoggedIn } = useAuth()

  return <main className={styles.page}>{isLoggedIn ? <LoggedInHome /> : <GuestHome />}</main>
}
