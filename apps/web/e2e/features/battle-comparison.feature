@game-board
Feature: Monster Battle Comparison

  Background:
    Given a 2-player game has started with "Alice" and "Bob"

  Scenario: Drawing a monster shows ability comparison
    When the active player draws until a monster appears
    Then the active player should see the battle comparison
    And the battle comparison should show 5 ability matchups
