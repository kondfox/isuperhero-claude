@game-board
Feature: Turn Rotation

  Scenario: Turn passes to next player after ending turn
    Given a 2-player game has started with "Alice" and "Bob"
    When the active player clicks the "Draw from Cosmos" button
    And the active player resolves the draw outcome
    And the active player clicks the "End Turn" button
    Then the previously inactive player should now be active
    And the previously active player should now be waiting
