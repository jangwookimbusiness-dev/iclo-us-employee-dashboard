# employer-dashboard-poc — Claude Code Context

Read `docs/PRD.md` first (spec canon). Commands, red lines, and conduct rules: see `AGENTS.md`. They bind Claude Code too.

## Role in this project
Claude Code = design interrogation, planning, review, QA, ship gate. **Implementation is either agent — whoever authors, the other checks** (PRD §3.1, changed 2026-08-12; the earlier "Codex is primary implementer" was never what happened and optimised the wrong risk).

The rule that matters is not about code:

> Nothing an agent authors ships until a different model has **checked it against the repository** — not read it, checked it.

Give the reviewer the artifact *and* the paths, and tell it to open them. A reviewer that only reads the artifact agrees with it. Never approve your own PR. `codex exec` needs `< /dev/null` or it hangs forever — see AGENTS.md.

Parallel authoring applies to **plans, specs and proposals** (two drafts from one brief, then merge), not to code (single author + cross-model review).

## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy,
/canary, /benchmark, /browse, /open-gstack-browser, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release,
/document-generate, /codex, /cso, /autoplan, /pair-agent, /careful, /freeze, /guard,
/unfreeze, /gstack-upgrade, /learn.

## Sprint for this project
GitHub Issues and Milestones are the live backlog. PRD §3.2 and the Handoff Brief provide scope and acceptance context, not a second task queue. The review loop:

1. `/office-hours` on `docs/PRD.md` before any code. Premises broken there flow back into the PRD via PR.
2. `/plan-ceo-review` → `/plan-eng-review` → `/plan-design-review` (end-user UI, so the design review applies).
3. Either agent implements against PRD §3.3. Booth capture is cancelled. `screens/member.html.in` builds the separate member consent/profile demo; it is not a booth or employer individual-result surface.
4. `/review` + `/qa` on every PR, by the model that did not write it. Before `/ship`, `make check` and the kill-ai-slop Mode B scan must pass.
5. `/ship` prepares the PR; Jang Woo Kim decides the merge. Pages publishes only the approved root redirect after gates pass, not the local screens.

**No event deadline.** The old freeze/rehearsal dates belonged to the cancelled booth demo. PRD §1.3 records the exclusion; current owners and dates belong in GitHub Issues, not a local CEO plan.
