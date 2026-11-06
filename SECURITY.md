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

## Recommended repository settings (owner)

These live in GitHub settings, not in the code:

- Protect `main`: require pull requests, require the **CI / check** status to pass, and block force-pushes.
- Turn on secret scanning, push protection, Dependabot alerts and private vulnerability reporting.
- Settings → Pages → Source: **GitHub Actions**.
- Settings → Actions → General: allow only GitHub-authored and pinned actions; set the default workflow permissions to read-only.
