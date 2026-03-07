@game-board
Feature: Game Start

  Scenario: Players start a game and both see the game board
    Given "Alice" has created a room with max 2 players
    And I am logged in as "Bob"
    And I am on the join room page
    When I fill in "Room Code" with the room code
    And I click the "Join Room" button
    Then I should see the heading "Lobby"
    When Alice clicks the "Ready" button
    And I click the "Ready" button
    And I click the "Start Game" button
    Then I should see the heading "Game Board"
    And Alice should see the heading "Game Board"

  Scenario: Game board displays both player names
    Given a 2-player game has started with "Alice" and "Bob"
    Then I should see "Alice" on the game board
    And I should see "Bob" on the game board

  Scenario: Game board shows whose turn it is
    Given a 2-player game has started with "Alice" and "Bob"
    Then the active player should see "Your turn"
    And the inactive player should see a waiting message
