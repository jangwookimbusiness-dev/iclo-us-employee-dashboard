# ICLO — Employer Dashboard (click demo)

Aggregate, privacy-safe oral-health dashboard for self-funded employers.

> **Synthetic data — illustrative only.** Every number here is a fixed synthetic sample, not ICLO performance evidence.

**Live:** https://jangwookimbusiness-dev.github.io/iclo-us-employee-dashboard/

## What it shows
Five views from a self-funded employer's perspective:
`Overview` · `Signals` · `Funnel` · `Trend vs control` · `Data & Snowflake`
with three size scenarios (2,500 / 10,000 / 25,000), a department filter, dual-denominator lens, and source-provenance chips.

## Screen rules (regulatory, not stylistic)
- Aggregate only — no individual PHI, no individual scores
- Cell size `n ≥ 20` suppression (fires live via the department filter)
- Non-disease signal labels only (`Low` / `Moderate` / `Priority`)
- "Synthetic data — illustrative only" on every view

`index.html` is a self-contained click demo — no build step, runs offline.
