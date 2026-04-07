# NCS Player Prototype

A modern Electron desktop prototype for Windows and macOS that talks directly to your own NCS metadata API:

`https://api.schmittdev.org/ncsplayer/public/api.php`

## Highlights

- clean Spotify-inspired desktop layout
- Home, Discover, Genres, Search and Library views
- dedicated queue drawer with reorder, remove and play-from-queue actions
- autoplay, next, previous and shuffle controls
- local playlists and liked songs via `electron-store`
- search against your own API
- genre detail pages with a proper song list

## Stack

- Electron
- Vanilla JavaScript
- electron-store
- electron-builder

## Project structure

```text
.
├── main.js
├── preload.js
├── package.json
├── src/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── CHANGELOG.md
├── CONTRIBUTING.md
└── README.md
```

## Quick start

```bash
npm install
npm run dev
```

## Production builds

```bash
npm run dist:win
npm run dist:mac
```

## API contract used by the app

The renderer expects these endpoints to work:

- `?action=songs&page=1&limit=120`
- `?action=search&q=favela`
- `?action=health`

Expected song fields:

- `title`
- `slug`
- `artists` or `artist_raw`
- `genre` or `genres`
- `audio_url`
- `cover_large_url` / `cover_medium_url` / `cover_url`
- `release_date`

## Queue behavior

- clicking a song starts playback from the current list context
- clicking `+` adds a track to the queue
- queue drawer lets you reorder, remove or jump to any queued track
- autoplay continues through the queue

## Notes

- this prototype intentionally keeps state local on the device
- playlists and likes are stored in Electron's local storage through `electron-store`
- if the API is unreachable, the UI will show a fallback message instead of crashing
