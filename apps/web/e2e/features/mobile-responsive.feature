@game-board
Feature: Mobile Responsiveness

  Background:
    Given a 2-player game has started with "Alice" and "Bob"

  Scenario: Passports show compact view on mobile
    Given the viewport is set to mobile
    Then each passport should show a compact summary

  Scenario: Passport expands on tap in mobile view
    Given the viewport is set to mobile
    When I tap the first player passport
    Then the first passport should show ability scores
