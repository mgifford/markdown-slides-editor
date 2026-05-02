Feature: Accessibility linting
  As a presentation author
  I want the editor to warn me about accessibility issues in my deck
  So that I can produce inclusive, accessible presentations

  Scenario: A slide with exactly one H1 heading raises no heading error
    Given a rendered slide with exactly one H1 heading "Good Title"
    When I lint the deck
    Then there are no heading errors for that slide

  Scenario: A slide with no H1 heading raises a heading error
    Given a rendered slide with no H1 heading
    When I lint the deck
    Then there is a heading error for that slide

  Scenario: A slide with more than one H1 heading raises a heading error
    Given a rendered slide with two H1 headings
    When I lint the deck
    Then there is a heading error for that slide

  Scenario: A link with generic text "click here" raises a warning
    Given a rendered slide with a link labelled "click here"
    When I lint the deck
    Then there is a generic-link warning for that slide

  Scenario: A link with descriptive text raises no generic-link warning
    Given a rendered slide with a link labelled "Read the WCAG guidelines"
    When I lint the deck
    Then there are no generic-link warnings for that slide

  Scenario: A content slide without speaker notes raises an info notice
    Given a content slide with no speaker notes
    When I lint the deck
    Then there is a missing-notes info notice for that slide

  Scenario: A dense slide raises a layout warning
    Given a slide body with more than 90 words and more than 6 bullets
    When I lint the deck
    Then there is a layout warning for that slide

  Scenario: A comfortable slide raises no layout warning
    Given a slide body with only a short paragraph
    When I lint the deck
    Then there are no layout warnings for that slide

  Scenario: An image without alt text raises an error
    Given a rendered slide containing an img element with no alt attribute
    When I lint the deck
    Then there is a missing-alt error for that slide
