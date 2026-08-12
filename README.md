# ICLO Employer Dashboard (click demo)

Aggregate, privacy-safe oral-health dashboard for US self-funded employers.

> **Synthetic data — illustrative only.** Every number here is a fixed synthetic sample, not ICLO performance evidence.

**Live:** https://jangwookimbusiness-dev.github.io/iclo-us-employee-dashboard/

## What it shows

Three views from a self-funded employer's perspective: `Overview`, `Signals`, `Funnel`. Each carries a department filter, a dual-denominator lens, and tap-to-open source-provenance chips.

Three synthetic employers at 2,500, 10,000 and 25,000 eligible employees. Every number is computed in the browser from one constants block.

`?scen=` and `?tab=` open the screen straight onto a view, so a rehearsal is reproducible.

## Screen rules (regulatory, not stylistic)

- Aggregate only. No individual PHI, no individual scores
- Cell size `n ≥ 20` suppression, which fires live via the department filter
- Non-disease signal labels only (`Low` / `Moderate` / `Priority`)
- "Synthetic data — illustrative only" on every view
- Every figure derives from one constants block, and `test_single_source.py` fails if one stops propagating

`index.html` is self-contained. No build step, and it runs offline from `file://`.

Spec canon: `employer-dashboard-poc/docs/PRD.md`.
