# ICLO Employer Dashboard — repository agent guide

This file governs the entire repository. The shipped screens are built from
`screens/*.html.in` into `build/` by `scripts/build_screens.py`; the old root
`index.html` and `app.html` were retired 2026-08-27 (#49).

## Read this first

`REBUILD-CHARTER.md` governs the rebuild that started 2026-08-26. It carries the
retrospective (six root causes, five of them across 28 recorded learnings and
one added the day the rebuild started), six behavioural
rules, a complete reclassification of the required CI commands and canon-consistency
subchecks, and an asset-versus-liability
judgement on everything the old build produced. It is a second edition: the first
went through an independent codex review that returned twelve P1 findings, and §6
tabulates where the first draft was wrong.

Three things in it bind any agent working here.

**A check is not committed until you have watched it fail.** Nine of the 28
learnings are this one mistake. That includes prose: a docstring, commit message,
CI step name or PR body claiming behaviour must be checked against the code in the
same edit. A CI step in this repository described a coupling that had been removed
the day before, in a step whose purpose is catching exactly that.

**Before asserting a value, count where it is written.** The canon defined one
metric twice with different denominators; a withdrawal edited the prose and left
the code; a consistency check scanned one of the two documents it was meant to
reconcile. A check that reads one document cannot see two documents disagree.

**Deleting a file is not done until the documents naming it are fixed.** Count the
deleted name with `grep -rn` and, where a document names it as enforcement, write
where that rule is actually enforced now. The PRD's red-line table named two
deleted checks as the enforcement for minimum-cell suppression and single-source
propagation, so a regulatory reader would have concluded those rules were protected
by files that no longer existed. The protection had moved; the document had not.
This is not covered by counting where a value is written — the stale thing was a
filename, and the moment to count was the deletion, not an assertion.
`check_no_dangling_enforcers` now enforces the backticked cases; prose is still on
you.

**Before starting work, look at open pull requests and the issue that owns it.**
Run `gh pr list` and read the issue's scope line. This repository is worked by
more than one agent at a time, in separate worktrees, and two of them collided
twice on 2026-08-26. The first collision built an implementation while #36 was
explicitly scoped "Decision only" and #37 sat waiting for a merge decision. The
second opened a PR duplicating fixes that #40 landed mid-flight, which arrived as
a conflict and cost half the work. Both were cheap to avoid and neither was
noticed until after pushing.

Two habits follow. When an issue says the scope is a decision, record the decision
and stop -- the implementation is a separate issue with a separate review. And when
a decision record and an implementation disagree, the record is the specification:
move the code, not the record. That is how #39 was resolved.

The framework decision in §4.2 is settled: add no frontend framework. The
rebuild must use one Python 3.14/PyYAML builder to stage vanilla HTML, CSS, and
JavaScript plus an allowlisted `canon.json`. The JSON owns static screen
contract fields and, while `PROJECT_PHASE=demo`, the current synthetic values
and freshness. At A3/A2 those runtime fields move to the tenant exports, whose
`synthetic` envelope field governs the disclosure. The builder must accept
alternate canon and output paths so the perturb-then-render check can invoke
the same build boundary in a temporary directory.

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
- `make check` — run the same eleven CI commands as CI (the charter counts
  verification units differently and says so; see REBUILD-CHARTER.md §4.3)
- `make check-fast` — run the non-browser pre-commit subset
- `make serve` — serve the demo at `http://localhost:8000`
- `make docs` — rebuild the managed PDFs (the screenshot stage went with the
  screens it shot, #49; the twelve proposal PNGs are frozen assets now)
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
