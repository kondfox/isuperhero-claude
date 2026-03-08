import type { Room } from '@colyseus/sdk'
import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { AuthContext, type AuthContextValue } from '../context/AuthContext'
import { RoomContext } from '../context/RoomContext'
import type { GameSnapshot } from '../types/game-state'
import { AbilityName, DifficultyLevel } from '../types/game-state'
import { LobbyPage } from './LobbyPage'

const emptyAbilities = {
  [AbilityName.Management]: 0,
  [AbilityName.Communication]: 0,
  [AbilityName.Orientation]: 0,
  [AbilityName.Processing]: 0,
  [AbilityName.MovementEnergy]: 0,
}

const mockPlayer = {
  id: 'session-1',
  name: 'Alice',
  difficultyLevel: DifficultyLevel.Level1,
  abilities: emptyAbilities,
  monstersTamed: [],
  bonusCards: [],
  bonusCardsUsed: 0,
  hasBattleAdvantage: false,
  hasDefeatImmunity: false,
  connected: true,
  ready: false,
}

const mockState: GameSnapshot = {
  phase: 'waitingForPlayers',
  players: [mockPlayer],
  turnOrder: [],
  currentTurnIndex: 0,
  cosmosDeckSize: 50,
  eventLog: [],
  winnerId: '',
  roomSettings: {
    maxPlayers: 4,
    taskTimeLimitSeconds: 120,
    roomName: 'Test Room',
    roomCode: 'ABC123',
  },
}

const defaultRoomContext = {
  room: null as Room | null,
  state: null as GameSnapshot | null,
  myPlayerId: null as string | null,
  roomId: null as string | null,
  error: null as string | null,
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  send: vi.fn(),
  clearError: vi.fn(),
}

const loggedInAuthContext: AuthContextValue = {
  user: { id: 'db-uuid-1', username: 'Alice', email: 'alice@example.com' },
  isLoggedIn: true,
  loading: false,
  error: null,
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  getAccessToken: () => 'mock-token',
  clearError: vi.fn(),
}

function renderLobbyPage(
  mode: string,
  roomOverrides: Partial<typeof defaultRoomContext> = {},
  authOverrides: Partial<AuthContextValue> = {},
) {
  return render(
    <AuthContext.Provider value={{ ...loggedInAuthContext, ...authOverrides }}>
      <RoomContext.Provider value={{ ...defaultRoomContext, ...roomOverrides }}>
        <MemoryRouter initialEntries={[`/lobby?mode=${mode}`]}>
          <Routes>
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      </RoomContext.Provider>
    </AuthContext.Provider>,
  )
}

describe('LobbyPage - Create Room form', () => {
  it('shows difficulty options with age ranges', () => {
    renderLobbyPage('create')
    const select = screen.getByLabelText('Difficulty')
    const options = within(select).getAllByRole('option')
    expect(options[0]).toHaveTextContent('Ages 5')
    expect(options[1]).toHaveTextContent('Ages 7')
    expect(options[2]).toHaveTextContent('Ages 12')
  })

  it('shows "Playing as" with the logged-in player name', () => {
    renderLobbyPage('create')
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })
})

describe('LobbyPage - Join Room form', () => {
  it('shows difficulty options with age ranges', () => {
    renderLobbyPage('join')
    const select = screen.getByLabelText('Difficulty')
    const options = within(select).getAllByRole('option')
    expect(options[0]).toHaveTextContent('Ages 5')
    expect(options[1]).toHaveTextContent('Ages 7')
    expect(options[2]).toHaveTextContent('Ages 12')
  })

  it('calls joinRoom with room code, player name and playerId on submit', async () => {
    const joinRoom = vi.fn()
    renderLobbyPage('join', { joinRoom })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Room Code'), 'ABC123')
    await user.click(screen.getByRole('button', { name: /join room/i }))

    expect(joinRoom).toHaveBeenCalledWith('ABC123', {
      name: 'Alice',
      playerId: 'db-uuid-1',
      difficultyLevel: DifficultyLevel.Level1,
    })
  })

  it('shows error when join fails', () => {
    renderLobbyPage('join', { error: 'no rooms found with provided criteria' })
    expect(screen.getByText('no rooms found with provided criteria')).toBeInTheDocument()
  })
})

describe('LobbyPage - Lobby view', () => {
  const connectedContext = {
    room: {} as Room,
    state: mockState,
    myPlayerId: 'session-1',
    roomId: 'colyseus-room-id',
  }

  it('shows a "Lobby" heading', () => {
    renderLobbyPage('create', connectedContext)
    expect(screen.getByRole('heading', { name: /lobby/i })).toBeInTheDocument()
  })

  it('shows room name', () => {
    renderLobbyPage('create', connectedContext)
    expect(screen.getByText('Test Room')).toBeInTheDocument()
  })

  it('shows the room code from state (not the Colyseus roomId)', () => {
    renderLobbyPage('create', connectedContext)
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })

  it('shows correct player count with max players', () => {
    renderLobbyPage('create', connectedContext)
    expect(screen.getByText('Players (1/4)')).toBeInTheDocument()
  })

  it('shows player name in the list', () => {
    renderLobbyPage('create', connectedContext)
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)
  })

  it('shows "(You)" marker for current player', () => {
    renderLobbyPage('create', connectedContext)
    expect(screen.getByText('(You)')).toBeInTheDocument()
  })

  it('shows multiple players when more than one', () => {
    const secondPlayer = {
      ...mockPlayer,
      id: 'session-2',
      name: 'Bob',
      difficultyLevel: DifficultyLevel.Level2,
      ready: true,
    }
    const multiPlayerState = {
      ...mockState,
      players: [mockPlayer, secondPlayer],
    }
    renderLobbyPage('create', { ...connectedContext, state: multiPlayerState })
    expect(screen.getByText('Players (2/4)')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows (1/2) when maxPlayers is 2 and one player is connected', () => {
    const twoPlayerState: GameSnapshot = {
      ...mockState,
      roomSettings: { ...mockState.roomSettings, maxPlayers: 2 },
    }
    renderLobbyPage('create', { ...connectedContext, state: twoPlayerState })
    expect(screen.getByText('Players (1/2)')).toBeInTheDocument()
  })

  it('shows the creator in the player list immediately upon entering the lobby', () => {
    renderLobbyPage('create', connectedContext)
    expect(screen.queryByText('No players yet')).not.toBeInTheDocument()
    expect(screen.getByText('(You)')).toBeInTheDocument()
  })
})

describe('LobbyPage - auth redirect', () => {
  it('redirects to login when not logged in', () => {
    const authContext = { ...loggedInAuthContext, isLoggedIn: false, user: null }
    render(
      <AuthContext.Provider value={authContext}>
        <RoomContext.Provider value={defaultRoomContext}>
          <MemoryRouter initialEntries={['/lobby?mode=create']}>
            <Routes>
              <Route element={<ProtectedRoute />}>
                <Route path="/lobby" element={<LobbyPage />} />
              </Route>
              <Route path="/login" element={<div>Login</div>} />
            </Routes>
          </MemoryRouter>
        </RoomContext.Provider>
      </AuthContext.Provider>,
    )
    expect(screen.getByText('Login')).toBeInTheDocument()
  })
})
