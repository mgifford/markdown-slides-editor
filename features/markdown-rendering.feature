Feature: Markdown rendering
  As a presentation author
  I want Markdown syntax to be converted to accessible HTML
  So that slide content is rendered correctly in the browser

  Scenario: Headings are rendered as HTML heading elements
    Given Markdown text "# Slide Title"
    When I render the Markdown
    Then the output contains "<h1>Slide Title</h1>"

  Scenario: Second-level headings are rendered correctly
    Given Markdown text "## Sub-heading"
    When I render the Markdown
    Then the output contains "<h2>Sub-heading</h2>"

  Scenario: Unordered lists are rendered as HTML list elements
    Given Markdown text containing an unordered list:
      """
      - First item
      - Second item
      - Third item
      """
    When I render the Markdown
    Then the output contains "<ul>"
    And the output contains "<li>First item</li>"

  Scenario: Ordered lists are rendered as HTML ordered list elements
    Given Markdown text containing an ordered list:
      """
      1. Step one
      2. Step two
      """
    When I render the Markdown
    Then the output contains "<ol>"
    And the output contains "<li>Step one</li>"

  Scenario: Links are rendered as anchor elements
    Given Markdown text "[Example](https://example.com)"
    When I render the Markdown
    Then the output contains "href=\"https://example.com\""
    And the output contains "Example"

  Scenario: Bold text is rendered as strong elements
    Given Markdown text "This is **bold** text"
    When I render the Markdown
    Then the output contains "<strong>bold</strong>"

  Scenario: Italic text is rendered as em elements
    Given Markdown text "This is *italic* text"
    When I render the Markdown
    Then the output contains "<em>italic</em>"

  Scenario: Paragraphs are wrapped in p elements
    Given Markdown text "A simple paragraph."
    When I render the Markdown
    Then the output contains "<p>A simple paragraph.</p>"

  Scenario: Images are rendered as img elements with alt text
    Given Markdown text "![A cat](cat.jpg)"
    When I render the Markdown
    Then the output contains "alt=\"A cat\""
    And the output contains "src=\"cat.jpg\""
