Feature: Storage persistence
  As a presentation author
  I want my deck to be saved locally in the browser
  So that I can return to my work without losing progress

  Scenario: Default storage key is the expected constant
    When I read the storage key
    Then the storage key is "markdown-slides-editor.deck"

  Scenario: Storage saves and retrieves a deck record
    Given a deck record with source "# Hello"
    When I save the deck record using in-memory storage
    And I load the deck record from in-memory storage
    Then the loaded source is "# Hello"

  Scenario: Storage falls back gracefully when IndexedDB is unavailable
    Given IndexedDB is unavailable
    When I load the deck record from storage
    Then the load does not throw an error

  Scenario: Loading from empty storage returns null
    Given storage is empty
    When I load the deck record from storage
    Then the loaded record is null
