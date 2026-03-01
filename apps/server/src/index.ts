import { createServer } from 'node:http'
import { Server } from 'colyseus'

const port = Number(process.env.PORT) || 2567
const httpServer = createServer()
const gameServer = new Server({ server: httpServer })

// Rooms will be registered here in the next planning session.
// Example: gameServer.define("game_room", GameRoom);

gameServer.listen(port).then(() => {
  console.log(`[iSuperhero] Game server running on port ${port}`)
})
