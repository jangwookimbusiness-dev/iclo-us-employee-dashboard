# ICLO × Snowflake Joint-Validation Package v10

## What changed in v10

v10 is a correctness pass over v9. No new claims, no new assets, no scope change.

**Reports rebuilt.** `Report-v7`, `Report-v8` and `Report-v9` were byte-identical — the same DOCX and PDF renamed forward twice while only the decks were re-rendered. The v8 and v9 deck passes never reached the reports. v10 rebuilds them.

**Defects fixed in the decks**

- Slide 7's drawn path descended from Year 1 through Years 2-3 into a box captioned "Direction unknown", asserting the recovery the caption refuses to claim. The rise into Year 1 is kept; everything after it is level.
- Slide 7's LOW / HIGH TURNOVER labels and their two "lens" labels sat 240px apart, paired only by font color. Merged.
- Slide 8's English subhead overflowed its box and the section rule struck through the second line.
- Slide 8's caption rail used four unrelated accent colors, the same pattern the de-slop pass removed elsewhere. Now one teal rail with navy labels.
- Slide 8's dashboard screenshot was cut off at its own right edge, losing the completeness figure and the privacy strip. Re-captured (see below).
- Slide 8's QR code was unlabelled; the demo URL is now printed beneath it.
- Slide 3's footer page number rendered as `3` while every other slide was two-digit, in both languages. The journey-number regex was also matching the footer.
- Slide 2's provenance chip credited ICLO's own four-decision model to "CONFIRMED MARKET CONTEXT".
- Slide 6's title said Snowflake governs the evidence layer. A platform supplies controls; ICLO and the customer own governance.
- Slide 10's consumption line read as a credit formula while omitting warehouse size, runtime, concurrency and volume.
- Slide 15 (was 14) shipped as two blank tables with two different header colors and no statement that it is a template.
- Slide 16 (was 15) closed the external deck on five editor's brackets. Two field families are the ask in this meeting and now read as requests; the company row is ICLO's own and is marked as such.
- KO slide 8 was titled "네 가지" over five items.

**Connectors restored.** Several diagrams were drawing boxes with nothing between them. The template actually carried connector shapes — arrowheads and all — but with no stroke colour, so they rendered as nothing:

- Slide 10's four phases had three connectors at x=316/607/898 with no stroke. A 90-day timeline was reading as four unlinked columns. Stroked; the conditional EXPAND arrow is muted grey, since it is not the next step.
- Slide 6's two vertical links down the raw-image path were being erased outright by the flatten sweep. Excluded from it and given the coral the rest of that path uses.
- Slide 5's equivalent links were grey-on-white at 1px, effectively invisible. Given the connector colour.
- Slide 7 was rebuilt as a stepped timeline. The v10 fix had removed the misleading descending arrows but put nothing back, leaving four blocks floating. It now steps up into Year 1 — the slide's actual claim — and runs level through Years 2-3 to Validate, with stops on the path. The three principle cards moved up to close the dead band underneath.

Slides 2 and 13 keep a single arrow into their centre element rather than four converging ones. That is deliberate: the four items on each read as one group feeding the centre, and both slides are consistent with each other.

**Fixed in the demo.** `index.html` — `.hrow`, `.ctxrow` and `.frow` each set `padding: <v> 0`, which overrode `.wrap`'s 28px side padding. Header, filter bar and footer ran to the viewport edge and the right-aligned text clipped at every window width. Changed to `padding-block`. This was the root cause of the truncated slide 8 screenshot, and it affected the live demo behind the QR code.

**"J-curve" dropped.** The material called the shape a J-curve while plotting **cost**. On a cost axis the shape is a hump, not a J — the J only appears when the y-axis is net value or return, where you dip first and rebound. Worse, a J-curve's defining feature *is* the rebound, and this proposal explicitly refuses to claim it ("Direction remains a customer-specific hypothesis"). The name was promising what the text withholds. The cost axis is kept, since every sentence in the package is already written that way, and the name is gone:

- Deck slide 14 (was 13): "What the J-Curve Model Needs" → "What the Scenario Model Needs", after the slide's own centre element, GOVERNED SCENARIO MODEL.
- EN report: "The Economics Begin with a J-Curve - Not a Year-One Savings Promise" → "The Economics Start with Higher Year-One Claims - Not a Savings Promise", plus one clause noting the chart is a cost path, not a return curve.
- KO report: the `J-curve` callout became `1년차 비용 곡선` and now states outright that the axis is cost, so the shape is inverted relative to an investment-return J-curve. This is the one place the term still appears, deliberately, to disambiguate it.

Superseded artifacts outside this package (`ICLO-Snowflake-HLS-Meeting-Pack-v2.md`, `ICLO-Snowflake-Briefing-Meeting-Pack-v1.md`) still use the old term; they are Aug 5 material and were not rebuilt.

