import { describe, expect, it, vi } from 'vitest'

/**
 * Tests for the Bun WebSocket compatibility patch.
 *
 * Bun's ws `send()` converts plain JavaScript Arrays to strings via
 * `.toString()`, breaking Colyseus binary protocol messages. The patch
 * converts Arrays to Uint8Array before sending.
 */
describe('bun-ws-patch', () => {
  it('converts plain Array data to Uint8Array before sending', async () => {
    // Mock the WebSocketClient that @colyseus/ws-transport exports
    const sendSpy = vi.fn()
    const mockWs = { readyState: 1, send: sendSpy }

    // Import the WebSocketClient class
    const { WebSocketClient } = await import('@colyseus/ws-transport')

    // Apply the patch
    await import('./bun-ws-patch')

    // Create a client instance with an open connection
    const client = new WebSocketClient('test-id', mockWs as never)
    // Override state to JOINED so raw() is called directly
    client.state = 1 // ClientState.JOINED

    // Send a plain Array (like Colyseus ROOM_STATE message)
    const plainArray = [14, 0, 1, 2, 3]
    client.raw(plainArray as never)

    expect(sendSpy).toHaveBeenCalledTimes(1)
    const sentData = sendSpy.mock.calls[0][0]
    expect(sentData).toBeInstanceOf(Uint8Array)
    expect(Array.from(sentData)).toEqual([14, 0, 1, 2, 3])
  })

  it('leaves Buffer data unchanged', async () => {
    const sendSpy = vi.fn()
    const mockWs = { readyState: 1, send: sendSpy }

    const { WebSocketClient } = await import('@colyseus/ws-transport')
    await import('./bun-ws-patch')

    const client = new WebSocketClient('test-id', mockWs as never)
    client.state = 1

    const buffer = Buffer.from([10, 0, 1, 2])
    client.raw(buffer as never)

    expect(sendSpy).toHaveBeenCalledTimes(1)
    const sentData = sendSpy.mock.calls[0][0]
    // Buffer is a subclass of Uint8Array, should pass through unchanged
    expect(sentData).toBe(buffer)
  })

  it('leaves Uint8Array data unchanged', async () => {
    const sendSpy = vi.fn()
    const mockWs = { readyState: 1, send: sendSpy }

    const { WebSocketClient } = await import('@colyseus/ws-transport')
    await import('./bun-ws-patch')

    const client = new WebSocketClient('test-id', mockWs as never)
    client.state = 1

    const uint8 = new Uint8Array([14, 0, 1, 2])
    client.raw(uint8 as never)

    expect(sendSpy).toHaveBeenCalledTimes(1)
    const sentData = sendSpy.mock.calls[0][0]
    expect(sentData).toBe(uint8)
  })
})
