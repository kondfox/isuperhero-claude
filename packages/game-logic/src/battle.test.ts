import {
  AbilityName,
  type AbilityScores,
  DifficultyLevel,
  type MonsterCard,
} from "@isuperhero/types";
import { describe, expect, it } from "vitest";
import { applyBattleDefeat, applyBattleVictory, resolveBattle } from "./battle";
import { createPlayer } from "./create-game";

function makeMonster(abilities: Partial<AbilityScores> = {}): MonsterCard {
  return {
    id: "m1",
    name: "Test Monster",
    abilities: {
      [AbilityName.Management]: 2,
      [AbilityName.Communication]: 2,
      [AbilityName.Orientation]: 2,
      [AbilityName.Processing]: 2,
      [AbilityName.MovementEnergy]: 2,
      ...abilities,
    },
    imageUrl: "monster.png",
  };
}

function makePlayerWithAbilities(scores: Partial<AbilityScores>) {
  const player = createPlayer("p1", "Alice", DifficultyLevel.Level1);
  return {
    ...player,
    abilities: { ...player.abilities, ...scores },
  };
}

describe("resolveBattle", () => {
  it("returns victory when all player scores are strictly higher", () => {
    const player = makePlayerWithAbilities({
      [AbilityName.Management]: 3,
      [AbilityName.Communication]: 3,
      [AbilityName.Orientation]: 3,
      [AbilityName.Processing]: 3,
      [AbilityName.MovementEnergy]: 3,
    });
    const monster = makeMonster(); // all 2s
    const result = resolveBattle(player, monster);
    expect(result.victory).toBe(true);
    for (const comparison of Object.values(result.comparisons)) {
      expect(comparison.playerWins).toBe(true);
    }
  });

  it("returns defeat when one ability is equal", () => {
    const player = makePlayerWithAbilities({
      [AbilityName.Management]: 2, // equal to monster
      [AbilityName.Communication]: 3,
      [AbilityName.Orientation]: 3,
      [AbilityName.Processing]: 3,
      [AbilityName.MovementEnergy]: 3,
    });
    const result = resolveBattle(player, makeMonster());
    expect(result.victory).toBe(false);
    expect(result.comparisons[AbilityName.Management].playerWins).toBe(false);
  });

  it("returns defeat when one ability is lower", () => {
    const player = makePlayerWithAbilities({
      [AbilityName.Management]: 1, // lower than monster's 2
      [AbilityName.Communication]: 3,
      [AbilityName.Orientation]: 3,
      [AbilityName.Processing]: 3,
      [AbilityName.MovementEnergy]: 3,
    });
    const result = resolveBattle(player, makeMonster());
    expect(result.victory).toBe(false);
  });

  it("returns defeat when all abilities are lower", () => {
    const player = makePlayerWithAbilities({
      [AbilityName.Management]: 0,
      [AbilityName.Communication]: 0,
      [AbilityName.Orientation]: 0,
      [AbilityName.Processing]: 0,
      [AbilityName.MovementEnergy]: 0,
    });
    const result = resolveBattle(player, makeMonster());
    expect(result.victory).toBe(false);
  });

  it("handles 0 vs 0 as defeat (not strictly higher)", () => {
    const player = makePlayerWithAbilities({
      [AbilityName.Management]: 0,
      [AbilityName.Communication]: 3,
      [AbilityName.Orientation]: 3,
      [AbilityName.Processing]: 3,
      [AbilityName.MovementEnergy]: 3,
    });
    const monster = makeMonster({ [AbilityName.Management]: 0 });
    const result = resolveBattle(player, monster);
    expect(result.victory).toBe(false);
    expect(result.comparisons[AbilityName.Management].playerWins).toBe(false);
  });

  it("includes correct scores in comparisons", () => {
    const player = makePlayerWithAbilities({ [AbilityName.Management]: 4 });
    const monster = makeMonster({ [AbilityName.Management]: 1 });
    const result = resolveBattle(player, monster);
    expect(result.comparisons[AbilityName.Management].playerScore).toBe(4);
    expect(result.comparisons[AbilityName.Management].monsterScore).toBe(1);
  });
});

describe("applyBattleVictory", () => {
  it("adds monster to tamed list", () => {
    const player = createPlayer("p1", "Alice", DifficultyLevel.Level1);
    const monster = makeMonster();
    const result = applyBattleVictory(player, monster);
    expect(result.monstersTamed).toHaveLength(1);
    expect(result.monstersTamed[0]).toBe(monster);
  });

  it("does not mutate original player", () => {
    const player = createPlayer("p1", "Alice", DifficultyLevel.Level1);
    const monster = makeMonster();
    applyBattleVictory(player, monster);
    expect(player.monstersTamed).toHaveLength(0);
  });

  it("appends to existing monsters", () => {
    const player = {
      ...createPlayer("p1", "Alice", DifficultyLevel.Level1),
      monstersTamed: [makeMonster()],
    };
    const newMonster = { ...makeMonster(), id: "m2", name: "Monster 2" };
    const result = applyBattleVictory(player, newMonster);
    expect(result.monstersTamed).toHaveLength(2);
  });
});

describe("applyBattleDefeat", () => {
  it("decreases the chosen ability by 1", () => {
    const player = makePlayerWithAbilities({ [AbilityName.Management]: 3 });
    const result = applyBattleDefeat(player, AbilityName.Management);
    expect(result.abilities[AbilityName.Management]).toBe(2);
  });

  it("does not go below 0", () => {
    const player = createPlayer("p1", "Alice", DifficultyLevel.Level1);
    const result = applyBattleDefeat(player, AbilityName.Management);
    expect(result.abilities[AbilityName.Management]).toBe(0);
  });
});
