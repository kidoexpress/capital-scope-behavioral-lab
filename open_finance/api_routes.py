"""Open Finance API routes.

Mounted at /api/open-finance by both main.py (Railway/local) and api/index.py
(Vercel) — stateless, so it runs identically on either. See __init__.py for
the mock/live switch and its honesty caveats.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from . import mock_data, pluggy_client
from .mapper import map_investments_to_holdings

router = APIRouter(prefix="/open-finance", tags=["open-finance"])


@router.get("/status")
def status():
    """Lets the frontend show an honest 'mock data' vs 'connected' badge."""
    live = pluggy_client.is_configured()
    return {
        "mode": "live" if live else "mock",
        "message": (
            "Connected to Pluggy."
            if live
            else "No Pluggy credentials configured — showing illustrative sample data."
        ),
    }


@router.get("/institutions")
async def institutions():
    """Institutions the Connect flow can offer. Mock mode: a fixed sample list."""
    if pluggy_client.is_configured():
        # Pluggy's real /connectors endpoint lists live institutions; not
        # wired up here since no sandbox account exists to verify the
        # response shape against. Falls back to the sample list either way
        # rather than guessing at an untested integration.
        pass
    return {"institutions": mock_data.MOCK_INSTITUTIONS, "mode": "mock" if not pluggy_client.is_configured() else "live"}


@router.post("/connect-token")
async def connect_token():
    """Token the frontend's Pluggy Connect widget needs to open. Live mode only."""
    if not pluggy_client.is_configured():
        raise HTTPException(
            400,
            "Open Finance is running in mock mode (no PLUGGY_CLIENT_ID/SECRET set). "
            "Use /open-finance/investments/{institution_id} to pull sample data instead "
            "of opening a real Connect widget.",
        )
    try:
        token = await pluggy_client.create_connect_token()
    except Exception as exc:  # noqa: BLE001 — surface upstream failure plainly
        raise HTTPException(502, f"Pluggy connect-token request failed: {exc}") from exc
    return {"connectToken": token}


@router.get("/investments/{institution_id}")
async def investments(institution_id: str):
    """Fetch (or fabricate) investment holdings for a connected institution.

    In live mode, `institution_id` is a real Pluggy itemId returned by the
    Connect widget's onSuccess callback. In mock mode, it's one of the ids
    from /institutions (mock-nubank, mock-itau, mock-xp).
    """
    if pluggy_client.is_configured():
        try:
            records = await pluggy_client.fetch_investments(institution_id)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(502, f"Pluggy investments request failed: {exc}") from exc
    else:
        records = mock_data.MOCK_INVESTMENTS.get(institution_id)
        if records is None:
            raise HTTPException(404, f"Unknown mock institution id: {institution_id}")

    holdings = map_investments_to_holdings(records)
    return {
        "institution_id": institution_id,
        "mode": "live" if pluggy_client.is_configured() else "mock",
        "holdings": holdings,
        "count": len(holdings),
    }
