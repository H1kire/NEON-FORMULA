# FORMULA ASCENT

**FORMULA ASCENT** is a browser-based mathematical idle game. Build up your Score, improve five connected formula modules, perform Ascensions, unlock permanent upgrades and expand your Upgrade Tree.

The game is available in English and Russian.

## How to play

1. Start a run and let your formula generate Score over time.
2. Spend Score on upgrades for the five formula modules: A, B, C, D and E.
3. Unlock Research Division upgrades to improve your progression and automation.
4. Earn Ascension Points (AP) and perform an **Ascension** to reset the current run while keeping long-term progress.
5. Save up 1,000 AP to unlock the **Genesis Gate**. This opens the Upgrade Tree and Genesis Prestige.
6. Earn Genesis Points (GP) to purchase permanent nodes in the Upgrade Tree.

## The formula

The game has five connected formula modules. Their multipliers are calculated together, with each update using the previous complete state of the system:

- **A — Power Foundation:** grows with time and receives feedback from C.
- **B — Root Amplifier:** is influenced by A.
- **C — Logarithmic Recursion:** uses A, B and its previous value.
- **D — Nonlinear Coupling:** combines A, B and C.
- **E — Logarithmic Resonance:** combines B and D.

The current module equations are:

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

Here, **t** is the run time. The five module multipliers contribute to production together.

### Additional formula upgrades

- **NODE #0001** unlocks an integral multiplier based on the current value of E. Once purchased, this effect is permanent.
- **Global Sum** adds weighted terms to production. Its contribution grows with purchases and with **Ascension Legacy**.
- **Ascension Legacy** is a permanent upgrade purchased with AP. It strengthens the additional Global Sum terms.

After NODE #0001 is unlocked, production includes:

\[
\int_0^e\sqrt{1+x}\,dx
=\frac{2}{3}\left((1+e)^{3/2}-1\right)
\]

The integral uses the current value of E as its upper limit.

## Progression systems

### Score and formula upgrades

Score is generated continuously while a run is active. Each module has its own upgrades and purchase costs. The formula modules influence one another, so improving one can affect the others.

### Research Division

Research upgrades are purchased with AP. They improve formula progression, upgrade prices, dependencies, time-based production, automation and prestige gains. Some research unlocks additional features.

### Ascension

Ascension resets the current run and its Score, while keeping AP and long-term progression upgrades. AP is used for Research Division and other Ascension upgrades.

### Genesis Prestige

The Genesis Gate costs **1,000 AP** and permanently unlocks the Upgrade Tree and Genesis Prestige.

Genesis Prestige resets the current run and AP-based progression, but preserves GP, the Genesis Gate and purchased Upgrade Tree nodes.

### Upgrade Tree

The Upgrade Tree contains **3,886 nodes** connected in a large network. Nodes have different shapes that indicate their upgrade category. In the current release, **NODE #0001** is available for purchase and costs 1 GP; other nodes are reserved for future content.

Purchased nodes remain unlocked through prestige resets.

## Automation

Automation can purchase upgrades for individual formula modules. Each module's automation can be enabled or disabled separately, and automation can also be paused globally. Automation features are unlocked through Research Division progression.

## Settings and statistics

The settings menu includes:

- English and Russian languages;
- number notation;
- autosave;
- offline progress;
- compact number display;
- reduced motion.

The game also includes a statistics page.

## Account and cloud saves

Players can sign in with a Google account. Cloud save lets a player store their game progress in that account and restore it later, including on another supported browser or device.

A cloud save belongs to the signed-in account. Restoring a cloud save replaces the corresponding local game progress, so make sure you select the intended account and save.

## Playing the game

FORMULA ASCENT runs in a web browser. The game is hosted as a static website and does not require a separate game installation.
