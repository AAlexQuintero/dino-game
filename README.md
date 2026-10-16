# Dino Expedition — CSC321 Homework 3

An expanded version of the professor’s React dinosaur starter. The original `App → Dino` component structure, Create React App setup, and dinosaur/cactus assets are preserved. No assignment PDF was present in the workspace.

## Install and launch

Use Node.js and npm compatible with Create React App 5 (validated here with the installed environment).

```sh
npm install --cache .npm-cache
npm start
```

Open http://localhost:3000. If dependencies are already installed, just run `npm start`.

```sh
npm run build
CI=true npm test -- --watchAll=false --runInBand
```

The production build is written to `build/`. Do not open `public/index.html` directly; use the development server or serve the build over HTTP.

## Controls

| Key / button | Action |
| --- | --- |
| Space or Arrow Up | Start and jump; release before the next jump |
| Hold Arrow Down or S | Crouch; release to stand (also works in the air) |
| P or Pause/Resume button | Pause/resume |
| Start expedition | Begin a run |
| Restart expedition | Start a fresh run after game over |

The page suppresses scrolling for gameplay keys. Holding jump does not repeatedly jump. Switching windows automatically pauses and releases crouch. Keyboard controls continue working after clicking buttons. All movement, score, spawn timers, invulnerability, and scenery freeze while paused.

## Six new features and demonstrations

1. **Shield power-up.** Collect the turquoise hexagon at ground level. The first appears after about five seconds plus travel time, with later ones spaced roughly 9–14 seconds apart. A ring and “Shield active” label show protection. Hit an obstacle: the shield disappears, the obstacle fades, and the dinosaur receives 1.2 seconds of invulnerability. That obstacle cannot hit again. Shields do not stack.
2. **Ducking and flying obstacles.** Hold Down/S to flatten the dinosaur and reduce its collision height from 54 to 28 world units. Duck beneath higher birds; jump over low birds and cacti. All birds can also be jumped. Obstacles have at least 1.65 seconds of separation, exceeding the approximately 0.7-second jump duration. Speed increases gradually and is capped. Shield spawns are separated from nearby obstacles.
3. **Changing biomes.** Reach 150 points to enter Snow and 300 to enter Volcanic; at 450 the sequence returns to Desert. Each has its own sky, mountain, ground, cactus, and bird colors. The dashboard displays the current biome. Scores grow at 10 points per second.
4. **Day/night scenery.** Keep running to see moving clouds, the sun fading into a moon, and stars appearing against a dark sky. The cycle lasts 45 seconds, with deepest night at 22.5 seconds. Outlined obstacles and the dinosaur stay visible. Pause to verify scenery freezes too.
5. **Persistent local leaderboard.** Finish several runs to populate the five highest scores, their dates, and the personal best. Refresh to verify persistence. Only completed runs count. Invalid entries are filtered; blocked storage or invalid JSON does not crash the game. A storage message explains when progress is session-only. Records use the browser’s local date format and the `csc321-dino-v1` localStorage key.
6. **Persistent achievements.** Jump once, reach 100 points, survive a full 45-second day/night cycle, and absorb a collision with a shield. Each milestone displays a short notification and changes its panel entry from Locked to Unlocked. Refresh to verify saved unlocks. Requirements are visible below the game.

Restart clears movement, score, biome/day-cycle time, hazards, pickups, crouch, shield, invulnerability, and pending notifications. Saved records and achievements remain.

## Implementation and dependencies

`src/components/Dino/game.js` contains elapsed-time physics, world-space collision rectangles, spawns, milestones, and storage validation. `Dino.js` connects the engine to React, keyboard input, a cleaned-up animation loop, and responsive rendering. Rendering and collisions share a 900 × 320 world, including the crouched dinosaur size. Small physics substeps avoid skipping collisions. Long frame gaps are capped to avoid teleporting after a suspended tab; this intentionally slows simulation during severe stalls.

Existing dependencies remain unchanged: React/React DOM 18, react-scripts 5, Testing Library packages, and web-vitals; exact versions are in `package-lock.json`. No new application dependencies were added. Browser verification used temporary Playwright tooling outside this repository.

Asset credits: `src/components/Dino/img/trex.png` and `cactus.png` were supplied in the professor’s starter project; original artist/license information was not provided. Other game scenery, birds, and shield effects use CSS and text symbols. The `public/` React icons originate from the Create React App starter. No external images or fonts are downloaded during play.

## Validation

- Production build compiles without warnings.
- Five automated tests cover jump/landing, crouch collision bounds, shield collection/absorption, invulnerability, fatal collisions, pause, restart defaults, elapsed-time movement, biome/night milestones, storage validation, top-five ranking, and storage failures.
- Chromium checks exercise rendered keyboard controls, jump, crouch/release, pause/resume, collection, shield hit, flying-obstacle collisions, restart, biomes, day/night, all four achievements, saved scores/unlocks after reload, malformed storage, and mobile page width. Later biome/collision scenarios are arranged through the existing React state for deterministic verification, rather than requiring a manual 45-second survival run. There are no shipped debug controls.
- `submission-screenshot.png` is an actual Chromium capture of the running app. Browser verification is automated; Safari and a full manual playthrough have not been performed.

## Submission

1. Run `npm start` and review the game. The included `submission-screenshot.png` shows it running. To take your own on a Mac, press **Shift–Command–4** and drag over the game window (or press Space afterward to capture a window). Rename the capture `submission-screenshot.png` if replacing it.
2. Create a **public GitHub repository** when ready. Include `src/`, `public/`, `README.md`, `.gitignore`, `package.json`, `package-lock.json`, and the screenshot. Preserve the assets inside `src/`. The old `package-lock.backup.json` is unnecessary for submission.
3. Exclude `node_modules/`, `.npm-cache/`, and `build/` (already covered by `.gitignore`). Confirm the repository can be cloned and launched with the commands above.
4. Submit the public repository URL and the running-game screenshot according to your professor’s submission portal instructions. Check any assignment PDF provided separately for additional requirements.

No repository has been published or pushed by this implementation.
