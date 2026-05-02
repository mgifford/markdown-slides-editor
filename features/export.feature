Feature: Export filename and bundle generation
  As a presentation author
  I want to export my deck as a self-contained ZIP bundle
  So that I can share and archive it reliably

  Scenario: Export filename is generated from the deck title and date
    Given a deck titled "Digital Independence & Open Source Ecosystems" dated "2025-03-23"
    When I generate an export filename
    Then the filename is "Digital-Independence-Open-Source-Ecosystems_23Mar2025.zip"

  Scenario: Short export filename truncates to the first five words
    Given a deck titled "Code as Constitution Building Public Digital Infrastructure We Can Actually Trust" dated "2026-05-01"
    When I generate a short export filename
    Then the short filename is "Code-as-Constitution-Building-Public_01May2026.zip"

  Scenario: Export bundle contains the expected files
    Given a minimal deck with front matter and one content slide
    When I build the export bundle
    Then the bundle contains "deck.md"
    And the bundle contains "deck.json"
    And the bundle contains "presentation.html"
    And the bundle contains "presentation.odp"
    And the bundle contains "presentation-one-page.html"
    And the bundle contains "presentation-offline.html"

  Scenario: Snapshot HTML embeds the slide theme
    Given a deck using theme "default-high-contrast"
    When I build the snapshot HTML
    Then the snapshot HTML contains data-theme "default-high-contrast"

  Scenario: One-page HTML is generated from the deck
    Given a minimal deck with one content slide
    When I build the one-page HTML
    Then the one-page HTML contains "<!doctype html>"
