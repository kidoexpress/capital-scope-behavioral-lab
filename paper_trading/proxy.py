"""Yahoo Finance HTTP proxy — mirrors the Vite dev proxy for production builds."""
from __future__ import annotations
import asyncio
import time
from collections import deque

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response

router = APIRouter()

# Simple sliding-window rate limiter: max 10 requests per 1 second
_request_times: deque = deque()
_RATE_LIMIT = 10
_WINDOW = 1.0


async def _check_rate_limit():
    now = time.monotonic()
    while _request_times and now - _request_times[0] > _WINDOW:
        _request_times.popleft()
    if len(_request_times) >= _RATE_LIMIT:
        wait = _WINDOW - (now - _request_times[0])
        if wait > 0:
            await asyncio.sleep(wait)
    _request_times.append(time.monotonic())

_client = httpx.AsyncClient(
    base_url="https://query1.finance.yahoo.com",
    headers={
        "User-Agent": "Mozilla/5.0 (compatible; CapitalScope/1.0)",
        "Accept": "application/json",
    },
    timeout=10.0,
    follow_redirects=True,
)


@router.api_route("/{path:path}", methods=["GET"])
async def proxy_yahoo(path: str, request: Request) -> Response:
    """Proxy GET requests to Yahoo Finance query1 API."""
    await _check_rate_limit()
    query = str(request.url.query)
    url = f"/{path}{'?' + query if query else ''}"
    try:
        resp = await _client.get(url)
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            media_type=resp.headers.get("content-type", "application/json"),
            headers={"Access-Control-Allow-Origin": "*"},
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Yahoo Finance timeout")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
