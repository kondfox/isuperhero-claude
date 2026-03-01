import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../components/Button/Button'
import { PlayerList } from '../components/PlayerList/PlayerList'
import { useRoom } from '../context/RoomContext'
import { DifficultyLevel, GamePhase } from '../types/game-state'
import styles from './LobbyPage.module.css'

function CreateRoomForm() {
  const { createRoom, error, clearError } = useRoom()
  const [playerName, setPlayerName] = useState('')
  const [difficulty, setDifficulty] = useState(DifficultyLevel.Level1)
  const [roomName, setRoomName] = useState('Game Room')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [taskTimeLimit, setTaskTimeLimit] = useState(120)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!playerName.trim()) return
    setSubmitting(true)
    clearError()
    await createRoom({
      name: playerName.trim(),
      difficultyLevel: difficulty,
      roomName: roomName.trim() || 'Game Room',
      maxPlayers,
      taskTimeLimitSeconds: taskTimeLimit,
    })
    setSubmitting(false)
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Create Room</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="playerName">
            Your Name
          </label>
          <input
            id="playerName"
            className={styles.input}
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            required
            maxLength={20}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="difficulty">
              Difficulty
            </label>
            <select
              id="difficulty"
              className={styles.select}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value) as DifficultyLevel)}
            >
              <option value={1}>Level 1</option>
              <option value={2}>Level 2</option>
              <option value={3}>Level 3</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="maxPlayers">
              Max Players
            </label>
            <select
              id="maxPlayers"
              className={styles.select}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            >
              <option value={2}>2 Players</option>
              <option value={3}>3 Players</option>
              <option value={4}>4 Players</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="roomName">
            Room Name
          </label>
          <input
            id="roomName"
            className={styles.input}
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Game Room"
            maxLength={30}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="taskTimeLimit">
            Task Time Limit
          </label>
          <select
            id="taskTimeLimit"
            className={styles.select}
            value={taskTimeLimit}
            onChange={(e) => setTaskTimeLimit(Number(e.target.value))}
          >
            <option value={60}>60 seconds</option>
            <option value={90}>90 seconds</option>
            <option value={120}>120 seconds</option>
            <option value={180}>180 seconds</option>
          </select>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <Button type="submit" disabled={submitting || !playerName.trim()}>
            {submitting ? 'Creating...' : 'Create Room'}
          </Button>
        </div>
      </form>
      <Link to="/" className={styles.backLink}>
        Back to Home
      </Link>
    </div>
  )
}

function JoinRoomForm() {
  const { joinRoom, error, clearError } = useRoom()
  const [playerName, setPlayerName] = useState('')
  const [difficulty, setDifficulty] = useState(DifficultyLevel.Level1)
  const [roomCode, setRoomCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!playerName.trim() || !roomCode.trim()) return
    setSubmitting(true)
    clearError()
    await joinRoom(roomCode.trim(), {
      name: playerName.trim(),
      difficultyLevel: difficulty,
    })
    setSubmitting(false)
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Join Room</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="roomCode">
            Room Code
          </label>
          <input
            id="roomCode"
            className={styles.input}
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Enter room code"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="joinPlayerName">
            Your Name
          </label>
          <input
            id="joinPlayerName"
            className={styles.input}
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            required
            maxLength={20}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="joinDifficulty">
            Difficulty
          </label>
          <select
            id="joinDifficulty"
            className={styles.select}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value) as DifficultyLevel)}
          >
            <option value={1}>Level 1</option>
            <option value={2}>Level 2</option>
            <option value={3}>Level 3</option>
          </select>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <Button type="submit" disabled={submitting || !playerName.trim() || !roomCode.trim()}>
            {submitting ? 'Joining...' : 'Join Room'}
          </Button>
        </div>
      </form>
      <Link to="/" className={styles.backLink}>
        Back to Home
      </Link>
    </div>
  )
}

function LobbyView() {
  const { state, myPlayerId, roomId, send, leaveRoom, error } = useRoom()
  const navigate = useNavigate()

  // Navigate to game when it starts
  useEffect(() => {
    if (state?.phase === GamePhase.InProgress && roomId) {
      navigate(`/game/${roomId}`)
    }
  }, [state?.phase, roomId, navigate])

  if (!state) return null

  const players = state.players
  const myPlayer = players.find((p) => p.id === myPlayerId)
  const allReady = players.length >= 2 && players.every((p) => p.ready)

  const handleToggleReady = () => {
    send('playerReady', { ready: !myPlayer?.ready })
  }

  const handleStartGame = () => {
    send('startGame')
  }

  const handleLeave = async () => {
    await leaveRoom()
  }

  return (
    <div className={styles.lobbyCard}>
      <div className={styles.roomInfo}>
        <h1 className={styles.roomName}>{state.roomSettings.roomName}</h1>
        <div className={styles.roomCode}>
          <span>Code:</span>
          <span className={styles.codeValue}>{roomId}</span>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <p className={styles.sectionTitle}>
        Players ({players.length}/{state.roomSettings.maxPlayers})
      </p>
      <PlayerList players={players} myPlayerId={myPlayerId ?? undefined} />

      <div className={styles.lobbyActions}>
        <Button variant="secondary" onClick={handleToggleReady}>
          {myPlayer?.ready ? 'Not Ready' : 'Ready'}
        </Button>
        {allReady && <Button onClick={handleStartGame}>Start Game</Button>}
        <Button variant="danger" onClick={handleLeave}>
          Leave
        </Button>
      </div>
    </div>
  )
}

export function LobbyPage() {
  const { room } = useRoom()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') ?? 'create'

  return (
    <main className={styles.page}>
      {room ? <LobbyView /> : mode === 'join' ? <JoinRoomForm /> : <CreateRoomForm />}
    </main>
  )
}
