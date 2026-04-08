# TuneDeck

TuneDeck is a modern Electron desktop prototype for Windows and macOS that talks directly to your own NCS metadata API:

`https://api.schmittdev.org/ncsplayer/public/api.php`

## Highlights

- clean Spotify-inspired desktop layout
- custom title bar with native window actions
- song pages, artist pages and playlist pages
- local playlists and liked songs via `electron-store`
- dedicated queue drawer and queue access in the bottom player
- settings drawer with about and license sections
- search against your own API
- genre detail pages with a proper song list

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

## Notes

- project name: **TuneDeck**
- playlists and likes are stored locally on the device
- the program license section in-app points to **GNU GENERAL PUBLIC LICENSE Version 3**
- the music terms section is intentionally left as your own placeholder text


## Latest UI updates

- generated gradient playlist covers inspired by Deezer / Apple Music
- no login avatar in the top bar
- song page actions cleaned up and license modal added
- clicking player cover or title opens the song page
- clicking artist names opens the artist page everywhere in the app
