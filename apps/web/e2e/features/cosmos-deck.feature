@game-board
Feature: Cosmos Deck Count

  Background:
    Given a 2-player game has started with "Alice" and "Bob"

  Scenario: Game board shows the cosmos deck card count
    Then the game board should show the cosmos deck count
    And the cosmos deck count should be a positive number
