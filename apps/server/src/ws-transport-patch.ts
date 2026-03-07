/**
 * Bun WebSocket transport singleton patch for Colyseus 0.17.
 *
 * Bun's module resolver creates separate copies of @colyseus/core for
 * `colyseus` and `@colyseus/ws-transport`, even when versions match.
 * This causes the transport's `onConnection` handler to use a different
 * `matchMaker` singleton than the one that created the room, resulting
 * in "seat reservation expired" errors.
 *
 * This patch replaces the transport's `onConnection` to use the matchMaker
 * and connectClientToRoom from the same @colyseus/core that `colyseus` uses.
 *
 * Import this module after creating the WebSocketTransport but before
 * calling gameServer.listen().
 */
import {
  CloseCode,
  connectClientToRoom,
  debugAndPrintError,
  getBearerToken,
  Protocol,
} from '@colyseus/core'
import { WebSocketClient, type WebSocketTransport } from '@colyseus/ws-transport'
import { matchMaker } from 'colyseus'

function heartbeat(this: { pingCount: number }) {
  this.pingCount = 0
}

export function patchTransportMatchMaker(transport: WebSocketTransport): void {
  // Access protected wss via cast — needed to replace the connection handler
  const wss = (
    transport as unknown as {
      wss: { removeAllListeners: (e: string) => void; on: (e: string, fn: Function) => void }
    }
  ).wss
  wss.removeAllListeners('connection')

  wss.on(
    'connection',
    async (
      rawClient: {
        on: Function
        send: Function
        close: Function
        pingCount: number
        terminate?: Function
      },
      req: { url: string; headers: Record<string, string>; socket: { remoteAddress: string } },
    ) => {
      rawClient.on('error', (err: Error) => debugAndPrintError(`${err.message}\n${err.stack}`))
      rawClient.on('pong', heartbeat)
      rawClient.pingCount = 0

      const parsedURL = new URL(`ws://server/${req.url}`)
      const sessionId = parsedURL.searchParams.get('sessionId')
      const processAndRoomId = parsedURL.pathname.match(/\/[a-zA-Z0-9_-]+\/([a-zA-Z0-9_-]+)$/)
      const roomId = processAndRoomId && processAndRoomId[1]

      if (!sessionId && !roomId) {
        const timeout = setTimeout(() => rawClient.close(CloseCode.NORMAL_CLOSURE), 1000)
        rawClient.on('message', () => rawClient.send(new Uint8Array([Protocol.PING])))
        rawClient.on('close', () => clearTimeout(timeout))
        return
      }

      const room = matchMaker.getLocalRoomById(roomId!)
      // biome-ignore lint: ws.WebSocket is compatible at runtime
      const client = new WebSocketClient(sessionId!, rawClient as never)

      const reconnectionToken = parsedURL.searchParams.get('reconnectionToken')
      const skipHandshake = parsedURL.searchParams.has('skipHandshake')

      try {
        await connectClientToRoom(
          room,
          client,
          {
            headers: new Headers(req.headers as Record<string, string>),
            token:
              parsedURL.searchParams.get('_authToken') ?? getBearerToken(req.headers.authorization),
            ip:
              req.headers['x-real-ip'] ??
              req.headers['x-forwarded-for'] ??
              req.socket.remoteAddress,
          },
          {
            reconnectionToken: reconnectionToken ?? undefined,
            skipHandshake,
          },
        )
      } catch (e: unknown) {
        const err = e as { code: number; message: string }
        debugAndPrintError(e as Error)
        client.error(err.code, err.message, () =>
          rawClient.close(reconnectionToken ? CloseCode.FAILED_TO_RECONNECT : CloseCode.WITH_ERROR),
        )
      }
    },
  )
}
