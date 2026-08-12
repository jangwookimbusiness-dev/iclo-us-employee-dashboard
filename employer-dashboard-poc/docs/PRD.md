# employer-dashboard-poc: 임직원 구강 집계 대시보드

> **Canonical values live in `contracts/proposal-package-v11.yml`.** Screen names, KPI labels, constants,
> colors, terminology and start gates are defined there and shared with the report, the proposal decks and
> the engineering design doc. Change that file first, run `scripts/check-package-consistency.py`, then change
> this one. The shipped code is `index.html` **at the repo root** — not inside this folder.

> **Status**: v0.6 · 2026-08-12 — **booth live capture dropped.** v0.5 built the whole spec around a visitor
> capturing at the Snowflake World Tour Seoul booth on 2026-08-27. That is cancelled (J. Kim, 2026-08-12).
> The booth now shows the synthetic A/B/C dashboard only. `capture.html`, the booth employer, badge-QR
> enrolment, the Supabase store and the PIPA §23 consent path are all removed from scope and from the code.
> **The US PoC still runs on real data** — employer eligibility, TPA claims and employee-app activity. That
> work is governed by the engineering design doc and by `start_gates` in the contract, not by this PRD.
> **Product Type**: SW (web) · **Stage**: PoC — synthetic click demo
> **Owner**: Jangwoo Kim (CFO) — single decision-maker
> **Audience**: Internal + AI coding agents

> **This spec needs validation.** Zero problem-validation interviews with paying customers exist.
> Never present demo output as performance evidence. Every number on screen is synthetic.

---

## 1. Why

**1.1 What this is.** An aggregate, privacy-safe oral-health dashboard shown from a US self-funded employer's
point of view. It is the screen an employer would see once eligibility, app activity and dental claims sit in
one governed model. Today it runs on synthetic numbers.

**1.2 What it is for.** Two audiences, in this order.

| Audience | What the screen has to do |
|---|---|
| Snowflake, US HLS GTM and architecture | Show that the governed-evidence story is concrete: aggregate-only, `n ≥ 20` enforced, provenance per field. The proposal deck carries the ask; this screen is the proof it is not a slide |
| US self-funded employers and benefits consultants | Show the shape of the report they would buy, before any of their data exists |

**1.3 What changed on 2026-08-12.** The Seoul booth was going to let a visitor capture their own oral photo
and then fail to find themselves in the aggregate. That is dropped. The booth shows A/B/C.

What that removes: the live demo beat, PIPA §23 sensitive-data handling, the badge-QR enrolment question that
was blocking work, the security review that was a release condition, and roughly two weeks of build.

What it costs: the differentiator. §1.3 of v0.5 argued that a static synthetic dashboard is indistinguishable
from every other booth screen at a data conference. That argument still holds. The booth narrative, back-wall
copy and mini-session talk track need to carry the weight the capture loop was going to carry.

**1.4 The demo without capture.** The strongest thing left on screen is suppression. Filter to a small
department and the values disappear. That is a rule the visitor can watch fire, and it is the same rule the
proposal claims. It is weaker than "find yourself and fail", but it is real and it is on the screen today.

---

## 2. What

**2.1 Concept.** One surface. A single vanilla HTML file at the repo root, opened on the booth iPad or from
the Pages URL.

Three views over three synthetic employers. No backend, no store, no network dependency.

**2.2 In-scope / Out-of-scope.**

| In (build) | Out (do not build — reason) |
|---|---|
| 3 views: Program overview · Oral-health signal distribution · Intervention funnel | Login / roles / user accounts — nothing here is per-person |
| 3 synthetic employers A/B/C at 10,000 / 2,500 / 25,000 | A live booth employer — dropped 2026-08-12 |
| Department filter that drives suppression into view | Relaxing suppression so a small department "shows something" |
| Denominator lens: eligible employees vs covered member-months | Mixing the two denominators anywhere |
| Tap-to-open source chips, one per figure | `title`-only tooltips. There is no hover on a tablet |
| `?scen=` and `?tab=` URL state, so a screen can be opened onto a view | — |
| Offline: the file runs from `file://` with networking off | Any design where a network failure blanks the screen |
| — | **Preventive-visit Trend vs Control — still deferred.** Needs a control arm; experiment assignment has no consent basis, allocation rule or protocol owner |
| — | Any disease-specific wording — FDA 2026 red line |
| — | A numeric score. Bands only |

