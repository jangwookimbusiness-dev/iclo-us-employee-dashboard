# employer-dashboard-poc — Agent Context

Aggregate oral-health dashboard for **US self-funded employers**. Synthetic scenarios A/B/C only.

**The booth is gone — both halves of it.** Live capture dropped 2026-08-12 (no visitor capture, no badge scan, no store; `capture.html` deleted). The booth demo itself dropped 2026-08-13: this screen does not appear at Snowflake World Tour Seoul. There is **no freeze date, no rehearsal, no offline requirement and no iPad acceptance path** on this code. If you find one in an older doc, that doc is stale — PRD §1.3 is canon.

What it is for now: the screenshot source for the proposal, and the artifact the US evidence layer repoints onto Snowflake. Screen rules are **regulatory requirements, not taste** — do not modify them on your own judgment.

**Spec canon: `docs/PRD.md`, whose values come from `contracts/proposal-package-v11.yml` at the repo root. Read both before planning any change. Spec changes only via PR (living document).**

**The shipped code is `index.html` and `app.html` at the REPO ROOT, not in this folder.** `index.html` is the employer dashboard, `app.html` the employee app (added 2026-08-14). Start agents and run commands from the repository root so the root `AGENTS.md` governs the shipped files.

## Commands
- `make setup` — pinned Python environment
- `make check` — the same ten gates as CI
- `make check-fast` — non-browser pre-commit subset
- `make serve` — local HTTP server
- `make docs` — managed screenshots and PDFs
- `make install-hooks` — local pre-commit guard

There is no npm/Vite/React build. The v0.4 plan is archived in `BUILD.md` and must not be revived by accident.

## Red lines — violation = auto-reject (PRD §5.6)
- Forbidden terms in `src`/`dist`/`docs`: `diagnos*, cavit*, caries, decay, gingivit*, periodont*, abscess, lesion`. Signal label "Review" is banned — use **"Priority"**.
- No individual-level screens or mock person profiles **in employer views**.
  `app.html` is the member's own surface and may show only that member's own
  band, direction, coverage, consent state, and synthetic demo profiles.
- "Synthetic data — illustrative only" label on **every** view.
- Cells with `n < 20` never show values — render "Suppressed (n<20)".
- No AI-slop visuals (indigo/violet gradients, glassmorphism). Brand: Coral `#C2333A` (was `#FF7A79` — 2.53:1 on white, WCAG AA fail) · Navy `#1B2A4A` · Teal `#007A87` · white background.

## Automation — what runs itself now
`.github/workflows/gates.yml` runs all ten gates on every push to `main` and on PRs, on a Linux runner,
with `concurrency` + `cancel-in-progress` so a superseded run never keeps burning minutes. Before this
existed the gates were hand-run, and two of them had quietly stopped working without anyone noticing.

- `make install-hooks` — once per clone. Pre-commit runs the three fast checks so an obvious
  break does not spend CI minutes. `--no-verify` still works; it is a guard, not a gate.
- `make shots` — regenerates every proposal screenshot deterministically into
  `output/shots/`. Re-running produces byte-identical files. Every dashboard state is a URL
  (`?tab=`, `?scen=`, `?dept=`, `?lens=`), including the suppressed view.

## Running it locally
`make serve` then open `http://localhost:8000/`. Opening the file directly still works today but
will not once the screen fetches data — `fetch()` from a `file://` page is blocked. gstack `browse` also
refuses `file://` URLs outside `/private/tmp`. Append `?v=$(date +%s)` when iterating; the browser caches
hard between reloads and will show stale CSS after an edit.

## Escaping data that comes from outside this file
`esc()` in `index.html` is HTML-context only — text and quoted attributes. It does **not** make the inline
`style="...background:${...}"` interpolations safe, because those are CSS, not HTML. Colours and bands are
enums: check them against an allowlist instead of escaping. Every string is a literal today, so this is a
rule for when the screen starts reading a data file, not a live hole.

## Conduct
- Ambiguity → open a `type:decision` issue. **Guessing is prohibited.**
- YAGNI: no unrequested features; any new dependency needs a stated reason in the PR (ponytail ruleset applies).
- Cross-review: the authoring agent never approves its own work. Human (Jangwoo Kim) merges — agents never self-merge.

## Before proposing anything, check the repo (PRD §3.1)
Three greps, in this order. Each one has already caught a live defect.
1. **Does it exist?** `rg` the shipped code for the behaviour you are proposing.
   Suppression-reason display was proposed twice; `index.html:262` already had it.
2. **Does it have something to attach to?** A constraint on a feature that does not
   exist is vacuous. There is no export in `index.html`.
3. **Does a shipped document already take the opposite position?** `rg` `output/` and
   `contracts/`. A clean-room proposal was written while
   `ICLO-Snowflake-Briefing-Meeting-Pack-v1.md:167` rules it out for a single
   employer/TPA pilot.

## Handing work to the other model
`codex exec` blocks forever on stdin when stdin is not a TTY and not redirected. It
prints `Reading additional input from stdin...` and sits at 0% CPU — it does not fail,
so a wrapper timeout is what eventually notices. Always redirect:

```bash
codex exec --sandbox workspace-write --skip-git-repo-check "$PROMPT" < /dev/null
```

Two things make the review worth having:
- **Tell it what not to read.** Name the other model's draft explicitly. An
  uncontaminated reviewer finds different defects; a contaminated one agrees.
- **Tell it to verify, not read.** Give it the artifact *and* the paths to check
  against, and ask it to open them. Reviewers that only read the artifact agree with it.
- Escalation: `status:blocked` label + mention the decision-maker.
- Always work from the repository root. The root agent files govern the shipped application.
