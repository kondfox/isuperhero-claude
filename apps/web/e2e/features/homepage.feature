Feature: Homepage

  Scenario: Player sees homepage with navigation options
    Given I am on the homepage
    Then I should see the heading "iSuperhero Online"
    And I should see a "Create Room" link
    And I should see a "Join Room" link
