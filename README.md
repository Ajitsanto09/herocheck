# HeroCheck

**Check your hero image. Fix unreadable text. Copy the CSS.**

[![CI](https://github.com/Ajitsanto09/herocheck/actions/workflows/ci.yml/badge.svg)](https://github.com/Ajitsanto09/herocheck/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**[Try it live →](https://ajitsanto09.github.io/herocheck/)**

Drop in a hero image, type your headline, and see it on desktop, tablet and mobile crops at once.
HeroCheck measures text contrast on each crop and finds the lightest overlay that makes every one readable.

> "This headline works on desktop, but disappears against the sky on mobile."
> That's the bug HeroCheck catches.

<!-- Add a before/after GIF here: docs/demo.gif -->

## Features

- Drag-and-drop (or click) image upload. Everything runs locally in your browser, nothing is uploaded.
- Editable headline, text colour and position.
- Desktop (1440px), tablet (768px) and mobile (390px) previews with the real `background-size: cover` crop.
- Contrast score per viewport against [WCAG 2.2 contrast](https://www.w3.org/TR/WCAG22/#contrast-minimum): pass at 4.5:1.
- Overlay opacity slider, solid or gradient overlay, and an image focus point to fix bad mobile crops.
- **Fix contrast**: picks the smallest overlay that makes every viewport pass.
- Copy the CSS and HTML. Download a PNG of any preview.
- Three built-in examples so you can try it in ten seconds.

## Run it

Needs Node.js 22.18 or newer.

```bash
git clone https://github.com/Ajitsanto09/herocheck.git
cd herocheck
npm ci
npm run dev
```

Then open the URL it prints. `npm run check` runs lint, tests and a production build.

## How the contrast check works

For each viewport, HeroCheck draws the image exactly as CSS `cover` would, finds the box of every line of your headline,
blends in the overlay pixel by pixel, and computes the WCAG contrast ratio of your text colour against each pixel.
It reports the 5th-percentile ratio, so a few stray bright pixels don't fail a headline but a bright patch does.
The maths lives in [`src/contrast.ts`](src/contrast.ts) and is tested in [`test/contrast.test.ts`](test/contrast.test.ts).

Automated checks can't judge everything (busy textures, thin fonts, motion). Treat a pass as a strong hint and check the real page too.

## Deploy your own copy

Push to `main` on GitHub, then set **Settings → Pages → Source: GitHub Actions**.
The CI workflow tests, builds and publishes the site. It works under any repository name.
To redeploy without a new commit (for example after a GitHub Pages timeout), run the **CI** workflow from the Actions tab.

## Contributing

Pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

No server, no tracking, a strict Content Security Policy, checked uploads, and a locked-down supply chain.
See [SECURITY.md](SECURITY.md) for details and how to report a problem.

## Stack

React, TypeScript, Vite and Canvas. No runtime dependencies beyond React.

## Licence

[MIT](LICENSE)
