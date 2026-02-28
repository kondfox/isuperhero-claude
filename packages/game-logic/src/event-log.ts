import type { GameEvent, GameEventType, PlayerId } from "@isuperhero/types";

let eventCounter = 0;

export function createGameEvent(
  playerId: PlayerId,
  message: string,
  type: GameEventType,
): GameEvent {
  eventCounter += 1;
  return {
    id: `evt_${Date.now()}_${eventCounter}`,
    timestamp: Date.now(),
    playerId,
    message,
    type,
  };
}

export function addEvent(events: readonly GameEvent[], event: GameEvent): GameEvent[] {
  return [...events, event];
}
