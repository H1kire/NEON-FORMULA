# FORMULA ASCENT

Formula Ascent is a browser-based mathematical idle experiment with two prestige layers.

## Core gameplay
- The simulation and visible HUD update every 10 milliseconds.
- Five core formula modules (A–E) modify production.
- Ascension Points (AP): each next AP threshold is `1 Qa × 1.05^x`, where `x` starts at 2 for every new run and increases by 1 for each additional AP available from that run's Score. AP earned or spent in earlier Ascensions during the same Genesis cycle does not affect `x`.
- Ascension resets the current run but keeps AP, Research Division upgrades and Ascension upgrades.
- Research Division contains ten cheaper AP-funded upgrades. The one-time Genesis Gate costs exactly 1,000 AP and permanently unlocks the Upgrade Tree and Genesis Prestige.
- Genesis Prestige awards Genesis Points (GP) using only currently held AP: each next GP threshold is `1,000 current AP × 1.03^x`, where `x` is the next lifetime GP index. Spending GP on tree nodes does not reduce this index.
- Genesis Prestige is the second global soft reset. It resets the run, current AP, Research Division levels and Ascension upgrades. It preserves Genesis Points, the GP lifetime index, the Genesis Gate unlock and all purchased tree nodes.
- The Upgrade Tree contains exactly 3,886 nodes. Tree nodes cost GP; child nodes remain locked until their parent is fully upgraded.
- Settings include English/Russian language, number notation, autosave, offline progress, compact numbers and reduced motion.
- Statistics and a placeholder account page are available. Firebase account linking is planned for a later update.

## Run locally
Open `index.html` in a modern browser. No build step or framework is required.

## Project structure
- `index.html` — application pages and navigation.
- `style.css` — responsive interface and visual system.
- `script.js` — idle simulation, formulas, module upgrades and local saves.
- `prestige.js` — Ascension and Genesis prestige layers.
- `app-ui.js` — localization, settings, statistics and Research Division.
- `tree.js` — procedural 3,886-node upgrade network and GP-funded node progression.
