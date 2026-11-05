# Project architecture

## Runtime loading order

1. `assets/js/storage.js` installs `window.FAStorage` before any subsystem reads or writes persistent data.
2. `assets/js/prestige.js` restores AP/GP state and exposes prestige actions.
3. `assets/js/tree.js` constructs the 3,886-node graph and restores purchased nodes.
4. `assets/js/app-ui.js` restores settings/research, localization and menu panels.
5. `assets/js/script.js` restores the active run and starts the 10 ms simulation loop.

The order is intentional because later systems use globals exposed by earlier scripts. Do not convert these files to ES modules without changing the dependency model.

## Responsibilities

- HTML owns stable page structure, IDs and navigation.
- CSS owns presentation and responsive breakpoints.
- Storage owns guarded browser persistence access and error handling.
- Prestige owns AP/GP calculations and reset boundaries.
- Tree owns node generation, progression and canvas rendering.
- UI owns settings, localization, research cards and menu navigation.
- Simulation owns Score production, formula modules, automation and run saves.

## Persistent data

| Key | Owner | Data |
|---|---|---|
| `formula_ascent_save_v2` | Simulation | Timer, Score, A–E levels, recursive formula state, one-second accumulator and last-save timestamp |
| `prestigeSave` | Prestige | AP, GP and Ascension upgrade levels |
| `faMeta` | UI | Locale, settings, Research Division, automation and statistics |
| `faTree` | Tree | Purchased node IDs and levels |

All reads and writes must go through `FAStorage`. Keep legacy run keys in the migration list while old saves remain supported. Ascension resets only the run; Genesis resets run/AP/research/automation; full reset clears all save domains.

## Development checks

- Run `npm run check` before committing.
- Run `npm run start` for local browser testing.
- The audit checks JavaScript syntax, HTML IDs/nesting, script/style paths, event handlers, localization keys and storage access. It is static and does not replace browser testing.
- Keep GitHub Pages pointed at the repository root. `index.html` remains in the root and references files under `assets/`.

## Recursive formula engine

- The base multipliers A–E are active from the beginning and feed production as `t² × A × B × C × D × E`.
- Production is `t² × Σ(wᵢ × Π(letter multipliers))`. The time term stays outside the sum; every registered letter multiplier is inside it. The base term has weight 1, and each Global Sum purchase adds a weighted term. Ascension Legacy (Simple Boost) increases each added term by 25% per level, so the sum multiplier is `1 + GlobalSum × (1 + 0.25 × SimpleBoost)`. New letter modules must register their getter through `window.registerFormulaLetter` to join the shared product automatically.
- The production/render loop remains scheduled every 10 ms. It measures actual elapsed time and integrates Score with the trapezoidal average of the production rate at the start and end of each tick; delayed frames do not silently discard elapsed time.
- The HUD displays two decimal places for time, current Score and growth rate while values are below the compact-number threshold.
- `formulaState` stores the five multipliers. `advanceFormulaClock` advances the engine at one synchronous step per real second, independently of the 10 ms production/render loop.
- Each step reads a frozen previous state and calculates all five next values before replacing the state. C is recursive; A and C form a feedback loop.
- `FAMathSystem` exposes generic effective-level, parameter-curve, parameter-limit and letter-price helpers so future letters can use the same Research 1–5 rules.
- Letter parameter progress is `L_eff / (300 + L_eff)`. Research 1 increases `L_eff` globally; Research 4 expands each parameter in its mathematically appropriate direction; Research 5 strengthens dependency inputs.
- Letter purchase prices retain their original first-purchase base costs. The progression is `basePrice × (baseFactor ^ exponent) ^ level`, initially `baseFactor=2`, `exponent=3`, so each next level costs 8× the previous one.
- Research 2 reduces the exponent by 0.1% of its base value per level, capped at 99% (990 levels). Research 3 reduces the base factor by 0.01% of its original value per level, with a floor of 1.00. The original first-purchase prices are retained.
- The recursive state and fractional one-second accumulator are saved with the run. Ascension and Genesis Prestige reset both alongside the run timer.

## Mathematical rendering

- KaTeX 0.16.22 is vendored under `assets/vendor/katex/`; its CSS and fonts stay together so all assets resolve locally.
- `assets/js/formula-renderer.js` is loaded after KaTeX and before the simulation. It owns rendering only; game logic supplies LaTeX strings.
- The renderer caches each element's last expression, avoiding repeated typesetting during the 10 ms game loop.
- Keep the existing UI colors, panels, spacing and responsive design. KaTeX should inherit text color and only provide mathematical glyphs/layout.
- Other windows retain their original typography. Inside `#formulaModulePanel`, upgrade titles, descriptions and A–E KaTeX formulas use `16pt`; the main `#formulaText` formula uses `25pt`. There is no runtime font-size test panel.
