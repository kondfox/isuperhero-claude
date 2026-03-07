Feature: Join Room

  Scenario: Player navigates to join room form
    Given I am logged in as "JoinNav"
    And I am on the homepage
    When I click the "Join Room" link
    Then I should see the heading "Join Room"
    And I should see the "Room Code" field

  Scenario: Player joins an existing room
    Given "Alice" has created a room with max 2 players
    And I am logged in as "Bob"
    And I am on the join room page
    When I fill in "Room Code" with the room code
    And I click the "Join Room" button
    Then I should see the heading "Lobby"
    And I should see "Players (2/2)"
    And I should see "Alice" in the player list
    And I should see "Bob" in the player list
