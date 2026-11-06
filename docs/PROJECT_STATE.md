# NEON FORMULA — Project State

> Internal development handoff / continuity notes. This file is not loaded by the game and does not affect gameplay.
> Update this document after each meaningful development milestone. Before coding in a new chat, read this file and verify the current branch HEAD.

## Repository and workflow

- Repository: `H1kire/NEON-FORMULA`
- Active development branch: `тест`
- Stable branch: `main` — do not modify or merge into it unless the user explicitly asks.
- Current known HEAD when this file was created: `520671456257b464c42b7b56418f715b6adf6e98`
- The user performs manual browser testing. Do not claim browser testing unless it was actually performed.
- Work incrementally: one file = one responsibility; one version = one mechanic; fix errors before adding features; commit at meaningful milestones.
- Before editing: fetch the exact current file contents and blob SHA from the active branch. Never overwrite based on stale content.
- After editing: run available syntax/static checks and report changed files, commit SHA, checks, and what the user should test.
- Do not modify save keys or save behavior without an explicit request.

## Current project stage

The current focus is the first permanent upgrade-tree node, NODE #0001, which unlocks an integral multiplier in production. The implementation is committed on `тест`.

### Latest implementation

Files changed in the NODE #0001 implementation:
- `assets/js/tree.js`
- `assets/js/script.js`
- `scripts/audit.js`

Latest known branch HEAD:
`520671456257b464c42b7b56418f715b6adf6e98`

The implementation commit was followed by a small audit-script correction. GitHub Actions audit run `42218975784` passed for the implementation commit before that final audit-script-only correction. JavaScript files were syntax-checked with `new Function(content)`. No browser visual test was performed by the assistant.

## NODE #0001 — agreed mathematical behavior

The user selected integral variant C:

\[
\int_0^e \sqrt{1+x}\,dx
= \frac{2}{3}\left((1+e)^{3/2}-1\right)
\]

Here lowercase \(e\) is the current value of multiplier E and is the integral's upper limit. The ordinary multiplier E remains included in the product of A–E.

Before NODE #0001 is purchased, production remains unchanged.

After NODE #0001 is purchased, before Global Sum:

\[
f(t)=t^2\cdot
\int_0^e \sqrt{1+x}\cdot
\prod_{\ell\in\mathcal L}\ell\,dx
\]

After Global Sum is purchased:

\[
f(t)=t^2\cdot
\int_0^e \sqrt{1+x}\cdot
\left(\sum_{i=0}^{n}w_i\right)\cdot
\prod_{\ell\in\mathcal L}\ell\,dx
\]

