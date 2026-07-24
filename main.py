"""CapitalScope Terminal — FastAPI backend entry point.

Run with:
    uvicorn main:app --reload --port 8100
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from paper_trading import router as paper_trading_router
from paper_trading.proxy import proxy_router

app = FastAPI(
    title="CapitalScope Terminal API",
    description="Backend for CapitalScope Terminal: paper trading engine, data feeds, and metrics.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Behavioral Lab dev ports (isolated from upstream 5173/5174)
        "http://localhost:5273",
        "http://localhost:5274",
        "http://127.0.0.1:5273",
        "http://127.0.0.1:5274",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(paper_trading_router, prefix="/api")
app.include_router(proxy_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
