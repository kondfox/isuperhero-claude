Feature: Account Activation

  Scenario: Valid activation token activates account
    Given a freshly registered user for activation
    When I visit the activation link for the fresh user
    Then I should see the text "Account activated successfully"
    And I should see a "Log in" link

  Scenario: Invalid activation token shows error
    Given I navigate to "/activate?token=invalid-token-here"
    Then I should see the text "Invalid or expired activation link"

  Scenario: Missing token shows error
    Given I navigate to "/activate"
    Then I should see the text "Invalid or expired activation link"