- \(\prod_{\ell\in\mathcal L}\ell\) is the product of all active letter multipliers A–E.
- \(w_0=1\), and for \(i>0\), \(w_i=1+0.25L\), where \(L\) is Ascension Legacy level.
- If Global Sum has not been purchased, the sum must not be displayed in the formula.
- The integral is unlocked permanently after the first purchase of NODE #0001 and survives ordinary prestige resets.
- In `tree.js`, `window.isIntegralNodePurchased=()=>nodes[0].level>0;` is used as the unlock flag (root node id 0 is displayed as NODE #0001).
- In `script.js`, `getIntegralMultiplier()` computes the analytic expression using safe math helpers; `getGain()` applies it only after the node is purchased; `updateFormulaText()` renders the integral and conditionally includes Global Sum.
- The integral is evaluated analytically, not by numerical integration every game tick.

## Existing architecture

Project structure:

```
FORMULA-ASCENT/
├── index.html
├── package.json
├── README.md
├── assets/
│   ├── css/style.css
│   ├── css/formula-math.css
│   ├── js/storage.js
│   ├── js/prestige.js
│   ├── js/tree.js
│   ├── js/app-ui.js
│   ├── js/formula-renderer.js
│   └── js/script.js
├── assets/vendor/katex/
├── docs/ARCHITECTURE.md
├── docs/LEGACY_FORMULAS.md
└── scripts/audit.js, server.js
```

- `npm run start` starts local server at `http://127.0.0.1:4173`.
- `npm run check` runs static audit.
- GitHub Actions audit workflow: `.github/workflows/audit.yml`.
- KaTeX 0.16.22 is vendored locally (JS/CSS/fonts/contrib); no CDN/API dependency.

### Save keys — do not rename

- `formula_ascent_save_v2`
- `prestigeSave`
- `faMeta`
- `faTree`
- Legacy: `formula_ascent_save_v1`, `neon_formula_idle_v4_5`

## Upgrade Tree

- `assets/js/tree.js` creates 3886 nodes and renders them on Canvas; pan/zoom and `faTree` persistence are implemented.
- Root node id 0 is a square, costs 1 GP, and is displayed as NODE #0001.
- Other nodes are not yet purchasable; do not invent purchase mechanics.
- Node types: square = content unlock (max 1); circle = standard (2–100); triangle = major (max 10); pentagon = hyper (max 5).
- Preserve node IDs, types, links, purchase logic, and `faTree` save behavior unless explicitly asked.
- Layout is intentionally irregular/randomized: first node at (0,0); each next node chooses a previous point, random angle, and distance. No radial spokes, rows, sine waves, or ID sorting.
- Minimum center distance is 40 units.
- Visibility expands within radius 80 around the center and each purchased node. Once revealed, areas remain visible. A node only needs to be purchased once to reveal its area.
- Hidden nodes and their links are not visible or selectable.
- Camera: `MIN_SCALE=.0001`, `MAX_SCALE=2.5`; wheel down ×0.72, wheel up ×1.12; minus button ×0.65, plus ×1.18; center root resets to 0.28.
- User previously confirmed zoom works.

## Base A–E formulas

\[
a=\left(1+\frac{t}{60}\right)^{\frac{1+\ln(c)}{1.81}}
\]
\[
b=1+\frac{a^{0.652}-1}{1.055}
\]
\[
c_{n+1}=1+\frac{\ln(1+abc_n)}{1.66}
\]
\[
d=1+\frac{\sqrt{abc}}{11.7}
\]
\[
e=1+\frac{\ln(1+bd)}{2.057}
\]

- All letters initialize at 1.
- Synchronous recurrence: once per real second, every letter updates from the previous state.
- Do not update letters sequentially in-place; preserve synchronous behavior.

## Parameter upgrades

Shared soft cap:
\[
L_{\rm eff}=L(1+0.04R_1),\quad
P(L)=\frac{L_{\rm eff}}{300+L_{\rm eff}}
\]

Base parameter targets:
- A: 1.81 → 1.20
- B: 0.652 → 0.90
- C: 1.66 → 1.10
- D: 11.7 → 7.0
- E: 2.057 → 1.30

A/C/D/E upgrades lower divisors; B upgrade increases exponent. Research 1 adds +4% letter-upgrade effectiveness per level; Research 4 expands parameter limits, allowing divisors below 1 and exponents above 1; Research 5 strengthens cross-letter dependencies by +2% per level. Generic helpers exist for future letters: `getExpandedParameterLimit`, `getLetterParameter`, `getDependencyStrength`.

## Research Division

1. Mathematical Efficiency: +4% letter upgrade effectiveness/level, unlimited.
2. Discount Engineering: reduces letter price exponent by 0.1%/level, max 99%, 990 levels.
3. Price Stabilization: reduces price base by 0.01%/level, floor 1.00, max 5000 levels.
4. Deep Mathematical Optimization: expands letter parameter limits, unlimited.
5. Dependency Resonance: +2% cross-letter dependencies/level, unlimited.
6. Logarithmic Resonance: +8% E logarithmic input/level.
7. Temporal Core: +4% time-based production/level.
8. Automation License: +10% auto-purchase efficiency/level.
9. Quantum Multiplier: +15% total production/level.
10. Ascension Engine: +10% AP gain/level.
11. Genesis Gate: 1000 AP unlocks Upgrade Tree and Genesis Prestige.

Research costs use base array `[1,1,2,3,4,6,8,12,16,25]` and curve `costs[index]*1.8^level`, rounded up. Caps: `[0,990,0,0,0,20,20,10,20,20]`; 0 means unlimited. Research 3 effect plateaus at 5000 levels.

## Global Sum and Ascension Legacy

\[
f(t)=t^2\cdot\left(\sum_{i=0}^{n}w_i\right)\cdot
\left(\prod_{\ell\in\mathcal L}\ell\right)
\]

where \(n\) is the number of Global Sum purchases, \(w_0=1\), and \(w_{i>0}=1+0.25L\), with \(L\) = Ascension Legacy levels. The coefficient is \(1+n(1+0.25L)\).

Implementation helper:

```js
function getGlobalSumMultiplier(){
 const n=Math.max(0,Number(prestigeUpgrades.globalSum)||0);
 const legacy=Math.max(0,Number(prestigeUpgrades.simpleBoost)||0);
 return 1+n*(1+0.25*legacy);
}
```

- Global Sum costs: 1, 1k, 1m, 1b, 1t AP; max 5 purchases. Stored `globalSum` is n: 0 before purchase, then 2, 3, 4, 5, 6.
- `globalSumVersion: 2` migrates old saves by adding 1 to any existing positive purchase count, preserving the number of previous purchases.
- `getGlobalSumCost()` maps n=0 to 1 AP, n=2 to 1k, n=3 to 1m, n=4 to 1b, n=5 to 1t; n=6 is maxed.
- Simple Boost was renamed Ascension Legacy / «Наследие Вознесения».
- Ascension Legacy cost: \(125^{(L+1)}\) AP.

## Latest completed user test

The user manually confirmed on 2026-11-06 that Genesis Prestige activates after accumulating AP, and the integral formula displays correctly. The earlier pending concern about the Genesis Prestige button is resolved; the suspected ~1079 AP threshold was not confirmed and should not be treated as a bug.

## Global Sum first-purchase adjustment and Additional Upgrades visibility

Implemented on branch `тест`:
- First Global Sum purchase now sets `n=2`, adding two unit-weight terms beyond `w₀`; each later purchase increments n by 1, up to n=6 after five purchases.
- AP costs remain 1, 1K, 1M, 1B, 1T for purchases 1–5.
- Existing `prestigeSave` data is migrated once using `globalSumVersion: 2`; any previous positive purchase count is incremented by one to preserve purchase history under the new n representation.
- “Permanent ascension upgrades” is now “Additional Upgrades” (localized English/Russian) and is visible before the first prestige. Purchase costs and AP requirements remain unchanged.
- The plain-text formula fallback no longer appends the w definitions as prose.

Files changed:
- `assets/js/script.js`
- `assets/js/prestige.js`
- `assets/js/app-ui.js`
- `index.html`
- `scripts/audit.js`

Manual browser testing is pending. Verify an old save with one Global Sum purchase migrates to n=2, a first purchase from a fresh save produces n=2, and Additional Upgrades are visible before prestige.

## Live formula values panel — implementation in progress

Requested UI change: keep the main formula in its existing position in the ACTIVE FORMULA / ТЕКУЩАЯ ФОРМУЛА panel, and add a right-side live list with `a = ...` through `e = ...`. Values refresh through the existing `updateUI()` loop alongside total value and growth rate. When Global Sum is purchased, display `w₀` and `wᵢ>₀` beneath the A–E list, using `w₀=1` and `wᵢ>₀=1+0.25L`; remove those definitions from the main formula rendering.

Implementation files for this UI change:
- `index.html`
- `assets/css/style.css`
- `assets/js/script.js`

The assistant must not claim visual browser testing; the user will manually test the layout and live values.

### Aggregate Global Sum contribution display — 2026-11-06

The live value shown beside `wᵢ>₀` represents the **combined contribution of every additional weight** in the Global Sum, not the value of one individual weight.

- `w₀` remains displayed separately as `1`.
- The aggregate additional contribution is `n × (1 + 0.25L)`, where `n` is the stored Global Sum term count (2–6 after purchases) and `L` is Ascension Legacy level.
- The UI label is `Σ wᵢ>₀` to make clear that the displayed number is a sum of all additional weights.
- `getGlobalSumAdditionalWeight()` is the shared calculation; `getGlobalSumMultiplier()` returns `1 + getGlobalSumAdditionalWeight()`, keeping the displayed contribution identical to the production formula.
- Example: first Global Sum purchase (`n=2`) at `L=0` displays `Σ wᵢ>₀ = 2`, and the complete sum is `w₀ + Σwᵢ>₀ = 1 + 2 = 3`. At `L=1`, it displays `2.5`, and the complete sum is `3.5`.
- This is a display clarification and shared calculation refactor; it does not change production balance, purchases, or save data.
- Updated `scripts/audit.js` to verify aggregate contribution values at `n=2`, `L=0` and `L=1`.
- Browser visual testing remains the user's responsibility.

Implementation files: `assets/js/script.js`, `index.html`, `scripts/audit.js`.

## Working instructions for the next chat

1. Read this file first.
2. Fetch the latest `тест` branch HEAD and compare it with the commit recorded above.
3. Inspect the relevant source files before diagnosing or editing.
4. First ask for / use the user's latest manual test result if it has not been provided.
5. Keep changes on `тест`; leave `main` untouched.
6. Update this handoff file after each meaningful implementation or diagnosis milestone, including commit SHA, files changed, checks performed, and pending user tests.
