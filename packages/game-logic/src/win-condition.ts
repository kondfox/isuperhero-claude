import type { GameState, PlayerId, PlayerState } from "@isuperhero/types";
import { MONSTERS_TO_WIN } from "./constants";

export function checkWinCondition(player: PlayerState): boolean {
  return player.monstersTamed.length >= MONSTERS_TO_WIN;
}

export function checkGameOver(state: GameState): PlayerId | null {
  for (const player of state.players) {
    if (checkWinCondition(player)) {
      return player.id;
    }
  }
  return null;
}
