# NEON FORMULA — Project State

> Internal development handoff / continuity notes. This file is not loaded by the game and does not affect gameplay.
> Update this document after each meaningful development milestone. Before coding in a new chat, read this file and verify the current branch HEAD.

## Repository and workflow

- Repository: `H1kire/NEON-FORMULA`
- Active development branch: `тест`
- Stable branch: `main` — do not modify or merge into it unless the user explicitly asks.
- Code HEAD before the Letter F content-node implementation: `9be21c6ac1d3d5047f966d38cc24c68537a51cac`
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


### Letter multiplier purchase unlock — 2026-11-06

- A–E are still calculated by the recursive formula engine and their live values remain visible.
- An individual letter contributes to the production multiplier only after its corresponding upgrade has been purchased at least once (level > 0).
- First purchase permanently activates that letter for the current run/save; further purchases continue improving its parameter as before.
- Unpurchased letters are omitted from the A–E product and therefore cannot increase production.
- If no letters have been purchased, the letter-product factor is 1.
- The existing A–E levels are already persisted in the current save format, so no save-key or migration changes are needed.
- Runtime audit coverage verifies zero active letters, one active letter, a partial set, and all five active letters.
- Browser testing remains the user's responsibility.


### Upgrade tree neon connection threads — 2026-11-06

- The existing multi-link graph topology and node coordinates remain unchanged.
- Purchased NODE #0001 geometrically reveals its 80-unit area. Only nodes in that area that are graph-connected to NODE #0001 are actually displayed; candidate points without a path through visible links are hidden.
- Each additional purchased node is also a root for its own connected visible component, preserving future expansion behavior.
- Links are drawn only when both endpoints survive graph-connected visibility, including links whose endpoints are still locked for purchase.
- All visible links use a soft neon green by default.
- Selecting any visible node changes every direct visible link connected to that node to blue; selecting a different node moves the blue highlight to its own direct connections. With no selection, all visible links are green.
- Green and blue links retain a restrained glow. No purchase progression, node IDs, graph topology, coordinates, or save behavior is changed.
- Audit coverage verifies that disconnected candidate nodes remain hidden, purchased roots can reveal their own connected components, and selected-node edge highlighting still works.
- Browser visual testing remains the user's responsibility.

Implementation follow-up:
- Commit 4bfa99b32c0875aae70d941a83eae5da0f2af5f5: graph-connected node visibility in assets/js/tree.js.
- Commit 9e1dfb51285277989c83f54d2bf9c63497388f6e: runtime/static audit coverage in scripts/audit.js.


### NODE #0004 — Letter F content unlock — 2026-11-06

- NODE #0004 (id 3) is explicitly assigned the square type, so it is a one-time content node with max level 1. Its original random roll is still consumed before the type override, preserving the deterministic RNG sequence and leaving all other node types, effects, and graph links unchanged.
- Its fixed purchase price is 5 GP. NODE #0001 retains its 1 GP price.
- NODE #0004 is now purchasable; the existing purchase flow deducts 5 GP, saves the tree node, and refreshes the UI.
- Purchasing NODE #0004 unlocks the Letter F module. The unlock is derived from the persisted `faTree` node level, so no new save key or migration is introduced.
- The Formula Upgrades grid contains a hidden Letter F placeholder card. It appears only after NODE #0004 is purchased. The live formula-values panel also reveals an F row with a placeholder dash.
- No F mathematical formula, recurrence, production contribution, upgrade price, or automation is implemented yet. Those will be designed separately with the user.
- All square nodes are identified in the inspector as **CONTENT NODE** and use a dedicated content-node title rather than the ordinary node-type naming.
- NODE #0001 keeps its Genesis Core title; NODE #0004 has the dedicated Letter F Gate title.
- Updated `scripts/audit.js` for NODE #0004 type/cost/purchase availability and Letter F UI unlock behavior.
- Browser visual testing remains the user's responsibility.

Files changed:
- `assets/js/tree.js`
- `index.html`
- `assets/js/script.js`
- `assets/js/app-ui.js`
- `scripts/audit.js`

## AP and GP acquisition formulas — 2026-11-06

