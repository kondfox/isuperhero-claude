Feature: Registration

  Scenario: Registration page shows required fields
    Given I am on the registration page
    Then I should see the heading "Create Account"
    And I should see the "Email" field
    And I should see the "Username" field
    And I should see the "Password" field
    And I should see the "Create Account" button
    And I should see a "Already have an account? Log in" link

  Scenario: Successful registration shows activation notice
    Given I am on the registration page
    When I register with a unique email and username
    And I click the "Create Account" button
    Then I should see the text "Check your email"

  Scenario: Registration fails with duplicate email
    Given a registered user with email "taken@test.com" and username "taken_user"
    And I am on the registration page
    When I fill in "Email" with "taken@test.com"
    And I fill in "Username" with "unique_user"
    And I fill in "Password" with "password123"
    And I click the "Create Account" button
    Then I should see the text "Email already registered"

  Scenario: Registration fails with duplicate username
    Given a registered user with email "unique@test.com" and username "taken_user2"
    And I am on the registration page
    When I fill in "Email" with "another@test.com"
    And I fill in "Username" with "taken_user2"
    And I fill in "Password" with "password123"
    And I click the "Create Account" button
    Then I should see the text "Username already taken"
