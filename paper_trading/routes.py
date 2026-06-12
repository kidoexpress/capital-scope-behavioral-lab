from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

import yfinance as yf
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from .engine import engine


router = APIRouter(prefix="/portfolio", tags=["paper-trading"])


class CreatePortfolioRequest(BaseModel):
    name: str = Field(min_length=1)
    initial_cash: float = Field(gt=0)


class TradeRequest(BaseModel):
    action: Literal["buy", "sell"]
    ticker: str = Field(min_length=1)
    shares: float = Field(gt=0)
    date: Optional[str] = None


def api_error(exc: Exception) -> HTTPException:
    status = 404 if isinstance(exc, KeyError) else 400
    return HTTPException(status_code=status, detail=str(exc).strip("'"))


# ── Static routes first (must be before /{portfolio_id}) ──────────────────────

@router.post("/create")
def create_portfolio(payload: CreatePortfolioRequest):
    try:
        portfolio = engine.create_portfolio(payload.name, payload.initial_cash)
        return {
            "portfolio_id": portfolio.portfolio_id,
            "name": portfolio.name,
            "cash": portfolio.cash_balance,
            "initial_cash": portfolio.initial_cash,
            "total_value": portfolio.cash_balance,
            "holdings": [],
            "created_at": portfolio.created_at,
        }
    except Exception as exc:
        raise api_error(exc)


@router.get("/list")
def list_portfolios():
    rows = []
    for portfolio in engine.portfolios.values():
        try:
            summary = engine.summarize_portfolio(portfolio.portfolio_id)
        except Exception:
            summary = {
                "portfolio_id": portfolio.portfolio_id,
                "name": portfolio.name,
                "cash": portfolio.cash_balance,
                "total_value": portfolio.cash_balance,
                "holdings": [],
            }
        rows.append(summary)
    return rows


@router.get("/default-dates")
def default_dates():
    """Return a sensible default start/end date range (1 year back)."""
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=365)
    return {"start": start.isoformat(), "end": end.isoformat()}


# ── Parameterised routes ───────────────────────────────────────────────────────

@router.get("/{portfolio_id}")
def get_portfolio(portfolio_id: str):
    try:
        return engine.summarize_portfolio(portfolio_id)
    except Exception as exc:
        raise api_error(exc)


@router.post("/{portfolio_id}/trade")
def trade(portfolio_id: str, payload: TradeRequest):
    try:
        transaction = engine.execute_trade(
            portfolio_id, payload.action, payload.ticker, payload.shares, payload.date
        )
        return {
            "transaction": transaction,
            "updated_portfolio": engine.summarize_portfolio(portfolio_id),
        }
    except Exception as exc:
        raise api_error(exc)


@router.get("/{portfolio_id}/metrics")
def metrics(
    portfolio_id: str,
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
):
    try:
        return engine.get_performance_report(portfolio_id, start, end)
    except Exception as exc:
        raise api_error(exc)


@router.get("/{portfolio_id}/equity-curve")
def equity_curve(
    portfolio_id: str,
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
):
    try:
        report = engine.get_performance_report(portfolio_id, start, end)
        return report["equity_curve"]
    except Exception as exc:
        raise api_error(exc)


@router.delete("/{portfolio_id}")
def delete_portfolio(portfolio_id: str):
    try:
        engine.delete_portfolio(portfolio_id)
        return {"deleted": True, "portfolio_id": portfolio_id}
    except Exception as exc:
        raise api_error(exc)


@router.get("/fundamentals/{ticker}")
def get_fundamentals(ticker: str):
    """Return live fundamental data for a single ticker via yfinance."""
    try:
        t = yf.Ticker(ticker.upper())
        info = t.info
        rev = info.get("totalRevenue") or 0
        rev_growth = info.get("revenueGrowth")
        yoy_growth = round(rev_growth * 100, 1) if rev_growth else None
        mkt_cap = info.get("marketCap") or 0
        ps_ttm = round(mkt_cap / rev, 2) if rev > 0 else None
        gross_margin = info.get("grossMargins")
        gross_margin_pct = round(gross_margin * 100, 1) if gross_margin else None
        ev_ebitda = info.get("enterpriseToEbitda")
        return {
            "ticker": ticker.upper(),
            "name": info.get("longName") or info.get("shortName") or ticker.upper(),
            "sector": info.get("sector", "N/A"),
            "psTTM": ps_ttm,
            "evEbitda": round(ev_ebitda, 1) if ev_ebitda else None,
            "grossMargin": gross_margin_pct,
            "yoyGrowth": yoy_growth,
            "marketCap": mkt_cap,
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
