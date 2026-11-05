# Legacy A–E formula set (reserve)

This file preserves the previous A–E system for reference. These formulas are **not loaded by the game** and do not affect the active recursive formula engine.

Main production multiplier:

\[
f(t)=t^2\cdot a\cdot b\cdot c\cdot d\cdot e
\]

- **A — Radical scaling**
  \[
  a=\left(1+\frac{t}{86400}\right)^{1/r},\qquad
  r=\max\left(2.63-0.01\min(A_{level},63),2\right)
  \]

- **B — Lambert W**
  \[
  b=1+\frac{W(a)}{q_B},\qquad
  q_B=\frac{20}{\text{B level scale}\cdot\text{Research B bonus}}
  \]

- **C — Logarithmic composition**
  \[
  c=1+\frac{\ln(1+ab)}{q_C},\qquad
  q_C=\frac{40}{\text{C level scale}\cdot\text{Research C bonus}}
  \]

- **D — Error function**
  \[
  d=1+\frac{\operatorname{erf}\left(\sqrt{\ln(1+abc\cdot s_D)}\right)}{20}
  \]
  D approaches but never exceeds **1.05**. Upgrades increase the input scale \(s_D\), not the cap.

- **E — Arctangent**
  \[
  e=1+\frac{\arctan(abcd\cdot s_E)}{100}
  \]
  E approaches but never exceeds \(1+\pi/200\approx1.01571\). Upgrades increase the input scale \(s_E\), not the cap.

B and C have no fixed upper cap; D and E retain their fixed caps. All five legacy multipliers are at least 1.
