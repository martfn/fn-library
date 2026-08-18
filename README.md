# My Game Library

A private, mobile-first personal game library and "what should I play?" recommendation tool.

Built per the project plan (`Personal-Game-Library-Web-App.pdf`). This is **V1: Basic Foundation** —
no backend, no accounts, no console scanning. Just a fast local app you install on your iPhone.

## Files

- `index.html` / `app.js` — main mobile app (library, filters, search, Surprise Me, mood/time wizard)
- `editor.html` / `editor.js` — Collection Editor (desktop-first, add/remove games, manage platforms, import/export)
- `storage.js` — localStorage persistence layer (single source of truth for reads/writes)
- `rawg.js` — isolated RAWG.io API wrapper (search + details), swappable later
- `moods.js` — genre/tag → personal mood vocabulary mapping (auto, editable later)
- `recommend.js` — scoring-based recommendation engine + Surprise Me randomizer
- `manifest.webmanifest` — PWA / Add-to-Home-Screen config

## Setup

1. Get a free RAWG API key at https://rawg.io/apidocs
2. Paste it into `RAWG_API_KEY` in `rawg.js`
3. Serve the folder locally, e.g.:
   ```
   npx serve .
   ```
   (RAWG requests and `fetch` won't work from a `file://` URL, so use a local server.)
4. On your iPhone, open the local URL in Safari, tap Share → Add to Home Screen.

## Data model (per game)

```json
{
  "id": "game_123_1700000000000",
  "rawgId": 123,
  "title": "Stray",
  "year": 2022,
  "cover": "https://...",
  "genres": ["Action", "Adventure"],
  "officialPlatforms": ["PC", "PlayStation 5", "Nintendo Switch"],
  "personalPlatforms": ["mac", "switch"],
  "moods": ["adventure"],
  "lastPlayed": null,
  "personalRating": null,
  "playTime": null,
  "favorite": false
}
```

`officialPlatforms` comes from RAWG. `personalPlatforms` is yours — these are kept
deliberately separate so RAWG metadata changes never overwrite your own availability data.

## What's NOT built yet (by design, per the plan's phased roadmap)

- V1.1: manual mood overrides in the editor UI, mood filter chips in the main app
- V1.2: favorites UI, star ratings, play-time picker in the editor
- V2: "other ways to play" cross-platform discovery view, remake/port disambiguation
- V3: any console auto-sync (deliberately out of scope until justified)

## Attribution

This app uses the RAWG Video Games Database API. Per RAWG's free-tier terms, keep an
attribution + active link to https://rawg.io wherever RAWG data/images are shown.
