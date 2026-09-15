# Homeden: Governed Oral Health Evidence Layer for U.S. Employers

## Data architecture in a nutshell

This is the Snowflake-facing diagram: what enters the governed evidence layer, what stays outside it, and what the employer is allowed to see.

```mermaid
flowchart LR
    subgraph Left[Employee and source systems]
        APP[Employee app\nconsent, questionnaire,\nactions, engagement]
        E834[Employer or TPA\nEDI 834 eligibility]
        C837[TPA / ASO\nEDI 837D dental claims]
        R835[TPA / ASO\nEDI 835 remittance]
        HR[Employer HRIS\ndepartment history]
    end

    IMG[Raw oral images\nICLO-controlled U.S. storage]
    SIG[Derived oral signal\nLow / Moderate / Priority]

    subgraph SF[Snowflake governed evidence layer]
        RAW[RAW / STAGED\nsource preservation\nand validation]
        CAN[CANONICAL\nidentity, employer context,\ntime history]
        MART[PERSON-GRAIN MARTS\neligibility, claims,\nengagement, action match]
        GOV[GOVERNANCE\ntenant isolation, row access,\nminimum cell >= 20]
        OUT[EMPLOYER AGGREGATES\ncohort funnel, follow-through,\ncost and freshness]
    end

    DASH[Employer dashboard\naggregate-only delivery]

    APP --> RAW
    E834 --> RAW
    C837 --> RAW
    R835 --> RAW
    HR --> RAW

    IMG -. stays outside Snowflake .-> SIG
    SIG --> RAW

    RAW --> CAN --> MART --> GOV --> OUT --> DASH
```

## How to narrate it in 30 seconds

ICLO keeps raw oral imagery outside Snowflake in controlled U.S. storage. What enters Snowflake is the structured evidence layer: eligibility, claims, remittance, HR context, app events, consent records and derived oral-signal bands. Inside Snowflake, those records are standardized, linked at person grain, and governed before any employer view is produced. The employer never sees individual PHI or image data; it sees only aggregate measures such as participation, claims-confirmed follow-through, plan-paid cost and reporting freshness, with suppression applied below 20 distinct people.

## What Snowflake audiences should take away

- Snowflake is the governed evidence layer, not the image repository.
- The value is joining engagement to eligibility and claims, not storing another wellness app backend.
- The privacy boundary is explicit: person-grain processing inside the governed layer, aggregate-only output to employers.
- This design supports payer / TPA collaboration patterns such as Secure Data Sharing where available, without making that a prerequisite for the first pilot.
