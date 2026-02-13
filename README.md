# Nikita Rathi Portfolio Website

Static multi-page portfolio optimized for recruiter and hiring-manager review.

## Structure

- `index.html` - homepage with summary, key outcomes, featured case studies, and contact.
- `experience.html` - full experience timeline and education.
- `case-studies/aml-transformation.html` - AML transformation case study.
- `case-studies/baas-growth.html` - BaaS growth case study.
- `404.html` - custom not-found page for GitHub Pages.
- `assets/css/styles.css` - shared design system and responsive layout.
- `assets/js/main.js` - nav state, reveal motion, reduced-motion handling, headshot fallback.
- `assets/js/analytics.js` - consent-gated visitor analytics (pageviews, engagement, click tracking, optional GA4/Clarity/geo/custom endpoint).
- `assets/img/headshot.JPG` - add your headshot here.
- `sitemap.xml` and `robots.txt` - crawl and indexing helpers.
- `.nojekyll` - ensures static assets and paths are served without Jekyll processing.
- `.github/workflows/pages.yml` - optional automatic deployment pipeline for GitHub Pages.

## Local Preview

Run a local static server from project root:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Analytics and Advanced Visitor Tracking

Tracking is now wired into all pages through `assets/js/analytics.js`.

### Included out of the box

- Consent banner with allow/decline controls.
- Anonymous `visitor_id` (persistent) and `session_id` (per-tab session).
- `page_view`, `cta_click`, `contact_click`, `outbound_click`, and `file_download` events.
- Engagement metrics: `scroll_depth`, `engaged_30s`, `page_exit`, and `performance_summary`.
- Optional geo-enrichment (`geo_resolved`) from an IP geolocation API.
- Optional forwarding to:
  - Google Analytics 4 (GA4)
  - Microsoft Clarity
  - a custom analytics endpoint (via `sendBeacon` / `fetch`)

### Configure it

Each page contains a `window.NikitaTrackingConfig` block near the bottom.

Set these values:

- `ga4MeasurementId`: set to your GA4 id (example: `G-ABCDE12345`)
- `clarityProjectId`: set to your Clarity project id
- `customEndpoint`: set to your backend collector URL (optional)
- `geoLookup.enabled`: set `true` to enable geo lookup
- `geoLookup.url`: API endpoint returning JSON with fields like city/region/country

If you want tracking without consent gating, set:

- `requireConsent: false`

Recommended: keep `requireConsent: true` and publish a short privacy notice page.

## Personalization Checklist

1. Add your headshot to `assets/img/headshot.JPG`.
2. Replace canonical/OG URLs in each HTML file with your real GitHub Pages URL.
3. Confirm LinkedIn URL and contact email.
4. Replace `https://your-username.github.io/nikita-webpage` in `robots.txt` and `sitemap.xml`.

## GitHub Pages Deployment (Project Site)

1. Push this folder to a GitHub repository.
2. In repository settings, open **Pages**.
3. Under **Build and deployment**, set:
   - **Source**: Deploy from a branch
   - **Branch**: `main` (or your default branch), folder `/ (root)`
4. Save and wait for deployment.
5. Update canonical and OG URLs in all pages to match the published URL.

## GitHub Pages Deployment (GitHub Actions)

If you want deploys to run automatically on each push to `main`:

1. Push this repository to GitHub.
2. In **Settings > Pages**, set **Source** to **GitHub Actions**.
3. Confirm workflow file exists at `.github/workflows/pages.yml`.
4. Push changes to `main` and wait for the Pages workflow to complete.
5. Use the workflow URL shown in Actions to confirm deployment status.

Reference:

- [GitHub Pages quickstart](https://docs.github.com/en/pages/quickstart)

## Accessibility and Standards Notes

- Semantic landmarks, skip link, keyboard-focus styles, and reduced-motion support are included.
- Content and color choices are designed to support WCAG 2.2 AA readability targets.
- Home page includes `Person` schema JSON-LD.
