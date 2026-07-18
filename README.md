# Palette by Number

A calming, browser-based paint-by-number studio with 20 original projects across puppies, landscapes, flowers, gardens, and nature.

## Features

- Number-matched color filling with helpful feedback
- 20 responsive SVG projects and five category filters
- Automatic progress saving in the browser
- Undo, restart, number hints, and zoom controls
- High-resolution PNG download
- Keyboard, touch, and screen-reader friendly controls
- No accounts, trackers, external APIs, or server required

## GitHub Pages

The production site is in `site/`. The included GitHub Actions workflow publishes that directory to GitHub Pages whenever `main` changes. The workflow also enables Pages on its first run when repository permissions allow it.

## Local preview

From the repository root:

```bash
python3 -m http.server 8080 --directory site
```

Then visit `http://localhost:8080`.
