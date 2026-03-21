# Accessibility Checklist

This project treats these checks as required validation targets for slide content and runtime behavior.

## Slide structure

- Each slide must contain exactly one level-one heading.
- Heading levels must not skip levels within a slide.
- Speaker notes must be separated from visible slide content.

## Links and media

- Link text must describe the destination or action.
- Images must include alternative text.
- Embedded content must preserve logical reading order.

## Visual presentation

- Themes must maintain at least 4.5:1 contrast for normal text.
- Focus states must remain visible in editor and presentation views.
- Motion must respect `prefers-reduced-motion`.

## Interaction

- All presentation controls must work with a keyboard alone.
- Auto-advancing slides should be avoided.
- Presenter tools must not trap focus.

## Validation

- Run the editor accessibility check before export.
- Add automated `axe` and `pa11y` checks once CI is in place.
- Review exported HTML against WCAG references before publishing.
