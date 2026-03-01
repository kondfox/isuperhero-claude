import type { PlayerState } from '../../types/game-state'
import { DifficultyBadge } from '../DifficultyBadge/DifficultyBadge'
import styles from './PlayerList.module.css'

interface PlayerListProps {
  players: PlayerState[]
  myPlayerId?: string
}

export function PlayerList({ players, myPlayerId }: PlayerListProps) {
  if (players.length === 0) {
    return <p className={styles.empty}>No players yet</p>
  }

  return (
    <ul className={styles.list}>
      {players.map((player) => (
        <li key={player.id} className={styles.card} data-ready={player.ready}>
          <div className={styles.info}>
            <span className={styles.name}>
              {player.name}
              {player.id === myPlayerId && <span className={styles.you}>(You)</span>}
            </span>
            <DifficultyBadge level={player.difficultyLevel} />
          </div>
          <span className={player.ready ? styles.ready : styles.notReady}>
            {player.ready ? 'Ready' : 'Not Ready'}
          </span>
        </li>
      ))}
    </ul>
  )
}