This section records the implemented prestige currency formulas from \`assets/js/prestige.js\`. These are the live code rules, not a proposed balance change.

### AP — Ascension Points

Regular Prestige converts the current run's accumulated \`value\` into AP:

\`\`\`js
earned = countThresholds(value, 1e15, 1.05);
AP_gain = Math.floor(earned * getMetaBonus("prestige"));
\`\`\`

The threshold counter is:

\`\`\`js
countThresholds(amount, scale, base, divisor = 1)
\`\`\`

For the AP call, \`scale = 10^15\`, \`base = 1.05\`, and \`divisor = 1\`. Before the meta prestige bonus, the threshold for at least \(k\) AP is:

\[
V_k = 10^{15}\cdot 1.05^{k+1}
\]

- First AP: \(10^{15}\cdot1.05^2 = 1.1025\cdot10^{15}\) run value.
- Each additional AP requires the next threshold, growing by 5%.
- The prestige meta bonus multiplies the counted AP; the result is floored to a whole number.
- Regular Prestige resets the current run (\`t\`, \`value\`, and A–E upgrade levels/formula state) and adds the earned AP to the persistent AP balance \`p\`.

### GP — Genesis Points

Genesis Prestige converts the current AP balance \`p\` into GP, provided the Genesis Tree Pass has been purchased (\`FA_META.treePassPurchased\`):

\`\`\`js
GP_gain = countThresholds(p, 1000, 1.1, 2.5);
\`\`\`

For this call, \`scale = 1000\`, \`base = 1.1\`, and \`divisor = 2.5\`. The threshold for at least \(k\) GP is:

\[
AP_k = 1000\cdot1.1^{(k+1)/2.5}
\]

Approximate thresholds:
- 1 GP: 1,079.23 AP
- 2 GP: 1,123.12 AP
- 3 GP: 1,168.80 AP
- 4 GP: 1,216.35 AP
- **5 GP: 1,257.02 AP** (the mathematical threshold is compared directly as a floating-point number; because AP is normally held as a whole number, the practical minimum balance is **1,258 AP**).

Genesis Prestige adds the calculated whole GP to the persistent GP balance, then resets AP to 0 and resets the ordinary run and the AP-layer progression/upgrades as implemented in \`doGenesisPrestige()\`. GP is retained and is the currency used by the Upgrade Tree. The Genesis Tree Pass requirement is checked separately from the AP threshold.

### Important distinction: Genesis Gate cost vs GP threshold

- Genesis Gate costs **1,000 AP** to unlock the Genesis Tree Pass / Genesis Prestige access.
- That 1,000 AP purchase is not itself a conversion into GP and does not count as the GP threshold.
- After unlocking access, accumulate AP through regular Prestige cycles. Genesis Prestige awards GP according to the formula above.
- For the current **NODE #0004** price of 5 GP, the Genesis Prestige AP balance must reach the 5-GP threshold (approximately 1,257.02 AP), not merely 1,000 AP.

Implementation source: \`assets/js/prestige.js\` — \`countThresholds()\`, \`getPrestigeGain()\`, \`getGenesisGain()\`, \`doPrestige()\`, and \`doGenesisPrestige()\`.
\n\n## Google Authentication — implementation milestone\n\n- Hosting remains on GitHub Pages; Firebase Hosting is not configured or required.\n- Firebase Web SDK is loaded from the official gstatic CDN (compat SDK 10.14.1) and a separate `assets/js/firebase-auth.js` module handles Google sign-in, auth-state restoration, and sign-out.\n- Firebase project configuration uses project ID `formula-ascent`, auth domain `formula-ascent.firebaseapp.com`, and the supplied Realtime Database URL. Analytics is not initialized.\n- The account panel shows the signed-in Google display name, a profile-image avatar when available, and the signed-in state. Login uses a Google popup; auth persistence is explicitly set to browser local persistence.\n- This stage does not read or write Realtime Database data and does not connect cloud saves. Existing local save keys and game save/load logic remain unchanged.\n- Authorized domain `h1kire.github.io` and the Google provider must be enabled in Firebase Authentication.\n- Browser testing remains pending: verify popup sign-in on GitHub Pages, refresh persistence, sign-out, and localized account UI in English/Russian.\n

### Google Authentication implementation — 2026-11-06

- Implemented on the development branch; GitHub Pages remains the hosting platform. Firebase Hosting was not initialized.
- Firebase JS SDK compat 10.14.1 is loaded from the official gstatic CDN. `assets/js/firebase-auth.js` is a separate module responsible only for Google Authentication.
- Firebase Web App config uses `projectId: formula-ascent`, `authDomain: formula-ascent.firebaseapp.com`, and the supplied Realtime Database URL. Analytics is not initialized.
- The Account panel now has Google sign-in and sign-out controls, localized EN/RU labels, signed-in state, display name, and Google profile avatar when available.
- Login uses `signInWithPopup`; auth persistence is explicitly set to local browser persistence, and `onAuthStateChanged` restores the current session after reload.
- No Realtime Database reads/writes or cloud saves are implemented. Existing local save keys and game save/load logic remain untouched.
- The user has already enabled Google Authentication and added `h1kire.github.io` as an authorized domain. If popup login reports `auth/unauthorized-domain`, verify that the domain remains in the same Firebase project's Authentication authorized domains.
- Files changed: `assets/js/firebase-auth.js`, `index.html`, `assets/js/app-ui.js`, `assets/css/style.css`, `scripts/audit.js`.
- Implementation/audit commits: `260a582` (auth module), `f59bbf7` (account UI + SDK), `a1381c2` (localization), `ee65979` (styles), `214c3f2` and `11df70e`/`53062cb` (audit updates), `60e26bb` (localized account state). Latest code/audit commit: `53062cbeadc181b81eaf65ba45d2afd787d04d66`.
- GitHub Actions workflow run was not exposed for this push; no passing audit run is claimed. Browser testing remains pending.
- User should manually test: Google popup sign-in on `https://h1kire.github.io`, persistence after refresh, sign-out, popup-blocked/error messaging, and EN/RU account UI. Existing local progress should remain present and unchanged.

