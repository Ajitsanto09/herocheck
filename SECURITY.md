# Security

## Reporting a vulnerability

Please use GitHub's **Report a vulnerability** button on the repository's Security tab (private advisory).
Do not open a public issue for security problems.

## How HeroCheck is built to stay safe

- **Your images never leave your browser.** There is no server, no analytics and no network request after the page loads.
  The Content Security Policy (`default-src 'none'`) blocks the app from contacting any other site, even if a dependency tried to.
- **No inline or third-party scripts.** The built site only runs its own bundled JavaScript (`script-src 'self'`), with Trusted Types enforced.
- **Uploads are checked.** Only PNG, JPEG, WebP, GIF and AVIF up to 25 MB and 12,000 px a side. SVG is refused because it can carry scripts.
- **Exported code can't be injected.** The copied CSS uses a fixed `hero.jpg` placeholder, never your filename. Colours come only from colour pickers,
  and the headline is HTML-escaped in the copied HTML.
- **Supply chain.** `package-lock.json` is committed and CI installs with `npm ci`. `.npmrc` turns off install scripts. CI runs `npm audit`
  and `npm audit signatures`. GitHub Actions are pinned to commit SHAs with read-only default permissions. Dependabot proposes updates weekly.

## Repository settings

These live in GitHub settings, not in the code, and are switched on for this repository:

- `main` is protected by a ruleset: changes go through pull requests, the **check** and **dependency-review** jobs must pass,
  review threads must be resolved, and force-pushes and branch deletion are blocked.
- CODEOWNERS requests a maintainer review on every pull request.
- Secret scanning with push protection, Dependabot alerts and security updates, CodeQL code scanning,
  and private vulnerability reporting are on.
- Actions may only use GitHub-authored actions pinned to a full commit SHA. Workflows get read-only tokens by default
  and cannot approve pull requests.
