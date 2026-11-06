# Contributing

Thanks for helping. Small, focused pull requests are easiest to review.

1. Fork the repo and create a branch from `main`.
2. `npm ci`, then `npm run dev` to work on it.
3. Run `npm run check` (lint, tests, build) before you push.
4. Open a pull request and fill in the template. CI must pass before it can merge.

Ground rules:

- Images must stay in the browser. Don't add servers, analytics or network calls.
- Don't add a dependency for something a few lines of code can do.
- Contrast maths changes need a test in `test/contrast.test.ts`.

Found a security problem? Don't open an issue. Follow [SECURITY.md](SECURITY.md).
