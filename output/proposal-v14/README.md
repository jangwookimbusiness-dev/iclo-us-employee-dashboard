# Snowflake proposal v14

2026-09-07 · Documentation work tracked by [#79](https://github.com/jangwookimbusiness-dev/iclo-us-employee-dashboard/issues/79).

| Document | Editable source | PDF |
|---|---|---|
| 한국어 제안서 · 소프트웨어/데이터 아키텍처 개요 포함 | [proposal-KO.md](proposal-KO.md) | [한국어 PDF](../pdf/ICLO-Snowflake-v14-Proposal-KO.pdf) |
| English proposal · abstract software/data architecture | [proposal-EN.md](proposal-EN.md) | [English PDF](../pdf/ICLO-Snowflake-v14-Proposal-EN.pdf) |
| Snowflake-facing nutshell diagram, English | [../proposal-v15/data-architecture-nutshell-EN.md](../proposal-v15/data-architecture-nutshell-EN.md) | - |
| 한국어 상세 소프트웨어·데이터 아키텍처 | [architecture-KO.md](architecture-KO.md) | [한국어 기술 부록 PDF](../pdf/ICLO-Snowflake-v14-Architecture-KO.pdf) |
| Detailed software and data architecture, English | [architecture-EN.md](architecture-EN.md) | [English technical annex PDF](../pdf/ICLO-Snowflake-v14-Architecture-EN.pdf) |

Both languages are intended for external discussion and carry the same scope. The main proposal starts with the buyer decision, then explains the product, abstract architectures, Snowflake's proposed role, measurement approach, stages and asks. The annex is the technical counterpart, not an approved implementation plan or a claim of deployed infrastructure.

## Basis and editorial choices

- [Canonical contract](../../contracts/proposal-package-v11.yml): product boundaries, metric definitions, export schema, start conditions and recorded decisions.
- [PRD](../../employer-dashboard-poc/docs/PRD.md) and [current architecture](../../employer-dashboard-poc/docs/ARCHITECTURE.md): actual demo behavior and A3/A2 boundaries.
- [Technical design](../proposal-v10/06_Tech/ICLO-Evidence-Layer-DB-설계-KO.md) and [architecture brief](../../employer-dashboard-poc/docs/INTERNAL-DATA-ARCHITECTURE-BRIEF.md): detailed data model, API contract, controls and open decisions. Historical SQL examples are design inputs, not proof of Snowflake execution.
- [Meeting log](../../employer-dashboard-poc/docs/meeting-log.md): recorded buyer evidence and partner discussion are distinguished.
- [v13](../proposal-v13/제안서-v13-KO.md): continuity of the three-candidate/one-PoC ask, first-partner screening and first-90-day scope. Previous editions are preserved.
- Official Snowflake documentation, checked 2026-09-07: linked beside technical claims. Platform capabilities do not prove availability in ICLO's account or compliance of the complete service.

The 1-30 / 31-60 / 61-90 day sequence and 60-minute working session are proposed discussion terms, not newly approved commitments. Prices, savings, clinical outcomes, customer traction and introductions have not been invented. Account-specific credits and personal contact details are omitted.

This package was authored against the local #78 working changes. It does not publish, merge or close that implementation work. It does not close external customer, account, identity or legal decisions. This v14 package has not been sent to Snowflake.

## Rebuild and checks

Run `make docs` to rebuild the four PDFs through the existing renderer. Their source and artifact hashes are managed by `scripts/doc-manifest.json` and `.docstamps.json`. Inline Mermaid diagrams are editable in the Markdown sources and rendered by that pipeline. Run `make check` for repository verification; document consistency checking includes both languages and both annexes. This checks selected contract rules, not the truth of every sentence or translation quality; those require editorial review.

Verification on 2026-09-07: all eleven `make check` commands completed successfully, including 173 canon/render checks and 33 export regression cases. Demo-phase export presence is explicitly skipped, not evidence of a running Snowflake pipeline. The final document-only changes also passed the terminology, consistency and freshness checks. Deliberate terminology defects were observed failing in each of the four new sources before removal; the missing artifact stamps also failed before generation.

A different-model reviewer (GPT-5.6 Sol) checked bilingual alignment and repository contracts and reported no remaining content blockers. This was not legal validation or live Snowflake execution. Four PDFs were rendered for visual inspection, including all eight architecture diagrams; the editable sources and older editions remain available.
