# FORMULA ASCENT — Game overview

FORMULA ASCENT is a browser-based mathematical idle game. Players build Score through eight connected formula modules, improve the modules with upgrades, unlock F–H through the Upgrade Tree, and progress through two prestige systems.

## Available gameplay

- Eight connected formula modules: A, B, C, D, E, F, G and H.
- Letter F unlocks through NODE #0004 for 5 GP and costs 1 Qa Score.
- Letter G unlocks through NODE #1987 for 25 GP and starts at 1 Qi Score. Each level raises its maximum A–E bonus by 5 percentage points; its time saturation uses K = 5.
- Letter H unlocks through NODE #1988 for 50 GP and starts at 1 Sx Score. It uses W₀(t/10) raised to max(1, log_B(ABCD)), where B = max(100, 250 − 0.005 × H level).
- Future letter pricing rule: each new letter's initial Score cost is 1,000× the previous letter's initial Score cost. Research 2 and 3 affect these prices through the shared letter price function; letter-specific efficiency Research does not alter a new letter's own effect unless explicitly designed.
- Score production and individual module upgrades.
- Research Division upgrades purchased with Ascension Points.
- Ascension, which resets the current run while preserving long-term AP progression.
- Genesis Gate, unlocked for 1,000 AP.
- Genesis Prestige and Genesis Points.
- Upgrade Tree with 2,072 active connected nodes.
- NODE #0001, which unlocks a permanent integral multiplier.
- Global Sum and Ascension Legacy upgrades.
- Module automation for all eight letters A–H. Automation unlock prices are 10, 100, 1,000, 10,000, 100,000, 1,000,000, 10,000,000 and 100,000,000 AP respectively; each new letter costs 10× the previous card.
- NODE #2050 costs 1,000 GP and unlocks Time Dilation, a separate time-flow mode and the Dilation Upg research page. The shared KaTeX renderer formats AP, GP and Time Dilation currencies consistently, including upgrade costs, prestige balances, Research and Upgrade Tree costs. The main Score total, growth rate and letter-upgrade prices display numeric values without a Score suffix. Currency formatting is presentation-only and does not change stored values or game calculations. The Time Dilation interface uses a white-hole visual theme; its integral, temporal balances, thresholds, explanatory variables and Dilation Upg balance labels are typeset through the shared KaTeX renderer. A third live status card displays the current i, v and k parameters beside accumulated time and temporal currency. Its parameter values update only when the formatted value changes, and its DOM IDs are separate from the Dilation Upg cards to prevent rendering collisions. The live parameter symbols are slightly larger than their reduced numeric values. The i upgrade adds 1 per purchase, v adds 0.5 and k adds 0.1. Their independent costs follow C(L)=C₀×rᴸ: i uses C₀=100,000 and r=2.5; v uses C₀=250,000 and r=3; k uses C₀=1,000,000 and r=3.5. Existing saves retain their previously reached k value through a backward-compatible saved parameter value, and cloud validation accepts that value. Its labels, balances and controls use enlarged typography while the integral keeps its original size; the interface is independent of the Miniaturization QOL setting and does not display the internal node number. Upgrade/research cards and purchase buttons use steady hover/affordability highlights without animation, blinking or movement. The Research page is titled Research & Development (English) / Исследовательский центр (Russian). While active, ordinary run time t is frozen and t_dl accumulates at one unit per real second. At 60 t_dl or more, the player can manually start a five-second real-time integration. The operation consumes the accumulated t_dl and awards ∆t_dl using the definite integral of f(x)=i(vx+1)^k from 0 to the accumulated t_dl. Initial i, k and v are 1. The Research window contains a separate Dilation Upg page with three currently implemented infinite parameter upgrades (i, k, v), each initially costing 1,000 ∆t_dl and doubling in price per purchased level; other upgrade slots/effects are intentionally not implemented yet.
- English and Russian languages.
- Google account sign-in and cloud save/restore.

## Current Upgrade Tree content

The tree contains four node categories, represented by different shapes. NODE #0001 is available for 1 GP, and NODE #0004 is available for 5 GP to unlock Letter F. The horizontal ray assigns NODE #1987 to G, #1988 to H, #1989 to I and #1990 to J. G and H are purchasable sequential gates; I and J remain future gates. Square nodes are concentrated along the horizontal path extending from the F gate; eight additional square innovation slots branch vertically from NODE #1987 (G), four above and four below. Every square node has a two-grid-step exclusion area for other node types, except for required connecting-path nodes. NODE #0001 and its immediate two-step neighborhood are exempt. Square nodes on the F ray and the vertical G innovation branch connect only to nodes inside that same branch; NODE #0001 is the sole external connection exception, preserving the route from the center through the F gate while blocking links to nearby unrelated nodes. The uppermost G-branch square NODE #1926 is the first QOL node: Miniaturization, costing 10 GP after the G gate is purchased. It unlocks an optional compact layout for upgrade cards (including A–H), Research cards and Module Automation cards, disabled by default and controlled from the QOL menu. Outside this setting, the original vertical letter-card layout and original card layouts remain active, with each letter formula centered horizontally in its card. In compact mode, letter formulas are centered within a taller formula area (56 px desktop, 50 px on narrow screens), displayed at twice their previous size (20 px desktop, 16 px on narrow screens), and scroll horizontally when they do not fit; the area has no vertical scrolling. The remaining six G-branch squares are reserved for future non-letter gameplay innovations and currently have no effects. NODE #2050 is the Time Dilation innovation node, positioned on the G innovation branch. The Automation tab contains separate A–H cards. Their unlock prices start at 10 AP for A and increase 10× per next letter, reaching 100,000,000 AP for H. Each unlocked card can be toggled independently; the global pause stops every automated purchase. The F–H automation routines wait for the corresponding letter gate to be unlocked and respect each module’s level cap. Older five-card local and cloud saves are migrated to the eight-card format without losing existing A–E automation settings. The developer-only GP refund clears all purchased tree nodes, disables their effects and returns the full amount spent.

## Progress and accounts

Players can use a Google account to save progress to the cloud and restore it later in another supported browser or device. Cloud saves are associated with the signed-in account.

## More information

See the main [README](../README.md) for the current formula, progression systems, automation, settings and account information.


Gameplay pages have distinct visual themes: the formula workspace uses a cool scientific teal treatment, Automation uses a blue control-room treatment, Research uses a warm laboratory treatment, Dilation Upg retains its cool temporal-research treatment, and the Upgrade Tree uses a violet network treatment. The Menu page is intentionally unchanged; the dedicated white-hole Time Dilation module retains its own existing styling.
