# employer-dashboard-poc: 임직원 구강 집계 대시보드

> **Canonical values live in `contracts/proposal-package-v11.yml`.** Screen names, KPI labels, constants,
> colors, terminology and start gates are defined there and shared with the report, the proposal decks and
> the engineering design doc. Change that file first, run `scripts/check-package-consistency.py`, then change
> this one. The shipped code is `index.html` **at the repo root** — not inside this folder.

> **Status**: v0.7 · 2026-08-13 — **the booth demo is dropped.** Two decisions in two days removed the
> event from this spec entirely. On 8/12 the live capture went (visitor photo, badge scan, Supabase store,
> `capture.html`). On 8/13 the booth demo itself went: the dashboard will not be shown at Snowflake World
> Tour Seoul. ICLO still attends with the deck, the backwall and the video; the screen is not part of it.
>
> **What this dashboard is now.** Two things, neither of them an event deliverable:
> 1. The screenshot source for the proposal package. The v11 deck shows it, including suppression firing
> 2. The starting artifact for the US evidence layer. It is the thing that gets repointed off its constants
>    block and onto Snowflake objects
>
> **Product Type**: SW (web) · **Stage**: PoC — synthetic click demo
> **Owner**: Jangwoo Kim (CFO) — single decision-maker
> **Audience**: Internal + AI coding agents

> **This spec needs validation.** Zero problem-validation interviews with paying customers exist.
> Never present demo output as performance evidence. Every number on screen is synthetic.

---

## 1. Why

**1.1 What this is.** An aggregate, privacy-safe oral-health dashboard shown from a US self-funded employer's
point of view. It is the screen an employer would see once eligibility, app activity and dental claims sit in
one governed model. Today it runs on synthetic numbers computed in the browser.

**1.2 What it is for.**

| Use | What the screen has to do |
|---|---|
| Proposal package | Be the real screenshot behind the claims. A drawn mockup would fail hallmark gate 47 and, worse, would not be honest |
| US evidence layer (A3) | Be the artifact that gets repointed onto Snowflake objects without a rewrite |
| Conversations with Snowflake and, later, employers | Show that `n ≥ 20` suppression and per-field provenance are implemented, not asserted |

**1.3 What was dropped, and what it cost.**

| Date | Decision | What went with it |
|---|---|---|
| 2026-08-12 | Booth live capture cancelled | `capture.html`, the booth employer, badge-QR enrolment, the Supabase store, PIPA §23 handling, the security review that was a release condition |
| 2026-08-13 | Booth demo cancelled | The offline bundle, the iPad acceptance path, the staff operating script, the on-site rehearsal, the freeze as a code deadline |

The 8/12 decision removed a differentiator and said so (v0.6 §5.3 rated the booth weak as a result). The 8/13
decision removes the event from this spec entirely, which is simpler: there is no longer a date this code has
to survive, and no longer an offline constraint on how it fetches data. That second point is what makes the
US evidence-layer work startable.

---

## 2. What

> **Structure lives in `ARCHITECTURE.md`** (same folder) — three diagrams: what runs today, the A3 target,
> and the full product with existence markers on every box. This section says what the thing is; that one
> says how it is wired.

