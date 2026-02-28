// Shared types for the iSuperhero game.
// Game logic types will be added here in the next planning session
// after the game rulebook has been reviewed.

export type PlayerId = string;
export type RoomId = string;

export interface Player {
  id: PlayerId;
  name: string;
}

export interface GameRoom {
  id: RoomId;
  players: Player[];
}
