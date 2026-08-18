"""Maps Pluggy investment records onto this app's PortfolioHolding shape.

PortfolioHolding (frontend, src/types/index.ts) requires shares + avgCost +
currentPrice — a shares-at-a-price model that fits equities/ETFs/FIIs
directly. Fixed income (CDB/LCI/LCA/Tesouro Direto) has no share count or
market price; it's mapped as ONE synthetic "share" whose price is the current
balance, so it fits the existing schema without a migration:
  shares=1, avgCost=amount applied, currentPrice=current balance.
This deliberately does not attempt to model day-to-day fixed-income price
volatility — there isn't a traded price to model. If these positions later
feed the covariance/forecast engine (Financial Twin Lab), they should be
treated as a near-riskless bucket by rate+maturity, not given a fabricated
return series.
"""
from __future__ import annotations

FIXED_INCOME_TYPES = {"FIXED_INCOME", "TREASURY"}


def map_investment_to_holding(record: dict) -> dict:
    """One Pluggy investment record -> one PortfolioHolding-shaped dict.

    Weight is left at 0 here; the caller normalizes weights across the whole
    batch (mirrors how the frontend's own addHolding + normalizeWeights works
    for manually-entered positions).
    """
    is_fixed_income = record.get("type") in FIXED_INCOME_TYPES
    code = record.get("code") or record.get("name", "UNKNOWN")

    if is_fixed_income:
        balance = float(record.get("balance", 0.0))
        applied = float(record.get("amount", balance)) or balance or 1.0
        return {
            "symbol": code,
            "name": record.get("name", code),
            "weight": 0.0,
            "shares": 1,
            "avgCost": applied,
            "currentPrice": balance,
            "sector": "Fixed Income",
            "value": balance,  # used for weight normalization before insert
        }

    quantity = float(record.get("quantity", 1) or 1)
    unit_price = float(record.get("unitPrice", 0.0))
    applied_total = float(record.get("amount", unit_price * quantity))
    return {
        "symbol": code,
        "name": record.get("name", code),
        "weight": 0.0,
        "shares": quantity,
        "avgCost": (applied_total / quantity) if quantity else unit_price,
        "currentPrice": unit_price,
        "sector": record.get("sector", "Unknown"),
        "value": unit_price * quantity,
    }


def map_investments_to_holdings(records: list[dict]) -> list[dict]:
    """A batch of investment records -> weighted PortfolioHolding dicts."""
    mapped = [map_investment_to_holding(r) for r in records]
    total_value = sum(h["value"] for h in mapped) or 1.0
    for h in mapped:
        h["weight"] = h.pop("value") / total_value
    return mapped
