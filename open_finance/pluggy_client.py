"""Real Pluggy API client — used only when PLUGGY_CLIENT_ID/SECRET are set.

Endpoint shapes below match Pluggy's public docs (docs.pluggy.ai): POST /auth
exchanges clientId/clientSecret for an apiKey (2h TTL); POST /connect_token
exchanges the apiKey for a short-lived (30min) token the frontend widget uses;
GET /investments?itemId=... returns the connected account's holdings.

CAVEAT: this has never been run against Pluggy's real servers — no account was
created for this integration (that step needs the product owner, not an
agent). If the real /investments response shape differs from what mapper.py
expects, this is the file to adjust once a sandbox key exists.
"""
from __future__ import annotations

import os
import time

import httpx

PLUGGY_BASE_URL = "https://api.pluggy.ai"
_API_KEY_TTL = 2 * 60 * 60 - 120  # refresh a little before the real 2h expiry

_api_key: str | None = None
_api_key_expires_at: float = 0.0


def is_configured() -> bool:
    return bool(os.environ.get("PLUGGY_CLIENT_ID") and os.environ.get("PLUGGY_CLIENT_SECRET"))


async def _get_api_key(client: httpx.AsyncClient) -> str:
    global _api_key, _api_key_expires_at
    if _api_key and time.time() < _api_key_expires_at:
        return _api_key

    client_id = os.environ["PLUGGY_CLIENT_ID"]
    client_secret = os.environ["PLUGGY_CLIENT_SECRET"]
    resp = await client.post(
        f"{PLUGGY_BASE_URL}/auth",
        json={"clientId": client_id, "clientSecret": client_secret},
    )
    resp.raise_for_status()
    _api_key = resp.json()["apiKey"]
    _api_key_expires_at = time.time() + _API_KEY_TTL
    return _api_key


async def create_connect_token(item_id: str | None = None) -> str:
    """A short-lived token the frontend's PluggyConnect widget authenticates with."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        api_key = await _get_api_key(client)
        body = {"itemId": item_id} if item_id else {}
        resp = await client.post(
            f"{PLUGGY_BASE_URL}/connect_token",
            json=body,
            headers={"X-API-KEY": api_key},
        )
        resp.raise_for_status()
        return resp.json()["accessToken"]


async def fetch_investments(item_id: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        api_key = await _get_api_key(client)
        resp = await client.get(
            f"{PLUGGY_BASE_URL}/investments",
            params={"itemId": item_id},
            headers={"X-API-KEY": api_key},
        )
        resp.raise_for_status()
        return resp.json().get("results", [])
