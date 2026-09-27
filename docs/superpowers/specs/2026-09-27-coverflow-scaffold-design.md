# Coverflow Vanilla Scaffold

## Purpose

Create a minimal starting structure for a school project that recreates Apple's Cover Flow album presentation using vanilla HTML, CSS, and JavaScript.

## Goals

- Use feature-oriented folders that make the application's purpose visible.
- Keep the Deezer album source separate from the Cover Flow presentation.
- Leave a root HTML entry point and a small JavaScript bootstrap.
- Write the repository README in English.

## Non-goals

- Implement a user interface or album display.
- Make requests to Deezer or add API credentials/configuration.
- Add business logic, sample album data, dependencies, or a build tool.

## Structure

```text
coverflow/
├── README.md
├── index.html
└── src/
    ├── app.js
    ├── albums/
    │   └── deezer.js
    └── coverflow/
        ├── coverflow.js
        └── coverflow.css
```

`index.html` is the single page entry. `src/app.js` is the application bootstrap. `src/albums/deezer.js` reserves the integration boundary for future album retrieval. `src/coverflow/` owns the future album presentation and its styles. These files contain only the minimum scaffold needed to establish the structure, with no functional UI or API behavior.

## Acceptance

- The listed files exist at the specified paths.
- The HTML entry references the vanilla JavaScript entry point.
- The README is in English and describes the project and folder responsibilities.
- No external packages, API requests, album data, or business logic are added.
