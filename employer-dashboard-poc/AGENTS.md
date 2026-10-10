# employer-dashboard-poc — Agent Context

Aggregate oral-health dashboard for **US self-funded employers**. Synthetic scenarios A/B/C only.

**The booth is gone — both halves of it.** Live capture dropped 2026-08-12 (no visitor capture, no badge scan, no store; `capture.html` deleted). The booth demo itself dropped 2026-08-13: this screen does not appear at Snowflake World Tour Seoul. There is **no freeze date, no rehearsal, no offline requirement and no iPad acceptance path** on this code. If you find one in an older doc, that doc is stale — PRD §1.3 is canon.

Current purpose: a local synthetic demo and the starting screen for A3 tenant exports. Proposal PNGs are frozen historical assets. Current execution paths are in `docs/ARCHITECTURE.md`. Screen rules are **regulatory requirements, not taste** — do not modify them on your own judgment.

**Spec canon: `docs/PRD.md`, whose values come from `contracts/proposal-package-v11.yml` at the repo root. Read both before planning any change. Spec changes only via PR (living document).**

**The shipped screens are `screens/*.html.in`, built into `build/` by `scripts/build_screens.py`.** Start agents and commands at the repository root; its `AGENTS.md` and `REBUILD-CHARTER.md` govern this rebuild.

## Commands
- `make setup` — pinned Python environment
- `make check` — the same eleven CI commands as CI
- `make check-fast` — non-browser pre-commit subset
- `make serve` — local HTTP server
- `make docs` — managed PDFs; proposal PNGs are frozen
- `make install-hooks` — local pre-commit guard

There is no npm/Vite/React build. The v0.4 plan is archived in `BUILD.md` and must not be revived by accident.

## Red lines — violation = auto-reject (PRD §5.4)
- Forbidden terms in `src`/`dist`/`docs`: `diagnos*, cavit*, caries, decay, gingivit*, periodont*, abscess, lesion`. Signal label "Review" is banned — use **"Priority"**.
- No individual-level screens or mock person profiles **in employer views**.
  `screens/member.html.in` is the member's own surface and may show only that member's own
  band, direction, coverage, consent state, and synthetic demo profiles.
- "Synthetic data — illustrative only" label on **every** view.
- Cells with `n < 20` never show values — render "Suppressed (n<20)".
- No AI-slop visuals (indigo/violet gradients, glassmorphism). Brand: Coral `#C2333A` (was `#FF7A79` — 2.53:1 on white, WCAG AA fail) · Navy `#1B2A4A` · Teal `#007A87` · white background.

## Automation — what runs itself now
`.github/workflows/gates.yml` runs all eleven CI commands on every push to `main` and on PRs, on a Linux runner,
with `concurrency` + `cancel-in-progress` so a superseded run never keeps burning minutes. Before this
existed the gates were hand-run, and two of them had quietly stopped working without anyone noticing.

- `make install-hooks` — once per clone. Pre-commit runs the three fast checks so an obvious
  break does not spend CI minutes. `--no-verify` still works; it is a guard, not a gate.

## Running it locally
`make serve` builds the screens and serves `http://localhost:8000/employer.html` and `/member.html`.
JSON is fetched over HTTP; `file://` is unsupported. Public Pages contains only a redirect.

## External data
HTML text and quoted attributes must be escaped. Colours and enum values use allowlists;
HTML escaping does not validate CSS. `scripts/build_screens.py` owns the build-time boundary.
A3 tenant exports must add runtime validation before rendering external values.

## Conduct
- Ambiguity → open a `type:decision` issue. **Guessing is prohibited.**
- YAGNI: no unrequested features; any new dependency needs a stated reason in the PR (ponytail ruleset applies).
- Cross-review: the authoring agent never approves its own work. Human (Jang Woo Kim) merges — agents never self-merge.

## Before proposing anything, check the repo (PRD §3.1)
Three greps, in this order. Each one has already caught a live defect.
1. **Does it exist?** `rg` the shipped code for the behaviour you are proposing.
   Suppression-reason display was proposed twice although the now-retired root screen already had it.
   Current behavior is in `screens/employer.html.in`, built by `scripts/build_screens.py`.
2. **Does it have something to attach to?** A constraint on a feature that does not
   exist is vacuous. A3 export delivery is not wired into the current employer template;
   verify the actual builder/JSON boundary and `docs/ARCHITECTURE.md` before proposing that wiring.
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

## 김장우 영문 이름 표기 (필수)

- [사실] 사용자 지정: **김장우의 영문 이름은 반드시 `Jang Woo Kim`으로 표기한다.** 철자·대소문자·띄어쓰기·이름 순서를 바꾸거나 하이픈을 넣지 않는다.