**2.1 Concept.** Two surfaces, built from `screens/employer.html.in` and `screens/member.html.in` into
`build/` by `scripts/build_screens.py`. **The root `index.html` and `app.html` were retired 2026-08-27
(#49)** and the paragraph below describes them as they were; it is kept because the concept did not change,
only where the values come from. The employer dashboard is the first; the employee screen is the second —
originally added 2026-08-14, synthetic, a click-through of the
five things a member does: check in, read **their own band and which way it moved**, see what the plan
covers, see **why the remaining maximum is deliberately blank**, and find an in-network dentist. Neither
has a backend. Opened from the Pages URL or locally. Three views over three synthetic employers.

This sentence said "read their own score" and "see what is left" until 2026-08-16. Both were removed from
the app that day — the score until FDA clearance, the balance because computing one from our own claim
warehouse sends people to a chair expecting coverage they no longer have. The spec kept describing the
app it used to be, which is how a spec stops being a spec.

> **Opening it locally has a shelf life.** It works now because every number is a constant inside the file.
> The moment the screen fetches its data, `file://` stops working — a page with an opaque origin cannot
> fetch, and the browser blocks it. `bash scripts/serve.sh` exists for that, and the tests will need it
> too. Nothing has changed yet; this is here so the change is not a surprise.

**2.2 In-scope / Out-of-scope.**

| In (build) | Out (do not build — reason) |
|---|---|
| 3 views: Program overview · Oral-health signal distribution · Intervention funnel | Login / roles / user accounts — nothing here is per-person |
| 3 synthetic employers A/B/C at 10,000 / 2,500 / 25,000 | A live booth employer — dropped 2026-08-12 |
| Department filter that drives suppression into view | Relaxing suppression so a small department "shows something" |
| Denominator lens: eligible employees vs covered member-months | Mixing the two denominators anywhere |
| Tap-to-open source chips, one per figure | `title`-only tooltips. Hover is not a reliable input signal |
| `?scen=`, `?tab=`, `?dept=`, `?lens=` URL state — every view is linkable, so screenshots regenerate from a script | — |
| — | **An offline bundle.** Dropped 2026-08-13 with the booth. The evidence-layer work needs the screen to fetch, and nothing now requires it to run without a network |
| — | **Preventive-visit Trend vs Control — still deferred.** Needs a control arm; experiment assignment has no consent basis, allocation rule or protocol owner |
| — | Any disease-specific wording — FDA 2026 red line |
| — | A numeric score in employer views. Bands only |

**2.3 Core hypotheses.**

| # | Hypothesis | Verification |
|---|---|---|
| H1 | ~~A visitor who watches suppression fire stops asking about privacy~~ | **Void.** Depended on the booth demo. There is no visitor |
| H2 | ~~J-curve guardrail~~ | **Untestable.** The Trend view it depends on is deferred |
| H3 | The screen gives Snowflake something concrete enough to act on | ≥ 1 written follow-up toward US HLS GTM routing |

H1 and H2 are both void. H3 is the only live hypothesis and it is about the proposal, not the screen.
That is worth saying plainly: **this dashboard currently has no hypothesis of its own.** It is an input to
other work. The next spec that gives it one is the US evidence layer.

---

## 3. How

**3.1 Roles.**

| Role | Actor |
|---|---|
| Design interrogation, planning, review, QA, ship gate | Claude Code |
| Implementation | Either agent. Whoever authors, the other checks |
| Final approval & merge | Jangwoo Kim (human merges; agents never self-merge) |

Cross-check rule: **the authoring agent never approves its own work.**

v0.6 changed this. The earlier version assigned implementation to Codex and review to Claude Code, which
optimised the wrong risk. In practice Claude Code implemented and the code held: the booth removal passed
`test_build_reads_canon`, `test_consent`, the red-line check and the consistency check on the first run
(this listed `test_single_source` and `test_suppression`, both deleted in #49). The
failures were in **planning and documents**, and every one was a claim the repo already contradicted:

- a proposal to build suppression-reason display that the employer screen already ships
- a proposal to constrain an export that does not exist
- a clean-room proposal that `output/ICLO-Snowflake-Briefing-Meeting-Pack-v1.md:167` rules out for a single
  employer/TPA pilot

None is a coding mistake. They are the same mistake: **authoring against memory instead of against the
repository.** So the rule is not about who writes code:

> **Nothing an agent authors ships until a different model has checked it against the repository — not read
> it, checked it.**

The reviewer must be given the artifact *and* the repo, and told to verify claims by opening files. A
reviewer that only reads the artifact will agree with it.

**Parallel authoring applies to plans, not code.** Two independent drafts of the v11 proposal, both bound to
one shared brief and each forbidden from reading the other, found different defects: one caught a missing
disclosure and an overclaimed link verification, the other caught unquoted screen labels and a stale
terminology rule. The merge beat both. Prose merges cheaply, paragraph by paragraph.

Code does not. Two implementations of the same behaviour usually end with one chosen and the other's ideas
ported by hand, so the second draft costs twice and yields once.

| Artifact | Method |
|---|---|
| Plans, specs, proposals, architecture decisions | Parallel authorship from one shared brief, then merge |
| Code | Single author, cross-model review against the repo |

**3.2 What is left on this spec.** Nothing dated. The booth deadlines (8/22 script, 8/25 freeze, 8/26
rehearsal, 8/27 event) applied to a demo that no longer happens. The remaining event obligations — mini-session
speaker info, staff list, promo video, backwall — are not this repo's.

The next work on this code is the US evidence layer. Its shared work queue is the
repository's `A3 Evidence Layer` GitHub Milestone; `BACKLOG.md` defines the issue
schema. Local gstack plans preserve rationale but are not the live backlog.

**3.3 Stack.**

| Layer | Choice | Note |
|---|---|---|
| Display | Vanilla HTML built from `screens/*.html.in` by `scripts/build_screens.py`, inline CSS + JS | No `package.json`, `src/` or `dist/`. Vite/React/TS was the original plan and was not adopted. **2026-08-27**: the single root file became a template plus a builder so the canon is read at build time rather than copied by hand |
| Store | None today | A3 repoints this onto Snowflake objects |
| Style | Inline CSS custom properties (Coral `#C2333A` · Navy `#1B2A4A` · Teal `#007A87`, white bg) | Coral changed from `#FF7A79` on 2026-08-08: 2.53:1 on white failed WCAG AA. `#C2333A` is 5.49:1 |
| Signal bars | Low `#7E90AE` · Moderate `#4E8F98` · Priority `#C2333A` | Was `#D9E1EE` / `#8FB8BE`, measuring 1.24:1 and 2.02:1 against their track. Now 3.05 / 3.46 / 5.16 |
| Touch targets | 44px on every control, **unconditionally** | Kept after the booth iPad went. `@media(hover:none)` does not fire when a keyboard is attached, so input-capability queries are not a reliable way to size controls on any device |
| Charts | Hand-drawn CSS/SVG bars | No chart library |
| State | Plain JS module-scope variables + `?scen=` · `?tab=` · `?dept=` · `?lens=` URL state | |

**3.4 Data.** Every figure derives from the canon, read at build time. `test_build_reads_canon.py` perturbs
`contracts/proposal-package-v11.yml`, runs the real builder, and asserts the new value reached the rendered
DOM and the old one did not.

> **Corrected 2026-08-30.** This said "one constants block in `index.html`" enforced by
> `test_single_source.py`. Both are gone (#49) — and the premise this section's own A3 note anticipated was
> retired earlier than A3, by the rebuild. The check was rewritten rather than deleted, exactly as that note
> required; what went stale was this sentence naming the old file.

Scenarios A/B/C: 10,000 / 2,500 / 25,000 eligible · 38% activated · 61% repeat · $31.40 / $32.80 / $30.90
PMPM · 52·33·15 signal mix · funnel 3,800 → 2,800 → 950 → 420 on A.

> **A3 will invalidate this section's premise.** When the screen reads Snowflake objects instead of a
> constants block, that check must be **rewritten**, not deleted — "every figure derives from one
> object set" is the same property with a different source. That test was silently switched off once already
> (it matched the state initialiser as a literal string and stopped matching when URL state was added); do not
> let a rewrite switch it off a second time.

Canonical values live in `contracts/proposal-package-v11.yml`. Change that file first.

**3.5 Repo.** Subfolder `employer-dashboard-poc/` holds spec and scripts only. Shipped code is at the repo
root. Work starts from a GitHub Issue, happens on a feature branch, and merges to protected `main` only after
the required `gates` check. Cross-model review is recorded in the pull request; the human owner merges.

**3.6 Deploy.** GitHub Pages. No offline bundle — dropped with the booth. Locally, `bash scripts/serve.sh`
(see the note in §2.1 for why double-clicking the file will stop being enough).

---

## 4. Verification

There is no longer a success metric on this spec. The booth outcome metrics (captures, contacts, meetings
booked, privacy incidents) all measured an event this code no longer appears at. H3 belongs to the proposal.

### 4a. Machine-verifiable acceptance

- All 3 views render for all 3 employers; zero console errors
- Scenario A/B/C values match §3.4 exactly
- Any cell with `n < 20` masks values and prints "Suppressed (n<20)" with the reason inline
- The result is a band, never a numeric score
- `?scen=` · `?tab=` · `?dept=` · `?lens=` each open the screen onto the named state, and the
      department control shows the department that is actually selected
- "Synthetic data — illustrative only" on every view
- Provenance chip present and tappable on every figure
- `make check` passes all eleven repository gates (the count is asserted by `check_local_matches_ci`, which compares the Makefile against CI as sets — do not hand-edit this number)
- kill-ai-slop Mode B scan passes before a UI release

### 4b. Human check

Five steps, on any browser.

1. Open the page. A/B/C all load, no console errors.
2. Switch employers. Every figure moves; none are stale.
3. Filter to a small department. Values are replaced by "Suppressed (n<20)" and the reason states the group size.
4. Tap a source chip. Its ingestion path opens inline.
5. Switch the denominator lens. The highlight follows and no figure mixes the two.

### 4c. Anti-goals (achieving these = failure)

- Any individual-level result appears on screen, in any form
- Any disease-specific wording appears on screen, in code, or in a screenshot
- Demo numbers get presented as customer performance evidence
- A numeric score is shown in place of a band in an employer view

---

## 5. Risk & Guardrails

**5.1 Pressure test.** Direct evidence that a customer pays for this dashboard: **none**. With the booth gone,
this screen is not being tested against any audience at all right now. Verdict: **untested, and honestly so.**

**5.2 Problem validation.** Interviews with US benefits consultants or employers: **0**, and the conversations
that did happen were not recorded. Verdict: **blocking** for any production decision.

**5.3 Personal data.** This code processes **none**. No images, no badge scan, no contact collection, no
accounts. PIPA §23 does not apply and the security review that v0.5 made a release condition is not needed.

That is the largest risk reduction from the two August decisions, and it should be said plainly rather than
quietly enjoyed: the fastest way to have a privacy incident at a booth was to handle sensitive data at a booth.

**5.4 Agent red lines (violation = auto-reject).**

| Red line | Enforcement |
|---|---|
| Forbidden terms: `diagnos*, cavit*, caries, decay, gingivit*, periodont*, abscess, lesion`; signal label "Review" banned (use "Priority") | `scripts/check-forbidden-terms.sh` |
| No individual-level screens **in employer views**; no mock person profiles there | PR review. Scoped 2026-08-15: `app.html` is a member's own surface and shows their own result and their profiles by design (`contracts` `surfaces`) |
| **Band, never a number — on both surfaces, until FDA clearance** | PR review. Reversed 2026-08-16: the app briefly showed a 0-100 score. An image-derived figure presented to a person as their oral status reads outside the general-wellness boundary. The score is still computed; it is not rendered |
| Cells with `n < 20` never show values | `test_build_reads_canon.py` — the min-cell block and the floor walk. **Corrected 2026-08-30**: this said `test_suppression.py`, deleted with the old screens in #49, so this red line named a file that does not exist |
| ~~Band, never a numeric score — in employer views~~ | Superseded 2026-08-16 by the row above. The 08-14 settlement had the app showing a 0-100 score; that is reversed |
| Every figure derives from one source of truth | `test_build_reads_canon.py` — perturb the canon, run the builder, read the rendered DOM. **Corrected 2026-08-30**: this said `test_single_source.py`, deleted in #49. The check was not lost, it moved to the build boundary; the red line pointed at the old name for three days |
| Every view labeled "Synthetic data — illustrative only" | screenshot test |
| No AI-slop visual patterns | kill-ai-slop Mode B gate before `/ship` |
| Brand Coral is `#C2333A`; signal bars clear 3:1 against their track | `scripts/check-package-consistency.py` |
| No control under 44px, and no information reachable only by hover | PR review |
| Absolute privacy claims must be scoped (`no individual PHI` → `no individual PHI in employer views`) | `scripts/check-package-consistency.py` |

**5.5 What the US work still owes.** **Six** gates must close in writing before any real data is loaded.
They live in `contracts/proposal-package-v11.yml` under `start_gates`, which is the only list that counts:
HIPAA role determination, data rights in the employer–TPA contract, the basis for baseline loading before
consent, a common identity key, BAA and region, and **California CMIA** (§16-23, added 2026-08-28 — it
attaches regardless of the HIPAA role determination, so the first gate resolving either way leaves it open).

> **Corrected 2026-08-30.** This said four. It became five on 2026-08-25 and six on 2026-08-28, and this
> line was not updated either time. Do not restate the count here — read `start_gates`. A number copied into
> a second document is a number that goes stale, and this one did so twice.

---

## Handoff Brief (for AI coding agents)

### Background
ICLO is a smartphone oral-imaging AI company entering the US self-funded-employer market. This repo holds the
**employer-facing aggregate dashboard**, running on synthetic numbers. It is not an event deliverable. The
screen rules are **regulatory requirements, not stylistic taste** (FDA 2026 wellness boundary · HIPAA
aggregate principle) — do not modify them on your own judgment.

### Constraints
- **Tech**: §3.3. Single vanilla HTML file, no framework, no store
- **Red lines**: §5.4 — violation = auto-reject
- **Brand**: Coral `#C2333A` · Navy `#1B2A4A` · Teal `#007A87` · white background
- **Process**: §3.1. Author with one model, check with the other, against the repo

### Deliverables
None open on this spec. The v0.5 deliverables (D0–D7: badge QR question, Supabase store, capture app, contact
capture, Core AI integration, live booth employer) were cancelled 8/12. The v0.6 deliverables (D1 booth staff
script, D2 iPad rehearsal) were cancelled 8/13 with the booth demo.

Next work is the US evidence layer, planned separately.

### Communication
- **Decision-maker**: Jangwoo Kim (single)
- **Channel**: GitHub Issues/PR (ambiguity → `type:decision`; work blocked on it also gets `status:blocked`; guessing prohibited)
- **Spec canon**: this document; values = `contracts/proposal-package-v11.yml`; changes via PR only

---

### Tool references
- gstack — https://github.com/garrytan/gstack
- ponytail — https://github.com/DietrichGebert/ponytail
