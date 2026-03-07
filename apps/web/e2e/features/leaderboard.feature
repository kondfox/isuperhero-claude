Feature: Leaderboard Page

  Scenario: Homepage shows a leaderboard link
    Given I am logged in as "leaderboard_user1"
    And I am on the homepage
    Then I should see a "View leaderboard" link

  Scenario: Player navigates to leaderboard page
    Given I am logged in as "leaderboard_user2"
    And I am on the homepage
    When I click the "View leaderboard" link
    Then I should see the heading "Leaderboard"
    And I should see a "Back to home" link

  Scenario: Leaderboard shows content after loading
    Given I am on the leaderboard page
    Then I should see the heading "Leaderboard"
    And the leaderboard should finish loading