**2.3 What survives to the US product.** The Seoul booth is a one-day instrument. The US PoC runs on real
employer, TPA and employee-app data. Build accordingly.

| Survives — this is the product | Booth-only |
|---|---|
| The aggregate dashboard and scenarios A/B/C | The iPad and the offline bundle |
| 44px touch targets and tap-to-open chips | — |
| `n < 20` suppression and per-field provenance | — |
| Band, never a score | — |
| Denominator discipline | — |
| The Core AI call contract (engineering design §8.2) | — |
| Hash-on-read, discard-plaintext as a habit | — |

**2.4 Core hypotheses.**

| # | Hypothesis | Verification |
|---|---|---|
| H1 | A visitor who watches suppression fire stops asking how privacy is handled | Booth log: privacy question raised → resolved on-screen (Y/N), per conversation |
| H2 | ~~J-curve guardrail~~ — **untestable**; the Trend view it depends on is deferred | n/a |
| H3 | The screen gives Snowflake Korea something concrete enough to act on | ≥ 1 written follow-up toward US HLS GTM routing within 10 business days of 8/27 |

---

## 3. How

**3.1 Roles.**

| Role | Actor |
|---|---|
| Design interrogation, planning, review, QA, ship gate | Claude Code |
| Implementation | Codex |
| Final approval & merge | Jangwoo Kim (human merges; agents never self-merge) |

Cross-check rule: **the authoring agent never approves its own PR.**

**3.2 Roadmap.** The build is done. What is left is booth logistics and rehearsal.

| Date | Owner | Item |
|---|---|---|
| **8/14 (Fri)** | J. Kim | Mini-session speaker info + booth staff list to Snowflake |
| **8/21 (Fri)** | J. Kim | Company promo video (≤2 min) to Snowflake |
| 8/22 | Claude Code | `/qa` + `/review` + consistency check green; booth operating script for staff |
| **8/25 (Mon)** | — | **Freeze.** Tag the repo |
| **8/26 (Tue)** | J. Kim | Booth setup and operating rehearsal at COEX |
| **8/27 (Thu)** | — | Event, 08:00–17:00 |

**3.3 Stack.**

| Layer | Choice | Note |
|---|---|---|
| Display | **Single vanilla HTML file** (`index.html` at repo root), inline CSS + JS | No `package.json`, `src/` or `dist/`. Vite/React/TS was the original plan and was not adopted |
| Store | None | Every number is computed in the browser from one constants block |
| Style | Inline CSS custom properties (Coral `#C2333A` · Navy `#1B2A4A` · Teal `#007A87`, white bg) | Coral changed from `#FF7A79` on 2026-08-08: 2.53:1 on white failed WCAG AA. `#C2333A` is 5.49:1 |
| Signal bars | Low `#7E90AE` · Moderate `#4E8F98` · Priority `#C2333A` | Was `#D9E1EE` / `#8FB8BE`, measuring 1.24:1 and 2.02:1 against their track. Now 3.05 / 3.46 / 5.16 |
| Touch targets | 44px on every control, **unconditionally** | An iPad with a keyboard reports `hover:hover`, so a `@media(hover:none)` gate silently would not fire |
| Charts | Hand-drawn CSS/SVG bars | No chart library |
| State | Plain JS module-scope variables + `?scen=` and `?tab=` URL state | |

**3.4 Data.** Every figure derives from one constants block in `index.html`. `test_single_source.py` fails if
any constant stops propagating to the screen.

