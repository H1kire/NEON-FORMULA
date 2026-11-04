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
| `formula_ascent_save_v2` | Simulation | Timer, Score, A–E levels and last-save timestamp |
| `prestigeSave` | Prestige | AP, GP and Ascension upgrade levels |
| `faMeta` | UI | Locale, settings, Research Division, automation and statistics |
| `faTree` | Tree | Purchased node IDs and levels |

All reads and writes must go through `FAStorage`. Keep legacy run keys in the migration list while old saves remain supported. Ascension resets only the run; Genesis resets run/AP/research/automation; full reset clears all save domains.

## Development checks

- Run `npm run check` before committing.
- Run `npm run start` for local browser testing.
- The audit checks JavaScript syntax, HTML IDs/nesting, script/style paths, event handlers, localization keys and storage access. It is static and does not replace browser testing.
- Keep GitHub Pages pointed at the repository root. `index.html` remains in the root and references files under `assets/`.

## Mathematical rendering

- KaTeX 0.16.22 is vendored under `assets/vendor/katex/`; its CSS and fonts stay together so all assets resolve locally.
- `assets/js/formula-renderer.js` is loaded after KaTeX and before the simulation. It owns rendering only; game logic supplies LaTeX strings.
- The renderer caches each element's last expression, avoiding repeated typesetting during the 10 ms game loop.
- Keep the existing UI colors, panels, spacing and responsive design. KaTeX should inherit text color and only provide mathematical glyphs/layout.
- Ordinary upgrade-card text and all rendered formulas use a fixed `14pt` font size (Word size 14); there is no runtime font-size test panel.
