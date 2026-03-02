@game-board
Feature: Develop Ability

  Background:
    Given a 2-player game has started with "Alice" and "Bob"

  Scenario: Active player completes the full develop ability flow
    When the active player clicks the "Develop Ability" button
    Then the active player should see the ability selection
    When the active player chooses the "Management" ability
    Then the active player should see the "Roll Die" button
    When the active player clicks the "Roll Die" button
    Then the active player should see the die result
    And the active player should see the task card
    When the active player clicks the "Task Complete" button
    Then the active player should see the "Draw from Cosmos" button
    And the active player should see the "End Turn" button
    When the active player clicks the "End Turn" button
    Then the turn should advance to the next player

  Scenario: Active player fails a task during develop ability
    When the active player clicks the "Develop Ability" button
    And the active player chooses the "Communication" ability
    And the active player clicks the "Roll Die" button
    Then the active player should see the task card
    When the active player clicks the "Task Failed" button
    Then the active player should see the "Draw from Cosmos" button
    And the active player should see the "End Turn" button

  Scenario: Active player develops then draws from cosmos
    When the active player clicks the "Develop Ability" button
    And the active player chooses the "Management" ability
    And the active player clicks the "Roll Die" button
    And the active player clicks the "Task Complete" button
    And the active player clicks the "Draw from Cosmos" button
    Then the active player should see the drawn card
    When the active player resolves the draw outcome
    Then the active player should see the "End Turn" button
