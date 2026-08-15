# Sources and status notes v10

## Snowflake primary sources

- Snowflake Editions / Business Critical: https://docs.snowflake.com/en/user-guide/intro-editions
- Row access policies: https://docs.snowflake.com/en/user-guide/security-row-intro
- Data protection policies: https://docs.snowflake.com/en/user-guide/data-protection-policies-snowsight
- Access History: https://docs.snowflake.com/en/user-guide/access-history
- Cross-region sharing and replication: https://docs.snowflake.com/en/user-guide/secure-data-sharing-across-regions-platforms
- Native App Framework: https://docs.snowflake.com/en/developer-guide/native-apps/native-apps-about
- Data Clean Rooms: https://docs.snowflake.com/en/user-guide/cleanrooms/about

All seven resolved on 2026-08-06.

## U.S. dental-benefit context

- U.S. Department of Labor, EBSA, *Understanding Your Fiduciary Responsibilities Under a Group Health Plan* — an ERISA-covered group health plan may cover dental, and may fund benefits through a trust, by purchasing insurance, or by self-funding from the employer's general assets: https://www.dol.gov/sites/dolgov/files/EBSA/about-ebsa/our-activities/resource-center/publications/group-health-plan-fiduciary-responsibilities.pdf — section page: https://www.dol.gov/agencies/ebsa/employers-and-advisers/plan-administration-and-compliance/health-plans. **Replaced 2026-08-07: the HTML URL carried since v7 now returns 404.** It was still being returned as a live result by search engines, so the index is stale — the only reliable check is opening the link.
- U.S. Department of Labor, EBSA, *Annual Report to Congress on Self-Insured Group Health Plans*, 2025 edition (the current one): https://www.dol.gov/sites/dolgov/files/EBSA/researchers/statistics/retirement-bulletins/annual-report-on-self-insured-group-health-plans-2025.pdf — index of all editions: https://www.dol.gov/agencies/ebsa/about-ebsa/our-activities/resource-center/reports. Corrected in v10: the link carried through v7-v9 was on `beta.dol.gov`, a staging host, and its slug named a **2026** edition. The most recent edition DOL has published is 2025, so the old citation appears to have pointed at a document that does not exist.
- HealthCare.gov, dental coverage: https://www.healthcare.gov/coverage/dental-coverage/
- Medicaid.gov, preventive services including pediatric/CHIP dental requirements and state-option adult dental: https://www.medicaid.gov/medicaid/benefits/prevention — label corrected in v10. Through v9 this URL was listed as "dental benefits" while pointing at the prevention page; the two reports already described it correctly.
- American Dental Association, dental benefit plan designs: https://www.ada.org/resources/practice/dental-insurance/benefit-plan-designs
- Korea NHIS, national health insurance benefit framework: https://www.nhis.or.kr/english/wbheaa02600m01.do — cited in both reports; was missing from the v9 source list.

## Link verification status

Checked 2026-08-06/07. HealthCare.gov, ADA, NHIS and all Snowflake docs returned 200. The GitHub Pages demo returns 200 and the QR codes on deck slide 8 and booth slide 7 decode to that exact URL.

`dol.gov` and `medicaid.gov` return 403 to automated requests, so those four were opened in a browser on 2026-08-07:

| Link | Result |
|---|---|
| DOL fiduciary responsibilities (HTML, cited since v7) | **404 — dead.** Replaced with the PDF above. |
| DOL Annual Report to Congress, 2025 edition | Opens. Confirmed "March 2025" and the self-insured vs fully insured wording the reports rely on. |
| DOL EBSA Reports index | Opens. Lists the Self-Insured Group Health Plans Annual Reports section. |
| Medicaid.gov prevention | Opens. Carries the Oral Health paragraph (children/CHIP required, adult dental at state option) and EPSDT dental, so the v10 label is accurate. |

Two lessons worth keeping: a 403 to a script proves nothing either way, and **search engines returned the dead DOL link as a live result**. A stale index is not verification. Only opening the link is.

Still unopened: the replacement fiduciary PDF and its section page, both found via search rather than a browser.

## ICLO internal sources

- User-provided external-briefing requirements and World Tour materials.
- ICLO Employer Dashboard synthetic demo: https://jangwookimbusiness-dev.github.io/iclo-us-employee-dashboard/
- CEO Junbae Kim and CMO Hyeyoon Choi direction: A-main / B-prime opening hybrid; CEO panel participation; dental insurance and employee-benefit context.
- Fintech Cube Cohort 9 and Shinhan Future's Lab Cohort 12 selection facts supplied by ICLO.

## Unconfirmed fields

- Snowflake's official name for ICLO's current startup-support relationship and the current sponsor.
- Current Snowflake account, cloud, region, credits, usage and technical-support owner.
- ICLO legal-entity, headquarters, stage and core-team details for external use.

"Core 20" is not used as an external program name unless Snowflake confirms it in writing.

## Claims carried without a cited source

These appear in the decks and reports as assertions. None is sourced here; each is either ICLO's own framing or an untested planning assumption, and should be spoken as such in the meeting.

- "Years 2-3: treatment mix and run-out become measurable." No source supports the two-to-three-year timing.
- Low-turnover employers suit a multi-year value case; high-turnover employers suit an employee-experience case. Interpretive, not measured.
- The four-decision model on slide 2 (eligibility, network, plan rules, availability). ICLO's framing, labelled as such in v10.
- KO report p.2, "금융사 협업 과제를 발굴·검증 중" — corrected in v10 to the two verified cohort selections only.
