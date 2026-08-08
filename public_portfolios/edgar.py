"""SEC EDGAR 13F client — fetches real institutional holdings.

Only official, free SEC endpoints are used. Nothing is fabricated: if a value is
not in the filing (or a ticker cannot be resolved) it is reported as unknown.

SEC fair-access rules require a descriptive User-Agent and <10 requests/second.
Filings change quarterly, so results are cached on disk.
"""
from __future__ import annotations

import json
import re
import time
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# SEC fair-access requires a descriptive User-Agent that includes a contact address.
USER_AGENT = "CapitalScope-Behavioral-Lab/0.1 (research; contact@capitalscope.io)"
CACHE_DIR = Path(__file__).resolve().parent / "_cache"
CACHE_TTL_SECONDS = 12 * 60 * 60  # 13F data changes quarterly; refresh twice a day at most
_MIN_INTERVAL = 0.15  # be a good citizen with SEC rate limits
_last_request = 0.0


@dataclass
class Holding:
    issuer: str
    cusip: str
    ticker: str | None      # None when it cannot be resolved — never guessed
    value_usd: float
    shares: float
    weight: float = 0.0     # share of the disclosed equity book


@dataclass
class Filing:
    cik: str
    period: str             # report period (e.g. "2026-03-31")
    filed_at: str
    accession: str
    total_value_usd: float
    holdings: list[Holding] = field(default_factory=list)
    source_url: str = ""


def _get(url: str, as_json: bool = False) -> Any:
    """Rate-limited GET honouring SEC fair-access rules."""
    global _last_request
    delta = time.time() - _last_request
    if delta < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - delta)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Encoding": "gzip, deflate"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
        if resp.headers.get("Content-Encoding") == "gzip":
            import gzip
            raw = gzip.decompress(raw)
    _last_request = time.time()
    return json.loads(raw) if as_json else raw.decode("utf-8", errors="replace")


def _cache_path(key: str) -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    safe = re.sub(r"[^A-Za-z0-9_.-]", "_", key)
    return CACHE_DIR / f"{safe}.json"


def _cached(key: str, producer) -> Any:
    path = _cache_path(key)
    if path.exists() and (time.time() - path.stat().st_mtime) < CACHE_TTL_SECONDS:
        try:
            return json.loads(path.read_text())
        except Exception:
            pass
    value = producer()
    try:
        path.write_text(json.dumps(value))
    except Exception:
        pass  # cache is best-effort
    return value


# ─────────────── ticker resolution ───────────────
_SUFFIXES = re.compile(
    r"\b(inc|incorporated|corp|corporation|co|company|ltd|limited|plc|lp|llc|holdings?|group|"
    r"class|cl|com|common|stock|shs|sh|the|new|adr|ads|of|and)\b", re.I)

# 13F filings abbreviate issuer names; expand so they match SEC's official titles.
_ABBREV = {
    "intl": "international", "natl": "national", "amer": "america",
    "tech": "technologies", "svcs": "services", "sys": "systems",
    "pete": "petroleum", "fin": "financial", "indl": "industrial",
    "res": "resources", "pharms": "pharmaceuticals", "labs": "laboratories",
    "mtr": "motor", "elec": "electric", "engy": "energy", "cmnctns": "communications",
}


def _normalize(name: str) -> str:
    n = name.lower().replace("&", " and ")
    # SEC titles carry a state-of-incorporation marker such as "/DE/" or "/ON/"
    n = re.sub(r"/[a-z]{2,3}/?\s*$", " ", n)
    n = re.sub(r"[^a-z0-9 ]", " ", n)
    n = _SUFFIXES.sub(" ", n)
    tokens = [_ABBREV.get(t, t) for t in n.split()]
    return " ".join(tokens).strip()


def _ticker_map() -> dict[str, str]:
    """Normalized company name -> ticker, from SEC's official company_tickers.json."""
    def fetch():
        data = _get("https://www.sec.gov/files/company_tickers.json", as_json=True)
        out: dict[str, str] = {}
        for row in data.values():
            title = row.get("title") or ""
            ticker = row.get("ticker") or ""
            if not title or not ticker:
                continue
            out.setdefault(_normalize(title), ticker)
        return out
    return _cached("company_tickers", fetch)


