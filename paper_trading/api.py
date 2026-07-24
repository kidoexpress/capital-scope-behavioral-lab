from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .engine import engine


app = FastAPI(title="Capital Scope Behavioral Lab — Paper Trading API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5273", "http://localhost:5274", "http://127.0.0.1:5273", "http://127.0.0.1:5274"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.post("/api/portfolio/create")
def create_portfolio(payload: CreatePortfolioRequest):
    try:
        portfolio = engine.create_portfolio(payload.name, payload.initial_cash)
        return {
            "portfolio_id": portfolio.portfolio_id,
            "name": portfolio.name,
            "cash": portfolio.cash_balance,
            "created_at": portfolio.created_at,
        }
    except Exception as exc:
        raise api_error(exc)


@app.get("/api/portfolio/list")
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


@app.get("/api/portfolio/{portfolio_id}")
def get_portfolio(portfolio_id: str):
    try:
        return engine.summarize_portfolio(portfolio_id)
    except Exception as exc:
        raise api_error(exc)


@app.post("/api/portfolio/{portfolio_id}/trade")
def trade(portfolio_id: str, payload: TradeRequest):
    try:
        transaction = engine.execute_trade(portfolio_id, payload.action, payload.ticker, payload.shares, payload.date)
        return {
            "transaction": transaction,
            "updated_portfolio": engine.summarize_portfolio(portfolio_id),
        }
    except Exception as exc:
        raise api_error(exc)


@app.get("/api/portfolio/{portfolio_id}/metrics")
def metrics(
    portfolio_id: str,
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
):
    try:
        return engine.get_performance_report(portfolio_id, start, end)
    except Exception as exc:
        raise api_error(exc)


@app.get("/api/portfolio/{portfolio_id}/equity-curve")
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


@app.delete("/api/portfolio/{portfolio_id}")
def delete_portfolio(portfolio_id: str):
    try:
        engine.delete_portfolio(portfolio_id)
        return {"deleted": True, "portfolio_id": portfolio_id}
    except Exception as exc:
        raise api_error(exc)


@app.get("/api/portfolio/default-dates")
def default_dates():
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=365)
    return {"start": start.isoformat(), "end": end.isoformat()}
