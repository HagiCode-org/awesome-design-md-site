---
public: true
multilingual: false
style: product
---

# README requirements

## Product focus

- Introduce `awesome-design-md-site` as a static gallery at https://design.hagicode.com for browsing the design systems collected in the upstream `awesome-design-md` repository. Each entry gets a gallery card, a detail page, and rendered previews.
- Describe what visitors get: live search across entries, a README and DESIGN document switcher on each detail page, light and dark preview images with Fit, Tablet and Mobile widths, an option to open the original preview in a new tab, a downloadable DESIGN file, and a ten-language interface.
- Address designers, front-end developers and AI-assisted builders who look for a design system to study or reuse. The README is written in Chinese; keep it in Chinese.
- Lead with the product value (find and compare design systems quickly) before any technical detail.

## Required content

- Open with a short product introduction, a prominent link to the public site, and a link to the upstream `awesome-design-md` content source.
- List the product features that the site actually shows, as named above, and explain how a visitor uses them: search, open an entry, switch between README and DESIGN, switch preview theme and width.
- Mention the interface languages as a visitor-facing feature, consistent with the locales configured in `hagi18n.yaml`.
- Keep any license or attribution statement consistent with the repository and the upstream project.

## Exclusions

- Exclude tokens, secret values, internal hosts, machine-specific paths and private links.
- Do not describe features the site does not show.
- Keep repository maintenance instructions out of the README: repository layout, internal architecture, submodule handling, CI, build and preview-rendering internals, hagi18n maintenance and deployment.
