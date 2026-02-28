import {
  type AbilityName,
  type BattleResult,
  type BonusCard,
  CardType,
  type DieRollResult,
  GamePhase,
  type GameState,
  type MonsterCard,
  type PlayerId,
  type TaskDefinition,
  TurnAction,
  TurnPhase,
  type TurnState,
} from "@isuperhero/types";
import { applyTaskSuccess } from "./ability";
import { applyBattleDefeat, applyBattleVictory } from "./battle";

export function createTurn(activePlayerId: PlayerId): TurnState {
  return {
    activePlayerId,
    phase: TurnPhase.ChoosingAction,
  };
}

export function advanceToNextPlayer(state: GameState): GameState {
  const { turnOrder, players } = state;
  if (turnOrder.length === 0) {
    throw new Error("No players in turn order");
  }

  let nextIndex = (state.currentTurnIndex + 1) % turnOrder.length;
  const startIndex = nextIndex;

  // Skip disconnected players
  do {
    const playerId = turnOrder[nextIndex];
    const player = players.find((p) => p.id === playerId);
    if (player?.connected) {
      return {
        ...state,
        currentTurnIndex: nextIndex,
        turn: createTurn(turnOrder[nextIndex]),
      };
    }
    nextIndex = (nextIndex + 1) % turnOrder.length;
  } while (nextIndex !== startIndex);

  // All players disconnected — stay on current index
  return {
    ...state,
    currentTurnIndex: nextIndex,
    turn: createTurn(turnOrder[nextIndex]),
  };
}

function assertPhase(state: GameState, expected: TurnPhase): TurnState {
  if (!state.turn || state.turn.phase !== expected) {
    throw new Error(`Expected phase ${expected}, got ${state.turn?.phase ?? "null"}`);
  }
  return state.turn;
}

export function applyChooseAction(state: GameState, action: TurnAction): GameState {
  const turn = assertPhase(state, TurnPhase.ChoosingAction);

  if (action === TurnAction.DevelopAbility) {
    return {
      ...state,
      turn: { ...turn, chosenAction: action, phase: TurnPhase.ChoosingAbility },
    };
  }

  return {
    ...state,
    turn: { ...turn, chosenAction: action, phase: TurnPhase.DrawingCard },
  };
}

export function applyChooseAbility(state: GameState, ability: AbilityName): GameState {
  const turn = assertPhase(state, TurnPhase.ChoosingAbility);
  return {
    ...state,
    turn: { ...turn, chosenAbility: ability, phase: TurnPhase.RollingDie },
  };
}

export function applyDieRoll(
  state: GameState,
  rollResult: DieRollResult,
  task: TaskDefinition,
): GameState {
  const turn = assertPhase(state, TurnPhase.RollingDie);
  return {
    ...state,
    turn: {
      ...turn,
      dieRoll: rollResult,
      currentTask: task,
      phase: TurnPhase.CompletingTask,
    },
  };
}

export function applyTaskComplete(state: GameState, success: boolean): GameState {
  const turn = assertPhase(state, TurnPhase.CompletingTask);

  if (!success) {
    return {
      ...state,
      turn: { ...turn, phase: TurnPhase.TurnComplete },
    };
  }

  return {
    ...state,
    turn: { ...turn, phase: TurnPhase.ChoosingRelatedAbility },
  };
}

export function applyChooseRelatedAbility(
  state: GameState,
  relatedAbility: AbilityName,
): GameState {
  const turn = assertPhase(state, TurnPhase.ChoosingRelatedAbility);
  const primaryAbility = turn.chosenAbility;
  if (!primaryAbility) {
    throw new Error("No primary ability chosen");
  }

  const player = state.players.find((p) => p.id === turn.activePlayerId);
  if (!player) {
    throw new Error("Active player not found");
  }

  const updatedPlayer = applyTaskSuccess(player, primaryAbility, relatedAbility);

  return {
    ...state,
    players: state.players.map((p) => (p.id === player.id ? updatedPlayer : p)),
    turn: { ...turn, phase: TurnPhase.TurnComplete },
  };
}

export function applyDrawCard(
  state: GameState,
  card: MonsterCard | BonusCard,
  cardType: CardType,
): GameState {
  const turn = assertPhase(state, TurnPhase.DrawingCard);

  if (cardType === CardType.Bonus) {
    const player = state.players.find((p) => p.id === turn.activePlayerId);
    if (!player) {
      throw new Error("Active player not found");
    }
    const updatedPlayer = {
      ...player,
      bonusCards: [...player.bonusCards, card as BonusCard],
    };
    return {
      ...state,
      players: state.players.map((p) => (p.id === player.id ? updatedPlayer : p)),
      turn: {
        ...turn,
        drawnCard: card,
        drawnCardType: cardType,
        phase: TurnPhase.TurnComplete,
      },
    };
  }

  // Monster card — go to battle
  return {
    ...state,
    turn: {
      ...turn,
      drawnCard: card,
      drawnCardType: cardType,
      phase: TurnPhase.MonsterBattle,
    },
  };
}

export function applyBattleOutcome(state: GameState, result: BattleResult): GameState {
  const turn = assertPhase(state, TurnPhase.MonsterBattle);
  const player = state.players.find((p) => p.id === turn.activePlayerId);
  if (!player) {
    throw new Error("Active player not found");
  }
  const monster = turn.drawnCard as MonsterCard;

  if (result.victory) {
    const updatedPlayer = applyBattleVictory(player, monster);
    return {
      ...state,
      players: state.players.map((p) => (p.id === player.id ? updatedPlayer : p)),
      turn: { ...turn, battleResult: result, phase: TurnPhase.TurnComplete },
    };
  }

  return {
    ...state,
    turn: { ...turn, battleResult: result, phase: TurnPhase.BattleDefeatPenalty },
  };
}

export function applyBattleDefeatPenalty(state: GameState, ability: AbilityName): GameState {
  const turn = assertPhase(state, TurnPhase.BattleDefeatPenalty);
  const player = state.players.find((p) => p.id === turn.activePlayerId);
  if (!player) {
    throw new Error("Active player not found");
  }

  const updatedPlayer = applyBattleDefeat(player, ability);
  return {
    ...state,
    players: state.players.map((p) => (p.id === player.id ? updatedPlayer : p)),
    turn: { ...turn, phase: TurnPhase.TurnComplete },
  };
}
