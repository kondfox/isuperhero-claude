import { AbilityName } from "@isuperhero/types";
import { describe, expect, it } from "vitest";
import { DIE_SIDES } from "./constants";
import { getRolledTaskKey, markTaskRolled, rollDie } from "./dice";

describe("getRolledTaskKey", () => {
  it("returns the ability name as the key", () => {
    expect(getRolledTaskKey(AbilityName.Management)).toBe("management");
  });
});

describe("rollDie", () => {
  it("returns a number between 1 and 20", () => {
    const result = rollDie(AbilityName.Management, {}, () => 0.5);
    expect(result.taskNumber).toBeGreaterThanOrEqual(1);
    expect(result.taskNumber).toBeLessThanOrEqual(DIE_SIDES);
  });

  it("uses the injected random function", () => {
    // randomFn returning 0 should give taskNumber 1
    const result = rollDie(AbilityName.Management, {}, () => 0);
    expect(result.taskNumber).toBe(1);
  });

  it("returns wasRerolled false on first roll for an ability", () => {
    const result = rollDie(AbilityName.Management, {}, () => 0.5);
    expect(result.wasRerolled).toBe(false);
    expect(result.rerollCount).toBe(0);
  });

  it("rerolls when number already used", () => {
    const used = new Set([11]); // 0.5 * 20 + 1 = 11
    const rolledTasks = { [AbilityName.Management]: used };

    let callCount = 0;
    const randomFn = () => {
      callCount++;
      // First call returns 0.5 (taskNumber 11, used), second returns 0.7 (taskNumber 15)
      return callCount === 1 ? 0.5 : 0.7;
    };

    const result = rollDie(AbilityName.Management, rolledTasks, randomFn);
    expect(result.taskNumber).toBe(15);
    expect(result.wasRerolled).toBe(true);
    expect(result.rerollCount).toBe(1);
  });

  it("handles multiple rerolls", () => {
    const used = new Set([11, 15]); // both will be tried
    const rolledTasks = { [AbilityName.Management]: used };

    let callCount = 0;
    const values = [0.5, 0.7, 0.1]; // 11 (used), 15 (used), 3 (free)
    const randomFn = () => values[callCount++];

    const result = rollDie(AbilityName.Management, rolledTasks, randomFn);
    expect(result.taskNumber).toBe(3);
    expect(result.rerollCount).toBe(2);
  });

  it("resets when all 20 numbers are exhausted", () => {
    const allUsed = new Set(Array.from({ length: 20 }, (_, i) => i + 1));
    const rolledTasks = { [AbilityName.Management]: allUsed };

    const result = rollDie(AbilityName.Management, rolledTasks, () => 0.5);
    expect(result.taskNumber).toBe(11);
    expect(result.wasRerolled).toBe(false);
  });

  it("does not affect other abilities", () => {
    const used = new Set([11]);
    const rolledTasks = { [AbilityName.Communication]: used };

    const result = rollDie(AbilityName.Management, rolledTasks, () => 0.5);
    expect(result.taskNumber).toBe(11);
    expect(result.wasRerolled).toBe(false);
  });

  it("works with empty rolledTasks", () => {
    const result = rollDie(AbilityName.Orientation, {}, () => 0.95);
    expect(result.taskNumber).toBe(20);
    expect(result.wasRerolled).toBe(false);
  });
});

describe("markTaskRolled", () => {
  it("adds a task number to the set", () => {
    const result = markTaskRolled({}, AbilityName.Management, 5);
    expect(result[AbilityName.Management].has(5)).toBe(true);
  });

  it("preserves existing entries", () => {
    const existing = { [AbilityName.Management]: new Set([3]) };
    const result = markTaskRolled(existing, AbilityName.Management, 5);
    expect(result[AbilityName.Management].has(3)).toBe(true);
    expect(result[AbilityName.Management].has(5)).toBe(true);
  });

  it("does not mutate the original", () => {
    const original: Record<string, Set<number>> = {};
    markTaskRolled(original, AbilityName.Management, 5);
    expect(original[AbilityName.Management]).toBeUndefined();
  });

  it("preserves other abilities", () => {
    const existing = { [AbilityName.Communication]: new Set([7]) };
    const result = markTaskRolled(existing, AbilityName.Management, 5);
    expect(result[AbilityName.Communication].has(7)).toBe(true);
  });
});