def resolve_ticker(issuer: str, mapping: dict[str, str] | None = None) -> str | None:
    """Best-effort ticker lookup. Returns None rather than guessing."""
    m = mapping if mapping is not None else _ticker_map()
    norm = _normalize(issuer)
    if not norm:
        return None
    if norm in m:
        return m[norm]
    # try progressively shorter prefixes (e.g. "apple" from "apple computer")
    parts = norm.split()
    for cut in range(len(parts) - 1, 0, -1):
        candidate = " ".join(parts[:cut])
        if candidate in m:
            return m[candidate]
    # close-match fallback with a high cutoff — returns None when uncertain
    import difflib
    close = difflib.get_close_matches(norm, m.keys(), n=1, cutoff=0.9)
    return m[close[0]] if close else None


# ─────────────── filings ───────────────
def latest_13f_accession(cik: str) -> tuple[str, str, str] | None:
    """Return (accession, filing_date, report_period) of the most recent 13F-HR."""
    padded = str(int(cik)).zfill(10)

    def fetch():
        return _get(f"https://data.sec.gov/submissions/CIK{padded}.json", as_json=True)

    data = _cached(f"submissions_{padded}", fetch)
    recent = data.get("filings", {}).get("recent", {})
    for form, acc, filed, period in zip(
        recent.get("form", []), recent.get("accessionNumber", []),
        recent.get("filingDate", []), recent.get("reportDate", []),
    ):
        if form == "13F-HR":
            return acc, filed, period
    return None


def _find_infotable_url(cik: str, accession: str) -> str | None:
    """Locate the information-table XML via EDGAR's directory index.json."""
    acc_nodash = accession.replace("-", "")
    base = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{acc_nodash}"
    listing = _get(f"{base}/index.json", as_json=True)
    items = listing.get("directory", {}).get("item", [])
    candidates = [
        it["name"] for it in items
        if it.get("name", "").lower().endswith(".xml") and "primary_doc" not in it.get("name", "").lower()
    ]
    if not candidates:
        return None
    # the information table is the largest non-primary xml
    largest = max(candidates, key=lambda n: next(
        (int(it.get("size", 0)) for it in items if it["name"] == n), 0))
    return f"{base}/{largest}"


def _parse_infotable(xml_text: str) -> list[Holding]:
    root = ET.fromstring(xml_text)
    ns_uri = root.tag.split("}")[0].strip("{") if "}" in root.tag else ""
    ns = {"n": ns_uri} if ns_uri else {}
    path = ".//n:infoTable" if ns_uri else ".//infoTable"

    def text(node, tag):
        el = node.find(f"n:{tag}", ns) if ns_uri else node.find(tag)
        return el.text.strip() if el is not None and el.text else ""

    merged: dict[tuple[str, str], Holding] = {}
    for node in root.findall(path, ns):
        issuer = text(node, "nameOfIssuer")
        cusip = text(node, "cusip")
        try:
            value = float(text(node, "value") or 0)
        except ValueError:
            value = 0.0
        shrs_node = node.find("n:shrsOrPrnAmt", ns) if ns_uri else node.find("shrsOrPrnAmt")
        shares = 0.0
        if shrs_node is not None:
            try:
                shares = float(text(shrs_node, "sshPrnamt") or 0)
            except ValueError:
                shares = 0.0
        key = (issuer, cusip)
        if key in merged:  # same issuer can appear across multiple share classes/managers
            merged[key].value_usd += value
            merged[key].shares += shares
        else:
            merged[key] = Holding(issuer=issuer, cusip=cusip, ticker=None,
                                  value_usd=value, shares=shares)
    return list(merged.values())


def fetch_latest_13f(cik: str) -> Filing | None:
    """Fetch and parse the most recent 13F-HR for a CIK. Returns None if absent."""
    def fetch():
        found = latest_13f_accession(cik)
        if not found:
            return None
        accession, filed, period = found
        url = _find_infotable_url(cik, accession)
        if not url:
            return None
        holdings = _parse_infotable(_get(url))
        total = sum(h.value_usd for h in holdings) or 1.0
        mapping = _ticker_map()
        for h in holdings:
            h.weight = h.value_usd / total
            h.ticker = resolve_ticker(h.issuer, mapping)
        holdings.sort(key=lambda h: -h.value_usd)
        return {
            "cik": cik, "period": period, "filed_at": filed, "accession": accession,
            "total_value_usd": sum(h.value_usd for h in holdings),
            "source_url": url,
            "holdings": [h.__dict__ for h in holdings],
        }

    data = _cached(f"13f_{cik}", fetch)
    if not data:
        return None
    return Filing(
        cik=data["cik"], period=data["period"], filed_at=data["filed_at"],
        accession=data["accession"], total_value_usd=data["total_value_usd"],
        source_url=data.get("source_url", ""),
        holdings=[Holding(**h) for h in data["holdings"]],
    )
