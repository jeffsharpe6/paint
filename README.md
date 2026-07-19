# Palette by Number

A calming, browser-based paint-by-number studio with 25 original, professionally illustrated projects across puppies, landscapes, flowers, gardens, and nature.

## Features

- Number-matched color filling with helpful feedback
- 25 gallery-quality SVG projects with 5,728 fully mapped paint regions
- Five category filters and polished completed-art previews
- Automatic progress saving in the browser
- Undo, restart, number hints, and true 6× zoom controls
- 3840 × 2880 PNG download
- Keyboard, touch, and screen-reader friendly controls
- No accounts, trackers, external APIs, or server required

## Artwork

Every finished illustration in the collection was created specifically for Palette by Number, then converted into an eight-color interactive SVG. The source artwork favors sophisticated flat-color gouache and cut-paper compositions so the completed projects resemble commercial adult paint-by-number artwork while remaining practical to paint online.

The conversion workflow uses the MIT-licensed [Paint by Numbers Generator](https://github.com/drake7707/paintbynumbersgenerator) by drake7707. See `THIRD_PARTY_NOTICES.md`.

Every project map is checked for complete canvas coverage, unique region IDs,
matching number labels, and a selectable palette entry for every region. Run
`python3 tools/validate_project_maps.py` to repeat the full collection audit.

## GitHub Pages

The production site is in `site/`. The included GitHub Actions workflow publishes that directory to GitHub Pages whenever `main` changes. The workflow also enables Pages on its first run when repository permissions allow it.

## Local preview

From the repository root:

```bash
python3 -m http.server 8080 --directory site
```

Then visit `http://localhost:8080`.
