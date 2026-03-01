/**
 * Stub process.send before Colyseus loads.
 * Colyseus includes PM2/APM monitoring that calls process.send(),
 * which conflicts with Vitest's worker communication channel.
 */
const originalSend = process.send?.bind(process)
process.send = ((message: unknown, ...args: unknown[]) => {
  // Suppress Colyseus's PM2 APM messages
  if (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    typeof (message as Record<string, unknown>).type === 'string' &&
    ((message as Record<string, unknown>).type as string).startsWith('axm:')
  ) {
    return true
  }
  return originalSend?.(message, ...args) ?? false
}) as typeof process.send
