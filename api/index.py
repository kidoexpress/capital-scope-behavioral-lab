"""Vercel Python entrypoint.

This is a DELIBERATELY SMALLER app than main.py (used by Railway/local), not a
copy of it. Vercel's Hobby-tier function size limit is 225MB after
optimization; importing paper_trading pulls in yfinance (lxml + curl_cffi
native binaries) and pushed the bundle to 353MB even after dropping scipy and
pytest. paper_trading also persists to local JSON/SQLite files, which don't
survive Vercel's stateless serverless functions anyway — so leaving it out
here isn't a new regression, it was already going to be broken/degraded on
this platform.

Routes included, and why each is safe here:
- Yahoo proxy (paper_trading.proxy) — a raw httpx passthrough, no yfinance,
  no disk writes.
- Synthetic Portfolio Lab (/twin, /forecast, ...) — the guided Financial Twin
  flow; uses an in-memory MemoryStore, not a file-backed one.

Public Portfolios is NOT included here even though its API layer itself is
lightweight: performance.py imports paper_trading.data_feed for historical
prices, which pulls in yfinance's native deps (lxml, curl_cffi) and alone
pushed the bundle past even the reduced 225MB Hobby-tier limit. It's still
served by the full app (main.py) on Railway, which has no such constraint.

Full paper trading (persistent portfolios/trades) and the AI-agent proxies
(/api/claude, /api/fmp, /api/finnhub — dev-only Vite proxies with no FastAPI
equivalent yet) are also not available through this deployment.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from paper_trading.proxy import proxy_router
from synthetic_portfolio_lab.api_routes import router as synthetic_portfolio_router

app = FastAPI(title="Capital Scope Behavioral Lab API (Vercel)")

DEFAULT_ORIGINS = [
    "http://localhost:5273",
    "http://localhost:5274",
    "http://127.0.0.1:5273",
    "http://127.0.0.1:5274",
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

app.include_router(proxy_router, prefix="/api")
app.include_router(synthetic_portfolio_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "runtime": "vercel"}
