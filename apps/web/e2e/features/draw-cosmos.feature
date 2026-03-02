@game-board @wip
Feature: Draw from Cosmos

  Background:
    Given a 2-player game has started with "Alice" and "Bob"

  Scenario: Active player draws from the cosmos deck
    When the active player clicks the "Draw from Cosmos" button
    Then the active player should see the drawn card
    When the active player resolves the draw outcome
    Then the active player should see the "End Turn" button

  Scenario: Card draw event is visible to both players
    When the active player clicks the "Draw from Cosmos" button
    Then both players should see a card drawn event
