import { Client, type Room } from 'colyseus.js'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { GameSnapshot } from '../types/game-state'
import { generateRoomCode } from '../utils/room-code'
import { schemaToSnapshot } from '../utils/schema-to-snapshot'

function getWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}`
  }
  return 'ws://localhost:2567'
}

const WS_URL = getWsUrl()

export interface CreateRoomOptions {
  name: string
  difficultyLevel: number
  roomName?: string
  maxPlayers?: number
  taskTimeLimitSeconds?: number
}

export interface JoinRoomOptions {
  name: string
  difficultyLevel: number
}

interface RoomContextValue {
  room: Room | null
  state: GameSnapshot | null
  myPlayerId: string | null
  roomId: string | null
  error: string | null
  createRoom: (options: CreateRoomOptions) => Promise<void>
  joinRoom: (roomCode: string, options: JoinRoomOptions) => Promise<void>
  leaveRoom: () => Promise<void>
  send: (type: string, data?: Record<string, unknown>) => void
  clearError: () => void
}

const RoomContext = createContext<RoomContextValue | null>(null)

export function RoomProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<Client | null>(null)
  const roomRef = useRef<Room | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [state, setState] = useState<GameSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  const myPlayerId = room?.sessionId ?? null
  const roomId = room?.roomId ?? null

  const getClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new Client(WS_URL)
    }
    return clientRef.current
  }, [])

  const setupRoom = useCallback((newRoom: Room) => {
    roomRef.current = newRoom
    setRoom(newRoom)
    setError(null)

    // Set initial state (may have default/empty values before first sync)
    if (newRoom.state) {
      setState(schemaToSnapshot(newRoom.state))
    }

    // Subscribe to state changes — fires on every server sync
    newRoom.onStateChange((newState: unknown) => {
      setState(schemaToSnapshot(newState))
    })

    // Listen for server errors
    newRoom.onMessage('error', (message: { message: string }) => {
      setError(message.message)
    })

    // Handle disconnect
    newRoom.onLeave(() => {
      roomRef.current = null
      setRoom(null)
      setState(null)
    })
  }, [])

  const createRoom = useCallback(
    async (options: CreateRoomOptions) => {
      try {
        setError(null)
        const client = getClient()
        const roomCode = generateRoomCode()
        const newRoom = await client.create('game', { ...options, roomCode })
        setupRoom(newRoom)
      } catch (err) {
        setError((err as Error).message)
      }
    },
    [getClient, setupRoom],
  )

  const joinRoom = useCallback(
    async (roomCode: string, options: JoinRoomOptions) => {
      try {
        setError(null)
        const client = getClient()
        const newRoom = await client.join('game', { ...options, roomCode })
        setupRoom(newRoom)
      } catch (err) {
        setError((err as Error).message)
      }
    },
    [getClient, setupRoom],
  )

  const leaveRoom = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.leave()
      roomRef.current = null
      setRoom(null)
      setState(null)
    }
  }, [])

  const send = useCallback((type: string, data?: Record<string, unknown>) => {
    roomRef.current?.send(type, data)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      roomRef.current?.leave()
    }
  }, [])

  return (
    <RoomContext.Provider
      value={{
        room,
        state,
        myPlayerId,
        roomId,
        error,
        createRoom,
        joinRoom,
        leaveRoom,
        send,
        clearError,
      }}
    >
      {children}
    </RoomContext.Provider>
  )
}

export function useRoom() {
  const context = useContext(RoomContext)
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider')
  }
  return context
}

// Export context for testing
export { RoomContext }