## Complete cloud save and restore — 2026-11-06

- GitHub Pages remains the hosting platform; Firebase Hosting is not used.
- Added `assets/js/firebase-cloud-save.js`, which stores one complete cloud snapshot at `/users/{uid}/cloudSave` in Firebase Realtime Database. Each Google UID has its own isolated slot.
- A cloud snapshot contains the exact localStorage payloads for all four active game persistence sections: `formula_ascent_save_v2` (run and formula state), `prestigeSave` (AP/GP and prestige upgrades), `faMeta` (research, automation, settings, statistics and progression flags), and `faTree` (all purchased tree nodes).
- Before uploading, the module flushes all in-memory state through `saveGame(true)`, `saveMeta()`, `savePrestige()`, and the new `saveTreeProgress()` hook. It validates all four sections before writing.
- Restore requires confirmation, verifies the snapshot version and UID, validates all four sections before touching local storage, then replaces the four active save keys and removes obsolete legacy run-save keys. If a local write fails, it attempts to roll back the previous local values. After a successful restore the page reloads.
- The restored run's `lastTime` is reset to the restore moment so the offline-progress system does not award extra production accrued after the cloud snapshot. All saved game values and progression are otherwise restored from the snapshot.
- The account panel now has separate Save to Cloud and Restore Cloud Save buttons, plus a localized cloud status message and last-saved timestamp. Restore remains disabled until a cloud snapshot is found.
- Firebase Realtime Database compat SDK 10.14.1 is loaded alongside the existing Firebase App/Auth SDK.
- Important rules correction: the previous rules had root-level `.read: false` and `.write: false`, which cascade and prevent child-level owner grants from working. `database.rules.json` now omits root grants and allows reads/writes only under `/users/{uid}` when `auth.uid === uid`. The user must republish this updated JSON in Firebase Realtime Database Rules before cloud save/restore can work.
- No existing local save keys or normal save/load flow were renamed. Cloud save/restore is a separate layer.
- Browser testing remains pending. Verify save, sign-out/sign-in, restore on another browser/device with the same Google account, and rejection of access from a different account.

Files changed:
- `assets/js/firebase-cloud-save.js` (new)
- `assets/js/firebase-auth.js`
- `assets/js/app-ui.js`
- `index.html`
- `assets/css/style.css`
- `assets/js/tree.js`
- `database.rules.json`

Implementation commit before this documentation update: `767c80e4c119ca7eda528e0a4f9e9ef11d912f63`.


## Cloud save audit and hardening — 2026-11-06

- Full source audit found that the first cloud-save implementation was not included in the static audit's required-file list or JavaScript syntax checks, and the expected script order did not include Firebase Realtime Database SDK or the cloud-save module. The audit has been extended to cover both.
- Added guarded raw-string read/write methods to `FAStorage`; cloud save/restore no longer accesses `localStorage` directly.
- Cloud snapshot validation now checks required run fields and formula values, AP/GP and upgrade levels, meta sections, and unique valid upgrade-tree node IDs/levels before enabling restore or changing local data.
- Cloud-save status checks now ignore stale asynchronous responses after an account switch, validate the snapshot before enabling Restore, and save/restore requests use the UID captured at operation start.
- Restore now checks each guarded local write/removal and attempts rollback if any operation fails.
- Audit additionally parses Firebase rules and verifies owner-only read/write permissions, cloud SDK/module loading, cloud-save entry points and guarded storage usage.
- JavaScript syntax was checked in the development tool runtime. GitHub Actions/npm audit result is pending after this commit; browser testing remains the user's responsibility.
- Files changed: `assets/js/storage.js`, `assets/js/firebase-cloud-save.js`, `scripts/audit.js`.


### Audit completion — 2026-11-06

- GitHub Actions `npm run check` passed on commit `f951c26e2fed37be5fc3e01ec10f646a5d08f49d` (audit job `42291106397`).
- The first audit attempt correctly exposed a stale assertion in the newly expanded audit; the assertion was corrected and the following CI run passed.
- Final cloud save implementation uses guarded `FAStorage.getRaw/setRaw`, validates the four snapshot sections before restore, checks account identity across asynchronous operations, and rolls back local writes when a restore write fails.
- The audit now includes the cloud module in required files and syntax checks, checks Firebase Database SDK load order, validates owner-only database rules, and checks cloud save/restore integration.
- Manual browser verification is still required for a real Firebase account and cross-device restore. The CI audit does not connect to Firebase or emulate the browser UI.
