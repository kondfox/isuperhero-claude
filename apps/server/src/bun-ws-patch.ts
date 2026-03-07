/**
 * Bun WebSocket compatibility patch for Colyseus.
 *
 * Bun's `ws` compatibility layer converts plain JavaScript Arrays to strings
 * via `.toString()` when calling `ws.send()`. Colyseus's `getMessageBytes`
 * returns plain Arrays for protocol messages like ROOM_STATE and
 * ROOM_STATE_PATCH, so they arrive as text frames (e.g. "14") instead of
 * binary — causing the client to silently ignore them.
 *
 * This patch wraps `WebSocketClient.prototype.raw` to convert plain Arrays
 * to `Uint8Array` before sending, ensuring binary delivery.
 *
 * Import this module before creating the Colyseus Server.
 */
import { WebSocketClient } from '@colyseus/ws-transport'

const originalRaw = WebSocketClient.prototype.raw

WebSocketClient.prototype.raw = function patchedRaw(
  data: Uint8Array | Buffer,
  options?: { afterNextPatch?: boolean },
  cb?: (err?: Error) => void,
) {
  const sendData = Array.isArray(data) ? new Uint8Array(data as unknown as ArrayLike<number>) : data
  return originalRaw.call(this, sendData, options, cb)
}
