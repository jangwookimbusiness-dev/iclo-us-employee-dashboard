# BUILD.md — Implementation handoff

> **Superseded. Do not build from this file.** It specifies the Vite · React 18 · TypeScript · Tailwind
> stack, and PRD §3.4 records that the stack was never adopted — the shipped code is a single vanilla
> HTML file at the repo root. The capture app it also describes was deleted on 2026-08-12. The five-view
> structure, the `src/` file map and the T1–T9 task list below all belong to v0.4.
> **Current spec: `docs/PRD.md` §3.3–3.5 and its Handoff Brief. There is no freeze date** — the 8/25
> freeze belonged to the booth demo, scrapped 2026-08-13.
> Kept for the §4 contracts (suppression, denominators, provenance), which still hold and are still
> the ones the red-line checks enforce.

**Read order: `docs/PRD.md` (why + acceptance) → this file (how) → `AGENTS.md` (commands + red lines).**
Audience: both coding agents. Whoever authors, the other checks (PRD §3.1). Owner: Jangwoo Kim.

---

## 1. What you are building

A production-quality version of the approved prototype at `docs/prototype/employer-dashboard-poc-demo.jsx`.

The prototype is **the visual and behavioral specification**. It was reviewed and passes the red-line checks. It is not production code: it is one file, holds its dataset inline, and has no tests, no routing, no build config.

| Keep exactly | Replace / add |
|---|---|
| Layout, tab structure, and information order of all 5 views | Split into components under `src/` |
| Every number and label (they reproduce PRD §3.5) | Move data to `scripts/generate.ts` → `src/data/scenarios/*.json` |
| Denominator lens, department filter, scenario switch, source-chip toggle behavior | Add URL state (`?scenario=A`) |
| Suppression rendering and its wording | Extract to a pure, unit-tested function |
| Brand tokens and the `DEMO · Synthetic data` header/footer labels | Move tokens to a single module + Tailwind config |
| Copy, verbatim (it is regulated wording — see PRD §5.6) | — |

**Do not redesign.** If you believe a view is wrong, open a `question` issue with the reasoning; do not change it unilaterally. Design changes require an Owner decision because the copy and screen boundaries are regulatory, not stylistic.

---

## 2. Target file map

```
employer-dashboard-poc/
├── AGENTS.md · CLAUDE.md · SETUP.md · .gitignore   (exists)
├── package.json · vite.config.ts · tsconfig.json · tailwind.config.js   (T1)
├── index.html                                       (T1)
├── docs/
│   ├── PRD.md · meeting-log.md                      (exists)
│   └── prototype/employer-dashboard-poc-demo.jsx    (reference — never imported)
├── scripts/
│   ├── check-forbidden-terms.sh                     (exists — extend in T9)
│   └── generate.ts                                  (T2)
├── src/
│   ├── main.tsx · App.tsx                           (T3)
│   ├── tokens.ts                                    (T1)
│   ├── data/scenarios/{a,b,c}.json                  (T2 output, committed)
│   ├── lib/{suppression.ts,metrics.ts,sources.ts}   (T2–T3)
│   ├── components/{SourceChip,Suppressed,StatCard,BarRow,ContextBar,Box}.tsx  (T3)
│   └── views/{Overview,Signals,Funnel,Trend,DataSnowflake}.tsx               (T4–T6)
└── tests/{suppression,metrics,labels}.test.ts       (T7)
```

---

## 3. Task breakdown

Each task is independently implementable and verifiable. One PR per task; keep them small. `T1 → T2 → T3` are sequential; `T4–T6` can run in parallel after T3.

| ID | Task | Done when (machine-checkable) |
|---|---|---|
| **T1** | Vite + React 18 + TS + Tailwind scaffold; `src/tokens.ts` holds the palette and font stacks | `npm ci && npm run build` succeeds; CI build job activates and is green |
| **T2** | `scripts/generate.ts`: fixed-seed generator emitting the three scenario JSONs | `npm run generate` twice → `git diff --exit-code src/data` returns 0; scenario A JSON matches PRD §3.5 values exactly |
| **T3** | Shell: header, tab nav, context bar, footer + shared components + `src/lib` | All 5 tabs reachable; zero console errors; header/footer synthetic labels present |
| **T4** | Overview + Signals views | Overview shows the 5 KPIs; Signals shows Low 52 / Moderate 33 / Priority 15 with counts of valid captures |
| **T5** | Funnel + Trend views | Funnel reads 10,000 → 3,800 → 2,800 → 950 → 420 (scenario A, all departments); Trend renders both series and the guardrail band |
| **T6** | Data & Snowflake view | 4 source cards + 3-column plane diagram + the two open-item boxes render; source chips resolve for every metric |
| **T7** | Unit tests (see §5) | `npm test` green; suppression, denominator, and label tests present |
| **T8** | Offline bundle + Pages deploy | `dist/` opens from `file://` with networking off and is fully functional; Pages URL live |
| **T9** | CI completion: Lighthouse CI, synthetic-label screenshot test, fixed-seed double-run check | All jobs green on a PR; thresholds per PRD §4a |

