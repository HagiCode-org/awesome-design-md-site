# Design System Reference for Awesome Design MD Gallery

This file documents the gallery shell at `repos/awesome-design-md-site`. The site now follows the ClickHouse design language as an implementation target, not merely as a document outline. Vendor files under `vendor/awesome-design-md/design-md/*/DESIGN.md` remain gallery content; this root file describes the application shell that renders them.

## 1. Visual Theme & Atmosphere

The gallery should feel like a high-performance technical index rendered in ClickHouse's visual grammar: near-black canvas, neon yellow-green accents, dense uppercase structure labels, and heavy Inter display typography. The site is no longer a warm glassmorphism editorial shell. It is intentionally sharper, flatter, and more mechanical.

Dark mode is the native personality:

- page background is pure black
- panels use near-black fills with charcoal borders
- primary accent is Neon Volt `#faff69`
- secondary action color is Forest Green `#166534`
- headings are heavy, compact, and direct

Light mode is an inverted catalog view, not a separate brand system. It keeps the same typography and geometry while swapping the canvas to white and shifting emphasis toward green labels and light gray borders.

The shell must stay distinct from gallery entries. A vendor entry may use any palette, but the surrounding application chrome must keep the ClickHouse-style rules: black or white page base, Inter-heavy hierarchy, 4px/8px geometry, and border-led depth.

## 2. Color Palette & Roles

### Primary

| Role | Dark | Light | Usage |
| --- | --- | --- | --- |
| Accent primary | `#faff69` | `#166534` | Active tabs, hover emphasis, skip link, key accents |
| Accent secondary | `#166534` | `#faff69` | Secondary action color and contrast pair |
| Accent tertiary | `#f4f692` | `#14572f` | Pressed state and supporting emphasis |

### Surface & background

| Role | Dark | Light | Usage |
| --- | --- | --- | --- |
| Page background | `#000000` | `#ffffff` | Whole page base |
| Soft surface | `#141414` | `#f8f8f8` | Preview wells, inputs, code blocks |
| Panel background | `rgba(20,20,20,0.92)` | `rgba(255,255,255,0.96)` | Header, hero, toolbar, detail panels |
| Main border | `rgba(65,65,65,0.8)` | `#e5e7eb` | All shell containment |
| Soft border | `rgba(65,65,65,0.4)` | `#f0f0f0` | Secondary boundaries |

### Text

| Role | Dark | Light |
| --- | --- | --- |
| Primary text | `#ffffff` | `#000000` |
| Secondary text | `#a0a0a0` | `#414141` |
| Muted text | `#585858` | `#a0a0a0` |

### Rules

- Neon Volt is the dominant attention signal in dark mode.
- Forest Green is the secondary action color, not a decorative extra.
- Borders do most of the depth work; avoid soft atmospheric shadows.
- Do not reintroduce the previous teal / amber / rust palette into the shell.

## 3. Typography Rules

### Font family

- **Primary / Display**: `Inter`
- **Code**: `Inconsolata`

### Hierarchy

| Role | Size | Weight | Notes |
| --- | --- | --- | --- |
| Gallery hero | `clamp(2.25rem, 6vw, 6rem)` | `900` | Maximum impact, tight line-height |
| Detail / section headline | `clamp(2rem, 4.5vw, 4rem)` | `900` | Large, direct, compact |
| Showcase headline | `clamp(1.5rem, 2.5vw, 2.25rem)` | `700` | Secondary display |
| Card title | `1.45rem` | `700` | Strong but smaller than hero |
| Body | `16px-18px` | `400-600` | Inter only |
| Structure label | `14px` | `600` | Uppercase with `1.4px` tracking |

### Principles

- Inter Black is the key personality trait. When in doubt, increase weight before adding decoration.
- Uppercase tracked labels are structural devices, not occasional ornaments.
- Body copy stays restrained and secondary; the hierarchy is carried by weight and contrast.
- Code remains monospace and sharply framed.

## 4. Component Stylings

### Header and footer

- Sticky header in a bordered dark panel.
- Navigation items are outlined capsules with 4px corners, not rounded pills.
- Active nav and active tabs use a solid Neon Volt fill.
- Footer keeps the same containment system and uppercase link rhythm.

### Hero

- Hero is centered, bold, and headline-first.
- It should feel closer to a product cockpit opening than to a marketing editorial layout.
- Decorative treatment is limited to a faint radial neon glow; no glass blur stacks, no multicolor gradients.

### Search toolbar

- Search is a bordered control block directly under the hero.
- Input uses the same surface system as cards and code blocks.
- Empty search results stay inline and framed, not modal and not full-screen.

### Cards

- Cards are live preview containers with charcoal borders and minimal radius.
- Hover should lift slightly and sharpen border emphasis.
- Preview stage remains framed as a live iframe rather than a static screenshot.

### Detail page

The detail page is a workbench, not an article. From `1100px` up the live preview is pinned on the left (`position: sticky` under the site header) and the documentation scrolls on the right.

