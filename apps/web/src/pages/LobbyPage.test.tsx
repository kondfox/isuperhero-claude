import { render, screen, within } from '@testing-library/react'
import type { Room } from 'colyseus.js'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { RoomContext } from '../context/RoomContext'
import { AbilityName, DifficultyLevel } from '../types/game-state'
import type { GameSnapshot } from '../types/game-state'
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

const defaultContext = {
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

function renderLobbyPage(mode: string, contextOverrides: Partial<typeof defaultContext> = {}) {
  return render(
    <RoomContext.Provider value={{ ...defaultContext, ...contextOverrides }}>
      <MemoryRouter initialEntries={[`/lobby?mode=${mode}`]}>
        <Routes>
          <Route path="/lobby" element={<LobbyPage />} />
        </Routes>
      </MemoryRouter>
    </RoomContext.Provider>,
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
    expect(screen.getByText('Alice')).toBeInTheDocument()
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
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })
})
