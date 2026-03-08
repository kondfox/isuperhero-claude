Feature: Profile Page

  Scenario: Profile page shows user info
    Given I am logged in as "profile_user1"
    When I navigate to "/profile"
    Then I should see the heading "Profile"
    And I should see the text "profile_user1@e2e-test.com"

  Scenario: Profile page has change password form
    Given I am logged in as "profile_user2"
    When I navigate to "/profile"
    Then I should see the "Current Password" field
    And I should see the "New Password" field
    And I should see the "Confirm New Password" field
    And I should see the "Change Password" button

  Scenario: Change password succeeds with correct current password
    Given a fresh user for password change
    When I navigate to "/profile"
    And I fill in "Current Password" with "testpassword123"
    And I fill in "New Password" with "newpassword456"
    And I fill in "Confirm New Password" with "newpassword456"
    And I click the "Change Password" button
    Then I should see the text "Password changed successfully"

  Scenario: Change password fails with wrong current password
    Given I am logged in as "profile_pw_fail"
    When I navigate to "/profile"
    And I fill in "Current Password" with "wrongpassword"
    And I fill in "New Password" with "newpassword456"
    And I fill in "Confirm New Password" with "newpassword456"
    And I click the "Change Password" button
    Then I should see the text "Current password is incorrect"

  Scenario: Change password fails when passwords do not match
    Given I am logged in as "profile_pw_mismatch"
    When I navigate to "/profile"
    And I fill in "Current Password" with "testpassword123"
    And I fill in "New Password" with "newpassword456"
    And I fill in "Confirm New Password" with "differentpassword"
    And I click the "Change Password" button
    Then I should see the text "Passwords do not match"

  Scenario: Profile page shows game history section
    Given I am logged in as "profile_history_user"
    When I navigate to "/profile"
    Then I should see the heading "Game History"

  Scenario: Profile page shows empty game history
    Given I am logged in as "profile_empty_history"
    When I navigate to "/profile"
    Then I should see the text "No games played yet"

  Scenario: Homepage links to profile
    Given I am logged in as "profile_link_user"
    When I am on the homepage
    Then I should see a "Profile" link