- Back link, segmented toggles, document tabs, and adjacent navigation all use the same small-radius outlined control language. Related toggles are fused into one `segmented` group (shared borders, only the outer corners rounded).
- The header carries identity only: back link, layout switch (Split / Preview / Docs), title, summary. Panel headings inside the workbench are `1.125rem`, not display size, so the preview starts above the fold.
- The layout switch is remembered in `localStorage` (`adms-detail-layout`) and restored before first paint. Below `1100px` the panels stack and the switch is hidden.
- Preview tools: Light / Dark, a viewport width (Fit / Tablet `820px` / Mobile `390px`, hidden below `720px`), an open-in-new-tab icon, and a monospace width readout. A 2px Neon Volt bar runs across the stage while the frame loads.
- Documentation keeps its tabs, copy/download actions, and a section strip (the document's `h2`s, with scroll-spy) in one sticky bar. Actions that do not apply to the active tab leave the row; the DESIGN copy and download buttons appear only on the DESIGN tab.
- `←` / `→` open the previous / next design (ignored while typing or with a modifier key held).
- Preview and documentation stay in separate bordered panels.

### Gallery interaction

- Search: `/` focuses the field from anywhere, `Esc` clears it. Cards that stay after a filter slide to their new cell (transform only); cards that appear fade up. Both are skipped under `prefers-reduced-motion`.
- Cards show a Neon Volt arrow cue on hover and keyboard focus.
- Card-to-detail morph: the clicked card's preview frame grows into the detail preview stage and back (cross-document View Transitions, `design-preview`). Only that one element is named, at `pageswap` / `pagereveal` time; the site header is named `site-header` so it stays put. Browsers without support, and visitors who prefer reduced motion, get an ordinary navigation.

### Markdown

- README and DESIGN content render inside a shell-controlled frame.
- Inline code uses dark inset chips.
- Tables and code fences are fully bordered and explicit.

## 5. Layout Principles

- Main content width stays around `1200px`, expanding to `1440px` on large displays.
- Reading width stays narrower than gallery width for markdown clarity.
- Grid behavior:
  - gallery cards: 3 columns default
  - 4 columns on large desktop
  - 2 columns on medium screens
  - 1 column on narrow screens
- Responsive changes should be reflow only. Do not introduce a separate mobile visual identity.

## 6. Depth & Elevation

| Level | Treatment | Use |
| --- | --- | --- |
| Base | Solid page background | Full page |
| Surface | Near-black or light-gray fill | Inputs, code, preview wells |
| Panel | Border + panel fill | Header, hero, toolbar, detail panels |
| Hover | Slight translateY + brighter border | Interactive controls and cards |
| Active | Solid accent fill | Tabs, toggles, active nav |

Depth comes from contrast and containment, not from blur or layered drop shadows.

## 7. Do's and Don'ts

### Do

- Keep the shell in ClickHouse's visual family.
- Use Inter as both body and display font.
- Keep corners sharp: mostly `4px`, larger containers `8px`.
- Prefer border contrast over glow, blur, or gradient ornament.
- Keep hover and active states obvious.
- Preserve existing gallery behavior: source ingestion, preview fallback, README / DESIGN split, and bilingual shell copy.
- Keep motion on transform and opacity (plus the grid-track reflow of the detail layout switch), and keep every effect behind `prefers-reduced-motion`.

### Don't

- Don't reintroduce warm glassmorphism surfaces.
- Don't use soft 24px-32px radii for the shell.
- Don't use teal / amber / rust as primary shell colors.
- Don't turn the preview cards into screenshots.
- Don't merge README and DESIGN into a single undifferentiated document surface.

## 8. Responsive Behavior

| Range | Behavior |
| --- | --- |
| `>= 1440px` | Wider container, 4-column gallery grid, taller stacked detail preview |
| `>= 1100px` | Detail workbench: sticky preview left, scrolling docs right, layout switch visible |
| `721px - 1080px` | 2-column gallery grid, stacked toolbar and header groups |
| `<= 720px` | Single-column gallery and adjacent navigation, segmented groups share the row, viewport switch hidden, reduced preview height |

Mobile keeps the same black/white ClickHouse identity. It should compress, not soften.

## 9. Agent Prompt Guide

### Quick reference

- Dark page background: `#000000`
- Light page background: `#ffffff`
- Primary dark accent: `#faff69`
- Secondary action green: `#166534`
- Primary font: `Inter`
- Code font: `Inconsolata`
- Corner language: `4px / 8px`
- Display weight: `900`

### Example prompts

- "Restyle this gallery panel in ClickHouse style: black background, charcoal border, Inter typography, neon yellow-green accent, 4px corners."
- "Create a dark technical search toolbar with uppercase labels, strong border containment, and an active Neon Volt state."
- "Design a documentation tab switcher with outlined dark buttons and a solid neon active state."
- "Build a ClickHouse-like hero headline with Inter 900, very tight line-height, and restrained neon emphasis."

### Iteration rule

If a proposed UI change looks soft, rounded, pastel, glassy, or editorial, it is off-style. The correct direction is denser, sharper, higher contrast, and more technical.
