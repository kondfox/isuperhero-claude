import { useParams } from 'react-router'
import styles from './GamePage.module.css'

export function GamePage() {
  const { roomId } = useParams<{ roomId: string }>()

  return (
    <main className={styles.page}>
      <h1>Game Board</h1>
      <p className={styles.roomId}>Room: {roomId}</p>
    </main>
  )
}
