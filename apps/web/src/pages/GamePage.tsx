import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button/Button'
import { useRoom } from '../context/RoomContext'
import { AbilityName, GameEventType, GamePhase, TurnPhase } from '../types/game-state'
import { GameOverOverlay } from './GameOverOverlay'
import styles from './GamePage.module.css'

const POSITIVE_EVENTS = new Set([
  GameEventType.TaskCompleted,
  GameEventType.MonsterTamed,
  GameEventType.AbilityIncreased,
  GameEventType.BonusCardUsed,
])

const NEGATIVE_EVENTS = new Set([
  GameEventType.BattleDefeat,
  GameEventType.AbilityLost,
  GameEventType.TaskFailed,
])

function getEventColorClass(type: GameEventType): string {
  if (POSITIVE_EVENTS.has(type)) return styles.eventPositive
  if (NEGATIVE_EVENTS.has(type)) return styles.eventNegative
  return styles.eventInfo
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

const ABILITY_LABELS: Record<AbilityName, string> = {
  [AbilityName.Management]: 'Management',
  [AbilityName.Communication]: 'Communication',
  [AbilityName.Orientation]: 'Orientation',
  [AbilityName.Processing]: 'Processing',
  [AbilityName.MovementEnergy]: 'Movement Energy',
}

const ALL_ABILITIES = Object.keys(ABILITY_LABELS) as AbilityName[]

export function GamePage() {
  const { state, myPlayerId, send } = useRoom()
  const eventLogRef = useRef<HTMLDivElement>(null)
  const [expandedPassport, setExpandedPassport] = useState<string | null>(null)
  const [eventLogExpanded, setEventLogExpanded] = useState(true)
  const eventCount = state?.eventLog.length ?? 0

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when event count changes
  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight
    }
  }, [eventCount])

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
  const developDone = !!turn.currentTask

  return (
    <main className={styles.page} data-testid="game-board">
      <h1>Game Board</h1>

      <div className={styles.cosmosDeck}>
        Cosmos Deck: <span data-testid="cosmos-deck-count">{state.cosmosDeckSize}</span>
      </div>

      <div className={styles.passportRow}>
        {state.players.map((player) => {
          const isExpanded = expandedPassport === player.id
          const isCompact = !isExpanded
          const abilityTotal = Object.values(player.abilities).reduce(
            (a: number, b: number) => a + b,
            0,
          )
          return (
            // biome-ignore lint/a11y/useSemanticElements: passport has complex layout content
            <div
              key={player.id}
              className={`${styles.passport} ${player.id === turn.activePlayerId ? styles.passportActive : ''} ${isCompact ? styles.passportCompact : ''}`}
              data-testid="player-passport"
              role="button"
              tabIndex={0}
              onClick={() => setExpandedPassport(isExpanded ? null : player.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setExpandedPassport(isExpanded ? null : player.id)
                }
              }}
            >
              <span className={styles.passportName}>{player.name}</span>
              {isCompact && (
                <div className={styles.passportSummary}>
                  <span>{player.monstersTamed.length} monsters</span>
                  <span>{abilityTotal} ability</span>
                </div>
              )}
              <div className={styles.abilityBars}>
                {ALL_ABILITIES.map((ability) => (
                  <div key={ability} className={styles.abilityRow}>
                    <span className={styles.abilityLabel}>{ABILITY_LABELS[ability]}</span>
                    <div className={styles.abilityBarTrack}>
                      <div
                        className={styles.abilityBarFill}
                        style={{
                          width: `${(player.abilities[ability] / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <span className={styles.abilityValue} data-testid="ability-score">
                      {player.abilities[ability]}
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.shipBeds}>
                {[0, 1, 2].map((i) => {
                  const monster = player.monstersTamed[i]
                  return (
                    <div
                      key={i}
                      className={`${styles.shipBed} ${monster ? styles.shipBedFilled : ''}`}
                      data-testid="ship-bed"
                      data-filled={monster ? 'true' : 'false'}
                      title={monster?.name}
                    >
                      {monster ? (
                        <img
                          src={monster.imageUrl}
                          alt={monster.name}
                          className={styles.shipBedImage}
                        />
                      ) : (
                        ''
                      )}
                    </div>
                  )
                })}
              </div>
              <div
                className={styles.bonusTray}
                data-testid="bonus-tray"
                data-empty={player.bonusCards.length === 0 ? 'true' : 'false'}
              >
                {player.bonusCards.length > 0 ? (
                  player.bonusCards.map((card) => (
                    <span key={card.id} className={styles.bonusCard} title={card.description}>
                      <img src={card.imageUrl} alt={card.name} className={styles.bonusCardImage} />
                      {card.name}
                    </span>
                  ))
                ) : (
                  <span className={styles.bonusTrayEmpty}>No bonus cards</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.turnIndicator} data-testid="turn-indicator">
        {isMyTurn ? 'Your turn' : `Waiting for ${activePlayerName}...`}
      </div>

      {isMyTurn && turn.phase === TurnPhase.ChoosingAction && !developDone && (
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

      {isMyTurn && turn.phase === TurnPhase.ChoosingAction && developDone && (
        <div className={styles.actions}>
          <Button onClick={() => send('chooseAction', { action: 'drawFromCosmos' })}>
            Draw from Cosmos
          </Button>
          <Button variant="secondary" onClick={() => send('endTurn')}>
            End Turn
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
            <p className={styles.taskTitle} data-testid="task-title">
              {turn.currentTask?.title ||
                `${ABILITY_LABELS[turn.currentTask?.abilityName as AbilityName] ?? turn.currentTask?.abilityName} — Task #${turn.currentTask?.taskNumber}`}
            </p>
            <span className={styles.taskType} data-testid="task-type">
              {turn.currentTask?.taskType === 'digital' ? 'Digital' : 'Non-Digital'}
            </span>
            <div className={styles.taskRewards}>
              {turn.currentTask?.rewards.map((r) => (
                <span key={r} className={styles.taskReward} data-testid="task-reward">
                  {ABILITY_LABELS[r as AbilityName] ?? r}
                </span>
              ))}
            </div>
            {turn.currentTask?.requirements && (
              <p className={styles.taskRequirements} data-testid="task-requirements">
                {turn.currentTask.requirements}
              </p>
            )}
            {turn.currentTask?.instructions && (
              <div
                className={styles.taskInstructions}
                data-testid="task-instructions"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted server data from tasks-data.ts, never user input
                dangerouslySetInnerHTML={{ __html: turn.currentTask.instructions }}
              />
            )}
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
          {turn.drawnMonster && (
            <>
              <img
                src={turn.drawnMonster.imageUrl}
                alt={turn.drawnMonster.name}
                className={styles.drawnCardImage}
              />
              <p>Monster: {turn.drawnMonster.name}</p>
            </>
          )}
          {turn.drawnBonus && (
            <>
              <img
                src={turn.drawnBonus.imageUrl}
                alt={turn.drawnBonus.name}
                className={styles.drawnCardImage}
              />
              <p>Bonus: {turn.drawnBonus.name}</p>
            </>
          )}
          {turn.battleResult && (
            <>
              <div className={styles.battleComparison} data-testid="battle-comparison">
                {ALL_ABILITIES.map((ability) => {
                  const matchup = turn.battleResult?.comparisons[ability]
                  if (!matchup) return null
                  return (
                    <div
                      key={ability}
                      className={`${styles.battleMatchup} ${matchup.playerWins ? styles.matchupWin : styles.matchupLose}`}
                      data-testid="battle-matchup"
                    >
                      <span className={styles.matchupScore}>{matchup.playerScore}</span>
                      <span className={styles.matchupLabel}>{ABILITY_LABELS[ability]}</span>
                      <span className={styles.matchupScore}>{matchup.monsterScore}</span>
                    </div>
                  )
                })}
              </div>
              <p className={turn.battleResult.victory ? styles.victory : styles.defeat}>
                {turn.battleResult.victory ? 'Victory! Monster tamed!' : 'Defeat!'}
              </p>
            </>
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

      <div className={styles.eventLogWrapper}>
        <button
          type="button"
          className={styles.collapsibleHeader}
          onClick={() => setEventLogExpanded(!eventLogExpanded)}
          aria-label="Toggle event log"
        >
          <span>Event Log ({state.eventLog.length})</span>
          <span>{eventLogExpanded ? '\u25B2' : '\u25BC'}</span>
        </button>
        <div
          className={`${styles.eventLog} ${eventLogExpanded ? '' : styles.collapsibleCollapsed}`}
          data-testid="event-log"
          ref={eventLogRef}
        >
          {state.eventLog.length > 0 ? (
            state.eventLog.map((event) => (
              <div
                key={event.id}
                className={`${styles.eventItem} ${getEventColorClass(event.type)}`}
              >
                <span>{event.message}</span>
                <span className={styles.eventTimestamp}>{formatRelativeTime(event.timestamp)}</span>
              </div>
            ))
          ) : (
            <div className={styles.eventEmpty}>No events yet</div>
          )}
        </div>
      </div>

      {state.phase === GamePhase.Finished && state.winnerId && <GameOverOverlay state={state} />}
    </main>
  )
}
