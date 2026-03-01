import './bun-ws-patch'
import { createServer } from 'node:http'
import { Server } from 'colyseus'
import { GameRoom } from './rooms/GameRoom'

const port = Number(process.env.PORT) || 2567
const httpServer = createServer()
const gameServer = new Server({ server: httpServer })

gameServer.define('game', GameRoom).filterBy(['roomCode'])

gameServer.listen(port).then(() => {
  console.log(`[iSuperhero] Game server running on port ${port}`)
})
