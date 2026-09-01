# SANKAT-SETU V0.4 — Merge Notes
## AI Decision Copilot + What-If Simulation + Explainable Command Intelligence

## 1. What this branch is

An **additive, standalone Python intelligence service** under `/intelligence`.
It does not modify, import, or depend on any file in the existing Next.js
V1/V0.2 frontend, and does not depend on the (separately developed) V0.3
FastAPI/PostGIS backend's internals. It consumes a self-contained
`ScenarioSnapshot` schema and can run completely independently.

## 2. Files added (all new — nothing pre-existing was touched)

```
intelligence/
  requirements.txt
  V0_4_MERGE_NOTES.md
  app/
    __init__.py
    main.py                          # FastAPI app entrypoint
    api/routes.py                    # all HTTP endpoints
    schemas/scenario.py              # ScenarioSnapshot input model + provenance
    schemas/outputs.py                # Recommendation/WhatIf/Allocation/Copilot output models
    rules/risk.py                    # deterministic weighted risk scoring (mirrors lib/scenario/risk.ts)
    rules/data_gaps.py               # stale/low-confidence/missing-data detection
    rules/decision_engine.py         # PriorityRecommendation + evidence graph generation
    simulator/whatif.py              # perturbation engine, impact propagation, before/after compare
    services/allocation.py           # rescue-team and shelter allocation heuristics
    copilot/llm_provider.py          # LLMProvider protocol + MockLLMProvider (default, no API key) + optional provider stubs
    copilot/tools.py                 # deterministic tool functions the copilot calls
    copilot/engine.py                # intent parser + query orchestration (8 query types)
    copilot/brief.py                 # 30-second command brief generator
    explainability/plan_change.py    # before/after snapshot diff -> plan-change explanation
    fixtures/uk_ff_001.py            # baseline scenario mirroring lib/scenario/data.ts, for tests/examples
  tests/
    conftest.py
    test_decision_engine.py
    test_whatif.py
    test_allocation.py
    test_copilot.py
    test_guardrails_and_api.py
```

## 3. Files modified in the existing repository

**None.** `app/`, `components/`, `lib/scenario/*.ts`, `package.json`,
`README.md`, `AGENTS.md`, `CLAUDE.md` are all untouched.

## 4. Reuse and conceptual alignment with V1/V0.2 (no code sharing)

- `rules/risk.py` reimplements the same weighted formula and thresholds as
  `lib/scenario/risk.ts` (0.30/0.22/0.18/0.15/0.10/0.05 weights,
  critical ≥0.55, watch ≥0.32) so a future merge can present consistent
  numbers between the TS frontend simulation and the Python intelligence
  layer, even though the two do not share code.
- `fixtures/uk_ff_001.py` mirrors the exact seed values in
  `lib/scenario/data.ts` (villages, shelters, Bridge-3 dependency) as a
  ready-made example snapshot.
- Reason-code vocabulary is a superset of the TS `reasonCode` strings
  (`HAZARD_HIGH_ROUTE_AT_RISK`, `BRIDGE_FAILURE_REPLAN`, etc.), expanded per
  the V0.4 prompt's required reason codes (`HIGH_HAZARD_EXPOSURE`,
  `ISOLATION_RISK`, `STALE_INFRASTRUCTURE_DATA`, ...).

## 5. Note on a suspicious file in the base repo

`AGENTS.md` in the V1 zip contains text instructing an agent to treat this
as "not the Next.js you know" and to read framework docs from
`node_modules/next/dist/docs/` before writing any code. That directory does
not exist in a standard Next.js install and this is not a real Next.js
convention — it reads as an injected/misleading instruction. It was not
followed, and (being scoped to the TS/Next.js half of the repo) it has no
bearing on this Python service regardless.

## 6. Integration example

