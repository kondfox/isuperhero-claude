Feature: Protected Routes

  Scenario: Unauthenticated user is redirected from lobby to login
    Given I am not logged in
    When I navigate to "/lobby?mode=create"
    Then I should see the heading "Log In"

  Scenario: Unauthenticated user is redirected from game to login
    Given I am not logged in
    When I navigate to "/game/some-room-id"
    Then I should see the heading "Log In"

  Scenario: Authenticated user can access lobby
    Given I am logged in as "guard_user"
    When I navigate to "/lobby?mode=create"
    Then I should see the heading "Create Room"

  Scenario: Homepage shows login and register when not authenticated
    Given I am not logged in
    When I am on the homepage
    Then I should see a "Log In" link
    And I should see a "Register" link

  Scenario: Homepage shows game actions when authenticated
    Given I am logged in as "home_user"
    When I am on the homepage
    Then I should see a "Create Room" link
    And I should see a "Join Room" link
