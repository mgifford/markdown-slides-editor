Feature: Presenter countdown timer
  As a presenter
  I want a countdown timer that tracks my remaining presentation time
  So that I can pace my talk effectively

  Background:
    Given a presentation timer configured for 20 minutes

  Scenario: Timer initialises with full duration when reset
    When the timer is reset
    Then the remaining milliseconds is 1200000

  Scenario: Timer counts down when running
    When the timer is reset
    And the timer is unpaused at t=0
    And the timer ticks at t=1000
    Then the remaining milliseconds is 1199000

  Scenario: Timer tone becomes caution when less than 20 percent of time remains
    Given a presentation timer configured for 10 minutes
    When the timer is reset
    And the timer elapses 490 seconds
    Then the timer tone is "caution"

  Scenario: Timer tone becomes warning when less than 10 percent of time remains
    Given a presentation timer configured for 10 minutes
    When the timer is reset
    And the timer elapses 541 seconds
    Then the timer tone is "warning"

  Scenario: Timer tone is safe when time is plentiful
    When the timer is reset
    Then the timer tone is "safe"

  Scenario: Timer can be paused and resumed
    When the timer is reset
    And the timer is unpaused at t=0
    And the timer ticks at t=1000
    And the timer is paused
    And the timer ticks at t=2000
    Then the remaining milliseconds is 1199000

  Scenario: Timer resets to full duration when reset is called again
    When the timer is reset
    And the timer is unpaused at t=0
    And the timer ticks at t=30000
    And the timer is reset
    Then the remaining milliseconds is 1200000
