# AGENTS.md

## Project Snapshot
- This repository is a static, multi-page portfolio website (no framework, no bundler, no package manager).
- Pages are served directly as HTML/CSS/JS and deployed via GitHub Pages.
- Shared styles and behavior live in:
  - `assets/css/styles.css`
  - `assets/js/main.js`

## Repository Map
- `index.html`: homepage and summary metrics.
- `experience.html`: detailed timeline.
- `case-studies/aml-transformation.html`: AML case study.
- `case-studies/baas-growth.html`: BaaS case study.
- `404.html`: custom not-found page.
- `robots.txt` + `sitemap.xml`: crawl/indexing metadata.
- `.github/workflows/pages.yml`: optional GitHub Actions Pages deployment.

## Core Constraints
- Keep this project static unless explicitly asked otherwise.
- Reuse the existing design system in `assets/css/styles.css`; avoid page-specific inline style blocks.
- Preserve accessibility affordances already present:
  - skip link
  - semantic landmarks
  - keyboard focus visibility
  - reduced-motion support
- Keep desktop and mobile behavior intact (especially nav toggle and responsive grids).

## HTML Editing Rules
- Keep page navigation and footer links consistent across all pages.
- Use correct path depth:
  - Root pages (`index.html`, `experience.html`) reference `assets/...`
  - Case-study pages reference `../assets/...`
- Maintain `body[data-nav]` values and matching `data-nav-link` values:
  - `home`, `experience`, `aml-case`, `baas-case`
- If adding a section that should animate in, add `data-reveal`.

## JS Coupling Notes (`assets/js/main.js`)
- Script expects:
  - `.site-header`
  - `.nav-toggle`
  - `#primary-menu`
  - `[data-nav-link]`
  - optional `[data-headshot]` inside `.portrait-card`
  - optional `[data-reveal]` elements
- If these selectors or attributes change, update JS in the same change.

## SEO + Metadata Consistency
- Canonical and OG URLs currently use placeholder domain values.
- If changing site URL or slug, update in all of:
  - `index.html`
  - `experience.html`
  - `case-studies/aml-transformation.html`
  - `case-studies/baas-growth.html`
  - `robots.txt`
  - `sitemap.xml`
- Keep `sitemap.xml` `lastmod` values current when content changes.

## Local Verification
- Run a static server from repo root:
  - `python3 -m http.server 8000`
- Manually verify:
  - all nav links work on each page
  - mobile menu opens/closes
  - reveal animations show content (or gracefully skip with reduced motion)
  - case-study pages resolve relative asset paths correctly
  - no broken canonical/OG references after URL updates

## Deployment Notes
- `.nojekyll` should remain in place for GitHub Pages static serving behavior.
- If GitHub Actions deployment is used, workflow is at `.github/workflows/pages.yml`.
