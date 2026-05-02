Feature: Deck source parsing
  As a presentation author
  I want the editor to correctly parse my Markdown source
  So that slides, front matter, and speaker notes are accurately extracted

  Background:
    Given a Markdown source with front matter and multiple slides

  Scenario: Front matter is extracted from the top of the source
    Given the source contains front matter with title "Demo" and lang "en"
    When I parse the source
    Then the deck metadata title is "Demo"
    And the deck metadata lang is "en"

  Scenario: Slides are split on triple-dash delimiters
    Given the source contains two slides separated by "---"
    When I parse the source
    Then the deck has 2 slides

  Scenario: Speaker notes are extracted after "Note:"
    Given the source contains a slide with a "Note:" section containing "Private note"
    When I parse the source
    Then the first slide notes is "Private note"

  Scenario: Resources are extracted after "Resources:"
    Given the source contains a slide with a "Resources:" section containing "- [Reference](https://example.com)"
    When I parse the source
    Then the first slide resources is "- [Reference](https://example.com)"

  Scenario: Script is extracted after "Script:"
    Given the source contains a slide with a "Script:" section containing "Full script text."
    When I parse the source
    Then the first slide script is "Full script text."

  Scenario: A title slide is prepended when titleSlide is true in front matter
    Given the source has "titleSlide: true" in front matter with title "My Talk"
    When I parse the source
    Then the first slide kind is "title"
    And the first slide title is "My Talk"

  Scenario: Source offset maps to the correct slide index
    Given a source with three slides each containing unique headings
    When I request the slide index for an offset inside the second slide
    Then the slide index is 2