---

## 4. Contracts

### 4.1 Data generator (`scripts/generate.ts`)

- **Fixed seed, no `Math.random()` at runtime.** The app reads committed JSON only; the generator is the single place data is produced.
- Emits one file per scenario. Shape (derive types with `zod` or plain TS interfaces — no new runtime dependency needed):

```ts
type Scenario = {
  id: 'A' | 'B' | 'C';
  label: string;
  eligibleEmployees: number;
  dependentRatio: number;      // 2.2 (est.) — labelled "est." in the UI
  pmpmAllowed: number;
  fractions: { activated: number; valid: number; openActions: number; completed: number };
  signals: { key: 'Low' | 'Moderate' | 'Priority'; sharePct: number }[];
  trend: { month: string; interventionPct: number; controlPct: number }[];
  allowedGuardrail: { month: string; lo: number; hi: number; observed: number }[];
  departments: { key: string; n: number }[];   // one department < 20 per scenario
  freshness: { eligibilityThrough: string; claimsThrough: string; completenessPct: number };
};
```

- Scenario A is authoritative and must reproduce PRD §3.5 exactly. B and C preserve A's ratios; only the base counts and PMPM differ.
- Every scenario keeps one department below 20 so suppression is always demonstrable.

### 4.2 Suppression (`src/lib/suppression.ts`)

Pure function, no UI: given a group size, return whether values may be shown. Threshold is a named constant `MIN_CELL_SIZE = 20`. When suppressed, views render the `Suppressed` component and **never** a partial value, a rounded value, or a zero. Withheld wording is fixed: `Suppressed (n<20)`.

### 4.3 Denominators (`src/lib/metrics.ts`)

Two denominators, never interchangeable:
- participation metrics ÷ **eligible employees**
- cost metrics ÷ **covered member-months** (`eligibleEmployees × dependentRatio × months`)

Every metric definition carries which denominator it uses; the UI renders that label under each figure. A metric with no declared denominator is a type error. Model it so.

### 4.4 Source provenance (`src/lib/sources.ts`)

Each metric maps to a source of record (`HRIS 834`, `App events`, `TPA 837D/835`, `Clinical partner`) plus an ingestion note. Chips are toggleable and hover-titled, as in the prototype. Adding a metric without a source mapping must fail typecheck or a test.

---

## 5. Tests (T7 minimum set)

- **suppression**: below threshold → withheld; at and above → shown; boundary at exactly 20 is shown.
- **metrics**: participation and cost denominators produce the documented scenario-A figures; a cost metric divided by employees is rejected by the type system or a test.
- **labels**: every view module's rendered output contains the synthetic-data label; the forbidden-term list does not appear in any rendered string.
- **generator**: two runs produce byte-identical JSON.

Add regression tests for every bug `/qa` finds.

---

## 6. Constraints recap

Stack is fixed (PRD §3.4): Vite · React 18 · TypeScript · Tailwind · Recharts · React state + URL query. No global state library, no second chart library, no component library, no CSS-in-JS runtime. Any additional dependency requires a stated reason in the PR body (ponytail applies).

Prototype note: the prototype uses inline `style` objects. In production, move colors and fonts into `tokens.ts` and the Tailwind theme; keep the values identical.

Red lines and conduct: `AGENTS.md`. Acceptance: PRD §4a. Owner walkthrough: PRD §4b. Read it before T4–T6, since it is the script the Owner will run against your work.

---

## 7. Suggested sprint sequence (Claude Code)

1. `/office-hours` on `docs/PRD.md` — pressure-test before any code. Broken premises → PRD PR.
2. `/plan-eng-review` to lock the file map and the T2 data contract; `/plan-design-review` on the prototype (it is a real UI, so this applies).
3. Hand T1–T2 to Codex. Then `/review` + `/qa` per PR; `/codex` for a cross-model second opinion on T2 (the data contract is where a silent error is most expensive).
4. T3 → T4–T6 in parallel → T7.
5. Before `/ship`: `bash scripts/check-forbidden-terms.sh` and the kill-ai-slop Mode B scan must both pass. Then T9. (T8's offline bundle went with the booth on 2026-08-13.)
6. ~~Freeze **2026-08-25**~~ — void. It was the booth demo's date, and the demo was scrapped. The gate is the PRD §4b walkthrough, not a date.
