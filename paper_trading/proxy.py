"""Yahoo Finance HTTP proxy — mirrors the Vite dev proxy for production builds."""
from __future__ import annotations
import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response

router = APIRouter()

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
