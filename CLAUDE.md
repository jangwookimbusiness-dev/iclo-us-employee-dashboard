# Repository context

Read `AGENTS.md`, `employer-dashboard-poc/docs/PRD.md`, and
`contracts/proposal-package-v11.yml` before planning or changing behavior.

The shipped screens are built from `screens/employer.html.in` and
`screens/member.html.in` into `build/` by `scripts/build_screens.py`. The old root
`index.html` and `app.html` were retired 2026-08-27 (#49); do not recreate them.
The supported workflow is `make setup` → feature branch → `make check` → pull
request → independent model review → human merge. Do not use the superseded npm,
Vite, React, or Tailwind plan in `employer-dashboard-poc/BUILD.md`.

GitHub Issues and Milestones are the shared backlog. Local gstack plans are
inputs and may be stale; reconcile them against the repository and linked issue
before acting.
