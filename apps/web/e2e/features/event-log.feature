@game-board
Feature: Event Log

  Background:
    Given a 2-player game has started with "Alice" and "Bob"

  Scenario: Event log is visible on game board
    Then the event log should be visible

  Scenario: Events appear after drawing from cosmos
    When the active player clicks the "Draw from Cosmos" button
    Then the active player should see an event in the log

  Scenario: Event log toggle works on mobile
    Given the viewport is set to mobile
    When the active player toggles the event log
    Then the active player event log should be collapsed
    When the active player toggles the event log
    Then the active player event log should be expanded
