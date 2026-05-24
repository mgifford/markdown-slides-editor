---
title: Advanced Visual Layouts Demo Deck
lang: en
theme: default-high-contrast
durationMinutes: 20
slideWidth: 1280
slideHeight: 720
titleSlide: true
subtitle: Master recipes for blending high-impact images with accessible scannable text
date: 2026-03-22
location: Toronto
speakers: Alex Example
closingSlide: true
closingTitle: Questions & Design Frameworks
closingPrompt: Let's build accessible, visually stunning presentation structures.
---

# Archetype 1: The Dynamic Hero Transition
## Programmatic sequencing: The image controls the room before the text appears

::image-hero text-bottom-left logo-top-right pan-left saturation-85 stay-3 transition-6 final-0.15 blur-6px
![High impact focal image](https://dummyimage.com/1280x720/8B4513/ffffff.png&text=Warm+Focal+Asset)
---
Control the room's attention
---
<img src="https://dummyimage.com/170x60/ffffff/8B4513.png&text=Summit+Logo" alt="Summit logo">
::

- **Seconds 0 to 3:** The audience focuses entirely on the crisp, clear image while listening to you.
- **Seconds 3 to 9:** The image blurs and fades to 15% as this text appears over a near-invisible background.
- **The Result:** Complete focus control without requiring distracting standalone slide breaks.

Note:
Use this method for your presentation anchors. It honors both visual-first learners and text readers without splitting the momentum.

Resources:
- [WCAG 2.2 Success Criterion 1.4.3: Contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
- [Inclusive Design Principles](https://inclusivedesignprinciples.info/)

---

# Archetype 2: Media Left Layout
## Image on the left, analysis on the right

::media-left
![Dashboard screenshot with highlighted trend lines](https://dummyimage.com/560x360/dae8f5/102542.png&text=Dashboard+Detail)
---
When detail matters, keep the image crisp and place the interpretation beside it.

- Anchor the room on one visual
- Add only the supporting points you need
- Move deeper detail into notes
::

Note:
If your image contains detailed features, faces, or text instructions, never use it as a background. Use a media or column layout instead for strict WCAG contrast compliance.

---

# Archetype 3: Media Right Layout
## Text first, visual support on the right

::media-right
![Annotated process diagram with three handoff stages](https://dummyimage.com/560x360/cbe7f5/0b3d91.png&text=Process+Diagram)
---
This pattern works when your spoken story starts with text and the visual acts as confirmation.

1. State the decision or recommendation
2. Use the image to confirm the flow
3. Keep visual and text in one screen without overlap
::

Script:
When presenting this slide, start by describing the decision framework before pointing to the diagram. Say: "Here you can see the three handoff stages we designed. Notice how each stage has a clear owner and a defined deliverable. This eliminates the ambiguity we saw in last quarter's process."

---

# Archetype 4: Column Layout with Image
## Perfect balance: Zero competition between graphics and text structures

::column-left
![Clean informational graphic](https://dummyimage.com/600x450/E8D5B7/333333.png&text=Concept+Graphic)
::

::column-right
### Side-by-Side Presentation
- **No Overlays:** Text and images never collide, maintaining strict WCAG contrast compliance.
- **High Clarity:** Keep your images at 100% saturation and visibility.
- **Natural Scan Pattern:** Ideal for western reading directions (Left: Visual concept, Right: Analysis).
::

Note:
The column layout gives you full control over proportions. You can use `::column-left-60%` to give the image more space, or `::column-right-40%` for a narrower text column.

---

# Archetype 5: The Billboard
## Aggressive text reduction for maximum emotional resonance

::image-hero stay-0 transition-0 final-0.35 text-center
![Cinematic broad landscape photography](https://dummyimage.com/1280x720/1a1a2e/e0e0e0.png&text=+)
---
One clear statement is more powerful than ten crowded bullet points.
::

---

# Archetype 6: Progressive Reveal
## Progressive disclosure: Stop the room from reading ahead of your narrative

::column-left
![Intriguing reveal graphic](https://dummyimage.com/600x450/0b3d91/ffffff.png&text=Look+Here+First)
::

::column-right on-click
### The On-Click Reveal
- **Immediate Visual:** The slide loads with only the title and the left graphic visible.
- **Narrative Control:** You establish the context verbally before displaying the conclusion.
- **The Payoff:** Clicking the clicker drops this bullet block into place right as you speak to it.
::

Note:
This structure completely breaks the habit of audiences reading the entire slide ahead of your voice. Use it whenever you need to build tension before revealing data or conclusions.

Resources:
- [Presentation Zen by Garr Reynolds](https://www.presentationzen.com/)

---

# The Triple-Threat Matrix
## Displaying concurrent options or regional case studies cleanly

::column-left
### 01. Germany
- **Sovereign Tech Fund**
- Core infrastructure support
- Public infrastructure strategy
::

::column-middle
### 02. France
- **The Albert AI Suite**
- Local language models
- In-house public workflows
::

::column-right
### 03. Netherlands
- **DigiD Mandates**
- Sovereignty crisis recovery
- Local legal requirements
::

::notes
When comparing three parallel concepts or models, don't build three separate slides. Use a clear three-column grid layout to show patterns side-by-side. This is especially effective for competitive analysis and regional comparisons.
::

---

# The Quote / Case Anchor

::column-left
::quote
"We are currently in a systemic rupture, not a simple historical transition."
::
::

::column-right
![Contextual portrait placeholder](https://dummyimage.com/600x450/4a4a4a/ffffff.png&text=Portrait+Photo)
::

Note:
Pairing a clean blockquote with a contextual portrait or site photo anchors quotes instantly, giving them a professional, journalistic magazine layout feel.

---

# Callout and Quote Showcase

::callout
Accessibility is not a feature. It is a fundamental requirement of ethical design.
::

::quote
"The power of the Web is in its universality. Access by everyone regardless of disability is an essential aspect."
— Tim Berners-Lee
::

Note:
Use `::callout` for highlighted points and `::quote` for attributed quotations. Both support the `on-click` modifier for progressive reveal.

---

# Hero Showcase: Opposite Corners
## Top-left text with pan and saturation effects

::image-hero text-top-left logo-bottom-right pan-right saturation-120 stay-3 transition-8 final-0.25
![Presenter introducing a session in front of a skyline backdrop](https://dummyimage.com/1280x720/2E5090/ffffff.png&text=Skyline+Backdrop)
---
Set context fast
---
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 60" role="img" aria-label="Event mark"><rect width="180" height="60" rx="12" fill="#ffffff"/><text x="90" y="38" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" fill="#2E5090">Event Mark</text></svg>
::

---

# Hero Showcase: Visible Headings
## Bottom-right text with visible title and subtitle

::image-hero text-bottom-right logo-top-left show-title show-subtitle blur-2px
![Crowd looking at a large projection screen during a plenary talk](https://dummyimage.com/1280x720/3a506b/ffffff.png&text=Visible+Headings)
---
Keep the title visible
---
<img src="https://dummyimage.com/170x60/ffffff/3a506b.png&text=Org+Flag" alt="Organization flag logo">
::

Note:
This variant is useful when the title itself is part of the on-screen narrative and should remain visible during the hero treatment.

---

# Hero Showcase: Timed Cinematic Reveal
## Centered message after image-first pause

::image-hero text-center logo-bottom-left stay-3 transition-5 final-0.12 blur-4px pan-up
![Audience watching a transition from full image to message-first overlay](https://dummyimage.com/1280x720/0f4c5c/ffffff.png&text=Timed+Reveal)
---
See the idea land
---
<img src="https://dummyimage.com/170x60/ffffff/0f4c5c.png&text=Brand+Mark" alt="Brand mark logo">
::

Note:
Timed heroes let you pause on the photo first, then transition to text for emphasis.

---

# Hero Showcase: Image-Only Pause
## Full-bleed visual breathing room

::image-hero
![Calm landscape used as an interstitial visual pause](https://dummyimage.com/1280x720/264653/ffffff.png&text=Image-Only+Pause)
::

---

# Centered Content with Diagram

::center
### The Design Feedback Loop

Planning leads to prototyping, which leads to testing, which leads to iteration, which feeds back into planning. Each cycle produces insights that compound over time.
::

Note:
The `::center` directive centers content horizontally. It works well for diagrams, key statements, or any content that benefits from visual emphasis through isolation.

Script:
Walk the audience through each stage of the loop. Emphasize that iteration is not rework but refinement. Point out that insights compound, meaning each cycle gets faster and more focused. Close by asking: "Where in this loop does your team spend the most time?"