**Corrected in the documents**

- The meeting kit said "replace both placeholders" while the README required three families, so the ICLO company fields could be missed. Now an owner-by-owner table.
- The data-rights matrix, named "outside Snowflake scope" and load-bearing for the whole architecture, had no accountable action anywhere. Now an ICLO-owned Day-30 row.
- The security reference had no acceptance owner or contents. Now a Day-60 row.
- Sizing output is pre-credit run-rate economics first, with credits as a separate time-limited sensitivity.
- Day 0 is defined as written sponsor acceptance, so "Meeting + N business days" and "Day N" count from the same date.
- Sources: added the Korea NHIS link both reports cite; corrected the Medicaid label, which read "dental benefits" over the prevention page; replaced the `beta.dol.gov` staging URL, whose slug named a 2026 edition that does not exist; replaced the DOL fiduciary link, dead since at least v7; recorded the browser-verification result for every link.
- `Sources-v10.md` now lists the claims carried without a cited source.

**Denominator and PHI wording corrected 2026-08-08.** Three places said something the architecture does not support:

- The dashboard glossed `eligible employees` as "(the app user)", which made "Activated 38% of eligible employees" circular. Eligible employees are the *population* — staff at contracted employers who are plan-eligible in the period, per HRIS 834 — and the app users are the Activated share of it. Fixed in `index.html`, in the reports' evidence-design row, and in the operator's guide.
- Deck slide 4 said only `No employee-level PHI`, which reads as "none exists anywhere". Slide 6 then shows HRIS eligibility and TPA claim lines entering Snowflake, so the contradiction surfaces on the next page. Now `No employee-level PHI in employer views`.
- Both reports now state plainly that individual-level records exist in the governed processing layer — member-months, claim lines and app events cannot be computed without them — and that what the controls govern is who may read them.

## Files

- `01_KO_Internal/`: v10 16-slide Korean internal-review deck and Korean vertical report.
- `02_EN_External/`: v10 16-slide English external deck and English vertical report.
- `04_QA/`: review checklist and sources.
- `06_Tech/`: Korean engineering design for the individual-level evidence database behind the dashboard — sources, identity resolution, canonical model with DDL, member-month expansion, claims-lag snapshots, the PHI boundary, and the Snowflake governance policies that enforce n ≥ 20 in the query engine rather than in the UI. Assumptions are listed and flagged.
- `05_Guide/`: Korean operator's guide to the dashboard demo, with screenshots — how to drive it in a booth or a working session, how to make the n ≥ 20 suppression fire on camera, and what not to claim while showing it.

## External-sharing rule

Share the English PDF by default. The English PPTX has its speaker notes cleared, but PDF remains the preferred externally forwarded artifact. The Korean deck and report are internal review materials.

**Release status: APPROVED, 2026-08-07.** See `04_QA/QA-Checklist-v10.md`. All four blockers are closed. Approval covers sending this to Snowflake; it does not cover distribution beyond them — see Co-branding below.

Closed on 2026-08-07: ICLO's company fields, the `beta.dol.gov` staging URL, the QR target, and the government links. One of those links, DOL's fiduciary-responsibilities page carried unchanged since v7, turned out to be **404** and was replaced.

## Open fields before release

| Field | Owner | Status |
|---|---|---|
| ICLO legal entity, HQ, stage, core team size | ICLO | Filled — ICLO Co., Ltd. · Jeju, Republic of Korea · commercial stage in the Korean market (B2C and B2B) · 12 core team |
| Official Snowflake program name and current sponsor | Snowflake | Open — this is the ask |
| Current account, cloud, region, credits, usage, technical-support owner | Snowflake | Open — this is the ask |

Do not replace the Snowflake program placeholder with "Core 20" unless Snowflake confirms that exact external-facing name.

## Co-branding

Snowflake logo and the `ICLO × Snowflake` lockup are retained in this proposal by ICLO decision, 2026-08-06. The permission question applies to distribution beyond Snowflake, not to a document addressed to them.

## Scope and guardrails retained

- U.S. self-funded employer dental-benefit PoC only.
- No year-one savings guarantee.
- Raw oral images remain outside Snowflake; only approved metadata/signals enter the governed evidence layer.
- Business Critical and an appropriate BAA are platform prerequisites when PHI is processed in Snowflake; they do not make ICLO as a whole HIPAA-compliant.
- Native App, Clean Room and federated learning remain conditional.

## Decisions still owed by ICLO

Listed at the end of `04_QA/QA-Checklist-v10.md`. Each one changes what ICLO is proposing, so none was changed without approval. The largest is that the 90 days as written validate the Snowflake relationship rather than the dental PoC the title names.

