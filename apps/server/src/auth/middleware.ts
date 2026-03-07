import type { IncomingMessage } from 'node:http'
import type { JwtPayload } from './jwt'
import { verifyAccessToken } from './jwt'

export async function extractAuthPayload(req: IncomingMessage): Promise<JwtPayload | null> {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null

  const token = header.slice(7)
  try {
    return await verifyAccessToken(token)
  } catch {
    return null
  }
}
