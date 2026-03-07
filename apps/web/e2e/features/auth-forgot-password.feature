Feature: Forgot Password

  Scenario: Forgot password page shows email field
    Given I am on the forgot password page
    Then I should see the heading "Forgot Password"
    And I should see the "Email" field
    And I should see the "Send Reset Link" button

  Scenario: Submitting email shows confirmation
    Given I am on the forgot password page
    When I fill in "Email" with "anyone@test.com"
    And I click the "Send Reset Link" button
    Then I should see the text "we've sent a password reset link"