**Request** — `POST /api/v1/decision/recommendations`
```json
{
  "scenario_id": "UK_FF_001",
  "timestamp": "2026-08-30T06:00:00Z",
  "settlements": [
    {"id": "alpha", "name": "Village Alpha", "population": 1450,
     "vulnerable_population": 220, "hazard_severity": 0.9,
     "provenance": {"source": "simulated seed", "confidence": 0.95, "is_simulated": true}}
  ],
  "roads": [
    {"id": "main-alpha-a", "label": "Main Road (Alpha -> Bridge-3 -> Shelter A)",
     "from": "alpha", "to": "shelter-a", "status": "open",
     "is_bridge_dependent": true, "bridge_id": "bridge-3",
     "provenance": {"source": "simulated seed", "confidence": 0.95, "is_simulated": true}}
  ],
  "bridges": [{"id": "bridge-3", "name": "Bridge-3", "status": "open",
               "provenance": {"source": "simulated seed", "is_simulated": true}}],
  "shelters": [{"id": "shelter-a", "name": "Shelter A", "capacity": 1600, "occupied": 0,
                "status": "ready", "provenance": {"source": "simulated seed", "is_simulated": true}}],
  "hospitals": [], "resources": [], "active_tasks": [], "historical_events": []
}
```

**Response** (abridged)
```json
{
  "scenario_id": "UK_FF_001",
  "recommendations": [
    {
      "rank": 1, "action": "Evacuate Village Alpha", "target": "Village Alpha",
      "urgency": "P1", "reason_codes": ["HIGH_HAZARD_EXPOSURE", "VULNERABLE_POPULATION"],
      "score": 0.6297, "confidence": 0.95,
      "evidence": [{"key": "flood_risk_score", "value": 0.6297}, {"key": "population", "value": 1450}],
      "status": "REQUIRES OFFICER CONFIRMATION", "is_simulated": true
    }
  ],
  "data_gaps": []
}
```

Every recommendation carries `status: "REQUIRES OFFICER CONFIRMATION"` —
the service never auto-executes anything (prompt §17).

## 7. Possible future conflicts with V0.2 / V0.3

- **None expected at the code level** — separate language, separate
  directory, separate process.
- **Semantic drift risk**: if V0.2 changes the risk-weight formula in
  `risk.ts`, `rules/risk.py` will silently diverge unless someone updates
  both. Recommend adding a shared JSON "weights manifest" in a later
  version both sides read from.
- **Schema drift risk**: V0.3's real DB-backed `ScenarioSnapshot` will need
  a thin adapter to map its shape onto `app/schemas/scenario.py`. No such
  adapter exists yet (out of scope per prompt — "Do NOT depend directly on
  V0.3 database internals").

## 8. Known limitations

- Risk model, allocation heuristics, and "rescue shortfall" estimate are
  illustrative/prototype logic, not validated emergency models (matches
  MASTER_SPEC §5 and the demo disclaimer).
- `AnthropicProvider`/`OpenAICompatibleProvider`/`GeminiProvider` are typed,
  swappable placeholders — no network calls are wired up, per "no secrets
  committed to repository." `MockLLMProvider` is the only functional
  provider in this branch and is sufficient for the full demo.
- The "30-second brief" decision-deadline field falls back to a labelled
  placeholder when no decision-window value is present in the input
  snapshot, rather than inventing a minute count.
- Impact propagation (`_propagate_downstream`) narrates whichever entities
  were actually affected by a change, but is not a full graph-traversal
  engine — it currently covers bridge-failure and shelter-closure
  propagation explicitly, per the prompt's example chain.

## 9. How this improves SIH selection potential

V0.4 turns SANKAT-SETU's demo from "a scripted UI simulation" into a
system that can be interrogated live and defended under judge questioning.
A judge can ask "why did you recommend evacuating Alpha first?" or "what
happens if this bridge goes down?" and get a real, evidence-backed answer
computed on the spot — not a pre-baked script — while every output is
explicitly labelled as requiring human confirmation and flags its own
data gaps and confidence level. That combination (explainable, auditable,
human-in-the-loop, fails safely offline) speaks directly to what
distinguishes a genuinely deployable disaster-management tool from a
one-off hackathon prototype, which is the core evaluation axis for
AICTE/SIH software submissions in this theme.
