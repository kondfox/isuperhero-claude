Feature: Login

  Scenario: Login page shows required fields
    Given I am on the login page
    Then I should see the heading "Log In"
    And I should see the "Username" field
    And I should see the "Password" field
    And I should see the "Log In" button
    And I should see a "Forgot password?" link
    And I should see a "Don't have an account? Register" link

  Scenario: Successful login redirects to homepage
    Given an activated user "login_user" with email "login@test.com" and password "password123"
    And I am on the login page
    When I fill in "Username" with "login_user"
    And I fill in "Password" with "password123"
    And I click the "Log In" button
    Then I should see the heading "iSuperhero Online"
    And I should see the text "login_user"

  Scenario: Login fails with wrong password
    Given an activated user "wrongpw_user" with email "wrongpw@test.com" and password "password123"
    And I am on the login page
    When I fill in "Username" with "wrongpw_user"
    And I fill in "Password" with "wrongpassword"
    And I click the "Log In" button
    Then I should see the text "Invalid username or password"

  Scenario: Login fails for unactivated account
    Given a registered user with email "unactivated@test.com" and username "unactivated_user"
    And I am on the login page
    When I fill in "Username" with "unactivated_user"
    And I fill in "Password" with "password123"
    And I click the "Log In" button
    Then I should see the text "Please activate your account"
