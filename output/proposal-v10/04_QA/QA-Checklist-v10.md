# QA Checklist v10

## RELEASE STATUS: APPROVED — 2026-08-07

Every blocker is closed. This does not approve distribution beyond Snowflake; see the co-branding note in `00_README.md`.

### Blockers, all closed

- [x] Six government links opened in a browser 2026-08-07. **The DOL fiduciary HTML link, cited unchanged since v7, returns 404.** Replaced with the publication PDF, which was then opened and confirmed to carry the correct title, along with its section page, which lists the document. Medicaid prevention confirmed to carry the Oral Health paragraph (children/CHIP required, adult dental at state option) and EPSDT dental, so the v10 label is accurate. The DOL Annual Report confirmed as the March 2025 edition, with the self-insured vs fully insured wording the reports rely on.
- [x] ICLO company row filled 2026-08-07 from facts supplied by ICLO: ICLO Co., Ltd. (주식회사 아이클로), Jeju, Republic of Korea, commercial stage in the Korean market (B2C and B2B), 12 core team members. Market scope stated explicitly — "commercialized" unqualified would read as U.S. commercialization to this audience.
- [x] `beta.dol.gov` replaced 2026-08-07 with the current `www.dol.gov` addresses. The old slug named a **2026** edition; DOL's most recent published edition is **2025**, so the previous citation appears to have pointed at a document that does not exist.
- [x] Slide 8 QR decoded 2026-08-07: `https://jangwookimbusiness-dev.github.io/iclo-us-employee-dashboard/`, matching the URL printed beneath it. Target returns 200. The booth deck's slide 7 QR and the original `demo-qr.png` asset decode to the same URL. Re-verify only if the asset is replaced — no build script generates it, so it cannot be checked from source.

### Carry this forward

Search engines returned the dead DOL link as a live result while it was already 404. A search hit is not link verification; only opening the link is. The same link survived v7, v8 and v9 unchecked because automated requests to `dol.gov` return 403 and nobody opened it.
The Snowflake program name, sponsor, account, cloud, region, credits and support-owner fields are **not** blockers. They are the ask in this meeting and v10 states them as requests rather than as unfilled brackets.

## What v9 claimed that was not true

Recorded so the same boxes are not ticked again on inspection of source alone.

- v9 claimed `kill-ai-slop` returned no slop signals. Slide 8's caption rail shipped with four unrelated accent colors (coral / navy / sky / teal). **Fixed in v10:** one teal rail, navy labels.
- v9 claimed both decks passed overflow testing. The English slide 8 subhead was 132 characters in a 52px box; its second line wrapped past the box and the section rule struck through it. **Fixed in v10:** subhead shortened to one line. All slides in both languages re-measured against the rule; no remaining collisions.
- v9 claimed the final PDFs were reviewed slide by slide. Slide 3's footer page number rendered as `3` while every other slide was two-digit, in both languages, caused by the journey-number regex also matching the footer. **Fixed in v10:** all page numbers verified two-digit and renumbered after the timeline split.
- v9 claimed the reports were re-rendered. They were not. `Report-v7`, `Report-v8` and `Report-v9` are byte-identical (same MD5, DOCX and PDF); only the filename changed. **Fixed in v10:** reports rebuilt.

## Visual narrative

- [x] Repeated card grids, decorative badges, repeated bottom banners and non-semantic rainbow colors removed — re-verified against the rendered PDF, not the source.
- [x] Slide 2 uses a decision-friction map; its provenance chip now reads ICLO FRAMING / U.S. MARKET CONTEXT. The four-decision model is ICLO's own, and v9 credited it to "CONFIRMED MARKET CONTEXT".
- [x] Slide 7's drawn path no longer descends into a box captioned "Direction unknown". The rise into Year 1 is kept because that is the slide's claim; everything after it is level.
- [x] Slide 7's turnover labels carry their own lens text. In v9 the pairing was communicated only by font color across a 240px gap.
- [x] Slide 8's dashboard screenshot shows its full width, including the completeness figure and the aggregate / n ≥ 20 / no-PHI strip.
- [x] Slide 15 states that it is a blank template; both table headers use one fill and the deck typeface.
- [x] Slide 16 separates the field ICLO owns from the fields requested of Snowflake.
- [x] Page numbers are two-digit and sequential on all 16 slides in both languages, including the two halves of the split timeline.

