# FORMULA ASCENT

Formula Ascent is a browser-based mathematical idle experiment with two prestige layers.

## Core gameplay
- The simulation and visible HUD update every 10 milliseconds.
- Five core formula modules (A–E) modify production.
- Ascension Points (AP): each next AP threshold is `1 Qa × 1.05^x`, where `x` starts at 2 for every new run and increases by 1 for each additional AP available from that run's Score.
- Ascension resets the current run but keeps AP, Research Division upgrades and Ascension upgrades.
- Research Division contains ten AP-funded upgrades. Its eighth upgrade unlocks the automation panel; later levels increase automatic purchase efficiency by 10% per level.
- The one-time Genesis Gate costs exactly 1,000 AP and permanently unlocks the Upgrade Tree and Genesis Prestige.
- Genesis Points (GP) use only currently held AP: each next GP threshold is `1,000 × 1.1^(x/2.5)`, where `x` starts at 2 and increases by 1 for each additional GP available from the current AP balance.
- Genesis Prestige resets the current run, AP, Research Division, automation unlocks and Ascension upgrades. It preserves GP, the Genesis Gate and purchased tree nodes.
- Each A–E automation module is purchased separately for `10^letter_index` AP, can be toggled independently, and can be paused globally.
- The Upgrade Tree contains exactly 3,886 nodes. Tree nodes cost GP; child nodes remain locked until their parent is fully upgraded.
- Settings include English/Russian language, number notation, autosave, offline progress, compact numbers and reduced motion.
- Statistics and a placeholder account page are available. Firebase account linking is planned for a later update.

## Formula modules A–E

The five formula modules are active from the beginning; their multipliers are always included in production. All formula updates use **real elapsed time** and one synchronous recursive update per second. Every letter is calculated from the previous second's complete A–E state, so no letter is evaluated in a privileged order.

The production formula is:

\[
f(t)=t^2\cdot a\cdot b\cdot c\cdot d\cdot e
\]

- **A — Power Foundation:** \(a=(1+t/60)^{(1+\ln(c))/1.81}\). C feeds back into A's exponent.
- **B — Root Amplifier:** \(b=1+(a^{0.652}-1)/1.055\).
- **C — Logarithmic Recursion:** \(c_{n+1}=1+\ln(1+abc_n)/1.66\). C uses its previous value and participates in the A feedback loop.
- **D — Nonlinear Coupling:** \(d=1+\sqrt{abc}/11.7\).
- **E — Logarithmic Resonance:** \(e=1+\ln(1+bd)/2.057\).

With no letter upgrades or Research levels, the synchronous baseline reaches approximately **1,096.87×** combined A–E multiplier after 300 real seconds. This is a mathematical baseline, not a promise about a save that already contains upgrades.

### Letter upgrades

- The first purchase prices remain A=1,000, B=100,000, C=10,000,000, D=1,000,000,000 and E=1,000,000,000,000 Score.
- Without Research, each subsequent purchase costs 3% more than the previous level. Research 2 discounts the current price by 1% per level, capped at 99%; Research 3 reduces the extra per-level price growth.
- Each letter has its own parameter: A/C/D/E improve by lowering a divisor; B improves by raising its exponent.
- Parameter progress uses a smooth curve \(L_{eff}/(300+L_{eff})\). The curve is still meaningful at level 100 and has diminishing returns beyond roughly level 300.
- Research 1 globally increases effective letter levels by 4% per research level. Research 4 globally expands parameter limits: divisors can pass below 1.00, while exponents can rise above 1.00.
- Research 5 globally strengthens cross-letter dependencies. Research 1, 4 and 5 apply to all current and future letter modules through the shared math-system helpers.

### Research Division

The first five projects form the global letter-progression layer: Mathematical Efficiency (unlimited), Discount Engineering (up to 99%), Price Stabilization (unlimited), Deep Mathematical Optimization (unlimited), and Dependency Resonance (unlimited). Research 6–10 retain the time, automation, production and prestige specializations. Research 8 (index 7) unlocks the letter automation panel. The one-time Genesis Gate remains the 1,000 AP final research unlock.

## Mathematical rendering

The game vendors KaTeX 0.16.22 locally under `assets/vendor/katex/` (including its fonts). No runtime CDN or external math-rendering API is used. `assets/js/formula-renderer.js` is a presentation-only adapter; it renders the current formula strings into the existing UI and caches unchanged expressions so the 10 ms simulation loop does not repeatedly typeset identical math. The existing typography is preserved throughout the interface. Inside Formula Upgrades, card titles, descriptions and A–E formulas use **16 pt**; the main `f(t)` formula uses **25 pt**. Other windows retain their original font sizes. KaTeX does not participate in Score, AP, GP, upgrade, or save calculations.

## Project structure

```text
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
```

## File responsibilities
- `index.html` — application markup and navigation.
- `assets/css/style.css` — responsive visual system.
- `assets/js/storage.js` — guarded localStorage access.
- `assets/js/prestige.js` — Ascension and Genesis prestige layers.
- `assets/js/tree.js` — procedural 3,886-node upgrade network.
- `assets/js/app-ui.js` — localization, settings, statistics and Research Division.
- `assets/js/script.js` — idle simulation, formulas, automation and run saves.
- `scripts/audit.js` — static project checks.
- `scripts/server.js` — dependency-free local development server.
- `docs/ARCHITECTURE.md` — data flow and persistence notes.

## Run locally

Requires Node.js 18 or newer.

- `npm run start` — open `http://127.0.0.1:4173`.
- `npm run check` — run the static project audit.
- The game remains a static site and can be deployed directly to GitHub Pages. No build step or framework is required.

## Save data

Browser local storage is divided into four independent records:
- `formula_ascent_save_v2` — run timer, Score, A–E module levels and the synchronous recursive formula state/timing accumulator.
- `prestigeSave` — AP, GP and Ascension upgrades.
- `faMeta` — language, settings, Research Division, automation and statistics.
- `faTree` — purchased Upgrade Tree nodes.

Legacy run keys are migrated to the current run key on load. All storage access is centralized in `assets/js/storage.js`. If browser storage is unavailable, the simulation can continue in memory and save failures are reported instead of crashing the game.
