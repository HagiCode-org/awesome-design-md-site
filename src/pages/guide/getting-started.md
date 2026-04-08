---
layout: ../../layouts/BaseLayout.astro
title: Getting Started
description: First steps for the Awesome Design MD Site Astro template.
lang: en
nav:
  - label: Home
    href: /
  - label: Guide
    href: /guide/getting-started
  - label: Chinese
    href: /zh-CN/guide/getting-started
  - label: GitHub
    href: https://github.com/HagiCode-org/awesome-design-md-site
currentPath: /guide/getting-started
---

<div class="markdown-shell shell-panel">

# Getting Started

This repository is now an Astro starter extracted from `repos/site`, but stripped down to the reusable parts.

## What is included

- Astro 6 with static output
- React islands for small interactive sections
- MDX support for richer markdown pages
- English and Chinese routes
- Shared shell styling shipped from `public/global.css`

## Shell stylesheet source of truth

- Runtime shell and header changes must land in `public/global.css`; `BaseLayout.astro` links `/global.css` directly.
- `src/styles/global.css` is not the stylesheet currently served by the built site, so treat it as a reference copy only unless the layout import changes.

## Mobile header decisions

- Narrow screens use the compact `ADMG` brand label instead of the full site name.
- Language and theme controls stay directly visible in the sticky header.
- Repository links move into a `details` utility surface triggered from the mobile header, while tablet and desktop keep them inline.

## First edits

1. Change copy in `src/config/site.ts`.
2. Point `SITE_URL` at your real domain before production builds.
3. Replace the sample sections in `src/pages/index.astro`.
4. Add more `.md` or `.mdx` files under `src/pages/`.

## Commands

```bash
npm install
npm run dev
npm run build
```

</div>
