@game-board
Feature: Bonus Card Tray

  Background:
    Given a 2-player game has started with "Alice" and "Bob"

  Scenario: Each passport shows an empty bonus card tray at start
    Then each passport should show a bonus card tray
    And all bonus trays should be empty at the start
