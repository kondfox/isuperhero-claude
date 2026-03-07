import './bun-ws-patch'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { Server } from 'colyseus'
import type { NextFunction, Request, Response } from 'express'
import { handleApiRequest } from './api/routes'
import { getDb } from './db/index'
import { GameRoom } from './rooms/GameRoom'
import { patchTransportMatchMaker } from './ws-transport-patch'

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

// Create HTTP server manually for Bun compatibility
const httpServer = createServer()

const transport = new WebSocketTransport({ server: httpServer })
patchTransportMatchMaker(transport)

const gameServer = new Server({
  transport,
  express: (app) => {
    // API routes
    app.all('/api/*', async (req: Request, res: Response) => {
      if (!process.env.DATABASE_URL) {
        res.status(503).json({ error: 'Database not configured', code: 'NO_DATABASE' })
        return
      }
      try {
        const handled = await handleApiRequest(req, res, getDb())
        if (!handled) {
          res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' })
        }
      } catch (_err) {
        res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
      }
    })

    // Static file serving (production)
    if (hasStaticFiles) {
      app.get('*', (req: Request, res: Response, next: NextFunction) => {
        const url = req.url ?? '/'

        // Skip Colyseus paths
        if (url.startsWith('/colyseus') || url.startsWith('/matchmake')) {
          next()
          return
        }

        const filePath = join(webRoot, url)
        if (existsSync(filePath) && !filePath.endsWith('/')) {
          const ext = extname(filePath)
          res.setHeader('Content-Type', MIME_TYPES[ext] ?? 'application/octet-stream')
          res.send(readFileSync(filePath))
          return
        }

        // SPA fallback: serve index.html for non-file routes
        res.setHeader('Content-Type', 'text/html')
        res.send(readFileSync(join(webRoot, 'index.html')))
      })
    }
  },
})

gameServer.define('game', GameRoom).filterBy(['roomCode'])

// Bun's httpServer.listen() throws a non-fatal error through the callback.
// Patch the transport.listen to bind the port ourselves and skip the error.
transport.listen = function (
  _port: number,
  _hostname: unknown,
  _backlog: unknown,
  callback: (err?: Error) => void,
) {
  httpServer.listen(port, () => {
    callback()
  })
  httpServer.on('error', (err) => {
    // Only real errors — Bun's spurious error has no code
    if ((err as NodeJS.ErrnoException).code) {
      callback(err)
    }
  })
  return this
}

gameServer.listen(port).then(() => {
  console.log(`[iSuperhero] Game server running on port ${port}`)
  if (hasStaticFiles) {
    console.log(`[iSuperhero] Serving static files from ${webRoot}`)
  }
})
