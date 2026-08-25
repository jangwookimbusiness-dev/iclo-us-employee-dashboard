# Contributing

## Setup

```bash
git clone https://github.com/jangwookimbusiness-dev/iclo-us-employee-dashboard.git
cd iclo-us-employee-dashboard
make setup
make check
```

Python 3.14.7 and Google Chrome or Chromium are required. See
`employer-dashboard-poc/SETUP.md` for platform-specific installation details.
Large and generated files follow `ARTIFACTS.md`; do not commit a handoff archive
or any individual file above 15 MiB.

## Work selection

GitHub Issues are the only shared work queue. A ready issue states:

- outcome and user impact;
- acceptance criteria and evidence required to close;
- priority, area, milestone, and owner;
- dependencies, decision gates, and explicit blockers.

The YAML contract records durable product and regulatory decisions. It does not
replace the issue queue. A local agent plan does not authorize work until it is
reconciled with an issue.

## Branch and pull request workflow

1. Create a branch such as `feat/<issue>-short-name` or `fix/<issue>-short-name`.
2. Keep the change within the linked issue's acceptance criteria.
3. Run `make check`.
4. Open a PR using the repository template and link `Closes #<issue>`.
5. Record the independent model review in the PR.
6. Jangwoo Kim merges after required checks pass. Never push directly to `main`.

## Generated artifacts

Current managed documents must be registered in `scripts/doc-manifest.json` and
rebuilt with `make docs`. Historical generators live under `scripts/build/` and
must not be used as the base for new deliverables. Large binary-history migration
requires a separately approved maintenance window because it rewrites Git history.

Changes to `index.html`, `app.html`, `data/member-demo.json`, or `scripts/shots.py`
also invalidate the managed screenshots and proposal PDF. Run `make docs` before
`make check`. If the local `make-pdf` binary is unavailable, hand the branch to a
document owner for that rebuild rather than bypassing the freshness gate.
