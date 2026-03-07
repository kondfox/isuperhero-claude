Feature: Reset Password

  Scenario: Successful password reset
    Given an activated user "reset_user" with email "reset@test.com" and password "oldpassword1"
    And a password reset has been requested for "reset@test.com"
    When I visit the reset password link for "reset@test.com"
    And I fill in "New Password" with "newpassword1"
    And I fill in "Confirm Password" with "newpassword1"
    And I click the "Reset Password" button
    Then I should see the text "Password has been reset successfully"
    And I should see a "Log in" link

  Scenario: Mismatched passwords show error
    Given an activated user "mismatch_user" with email "mismatch@test.com" and password "password123"
    And a password reset has been requested for "mismatch@test.com"
    When I visit the reset password link for "mismatch@test.com"
    And I fill in "New Password" with "newpassword1"
    And I fill in "Confirm Password" with "differentpass"
    And I click the "Reset Password" button
    Then I should see the text "Passwords do not match"

  Scenario: Invalid reset token shows error
    Given I navigate to "/reset-password?token=expired-token"
    When I fill in "New Password" with "newpassword1"
    And I fill in "Confirm Password" with "newpassword1"
    And I click the "Reset Password" button
    Then I should see the text "Invalid or expired reset link"
