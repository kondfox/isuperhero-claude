import { Button } from '../components/Button/Button'
import { useRoom } from '../context/RoomContext'
import { TurnPhase } from '../types/game-state'
import styles from './GamePage.module.css'

const ABILITY_LABELS: Record<string, string> = {
  management: 'Management',
  communication: 'Communication',
  orientation: 'Orientation',
  processing: 'Processing',
  movementEnergy: 'Movement Energy',
}

const ALL_ABILITIES = Object.keys(ABILITY_LABELS)

export function GamePage() {
  const { state, myPlayerId, send } = useRoom()

  if (!state || !state.turn) {
    return (
      <main className={styles.page}>
        <h1>Game Board</h1>
        <p className={styles.loading}>Loading...</p>
      </main>
    )
  }

  const turn = state.turn
  const isMyTurn = turn.activePlayerId === myPlayerId
  const activePlayer = state.players.find((p) => p.id === turn.activePlayerId)
  const activePlayerName = activePlayer?.name ?? 'Player'
  const hasDrawnCard = turn.drawnMonster || turn.drawnBonus

  return (
    <main className={styles.page} data-testid="game-board">
      <h1>Game Board</h1>

      <div className={styles.playerBar}>
        {state.players.map((player) => (
          <span
            key={player.id}
            className={`${styles.playerName} ${player.id === turn.activePlayerId ? styles.activePlayer : ''}`}
          >
            {player.name}
          </span>
        ))}
      </div>

      <div className={styles.turnIndicator} data-testid="turn-indicator">
        {isMyTurn ? 'Your turn' : `Waiting for ${activePlayerName}...`}
      </div>

      {isMyTurn && turn.phase === TurnPhase.ChoosingAction && (
        <div className={styles.actions}>
          <Button onClick={() => send('chooseAction', { action: 'developAbility' })}>
            Develop Ability
          </Button>
          <Button
            variant="secondary"
            onClick={() => send('chooseAction', { action: 'drawFromCosmos' })}
          >
            Draw from Cosmos
          </Button>
        </div>
      )}

      {isMyTurn && turn.phase === TurnPhase.ChoosingAbility && (
        <div className={styles.abilitySelection} data-testid="ability-selection">
          <p className={styles.sectionLabel}>Choose an ability</p>
          <div className={styles.abilityGrid}>
            {ALL_ABILITIES.map((ability) => (
              <Button
                key={ability}
                variant="secondary"
                onClick={() => send('chooseAbility', { ability })}
              >
                {ABILITY_LABELS[ability]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isMyTurn && turn.phase === TurnPhase.RollingDie && (
        <div className={styles.actions}>
          <Button size="large" onClick={() => send('rollDie')}>
            Roll Die
          </Button>
        </div>
      )}

      {isMyTurn && turn.phase === TurnPhase.CompletingTask && (
        <div className={styles.taskSection}>
          <div className={styles.dieResult} data-testid="die-result">
            Rolled: {turn.dieRoll?.taskNumber}
          </div>
          <div className={styles.taskCard} data-testid="task-card">
            <p className={styles.taskTitle}>
              {ABILITY_LABELS[turn.currentTask?.abilityName ?? '']} — Task #
              {turn.currentTask?.taskNumber}
            </p>
          </div>
          <div className={styles.actions}>
            <Button onClick={() => send('taskComplete', { success: true })}>Task Complete</Button>
            <Button variant="danger" onClick={() => send('taskComplete', { success: false })}>
              Task Failed
            </Button>
          </div>
        </div>
      )}

      {isMyTurn && hasDrawnCard && turn.phase !== TurnPhase.ChoosingAction && (
        <div className={styles.drawnCard} data-testid="drawn-card">
          {turn.drawnMonster && <p>Monster: {turn.drawnMonster.name}</p>}
          {turn.drawnBonus && <p>Bonus: {turn.drawnBonus.name}</p>}
          {turn.battleResult && (
            <p className={turn.battleResult.victory ? styles.victory : styles.defeat}>
              {turn.battleResult.victory ? 'Victory! Monster tamed!' : 'Defeat!'}
            </p>
          )}
        </div>
      )}

      {isMyTurn && turn.phase === TurnPhase.BattleDefeatPenalty && (
        <div className={styles.penaltySection} data-testid="battle-defeat-penalty">
          <p className={styles.sectionLabel}>Choose an ability to lose</p>
          <div className={styles.abilityGrid}>
            {ALL_ABILITIES.map((ability) => (
              <Button
                key={ability}
                variant="danger"
                onClick={() => send('battleDefeatPenalty', { ability })}
              >
                {ABILITY_LABELS[ability]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isMyTurn && turn.phase === TurnPhase.TurnComplete && (
        <div className={styles.actions}>
          <Button size="large" onClick={() => send('endTurn')}>
            End Turn
          </Button>
        </div>
      )}

      <div className={styles.eventLog} data-testid="event-log">
        {state.eventLog.length > 0 ? (
          state.eventLog.map((event) => (
            <div key={event.id} className={styles.eventItem}>
              {event.message}
            </div>
          ))
        ) : (
          <div className={styles.eventEmpty}>No events yet</div>
        )}
      </div>
    </main>
  )
}
