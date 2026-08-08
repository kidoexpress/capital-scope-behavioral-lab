"""US House financial-disclosure index (STOCK Act).

Uses the official House Clerk bulk index, which lists WHO filed a Periodic
Transaction Report (a stock trade disclosure), WHEN, and links to the official
PDF. The traded ticker, size and direction live inside those PDFs — many of them
scanned — so they are NOT parsed here and are never guessed.

Senate disclosures (efdsearch.senate.gov) block automated access and third-party
aggregators require paid licences, so neither is used.
"""
from __future__ import annotations

import io
import time
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

USER_AGENT = "CapitalScope-Behavioral-Lab/0.1 (research; contact@capitalscope.io)"
CACHE_DIR = Path(__file__).resolve().parent / "_cache"
CACHE_TTL_SECONDS = 6 * 60 * 60

INDEX_URL = "https://disclosures-clerk.house.gov/public_disc/financial-pdfs/{year}FD.ZIP"
PDF_URL = "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/{year}/{doc_id}.pdf"


@dataclass
class Disclosure:
    member: str
    state_district: str
    filing_date: str
    doc_id: str
    year: int
    pdf_url: str
    filing_type: str = "P"   # P = Periodic Transaction Report (an actual trade)


def _fetch_index_xml(year: int) -> bytes | None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cached = CACHE_DIR / f"house_{year}.xml"
    if cached.exists() and (time.time() - cached.stat().st_mtime) < CACHE_TTL_SECONDS:
        return cached.read_bytes()
    req = urllib.request.Request(INDEX_URL.format(year=year), headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            blob = resp.read()
        with zipfile.ZipFile(io.BytesIO(blob)) as zf:
            name = next((n for n in zf.namelist() if n.lower().endswith(".xml")), None)
            if not name:
                return None
            data = zf.read(name)
        try:
            cached.write_bytes(data)
        except Exception:
            pass
        return data
    except Exception:
        return cached.read_bytes() if cached.exists() else None


def recent_trade_disclosures(year: int | None = None, limit: int = 60) -> list[Disclosure]:
    """Most recent Periodic Transaction Reports (trade filings) for a year."""
    year = year or date.today().year
    data = _fetch_index_xml(year)
    if not data:
        return []
    try:
        root = ET.fromstring(data)
    except ET.ParseError:
        return []

    out: list[Disclosure] = []
    for m in root.findall(".//Member"):
        if (m.findtext("FilingType") or "").strip().upper() != "P":
            continue
        doc_id = (m.findtext("DocID") or "").strip()
        if not doc_id:
            continue
        first = (m.findtext("First") or "").strip()
        last = (m.findtext("Last") or "").strip()
        out.append(Disclosure(
            member=f"{first} {last}".strip(),
            state_district=(m.findtext("StateDst") or "").strip(),
            filing_date=(m.findtext("FilingDate") or "").strip(),
            doc_id=doc_id,
            year=year,
            pdf_url=PDF_URL.format(year=year, doc_id=doc_id),
        ))

    def sort_key(d: Disclosure):
        for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
            try:
                return datetime.strptime(d.filing_date, fmt)
            except ValueError:
                continue
        return datetime.min

    out.sort(key=sort_key, reverse=True)
    return out[:limit]


def disclosure_summary(year: int | None = None) -> dict:
    """Aggregate view: who is filing trade disclosures most often this year."""
    year = year or date.today().year
    rows = recent_trade_disclosures(year, limit=10_000)
    counts: dict[str, int] = {}
    for d in rows:
        counts[d.member] = counts.get(d.member, 0) + 1
    top = sorted(counts.items(), key=lambda t: -t[1])[:15]
    return {
        "year": year,
        "total_trade_filings": len(rows),
        "unique_members": len(counts),
        "most_active": [{"member": m, "filings": c} for m, c in top],
        "source": "US House Clerk — official financial disclosure index",
        "limitation": "Ticker, amount and direction are inside the linked PDFs (often scanned) "
                      "and are not extracted here.",
    }