Scenarios A/B/C: 10,000 / 2,500 / 25,000 eligible · 38% activated · 61% repeat · $31.40 / $32.80 / $30.90
PMPM · 52·33·15 signal mix · funnel 3,800 → 2,800 → 950 → 420 on A.

Canonical values live in `contracts/proposal-package-v11.yml`. Change that file first.

**3.5 Repo.** Subfolder `employer-dashboard-poc/` holds spec and scripts only. Shipped code is at the repo
root. Protected `main` · PRs required · cross-review per §3.1.

**3.6 Deploy.** GitHub Pages. The offline bundle is the fallback if COEX networking fails.

---

## 4. Verification & Success

**Success = at least one written Snowflake follow-up toward US HLS GTM routing within 10 business days of 8/27.**

### 4a. Machine-verifiable acceptance

- [ ] All 3 views render for all 3 employers; zero console errors
- [ ] Scenario A/B/C values match §3.4 exactly and still work with the network disabled
- [ ] Any cell with `n < 20` masks values and prints "Suppressed (n<20)"
- [ ] The result is a band, never a numeric score
- [ ] `?scen=` and `?tab=` open the screen onto the named view
- [ ] "Synthetic data — illustrative only" on every view
- [ ] Provenance chip present and tappable on every figure
- [ ] `python3 test_single_source.py` passes — every constant reaches the screen
- [ ] `python3 test_suppression.py` passes — no displayed count below 20
- [ ] `bash employer-dashboard-poc/scripts/check-forbidden-terms.sh` exits 0
- [ ] `python3 scripts/check-package-consistency.py` exits 0
- [ ] Works on the booth iPad in landscape without scrolling the Overview
- [ ] kill-ai-slop Mode B scan pass

### 4b. Human verification script

The Owner performs this on the booth iPad; passing all 7 = approval.

1. Open the display. A/B/C all load, no console errors.
2. Turn networking off. Everything still works.
3. Switch employers. Every figure moves; none are stale.
4. Filter to a small department. Values are replaced by "Suppressed (n<20)". **Say it out loud — this is the demo.**
5. Tap a source chip. Its ingestion path opens inline.
6. Switch the denominator lens. The highlight follows and no figure mixes the two.
7. On the iPad in landscape: the whole Overview fits without scrolling and every control is comfortable to tap.

### 4c. Outcome metrics

| Metric | Baseline | Target | Method | Owner |
|---|---|---|---|---|
| Freeze met | n/a | 8/25, binary | repo tag | J. Kim |
| Snowflake follow-up toward US HLS routing | 0 | ≥ 1 written | mail thread | J. Kim |
| Korean enterprise / VC meetings booked | 0 | ≥ 3 | booth log | J. Kim |
| Privacy incidents | 0 | **0** | booth log | J. Kim |

### 4d. Anti-goals (achieving these = failure)

- Any individual-level result appears on screen, in any form
- Any disease-specific wording appears on screen, in code, or in a screenshot
- Demo numbers get presented as customer performance evidence
- A numeric score is shown in place of a band
- The network fails and the screen goes blank
- Chasing polish past the 8/25 freeze

---

## 5. Risk & Guardrails

**5.1 Pressure test.** Direct evidence that a customer pays for this dashboard: **none**. The booth tests
whether the governed-evidence story is legible to a technical audience, which is a lower bar. Verdict: **weak,
deliberately.**

**5.2 Problem validation.** Interviews with US benefits consultants or employers: **0**. Verdict: **blocking**
for any production decision. The Seoul booth cannot close this gap — its audience is not the buyer.

**5.3 Competition.** Without the capture loop, the in-room comparison is every other dashboard at a data
conference. The remaining differentiator is that suppression is visible and testable on the screen rather than
asserted in a slide. That is thinner than v0.5 assumed. Verdict: **weak.**

