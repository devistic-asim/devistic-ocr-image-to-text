# Contributing

Thanks for looking at Devistic OCR. The app is a client-side Vite + React + TypeScript project. There is no server to run.

## Setup

```bash
npm install
npm test
npm run lint
npm run dev
```

Open the printed local URL. The dev server uses the same `/devistic-ocr-image-to-text/` base path as GitHub Pages.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Keep changes focused. Layout math lives in `src/lib/layout.ts` and should stay pure so the unit tests can cover it.
3. Run `npm test` and `npm run lint` before you open a pull request.
4. Describe what a reviewer should see in the browser, especially if you touched recognition, layout, or theme contrast.
5. Do not add analytics, trackers, API keys, or a backend. Images and text stay in the browser.

## Reporting issues

Use the bug and feature templates. Include the browser, the language you selected, and whether the image was a photo or a screenshot. Do not attach images that contain private information.
