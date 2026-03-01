Feature: Create Room

  Scenario: Player navigates to create room form
    Given I am on the homepage
    When I click the "Create Room" link
    Then I should see the heading "Create Room"
    And I should see the "Your Name" field
    And I should see a "Difficulty" dropdown
    And I should see a "Max Players" dropdown

  Scenario: Player creates a room and enters lobby
    Given I am on the create room page
    When I fill in "Your Name" with "Alice"
    And I select "2 Players" from "Max Players"
    And I click the "Create Room" button
    Then I should see the heading "Lobby"
    And I should see the room code
    And I should see "Players (1/2)"
    And I should see "Alice" in the player list