**5.4 First 10 targets.** Snowflake Korea HLS/GTM contacts, the mini-session moderator, the organizer-matched
enterprise and VC meetings.

**5.5 Smallest validating build.** Already shipped. A/B/C, three views, suppression firing on the department
filter.

**5.6 Agent red lines (violation = auto-reject).**

| Red line | Enforcement |
|---|---|
| Forbidden terms: `diagnos*, cavit*, caries, decay, gingivit*, periodont*, abscess, lesion`; signal label "Review" banned (use "Priority") | `scripts/check-forbidden-terms.sh` |
| No individual-level screens; no mock person profiles | PR review |
| Cells with `n < 20` never show values | `test_suppression.py` |
| **Band, never a numeric score** | PR review |
| Every figure derives from the single constants block | `test_single_source.py` |
| Every view labeled "Synthetic data — illustrative only" | screenshot test |
| No AI-slop visual patterns | kill-ai-slop Mode B gate before `/ship` |
| Brand Coral is `#C2333A`; signal bars clear 3:1 against their track | `scripts/check-package-consistency.py` |
| No control under 44px, and no information reachable only by hover | review on the actual iPad |
| Absolute privacy claims must be scoped (`no individual PHI` → `no individual PHI in employer views`) | `scripts/check-package-consistency.py` |

**5.7 Personal data.** With capture dropped, the booth processes **no personal data at all**. No images, no
badge scan, no contact collection. PIPA §23 does not apply and the security review that v0.5 made a release
condition is no longer needed.

This is the single largest risk reduction from the 2026-08-12 decision, and it should be said plainly rather
than quietly enjoyed: the fastest way to have a privacy incident at a booth was to handle sensitive data at a
booth.

**5.8 What the US PoC still owes.** The dashboard on real data is a different problem and this PRD does not
govern it. Four gates must close in writing before any real data is loaded: HIPAA role determination, data
rights in the employer–TPA contract, the basis for baseline loading before consent, and a common identity key.
They live in `contracts/proposal-package-v11.yml` under `start_gates`, and the engineering design doc carries
the model.

---

## Handoff Brief (for AI coding agents)

### Background
ICLO is a smartphone oral-imaging AI company entering the US self-funded-employer market. This repo holds the
**employer-facing aggregate dashboard**, shown at **Snowflake World Tour Seoul, COEX, 2026-08-27**. It runs on
synthetic numbers. The screen rules are **regulatory requirements, not stylistic taste** (FDA 2026 wellness
boundary · HIPAA aggregate principle) — do not modify them on your own judgment.

### Constraints
- **Time**: freeze **8/25** → rehearsal 8/26 → event 8/27 (KST)
- **Tech**: §3.3. Single vanilla HTML file, no framework, no store
- **Red lines**: §5.6 — violation = auto-reject
- **Brand**: Coral `#C2333A` · Navy `#1B2A4A` · Teal `#007A87` · white background

### Deliverables
| # | Deliverable | Form | Due | Owner |
|---|---|---|---|---|
| D1 | Booth operating script for staff, one page | pdf | 8/22 | Claude Code |
| D2 | Rehearsal on the booth iPad, all of §4b | — | 8/26 | J. Kim |

The v0.5 deliverables D0 and D2–D7 (badge QR question, Supabase store, capture app, contact capture, Core AI
integration, live booth employer) are cancelled.

### Acceptance
→ §4a, every checkbox. **§4b step 4 is the demo.**

### Communication
- **Decision-maker**: Jangwoo Kim (single)
- **Channel**: GitHub Issues/PR (ambiguity → `question` label; guessing prohibited)
- **Spec canon**: this document; values = `contracts/proposal-package-v11.yml`; changes via PR only

---

### Tool references
- gstack — https://github.com/garrytan/gstack
- ponytail — https://github.com/DietrichGebert/ponytail
- Event guide — Snowflake Korea Startup Village Guide Deck, 25pp
