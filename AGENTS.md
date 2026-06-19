# awesome-design-md-site - Agent Configuration

## Root Configuration

Inherits all behavior from `/AGENTS.md` at the monorepo root. Local rules extend or override the root file for this repository.

## Project Context

`awesome-design-md-site` is an Astro-based static gallery site for browsing design system entries from the upstream `awesome-design-md` repository. Content is sourced from a vendor git submodule.

## Working Directory

Run commands from `repos/awesome-design-md-site/`.

## Key Commands

```bash
npm install
npm run dev
npm run build
npm run i18n:check
```

## Key Paths

- `src/pages/`: Astro routes (gallery, detail pages)
- `src/components/`: Astro/React components
- `vendor/awesome-design-md/`: git submodule content source
- `design.md`: site shell design system (separate from vendor entry DESIGN.md files)

## Agent Guidelines

- This repos's root `design.md` describes the gallery site shell itself, not upstream design entries.
- Vendor content under `vendor/awesome-design-md/` is a git submodule; do not edit it directly.
- Keep the gallery site shell design (two-theme colors, typography, search, preview tabs) aligned with `design.md`.
- Use `npm run i18n:check` to validate locale consistency.

## References

- `README.md`
- `design.md`
