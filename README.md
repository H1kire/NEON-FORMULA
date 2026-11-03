# FORMULA ASCENT

Formula Ascent is a browser-based mathematical idle experiment. Grow a formula, invest in five core modules, earn Ascension points and unlock permanent research.

## Core gameplay
- The simulation and visible HUD update every 10 milliseconds.
- Production is deliberately slower and module prices scale more aggressively.
- Five core formula modules (A–E) modify the production equation.
- Ascension points fund permanent research and the legacy Ascension Lab.
- Ten experimental research upgrades improve production and formula modules. The eleventh project unlocks the Upgrade Tree.
- The Upgrade Tree contains exactly 3,886 procedurally arranged nodes. Nodes can have multiple levels; child nodes remain locked until their parent is fully upgraded.
- Settings include English/Russian language, number notation, autosave, offline progress, compact numbers and reduced motion.
- Statistics and a placeholder account page are available. Firebase account linking is planned for a later update.

## Run locally
Open `index.html` in a modern browser. No build step or framework is required.

## Project structure
- `index.html` — application pages and navigation.
- `style.css` — responsive interface and visual system.
- `script.js` — 10 ms idle simulation, formulas, module upgrades and local saves.
- `prestige.js` — Ascension currency and permanent upgrades.
- `app-ui.js` — localization, settings, statistics and research upgrades.
- `tree.js` — procedural 3,886-node upgrade network and node progression.
