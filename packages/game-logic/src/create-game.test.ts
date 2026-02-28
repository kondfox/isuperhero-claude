import { AbilityName, DifficultyLevel, GamePhase, TurnPhase } from "@isuperhero/types";
import { describe, expect, it } from "vitest";
import {
  addPlayerToGame,
  createGameState,
  createInitialAbilities,
  createPlayer,
  removePlayerFromGame,
  startGame,
} from "./create-game";

const defaultSettings = {
  maxPlayers: 4,
  taskTimeLimitSeconds: 60,
  roomName: "Test Room",
  roomCode: "ABC123",
};

describe("createInitialAbilities", () => {
  it("returns all abilities at 0", () => {
    const abilities = createInitialAbilities();
    expect(abilities[AbilityName.Management]).toBe(0);
    expect(abilities[AbilityName.Communication]).toBe(0);
    expect(abilities[AbilityName.Orientation]).toBe(0);
    expect(abilities[AbilityName.Processing]).toBe(0);
    expect(abilities[AbilityName.MovementEnergy]).toBe(0);
  });
});

describe("createPlayer", () => {
  it("creates a player with initial state", () => {
    const player = createPlayer("p1", "Alice", DifficultyLevel.Level1);
    expect(player.id).toBe("p1");
    expect(player.name).toBe("Alice");
    expect(player.difficultyLevel).toBe(DifficultyLevel.Level1);
    expect(player.abilities[AbilityName.Management]).toBe(0);
    expect(player.monstersTamed).toEqual([]);
    expect(player.bonusCards).toEqual([]);
    expect(player.connected).toBe(true);
    expect(player.ready).toBe(false);
  });
});

describe("createGameState", () => {
  it("creates a game in WaitingForPlayers phase", () => {
    const state = createGameState(defaultSettings);
    expect(state.phase).toBe(GamePhase.WaitingForPlayers);
    expect(state.players).toEqual([]);
    expect(state.turnOrder).toEqual([]);
    expect(state.currentTurnIndex).toBe(0);
    expect(state.turn).toBeNull();
    expect(state.rolledTasks).toEqual({});
    expect(state.cosmosDeck).toEqual([]);
    expect(state.discardPile).toEqual([]);
    expect(state.eventLog).toEqual([]);
    expect(state.winnerId).toBeNull();
    expect(state.roomSettings).toBe(defaultSettings);
  });
});

describe("addPlayerToGame", () => {
  it("adds a player to the game", () => {
    const state = createGameState(defaultSettings);
    const player = createPlayer("p1", "Alice", DifficultyLevel.Level1);
    const result = addPlayerToGame(state, player);
    expect(result.players).toHaveLength(1);
    expect(result.players[0].id).toBe("p1");
  });

  it("does not mutate the original state", () => {
    const state = createGameState(defaultSettings);
    const player = createPlayer("p1", "Alice", DifficultyLevel.Level1);
    addPlayerToGame(state, player);
    expect(state.players).toHaveLength(0);
  });

  it("throws when room is full", () => {
    const settings = { ...defaultSettings, maxPlayers: 2 };
    let state = createGameState(settings);
    state = addPlayerToGame(state, createPlayer("p1", "Alice", DifficultyLevel.Level1));
    state = addPlayerToGame(state, createPlayer("p2", "Bob", DifficultyLevel.Level2));
    expect(() =>
      addPlayerToGame(state, createPlayer("p3", "Charlie", DifficultyLevel.Level3)),
    ).toThrow("Room is full");
  });

  it("throws when player already exists", () => {
    let state = createGameState(defaultSettings);
    state = addPlayerToGame(state, createPlayer("p1", "Alice", DifficultyLevel.Level1));
    expect(() =>
      addPlayerToGame(state, createPlayer("p1", "Alice2", DifficultyLevel.Level2)),
    ).toThrow("already in the game");
  });

  it("throws when game has started", () => {
    const state = createGameState(defaultSettings);
    const started = { ...state, phase: GamePhase.InProgress };
    expect(() =>
      addPlayerToGame(started, createPlayer("p1", "Alice", DifficultyLevel.Level1)),
    ).toThrow("Cannot add players after game has started");
  });
});

describe("removePlayerFromGame", () => {
  it("removes a player", () => {
    let state = createGameState(defaultSettings);
    state = addPlayerToGame(state, createPlayer("p1", "Alice", DifficultyLevel.Level1));
    state = addPlayerToGame(state, createPlayer("p2", "Bob", DifficultyLevel.Level2));
    const result = removePlayerFromGame(state, "p1");
    expect(result.players).toHaveLength(1);
    expect(result.players[0].id).toBe("p2");
  });

  it("removes player from turn order", () => {
    let state = createGameState(defaultSettings);
    state = addPlayerToGame(state, createPlayer("p1", "Alice", DifficultyLevel.Level1));
    state = addPlayerToGame(state, createPlayer("p2", "Bob", DifficultyLevel.Level2));
    state = { ...state, turnOrder: ["p1", "p2"] };
    const result = removePlayerFromGame(state, "p1");
    expect(result.turnOrder).toEqual(["p2"]);
  });

  it("throws when player not found", () => {
    const state = createGameState(defaultSettings);
    expect(() => removePlayerFromGame(state, "p1")).toThrow("not in the game");
  });
});

describe("startGame", () => {
  function readyState() {
    let state = createGameState(defaultSettings);
    const p1 = { ...createPlayer("p1", "Alice", DifficultyLevel.Level1), ready: true };
    const p2 = { ...createPlayer("p2", "Bob", DifficultyLevel.Level2), ready: true };
    state = addPlayerToGame(state, p1);
    state = addPlayerToGame(state, p2);
    return state;
  }

  it("starts the game when conditions are met", () => {
    const result = startGame(readyState());
    expect(result.phase).toBe(GamePhase.InProgress);
    expect(result.turnOrder).toEqual(["p1", "p2"]);
    expect(result.currentTurnIndex).toBe(0);
    expect(result.turn).not.toBeNull();
    expect(result.turn?.activePlayerId).toBe("p1");
    expect(result.turn?.phase).toBe(TurnPhase.ChoosingAction);
  });

  it("throws with fewer than 2 players", () => {
    let state = createGameState(defaultSettings);
    const p1 = { ...createPlayer("p1", "Alice", DifficultyLevel.Level1), ready: true };
    state = addPlayerToGame(state, p1);
    expect(() => startGame(state)).toThrow("at least 2 players");
  });

  it("throws when not all players are ready", () => {
    let state = createGameState(defaultSettings);
    state = addPlayerToGame(state, createPlayer("p1", "Alice", DifficultyLevel.Level1));
    state = addPlayerToGame(state, createPlayer("p2", "Bob", DifficultyLevel.Level2));
    expect(() => startGame(state)).toThrow("must be ready");
  });

  it("throws when game already started", () => {
    const state = { ...readyState(), phase: GamePhase.InProgress };
    expect(() => startGame(state)).toThrow("already started");
  });
});
