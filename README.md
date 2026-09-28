# Coverflow

A school project exploring an album browser inspired by Apple's Cover Flow. Albums come from the [iTunes Search API](https://performance-partners.apple.com/search-api).

## Project structure

```text
coverflow/
├── README.md
├── index.html
└── src/
    ├── app.js
    ├── albums/
    │   └── itunes.js
    ├── coverflow/
    │   ├── coverflow.js
    │   └── coverflow.css
    └── player/
        └── player.js
```

- `index.html` is the single browser entry point.
- `src/app.js` starts the app, runs album searches and wires the player sliders.
- `src/albums/itunes.js` searches albums and looks up their tracks in the iTunes Search API.
- `src/player/player.js` plays an album's track previews and drives the toolbar controls.
- `src/coverflow/` holds the Cover Flow and the Liquid Glass player styles.

Type in the search field to look up albums. Use ← / → or click a cover to browse; click the centered cover (or press Enter / play) to play it. While music plays, moving to another cover switches playback to that album, and when an album ends the flow advances to the next one. The iTunes Search API only provides 30-second previews, so full songs can't be played. There are no dependencies or build tooling; serve the folder with any static server (for example `python3 -m http.server`), since ES modules don't load from `file://`.
