# FORMULA ASCENT

Formula Ascent is a browser-based mathematical idle experiment with two prestige layers.

## Core gameplay
- The simulation and visible HUD update every 10 milliseconds.
- Five core formula modules (A–E) modify production.
- Ascension Points (AP): each next AP threshold is \`1 Qa × 1.05^x\`, where \`x\` starts at 2 for every new run and increases by 1 for each additional AP available from that run's Score.
- Ascension resets the current run but keeps AP, Research Division upgrades and Ascension upgrades.
- Research Division contains ten AP-funded upgrades. Its eighth upgrade unlocks the automation panel; later levels reduce automatic module purchase costs by 10% per level.
- The one-time Genesis Gate costs exactly 1,000 AP and permanently unlocks the Upgrade Tree and Genesis Prestige.
- Genesis Points (GP) use only currently held AP: each next GP threshold is \`1,000 × 1.1^(x/2.5)\`, where \`x\` starts at 2 and increases by 1 for each additional GP available from the current AP balance.
- Genesis Prestige resets the current run, AP, Research Division, automation unlocks and Ascension upgrades. It preserves GP, the Genesis Gate and purchased tree nodes.
- Each A–E automation module is purchased separately for \`10^letter_index\` AP, can be toggled independently, and can be paused globally.
- The Upgrade Tree contains exactly 3,886 nodes. Tree nodes cost GP; child nodes remain locked until their parent is fully upgraded.
- Settings include English/Russian language, number notation, autosave, offline progress, compact numbers and reduced motion.
- Statistics and a placeholder account page are available. Firebase account linking is planned for a later update.

## Project structure

\`\`\`text
FORMULA-ASCENT/
├── index.html
├── package.json
├── README.md
├── .gitignore
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── storage.js
│       ├── prestige.js
│       ├── tree.js
│       ├── app-ui.js
│       └── script.js
├── docs/ARCHITECTURE.md
└── scripts/
    ├── audit.js
    └── server.js
\`\`\`

## File responsibilities
- \`index.html\` — application markup and navigation.
- \`assets/css/style.css\` — responsive visual system.
- \`assets/js/storage.js\` — guarded localStorage access.
- \`assets/js/prestige.js\` — Ascension and Genesis prestige layers.
- \`assets/js/tree.js\` — procedural 3,886-node upgrade network.
- \`assets/js/app-ui.js\` — localization, settings, statistics and Research Division.
- \`assets/js/script.js\` — idle simulation, formulas, automation and run saves.
- \`scripts/audit.js\` — static project checks.
- \`scripts/server.js\` — dependency-free local development server.
- \`docs/ARCHITECTURE.md\` — data flow and persistence notes.

## Run locally

Requires Node.js 18 or newer.

- \`npm run start\` — open \`http://127.0.0.1:4173\`.
- \`npm run check\` — run the static project audit.
- The game remains a static site and can be deployed directly to GitHub Pages. No build step or framework is required.

## Save data

Browser local storage is divided into four independent records:
- \`formula_ascent_save_v2\` — run timer, Score and A–E module levels.
- \`prestigeSave\` — AP, GP and Ascension upgrades.
- \`faMeta\` — language, settings, Research Division, automation and statistics.
- \`faTree\` — purchased Upgrade Tree nodes.

Legacy run keys are migrated to the current run key on load. All storage access is centralized in \`assets/js/storage.js\`. If browser storage is unavailable, the simulation can continue in memory and save failures are reported instead of crashing the game.
