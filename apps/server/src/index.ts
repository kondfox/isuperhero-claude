import './bun-ws-patch'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'colyseus'
import { handleApiRequest } from './api/routes'
import { getDb } from './db/index'
import { GameRoom } from './rooms/GameRoom'

const port = Number(process.env.PORT) || 2567
const __dirname = dirname(fileURLToPath(import.meta.url))
const webRoot = join(__dirname, '../../../web')
const hasStaticFiles = existsSync(join(webRoot, 'index.html'))

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const httpServer = createServer(async (req, res) => {
  const url = req.url ?? '/'

  // API routes (only if DATABASE_URL is configured)
  if (url.startsWith('/api/') && process.env.DATABASE_URL) {
    try {
      const handled = await handleApiRequest(req, res, getDb())
      if (handled) return
    } catch (_err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }))
      return
    }
  }

  if (!hasStaticFiles) return

  // Skip Colyseus paths
  if (url.startsWith('/colyseus') || url.startsWith('/matchmake')) return

  const filePath = join(webRoot, url)
  if (existsSync(filePath) && !filePath.endsWith('/')) {
    const ext = extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' })
    res.end(readFileSync(filePath))
    return
  }

  // SPA fallback: serve index.html for non-file routes
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(readFileSync(join(webRoot, 'index.html')))
})

const gameServer = new Server({ server: httpServer })

gameServer.define('game', GameRoom).filterBy(['roomCode'])

gameServer.listen(port).then(() => {
  console.log(`[iSuperhero] Game server running on port ${port}`)
  if (hasStaticFiles) {
    console.log(`[iSuperhero] Serving static files from ${webRoot}`)
  }
})
