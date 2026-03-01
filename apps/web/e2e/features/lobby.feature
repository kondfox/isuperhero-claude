Feature: Lobby

  Scenario: Player toggles ready status
    Given I am on the create room page
    When I fill in "Your Name" with "Alice"
    And I select "2 Players" from "Max Players"
    And I click the "Create Room" button
    Then I should see the heading "Lobby"
    When I click the "Ready" button
    Then I should see the "Not Ready" button

  Scenario: Room code is 6 characters
    Given I am on the create room page
    When I fill in "Your Name" with "Alice"
    And I select "2 Players" from "Max Players"
    And I click the "Create Room" button
    Then I should see the heading "Lobby"
    And the room code should be 6 characters
