@game-board
Feature: Player Passport

  Background:
    Given a 2-player game has started with "Alice" and "Bob"

  Scenario: Each player has a passport with ability scores
    Then I should see a passport for each player
    And each passport should display 5 ability scores

  Scenario: Ability scores update after developing an ability
    When the active player clicks the "Develop Ability" button
    And the active player chooses the "Management" ability
    And the active player clicks the "Roll Die" button
    And the active player clicks the "Task Complete" button
    Then the active player's passport should show updated ability scores
