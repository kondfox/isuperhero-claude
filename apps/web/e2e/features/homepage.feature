Feature: Homepage

  Scenario: Authenticated player sees game actions
    Given I am logged in as "home_player"
    And I am on the homepage
    Then I should see the heading "iSuperhero Online"
    And I should see a "Create Room" link
    And I should see a "Join Room" link

  Scenario: Unauthenticated visitor sees auth links
    Given I am not logged in
    And I am on the homepage
    Then I should see the heading "iSuperhero Online"
    And I should see a "Log In" link
    And I should see a "Register" link
