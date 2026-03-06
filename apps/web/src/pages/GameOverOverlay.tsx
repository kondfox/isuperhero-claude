import { useNavigate } from 'react-router'
import { Button } from '../components/Button/Button'
import { useRoom } from '../context/RoomContext'
import type { GameSnapshot } from '../types/game-state'
import styles from './GameOverOverlay.module.css'

interface GameOverOverlayProps {
  state: GameSnapshot
}

export function GameOverOverlay({ state }: GameOverOverlayProps) {
  const { myPlayerId, leaveRoom } = useRoom()
  const navigate = useNavigate()

  const rankings = state.players
    .map((p) => ({
      playerId: p.id,
      name: p.name,
      monstersCount: p.monstersTamed.length,
      totalAbilityScore: Object.values(p.abilities).reduce((a: number, b: number) => a + b, 0),
    }))
    .sort((a, b) => b.monstersCount - a.monstersCount || b.totalAbilityScore - a.totalAbilityScore)

  const winner = rankings[0]

  const handleLeave = async () => {
    await leaveRoom()
    navigate('/')
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-label="Game over">
      <div className={styles.panel}>
        <div className={styles.trophy}>&#9733;</div>
        <div className={styles.winnerName}>{winner?.name} wins!</div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Monsters</th>
              <th>Ability</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => (
              <tr
                key={r.playerId}
                className={r.playerId === myPlayerId ? styles.currentPlayer : undefined}
              >
                <td className={styles.rank}>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.monstersCount}</td>
                <td>{r.totalAbilityScore}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.actions}>
          <Button onClick={handleLeave} aria-label="Back to lobby">
            Back to Lobby
          </Button>
          <Button variant="secondary" onClick={handleLeave} aria-label="Play again">
            Play Again
          </Button>
        </div>
      </div>
    </div>
  )
}
