# ICLO Employer Dashboard — repository agent guide

This file governs the entire repository, including the shipped `index.html` and
`app.html` files at the root.

## Canon and scope

- Product and regulatory canon: `employer-dashboard-poc/docs/PRD.md`
- Canonical values and decision register: `contracts/proposal-package-v11.yml`
- Current phase: `PROJECT_PHASE` (`demo`, `a3`, or `a2`)
- Shared backlog: GitHub Issues and Milestones. Files under `~/.gstack/` are
  planning inputs, never the team backlog.

Read the PRD and contract before changing application behavior. Regulatory
screen rules are requirements, not visual preferences.

## Supported commands

- `make setup` — create `.venv` from the pinned Python version and dependencies
- `make check` — run the same ten gates as CI
- `make check-fast` — run the non-browser pre-commit subset
- `make serve` — serve the demo at `http://localhost:8000`
- `make docs` — rebuild managed screenshots and PDFs
- `make shots` — regenerate deterministic screenshots
- `make install-hooks` — install the local pre-commit guard

There is no npm application and no supported `npm ci`, `npm build`, or Vite
workflow. Historical generators under `scripts/build/` are provenance records,
not the current build system.

## Delivery workflow

1. Start from a GitHub Issue with outcome, acceptance criteria, owner, priority,
   dependencies, and evidence required to close it.
2. Work on a feature branch. Never commit directly to `main`.
3. Run `make check` and record the result in the PR.
4. A model other than the author checks the change against the repository.
5. Jangwoo Kim makes the merge decision. GitHub deploys Pages only after gates pass.

Ambiguity becomes a `type:decision` issue. Blocked work uses `status:blocked` and
names the person or external event that can unblock it.

## Red lines

- Employer views are aggregate only; never expose individual PHI.
- Cells below 20 are suppressed and retain an explicit suppression explanation.
- Employer and member surfaces show bands, not numeric oral-health scores, until
  the documented regulatory gate changes.
- Disease-specific wording and the signal label `Review` are forbidden.
- Every surface backed by synthetic data says `Synthetic data — illustrative only`.
  The export `synthetic` envelope field governs this through A3; phase alone does not.
- Text from external data passes HTML-context escaping. CSS colours and enum
  values use allowlists; HTML escaping is not a CSS safety boundary.

Additional domain history lives in `employer-dashboard-poc/AGENTS.md`; this root
file wins when instructions conflict.
