"""Capital Scope Behavioral Lab — FastAPI backend entry point.

Run with:
    uvicorn main:app --reload --port 8100

In production (e.g. Railway) the platform injects $PORT and the start command
should bind to it — see Dockerfile. CORS origins can be extended without a code
change via the CORS_ORIGINS env var (comma-separated), for preview-deployment
URLs that aren't known ahead of time.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from paper_trading.routes import router as paper_trading_router
from paper_trading.proxy import proxy_router
from synthetic_portfolio_lab.api_routes import router as synthetic_portfolio_router
from public_portfolios.api_routes import router as public_portfolios_router
from open_finance.api_routes import router as open_finance_router

app = FastAPI(
    title="Capital Scope Behavioral Lab API",
    description="Backend for Capital Scope Behavioral Lab: paper trading engine, data feeds, metrics, and simulation.",
    version="1.0.0",
)

DEFAULT_ORIGINS = [
    # Behavioral Lab dev ports (isolated from upstream 5173/5174)
    "http://localhost:5273",
    "http://localhost:5274",
    "http://127.0.0.1:5273",
    "http://127.0.0.1:5274",
    # Production frontend (Vercel rewrites proxy /api/* server-side, so this
    # mainly covers direct/manual calls to the backend's own URL)
    "https://capital-scope-behavioral-lab.vercel.app",
]
extra_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=DEFAULT_ORIGINS + extra_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(paper_trading_router, prefix="/api")
app.include_router(proxy_router, prefix="/api")
app.include_router(synthetic_portfolio_router, prefix="/api")
app.include_router(public_portfolios_router, prefix="/api")
app.include_router(open_finance_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
