from fastapi import FastAPI

from app.api.routes import router

app = FastAPI(
    title="SANKAT-SETU Intelligence Service (V0.4)",
    description=(
        "AI Decision Copilot + What-If Simulation + Explainable Command Intelligence. "
        "Additive layer, independently runnable, no dependency on V0.2/V0.3 internals. "
        "Deterministic-first: works fully without any LLM API key."
    ),
    version="0.4.0",
)

app.include_router(router)
