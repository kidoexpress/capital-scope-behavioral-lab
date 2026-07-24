"""
proxy.py
--------
Yahoo Finance proxy — forwards /api/yahoo/* requests to query1.finance.yahoo.com.
This enables production builds to access Yahoo Finance without the Vite dev proxy.

Some Yahoo endpoints (v7/finance/quote, v10/finance/quoteSummary) reject anonymous
callers with 401. They require a session cookie plus a matching "crumb" token. This
proxy acquires that pair lazily, caches it, and attaches it to the endpoints that
need it. The keyless endpoints (notably v8/finance/chart) are unaffected.
"""
from __future__ import annotations

import asyncio
import random
import time

import httpx
from fastapi import APIRouter, Request, Response

proxy_router = APIRouter(prefix="/yahoo", tags=["proxy"])

YAHOO_BASE = "https://query1.finance.yahoo.com"
# Keep this User-Agent terse. Yahoo answers the JSON API with 429 when the
# User-Agent looks like a full desktop browser (a real Chrome never calls these
# endpoints directly, so it reads as scraping), but serves generic clients fine.
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
}

# The crumb handshake goes through the HTML site, where a browser-like
# User-Agent is expected instead.
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}

# Endpoints that Yahoo gates behind a cookie + crumb pair.
CRUMB_REQUIRED_PREFIXES = ("v7/finance/quote", "v10/finance/quoteSummary", "v6/finance/quoteSummary")

# Yahoo throttles bursts hard, and a portfolio refresh fans out one request per
# holding. Cap in-flight upstream calls so a wide portfolio degrades into a short
# queue instead of a wall of 429s.
_MAX_CONCURRENCY = 4
_semaphore = asyncio.Semaphore(_MAX_CONCURRENCY)
_MAX_RETRIES = 3

# Statuses worth a second attempt. Yahoo throttles with 429, and under burst it
# also answers otherwise-valid requests with a spurious 400 — a page load that
# fans out over a watchlist reproduces it, and the same URL succeeds moments later.
_RETRYABLE_STATUSES = {400, 429, 500, 502, 503, 504}

# Cached credentials. Yahoo crumbs stay valid for hours; refresh well before that.
_CREDENTIAL_TTL = 30 * 60
_crumb: str | None = None
_cookies: httpx.Cookies | None = None
_fetched_at: float = 0.0
_lock = asyncio.Lock()


def _needs_crumb(path: str) -> bool:
    normalized = path.lstrip("/")
    return normalized.startswith(CRUMB_REQUIRED_PREFIXES)


async def _fetch_credentials() -> tuple[str | None, httpx.Cookies | None]:
    """Acquire a Yahoo session cookie and its matching crumb.

    Returns (None, None) when Yahoo declines — callers then proceed unauthenticated
    and let Yahoo return whatever status it wants, rather than failing the request here.
    """
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            # Loading a quote page yields the A1/A3 consent cookies the crumb is bound to.
            await client.get(
                "https://finance.yahoo.com/quote/AAPL",
                headers={**BROWSER_HEADERS, "Accept": "text/html,application/xhtml+xml"},
            )
            resp = await client.get(
                "https://query2.finance.yahoo.com/v1/test/getcrumb",
                headers={**BROWSER_HEADERS, "Referer": "https://finance.yahoo.com/quote/AAPL"},
            )
            crumb = resp.text.strip()
            # Yahoo answers rate limiting with a 200 whose body is prose, not a token.
            if resp.status_code != 200 or not crumb or " " in crumb or len(crumb) > 32:
                return None, None
            return crumb, client.cookies
    except Exception:
        return None, None


async def _get_credentials() -> tuple[str | None, httpx.Cookies | None]:
    global _crumb, _cookies, _fetched_at
    if _crumb and time.monotonic() - _fetched_at < _CREDENTIAL_TTL:
        return _crumb, _cookies
    async with _lock:
        # Another request may have refreshed while we waited on the lock.
        if _crumb and time.monotonic() - _fetched_at < _CREDENTIAL_TTL:
            return _crumb, _cookies
        crumb, cookies = await _fetch_credentials()
        if crumb:
            _crumb, _cookies, _fetched_at = crumb, cookies, time.monotonic()
        else:
            # Back off rather than retrying the throttled crumb endpoint on every call.
            _crumb, _cookies, _fetched_at = None, None, time.monotonic()
        return _crumb, _cookies


@proxy_router.get("/{path:path}")
async def proxy_yahoo(path: str, request: Request) -> Response:
    """Forward GET requests to Yahoo Finance and return the response."""
    query_string = str(request.url.query)
    url = f"{YAHOO_BASE}/{path}"

    cookies: httpx.Cookies | None = None
    if _needs_crumb(path) and "crumb=" not in query_string:
        crumb, cookies = await _get_credentials()
        if crumb:
            query_string = f"{query_string}&crumb={crumb}" if query_string else f"crumb={crumb}"

    if query_string:
        url = f"{url}?{query_string}"

    try:
        async with _semaphore:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True, cookies=cookies) as client:
                for attempt in range(_MAX_RETRIES):
                    resp = await client.get(url, headers=HEADERS)
                    if resp.status_code not in _RETRYABLE_STATUSES or attempt == _MAX_RETRIES - 1:
                        break
                    # Exponential backoff with jitter so parallel callers don't
                    # retry in lockstep and re-trigger the throttle.
                    await asyncio.sleep(2**attempt + random.random())
                return Response(
                    content=resp.content,
                    status_code=resp.status_code,
                    media_type=resp.headers.get("content-type", "application/json"),
                )
    except httpx.TimeoutException:
        return Response(
            content='{"error":"timeout"}',
            status_code=504,
            media_type="application/json",
        )
    except Exception as exc:
        return Response(
            content=f'{{"error":"{exc}"}}',
            status_code=502,
            media_type="application/json",
        )
