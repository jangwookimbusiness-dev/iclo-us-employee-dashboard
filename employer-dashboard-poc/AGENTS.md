# employer-dashboard-poc — Agent Context

Aggregate oral-health dashboard for **US self-funded employers**. Synthetic scenarios A/B/C only. Next live use: **Snowflake World Tour Seoul, COEX, 2026-08-27**, where it runs as a click demo. Freeze 8/25. **Booth live capture was dropped 2026-08-12** — no visitor capture, no badge scan, no store, and `capture.html` is deleted (PRD §1.3). Screen rules are **regulatory requirements, not taste** — do not modify them on your own judgment.

**Spec canon: `docs/PRD.md`, whose values come from `contracts/proposal-package-v11.yml` at the repo root. Read both before planning any change. Spec changes only via PR (living document).**

**The shipped code is `index.html` at the REPO ROOT, not in this folder.** This folder holds only spec and scripts — there is no `package.json`, `src/` or `dist/`. The npm commands below do not run.

## Commands
Only the red-line check runs. The npm commands are the v0.4 Vite plan, which PRD §3.4 records as not adopted; they are kept here only so a build that revives them inherits the same names.
- `npm ci` — install
- `npm run generate` — regenerate synthetic data (fixed seed; two runs must diff to zero)
- `npm run dev` — local dev server
- `npm run build` — static build to `dist/`
- `npm test` — unit tests
- `bash scripts/check-forbidden-terms.sh` — red-line grep, must exit 0

## Red lines — violation = auto-reject (PRD §5.6)
- Forbidden terms in `src`/`dist`/`docs`: `diagnos*, cavit*, caries, decay, gingivit*, periodont*, abscess, lesion`. Signal label "Review" is banned — use **"Priority"**.
- No individual-level screens; no mock person profiles.
- "Synthetic data — illustrative only" label on **every** view.
- Cells with `n < 20` never show values — render "Suppressed (n<20)".
- No AI-slop visuals (indigo/violet gradients, glassmorphism). Brand: Coral `#C2333A` (was `#FF7A79` — 2.53:1 on white, WCAG AA fail) · Navy `#1B2A4A` · Teal `#007A87` · white background.

## Conduct
- Ambiguity → open a `question`-labeled issue. **Guessing is prohibited.**
- YAGNI: no unrequested features; any new dependency needs a stated reason in the PR (ponytail ruleset applies).
- Cross-review: the authoring agent never approves its own PR. Human (Jangwoo Kim) merges — agents never self-merge.
- Escalation: `blocked` label + mention the decision-maker.
- Always work from this folder (`employer-dashboard-poc/`), not the repo root — nested AGENTS.md/CLAUDE.md apply here.
