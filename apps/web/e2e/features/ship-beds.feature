@game-board
Feature: Ship Beds

  Background:
    Given a 2-player game has started with "Alice" and "Bob"

  Scenario: Each player passport shows 3 ship bed slots
    Then each passport should show 3 ship beds
    And all ship beds should be empty at the start
