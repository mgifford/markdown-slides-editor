# Data Model: Rich Visual Layouts and Presentation Export

## Entities

### Hero Transition State

Represents the lifecycle of a hero slide's visual transition.

| State | Image Opacity | Overlay Opacity | Triggered By |
|-------|--------------|-----------------|--------------|
| Initial | `1` (full) | `0` (hidden) | Slide rendered without `active` class |
| Transitioning | Animating → `--hero-final` | Animating → `1` | `active` class added after `requestAnimationFrame` |
| Final | `--hero-final` (e.g., `0.2`) | `1` (visible) | CSS transition completes |
| Static (editor/print) | `--hero-final` | `1` | `active` class applied immediately (no animation) |

**Timing parameters** (parsed from directive, set as inline CSS custom properties):
- `--hero-stay`: Delay before transition begins (seconds)
- `--hero-transition`: Duration of the transition (seconds)
- `--hero-final`: Target image opacity after transition
- `--hero-blur`: Target blur amount
- `--hero-saturation`: Target saturation level
- `--hero-pan-x`, `--hero-pan-y`: Pan direction offsets

### Overlay Theme

Visual properties of the hero text overlay, varying by color mode.

| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| `--hero-overlay-bg` | `rgba(0, 0, 0, 0.7)` | `rgba(255, 255, 255, 0.8)` |
| `--hero-overlay-color` | `#fff` | `var(--ink)` (`#102542`) |
| Image treatment | Unchanged | Unchanged |

### Export Mode

Determines rendering context for slide content.

| Mode | Hero Animation | Progressive Reveals | Notes Included | Color Mode |
|------|---------------|--------------------|-|------------|
| Audience view | Animated (deferred `active`) | Hidden until clicked | No | User preference |
| Presenter view | Static (immediate `active`) | Shown per reveal step | Yes (in panel) | User preference |
| Editor preview | Static (immediate `active`) | Shown at current step | Yes (in panel) | User preference |
| Print / PDF | Static (forced final state) | All visible | No (standard) | Neutral/light |
| Notes export | Static (forced final state) | All visible | Yes (inline below slide) | Neutral/light |

### Rendered Slide (existing, no changes)

The existing `renderedSlide` object already carries all fields needed:

- `html`: Rendered slide body HTML
- `notesHtml`: Rendered speaker notes
- `resourcesHtml`: Rendered resources section
- `scriptHtml`: Rendered script section
- `isImageHero`: Boolean flag for hero slides
- `imageHeroShowAll`, `imageHeroShowTitle`, `imageHeroShowSubtitle`: Display flags

No new fields needed on the data model. All work is in CSS and the activation timing in `mountSlideInto()`.
