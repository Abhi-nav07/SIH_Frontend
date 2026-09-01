# V0_3_MERGE_NOTES.md

## Scope of this pass

V0.3's job, per its own prompt: build the data backbone and integration
architecture *behind* the existing V0.2 frontend, additively, without
redoing V0.2's in-flight scope (sim clock, SLA escalation, MapLibre, etc.).
This document records exactly what was added, what (if anything) was
touched in existing files, and how to merge this cleanly once V0.2 lands.

## Files added

```
backend/                              # entire directory is new
  app/
    core/{config,db}.py
    models/{base,source,events,assets,scenario}.py
    schemas/{common,events,assets,scenario}.py
    adapters/{base,cap_adapter}.py
    fixtures/cap_{red_rainfall,flash_flood,landslide,cancel}.json
    repositories/{event_repo,asset_repo,scenario_repo}.py
    services/{freshness_service,confidence_service,conflict_service,
              snapshot_service,stream_service,seed_service}.py
    api/deps.py
    api/routes/{health,sources,alerts,scenarios,assets,shelters,
                 hospitals,resources}.py
    main.py
  tests/{conftest,test_cap_adapter,test_freshness,
         test_conflict_and_confidence,test_scenario_api,
         test_verification,test_assets_listing}.py
  alembic.ini, alembic/env.py, alembic/script.py.mako,
  alembic/versions/0001_initial.py
  requirements.txt, .env.example, .gitignore, README.md, pytest.ini

shared/
  types.ts                            # TS mirror of backend Pydantic schemas

lib/providers/
  types.ts                            # ScenarioDataProvider interface
  mockProvider.ts                     # wraps existing lib/scenario store, read-only
  apiProvider.ts                      # talks to the FastAPI backend
  index.ts                            # provider selection helper

V0_3_MERGE_NOTES.md                   # this file
```

## Existing files modified

**None.** No file under `app/`, `components/`, `lib/scenario/`, or any other
pre-existing path was edited. This was a hard constraint from both
MASTER_SPEC's merge-safety rule and the V0.3 prompt's "avoid unnecessary
edits to existing frontend components" instruction, and it held throughout:
`lib/providers/mockProvider.ts` reads `useScenarioStore.getState()` but
never calls a store *action*, so V0.2's decision/task/replan logic remains
the single source of truth for the running app. The five existing pages
still render from the store exactly as before — nothing imports
`lib/providers/` yet.

## Why nothing frontend-facing changed yet

The V0.3 prompt asks for the data-provider abstraction to exist, not for
pages to be rewritten to use it ("Do NOT rewrite the current pages"). So:

- `ScenarioDataProvider` / `MockScenarioProvider` / `ApiScenarioProvider`
  are built and self-consistent, but nothing currently calls them.
- Wiring a page (or a new page) to use `getDefaultScenarioProvider()`
  instead of `useScenarioStore` directly is a follow-up, and should probably
  happen alongside V0.2's MapLibre swap rather than before it, since that's
  when the frontend will actually want real geographic data instead of SVG
  coordinates.

## Known limitations / what to verify locally

This development sandbox has **no network access** — `pip install fastapi`
and equivalents fail outright (`ERROR: No matching distribution found`).
That means I could write and syntax-check the code, but could not:

- Run `pip install -r backend/requirements.txt`
- Run `pytest` and get real output
- Run `uvicorn app.main:app` and confirm it boots
- Run `alembic revision --autogenerate` (the initial migration was
  hand-written to mirror the models instead — see the note in
  `backend/alembic/versions/0001_initial.py` and `backend/README.md`)
- Run `npm install` for the frontend, or a project-context `tsc --noEmit`
  covering `lib/providers/` against the real `zustand`/`next` types

What I *did* verify, without needing those packages:

- Every backend `.py` file passes `python3 -m py_compile` (syntax-valid).
- `shared/types.ts` type-checks cleanly standalone
  (`tsc --noEmit --strict`).
- `lib/providers/*.ts` type-checks with only the errors expected from
  missing `@types/node`/`zustand` in an isolated check outside the real
  project (`process` global, implicit-`any` cascades from zustand's types
  being unresolved) — no errors attributable to this code itself.
- Seed data ids (`alpha`/`beta`/`gamma`/`delta`, `shelter-a`/`shelter-b`,
  `bridge-3`) were cross-checked by hand against `lib/scenario/data.ts`.

**Please run these locally** (where you have network access) before
treating V0.3 as verified, and treat any failures as real bugs to fix, not
as something I've already confirmed working:

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest -v
uvicorn app.main:app --reload --port 8000   # then check http://localhost:8000/docs
```

```bash
npm install
npx tsc --noEmit
```

## Possible conflicts with V0.2

Low risk, since no shared files were touched. The two places to double-check
once V0.2's work lands:

1. **`lib/scenario/store.ts` shape.** `MockScenarioProvider` reads
   `villages`, `edges`, `shelters`, `clockSeconds` off
   `useScenarioStore.getState()`. If V0.2 renames or restructures store
   state (e.g. while adding the sim clock or SLA escalation engine), this
   file's field references will need updating to match — it was written
   against the store shape in this upload's zip specifically.
2. **`lib/scenario/data.ts` ids.** The backend seed data
   (`app/services/seed_service.py`) was hand-matched to the ids in this
   zip's `data.ts`. If V0.2 adds/renames villages, shelters, or the bridge
   id, update `seed_demo_scenario()` to match so a future
   `ApiScenarioProvider` swap doesn't require remapping.

## Definition-of-done checklist (from the V0.3 prompt)

- [x] FastAPI backend written (not yet run in this sandbox — see above)
- [x] Seed scenario defined, matches frontend ids
- [x] `/api/v1/scenarios/{id}/state` returns normalized operational state
- [x] CAP-like sample alert can be ingested (`POST /alerts/ingest/cap`)
- [x] Bridge/road/shelter/hospital/resource data modeled with provenance
- [x] Every critical data object has provenance + freshness
- [x] Conflicting data is represented (`status: "conflict"`), never
      silently overwritten
- [x] Manual field verification works and supersedes conflicts
- [x] Scenario snapshots work (created on start + on events, replayable)
- [x] Realtime event stream emits at least one infrastructure change
      (SSE, `app/services/stream_service.py`)
- [x] Frontend data-provider abstraction exists
- [x] Mock provider works without the backend (reads the existing store)
- [ ] `pytest` passes — **written, not run**; run locally to confirm
- [ ] OpenAPI docs load — **should work** (`FastAPI(...)` default), not
      confirmed by an actual server boot in this sandbox
- [x] This file
