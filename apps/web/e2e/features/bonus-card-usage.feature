@game-board
Feature: Bonus Card Usage

  Background:
    Given a 2-player game has started with "Alice" and "Bob"

  Scenario: Player can use a bonus card on their turn
    When the active player draws until a bonus card is gained
    And the active player ends their turn after drawing
    And the new active player draws until a bonus card is gained
    Then the active player should see a Use button on their bonus card
    When the active player uses their first bonus card
    Then the bonus card should be removed from the tray

  Scenario: Use button only appears on own turn
    When the active player draws until a bonus card is gained
    And the active player ends their turn after drawing
    Then the previously inactive player should not see Use buttons on the other player's bonus cards
