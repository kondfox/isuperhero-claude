@game-board
Feature: Task Card Content

  Background:
    Given a 2-player game has started with "Alice" and "Bob"

  Scenario: Task card shows task type and rewards
    When the active player clicks the "Develop Ability" button
    And the active player chooses the "Management" ability
    And the active player clicks the "Roll Die" button
    Then the active player should see the task card
    And the task card should show the task type
    And the task card should show the rewards
