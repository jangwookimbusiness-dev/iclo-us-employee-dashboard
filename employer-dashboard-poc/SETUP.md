# Setup — employer-dashboard-poc (Claude Code + Codex · gstack + ponytail)

One-time environment setup, ~15 minutes. Step 1 is per-repo; steps 2–4 are per-machine.

## 0. Prerequisites
- macOS with git and push access to the `iclo` repo
- **Node.js ≥ 18 on PATH** (`node -v`) — ponytail's lifecycle hooks require it
- **Bun ≥ 1.0** (`bun -v`; install: `curl -fsSL https://bun.sh/install | bash`) — gstack requires it
- Claude Code and Codex CLI installed and signed in
- (optional) `gh` CLI

## 1. Place this folder in the iclo repo
```bash
git clone https://github.com/[FILL: owner]/iclo && cd iclo
# copy the employer-dashboard-poc/ folder from this kit into the repo root, then:
mkdir -p .github/workflows
# GitHub only runs workflows from the repo-root .github/ — move the CI file there:
mv <kit>/_repo-root/.github/workflows/employer-dashboard-poc-ci.yml .github/workflows/
git checkout -b bootstrap/employer-dashboard-poc
git add employer-dashboard-poc .github/workflows/employer-dashboard-poc-ci.yml
git commit -m "chore: bootstrap employer-dashboard-poc (PRD, agent context, red-line CI)"
git push -u origin bootstrap/employer-dashboard-poc   # open the PR, merge it
```

## 2. Install gstack
Open Claude Code and paste this (Claude runs the install itself):

> Install gstack: run `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup`

The project `CLAUDE.md` in this folder already contains the required gstack section, so skip any "add to CLAUDE.md" step.

Optional: give Codex the same gstack skills (recommended for the cross-check setup):
```bash
cd ~/.claude/skills/gstack && ./setup --host codex   # installs to ~/.codex/skills/gstack-*/
```
Verify: open a new Claude Code session inside `employer-dashboard-poc/` → typing `/office-hours` autocompletes.

## 3. Install ponytail (BOTH agents)
Claude Code:
```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```
Codex: install the ponytail plugin the same way from its plugin flow, then **restart the Codex app**. (Rule-file alternative: copy ponytail's Codex `AGENTS.md` rules from its repo, though the plugin route is preferred.)

> **Activation trap:** copying SKILL.md into a skills folder yields ~zero self-activation. The plugin's SessionStart hook is what injects the ruleset — plugin install is required, and `node` must be on PATH.

Verify: start a fresh session in each agent. `/ponytail` commands are listed, and the ruleset loads at session start.

## 4. Protect main
GitHub → `iclo` repo → Settings → Branches → add rule for `main`: require a pull request before merging (1 approval). Agents never self-merge; Jangwoo Kim is the only merger.

## 5. First session
```bash
cd iclo/employer-dashboard-poc
claude
```
Then, in order:
1. `/office-hours` — "Read docs/PRD.md and pressure-test this PoC." Broken premises → PRD update PR.
2. `/plan-ceo-review` → `/plan-eng-review` → `/plan-design-review`.
3. Hand the locked plan to Codex against the workstreams in PRD §3.3. WS0 (the Korean consent text) gates every capture-side deliverable.
4. Every Codex PR: `/review` + `/qa`. Before `/ship`: `bash scripts/check-forbidden-terms.sh` + kill-ai-slop Mode B scan.

## Environment exit checklist
Setup is done when all four hold. Delivery dates and acceptance are PRD §3.2 and §4a, not this file.
- [ ] `/office-hours` design doc accepted
- [ ] Red-line CI job green on a PR
- [ ] ponytail active on **both** agents, verified in fresh sessions
- [ ] `bash scripts/check-forbidden-terms.sh` exits 0 from a clean clone
