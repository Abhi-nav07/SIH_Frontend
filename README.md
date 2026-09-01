# SANKAT SETU

SANKAT SETU is an alert-to-action disaster orchestration prototype for SIH26206. The completed frontend demonstrates the full operational loop for an Uttarakhand flash-flood exercise:

`warning → risk priority → department tasks → field acknowledgement → route failure → replan → citizen instruction → after-action learning`

## Frontend modules

- **Command Center** — alert intake, risk summary, operational map, explainable P1 recommendation and replan control.
- **Action Board** — task search/filtering, department ownership, acknowledgement, execution, SLA countdowns and automatic escalation.
- **Decision Intelligence** — evidence-backed copilot, 30-second brief and before/after what-if comparison.
- **Last-Mile Alert** — route/shelter-specific mobile instruction and a citizen feedback loop that creates a P1 SDRF assistance task.
- **Living DDMP** — routes, infrastructure, shelters, resources and verification freshness as live operational data.
- **After-Action** — exercise timeline, department completion chart, coordination metrics, learning signals and JSON export.

The UI is responsive across desktop, tablet and mobile. All critical recommendations are explicitly marked as requiring officer confirmation.

## Run the frontend

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Production validation:

```bash
npm run lint
npm run build
npm start
```

## Optional V0.4 intelligence service

The Decision Intelligence page works without a Python service by using a deterministic frontend fallback. To use the full V0.4 FastAPI service:

```bash
cd intelligence
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The Next.js server proxies supported requests to `http://127.0.0.1:8000` by default. Override it when needed:

```bash
INTELLIGENCE_SERVICE_URL=http://127.0.0.1:8000 npm run dev
```

## Three-minute demo path

1. Open **Command Center** and start the exercise.
2. Inspect the P1 recommendation and expand **Why this action?**
3. Open **Action Board**, acknowledge/complete tasks, then advance exercise time to test SLA escalation.
4. Open **Decision Intelligence**, ask a quick question, and compare a Bridge-3 failure.
5. Apply the bridge failure after confirmation; verify the route, shelter, citizen alert and task replan.
6. In **Last-Mile Alert**, request assistance and confirm a P1 SDRF task appears on the Action Board.
7. Open **After-Action** to review the audit trail and export the exercise report.

## Project structure

```text
app/                 Next.js routes and intelligence proxy
components/          Responsive product UI
lib/scenario/        Deterministic simulation and Zustand state
lib/intelligence/    Snapshot adapter, typed client and fallbacks
backend/             V0.3 FastAPI/PostGIS service (preserved)
intelligence/        V0.4 explainable intelligence service (preserved)
shared/              Shared V0.3 types (preserved)
```

## Safety note

All scenario values, risk weights and recommendations are illustrative prototype inputs. They are not validated emergency forecasts or official operational directions. Production use requires authoritative data integrations, domain validation, access controls, audit logging and responsible-agency approval.
