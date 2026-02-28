import { type GameEvent, GameEventType } from "@isuperhero/types";
import { describe, expect, it } from "vitest";
import { addEvent, createGameEvent } from "./event-log";

describe("createGameEvent", () => {
  it("creates an event with all required fields", () => {
    const event = createGameEvent("p1", "Alice rolled 14", GameEventType.DieRolled);
    expect(event.playerId).toBe("p1");
    expect(event.message).toBe("Alice rolled 14");
    expect(event.type).toBe(GameEventType.DieRolled);
    expect(event.id).toMatch(/^evt_/);
    expect(typeof event.timestamp).toBe("number");
  });

  it("generates unique IDs", () => {
    const e1 = createGameEvent("p1", "msg1", GameEventType.TurnStarted);
    const e2 = createGameEvent("p1", "msg2", GameEventType.TurnStarted);
    expect(e1.id).not.toBe(e2.id);
  });
});

describe("addEvent", () => {
  it("appends event to the log", () => {
    const event = createGameEvent("p1", "test", GameEventType.GameStarted);
    const log = addEvent([], event);
    expect(log).toHaveLength(1);
    expect(log[0]).toBe(event);
  });

  it("does not mutate the original array", () => {
    const existing: GameEvent[] = [createGameEvent("p1", "first", GameEventType.GameStarted)];
    const newEvent = createGameEvent("p2", "second", GameEventType.PlayerJoined);
    const result = addEvent(existing, newEvent);
    expect(existing).toHaveLength(1);
    expect(result).toHaveLength(2);
  });

  it("preserves existing events", () => {
    const first = createGameEvent("p1", "first", GameEventType.GameStarted);
    const second = createGameEvent("p2", "second", GameEventType.PlayerJoined);
    const log = addEvent([first], second);
    expect(log[0]).toBe(first);
    expect(log[1]).toBe(second);
  });
});
