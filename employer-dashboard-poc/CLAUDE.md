# employer-dashboard-poc — Claude Code Context

Read `docs/PRD.md` first (spec canon). Commands, red lines, and conduct rules: see `AGENTS.md`. They bind Claude Code too.

## Role in this project
Claude Code = design interrogation, planning, review, QA, ship gate. **Codex = primary implementer.** Cross-review is mandatory: never approve your own PR; use `/codex` for a cross-model second opinion on nontrivial diffs.

## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy,
/canary, /benchmark, /browse, /open-gstack-browser, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release,
/document-generate, /codex, /cso, /autoplan, /pair-agent, /careful, /freeze, /guard,
/unfreeze, /gstack-upgrade, /learn.

## Sprint for this project
Deliverables and dates are PRD §3.2 and the Handoff Brief. Read them there, not here. The review loop around them:

1. `/office-hours` on `docs/PRD.md` before any code. Premises broken there flow back into the PRD via PR.
2. `/plan-ceo-review` → `/plan-eng-review` → `/plan-design-review` (end-user UI, so the design review applies).
3. Codex implements against the workstreams in PRD §3.3. WS0 (consent text) gates everything downstream of it.
4. `/review` + `/qa` on every Codex PR. Before `/ship`: `bash scripts/check-forbidden-terms.sh`, `scripts/check-package-consistency.py` and the kill-ai-slop Mode B scan must all pass.
5. `/ship` → Pages deploy from the repo root + the offline bundle.

Hard dates: **freeze 2026-08-25** · rehearsal 8/26 · Snowflake World Tour Seoul, COEX, **2026-08-27**.
The 9/5 freeze and the US-stay plan were v0.4 and are superseded. See the PRD status block.
