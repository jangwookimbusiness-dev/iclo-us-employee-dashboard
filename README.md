# ICLO Employer Dashboard (click demo)

Aggregate, privacy-safe oral-health dashboard for US self-funded employers.

> **Synthetic data — illustrative only.** Every number here is a fixed synthetic sample, not ICLO performance evidence.

**Not live.** The booth demo was scrapped on 2026-08-13. The Pages root —
https://jangwookimbusiness-dev.github.io/iclo-us-employee-dashboard/ — now
redirects to https://grin-mauve.vercel.app/, because the printed booth QR code
encodes that root and the copy Snowflake holds cannot be recalled. Pages
publishes only the allowlist in `scripts/build_pages_site.py`; run the dashboard
locally with `bash scripts/serve.sh`.

[![gates](https://github.com/jangwookimbusiness-dev/iclo-us-employee-dashboard/actions/workflows/gates.yml/badge.svg)](https://github.com/jangwookimbusiness-dev/iclo-us-employee-dashboard/actions/workflows/gates.yml)

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

`index.html` is self-contained — one file, no build step. It opens from `file://` today because every number
is a constant inside it. That is a property of the current build, not a requirement, and it ends as soon as
the screen fetches its data — a page with an opaque origin cannot fetch. Use `make serve` and
open `http://localhost:8000/`.

Spec canon: `employer-dashboard-poc/docs/PRD.md`.

## Development

```bash
git clone https://github.com/jangwookimbusiness-dev/iclo-us-employee-dashboard.git
cd iclo-us-employee-dashboard
make setup
make check
make serve
```

Python 3.14.7 and Chrome/Chromium are required. `make check` runs the same ten
gates as CI; `make docs` rebuilds managed screenshots and PDFs. Full setup:
[`employer-dashboard-poc/SETUP.md`](employer-dashboard-poc/SETUP.md).

There is deliberately no npm application or framework build. Historical one-off
document generators under `scripts/build/` are not part of the supported workflow.

## Work and decisions

- Live backlog: [GitHub Issues](https://github.com/jangwookimbusiness-dev/iclo-us-employee-dashboard/issues)
- Backlog policy: [`BACKLOG.md`](BACKLOG.md)
- Developer data-architecture pre-read:
  [`employer-dashboard-poc/docs/INTERNAL-DATA-ARCHITECTURE-BRIEF.md`](employer-dashboard-poc/docs/INTERNAL-DATA-ARCHITECTURE-BRIEF.md)
- Contribution workflow: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Generated and large-file policy: [`ARTIFACTS.md`](ARTIFACTS.md)
- Durable product and regulatory decisions: `contracts/proposal-package-v11.yml`

`main` accepts work through pull requests. GitHub Pages deploys only after the
required gates pass. The Pages artifact is staged by
`scripts/build_pages_site.py`; only `index.html`, `app.html`, and
`data/member-demo.json` are public site files.