## Content consistency

- [x] Existing Snowflake support relationship is visible on the cover, in the opening and in Step 0.
- [x] Slides 10 and 11 show Snowflake and ICLO actions by phase, with gates and outputs. The 90-day timeline was split in two so its columns could carry the deck's standard type size.
- [x] ICLO owns weekly written status and one decision log.
- [x] Consumption is stated as sizing inputs the SE turns into credits, not as an arrow equation. The v9 formula omitted warehouse size, runtime, concurrency and volume.
- [x] Sizing output is pre-credit run-rate economics first; credits are a separate time-limited sensitivity.
- [x] Day 30 diligence row and Day 75 use-case review are separate actions.
- [x] Agenda timing is 0–8 / 8–16 / 16–29 / 29–38 / 38–45 everywhere.
- [x] One canonical action register appears in both reports and the meeting kit.
- [x] Day 0 is defined as written sponsor acceptance; "Meeting + N business days" and "Day N" count from it.
- [x] Data-rights matrix has an owner, a date and a required output. In v9 it was named "outside Snowflake scope" with no accountable row anywhere.
- [x] The security reference has an acceptance owner and contents.
- [x] Meeting kit lists three open-field families, not two. v9 said "replace both placeholders" while the README required three.

## Product and regulatory restraint

- [x] U.S. self-funded employer dental-benefit PoC is explicit from the opening.
- [x] ICLO is not framed as another teledentistry app.
- [x] First-year dental-claims savings are not promised.
- [x] Raw-image and structured-data paths remain separate.
- [x] Business Critical + BAA are not presented as automatic HIPAA compliance.
- [x] Snowflake is not asked for FDA, HIPAA, licensure or data-rights conclusions.
- [x] Federated learning and Clean Room remain conditional.
- [x] No unsupported claim says that many TPAs store dental claims in Snowflake.
- [x] Snowflake is described as running the governed layer, not as governing it. ICLO and the customer own purposes and policy.
- [x] Unsourced timing and turnover claims are listed in `Sources-v10.md` as assumptions.

## External release hygiene

- [x] English PPTX speaker notes cleared.
- [x] Internal CEO/CMO review trail is not in the English external deck or report.
- [x] Both 16-slide PPTX files re-rendered to PDF and inspected page by page.
- [x] Slide 8 prints the demo URL beneath the QR code.
- [x] Snowflake co-branding retained for this proposal by ICLO decision (2026-08-06). The lockup permission line applies to broad external distribution beyond Snowflake, not to this document.

## Open, not fixed in v10 — needs a decision from ICLO

These are not defects. Each changes what ICLO is proposing, so none was altered without approval.

- [ ] "Experiment assignment" sits in the slide 6 outcome layer with no consent basis, allocation rule, nondiscrimination check or protocol owner, and appears in neither report. Either scope it properly or take it out of the first pilot.
- [ ] The 90 days validate the Snowflake relationship, not the dental PoC: no employer commitment, no contracted data, no ingested claims, no measured outcome. Either retitle it or add a customer track.
- [ ] The final gate is "use case and evidence minimum agreed" with no threshold for eligibility completeness, claim-line coverage, lag or engagement. Snowflake cannot objectively accept or reject it.
- [ ] No HIPAA role determination: which party is covered entity, business associate or subcontractor is never stated.
- [ ] No ERISA/fiduciary boundary on who at the employer may receive the dashboard and the prohibition on employment use.
- [ ] "Claims-verified" is used where "claims-linked" or "adjudication-supported" is what a claim line actually supports.
- [ ] The two Korean fintech accelerator selections are the only credential shown to a U.S. healthcare audience, with no gloss on what either program is.
