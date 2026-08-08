"""FastAPI routes for the Public Portfolio Tracker.

Serves real SEC 13F holdings, curated strategy summaries, measured performance vs
SPY, House disclosure activity, and a replication plan that converts a public
portfolio into paper-trading orders. No fabricated data: unavailable values are
returned as null with an explicit note.
"""
from __future__ import annotations

from dataclasses import asdict
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from .catalog import CATALOG, CATALOG_BY_SLUG, get_portfolio
from .congress import disclosure_summary, recent_trade_disclosures
from .edgar import fetch_latest_13f
from .performance import evaluate_disclosed_portfolio, period_start_from

router = APIRouter(prefix="/public-portfolios", tags=["public-portfolios"])

DISCLAIMER = (
    "Holdings come from official SEC 13F filings, disclosed quarterly with up to a 45-day lag "
    "and covering only long US-listed equity positions. Returns shown are a hypothetical "
    "buy-and-hold of the disclosed weights, not the manager's realized performance. "
    "Educational research only — not investment advice."
)


def _profile(p) -> dict:
    d = asdict(p)
    d["executive_summary"] = {
        "headline": p.headline,
        "strategy": p.strategy,
        "edge": p.edge,
        "concentration": p.concentration,
        "turnover": p.turnover,
        "replication_note": p.replication_note,
        "caveats": p.caveats,
        "style_tags": p.style_tags,
    }
    return d


@router.get("/catalog")
def catalog():
    """All tracked public portfolios with their executive summaries."""
    return {
        "portfolios": [_profile(p) for p in CATALOG],
        "categories": sorted({p.category for p in CATALOG}),
        "disclaimer": DISCLAIMER,
    }


@router.get("/{slug}")
def portfolio_detail(slug: str, performance: bool = Query(True)):
    """Live holdings + executive summary + measured performance for one manager."""
    if slug not in CATALOG_BY_SLUG:
        raise HTTPException(404, f"unknown portfolio: {slug}")
    p = get_portfolio(slug)

    filing = fetch_latest_13f(p.cik)
    if not filing:
        return {
            "profile": _profile(p),
            "filing": None,
            "holdings": [],
            "performance": None,
            "note": "No 13F filing could be retrieved for this manager.",
            "disclaimer": DISCLAIMER,
        }

    holdings = [
        {
            "issuer": h.issuer,
            "ticker": h.ticker,           # null when it could not be resolved
            "cusip": h.cusip,
            "weight": round(h.weight, 6),
            "value_usd": h.value_usd,
            "shares": h.shares,
        }
        for h in filing.holdings
    ]
    unresolved = sum(1 for h in filing.holdings if not h.ticker)

    perf = None
    if performance:
        weights = {h.ticker: h.weight for h in filing.holdings if h.ticker}
        perf = asdict(evaluate_disclosed_portfolio(weights, period_start_from(filing.period)))

    return {
        "profile": _profile(p),
        "filing": {
            "period": filing.period,
            "filed_at": filing.filed_at,
            "accession": filing.accession,
            "total_value_usd": filing.total_value_usd,
            "positions": len(filing.holdings),
            "unresolved_tickers": unresolved,
            "source_url": filing.source_url,
        },
        "holdings": holdings,
        "performance": perf,
        "disclaimer": DISCLAIMER,
    }


@router.get("/{slug}/replication-plan")
def replication_plan(slug: str, capital: float = Query(100_000, gt=0), top_n: int = Query(10, ge=1, le=50)):
    """Convert a public portfolio into concrete paper-trading orders.

    Weights are renormalized over the resolvable top-N holdings; share counts are
    left to the paper-trading engine, which prices orders at execution time.
    """
    if slug not in CATALOG_BY_SLUG:
        raise HTTPException(404, f"unknown portfolio: {slug}")
    p = get_portfolio(slug)
    filing = fetch_latest_13f(p.cik)
    if not filing:
        raise HTTPException(404, "no filing available to replicate")

    resolvable = [h for h in filing.holdings if h.ticker][:top_n]
    if not resolvable:
        raise HTTPException(422, "no holdings in this filing could be mapped to tradable tickers")

    total_w = sum(h.weight for h in resolvable) or 1.0
    orders = [
        {
            "ticker": h.ticker,
            "issuer": h.issuer,
            "target_weight": round(h.weight / total_w, 6),
            "allocation_usd": round(capital * (h.weight / total_w), 2),
        }
        for h in resolvable
    ]
    return {
        "slug": slug,
        "manager": p.name,
        "capital": capital,
        "orders": orders,
        "coverage": round(total_w, 6),
        "excluded_positions": len(filing.holdings) - len(resolvable),
        "filing_period": filing.period,
        "filed_at": filing.filed_at,
        "replication_note": p.replication_note,
        "disclaimer": DISCLAIMER,
    }


@router.get("/congress/activity")
def congress_activity(year: Optional[int] = None, limit: int = Query(40, ge=1, le=200)):
    """US House trade-disclosure activity (official index; PDFs not parsed)."""
    rows = recent_trade_disclosures(year, limit=limit)
    return {
        "summary": disclosure_summary(year),
        "recent": [asdict(d) for d in rows],
        "disclaimer": "Official US House Clerk disclosure index. Trade details (ticker, amount, "
                      "direction) are inside the linked PDFs and are not extracted here.",
    }
