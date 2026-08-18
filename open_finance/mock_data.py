"""Illustrative fixture data for Open Finance mock mode.

IMPORTANT HONESTY NOTE: field names here approximate the CATEGORIES Pluggy's
docs describe (fixed income has name/balance/rate/dueDate; equities have
code/quantity/unitPrice/value) — they are NOT verified against a real Pluggy
API response, since this integration was built without an account. When real
credentials are configured, `pluggy_client.py`'s response parsing should be
checked against an actual /investments payload and adjusted if field names
differ. Nothing here should be presented to an end user as real financial data.
"""
from __future__ import annotations

MOCK_INSTITUTIONS = [
    {"id": "mock-nubank", "name": "Nubank", "imageUrl": None, "primaryColor": "8A05BE"},
    {"id": "mock-itau", "name": "Itaú Unibanco", "imageUrl": None, "primaryColor": "EC7000"},
    {"id": "mock-xp", "name": "XP Investimentos", "imageUrl": None, "primaryColor": "1C1C1C"},
]

# One illustrative connected "item" per institution, each with a small mixed
# portfolio (fixed income + equities + a FII), so the mapper is exercised
# against both product families end to end.
MOCK_INVESTMENTS: dict[str, list[dict]] = {
    "mock-nubank": [
        {
            "type": "FIXED_INCOME",
            "subtype": "CDB",
            "name": "CDB Nubank 110% CDI",
            "code": "CDB-NU-001",
            "balance": 8250.40,
            "amount": 7500.00,  # originally applied
            "rate": 110.0,
            "rateType": "PERCENTAGE_CDI",
            "dueDate": "2027-03-15",
            "currencyCode": "BRL",
        },
        {
            "type": "EQUITY",
            "subtype": "STOCK",
            "code": "ITUB4",
            "name": "Itaú Unibanco PN",
            "sector": "Financials",
            "quantity": 120,
            "unitPrice": 34.82,
            "value": 4178.40,
            "amount": 3900.00,
            "currencyCode": "BRL",
        },
    ],
    "mock-itau": [
        {
            "type": "FIXED_INCOME",
            "subtype": "TREASURY",
            "name": "Tesouro Selic 2029",
            "code": "TD-SELIC-2029",
            "balance": 15430.10,
            "amount": 14000.00,
            "rate": 100.0,
            "rateType": "PERCENTAGE_SELIC",
            "dueDate": "2029-03-01",
            "currencyCode": "BRL",
        },
        {
            "type": "EQUITY",
            "subtype": "FUND",  # FII
            "code": "HGLG11",
            "name": "CSHG Logística FII",
            "sector": "Real Estate",
            "quantity": 45,
            "unitPrice": 162.30,
            "value": 7303.50,
            "amount": 6800.00,
            "currencyCode": "BRL",
        },
    ],
    "mock-xp": [
        {
            "type": "EQUITY",
            "subtype": "STOCK",
            "code": "PETR4",
            "name": "Petrobras PN",
            "sector": "Energy",
            "quantity": 200,
            "unitPrice": 38.15,
            "value": 7630.00,
            "amount": 6200.00,
            "currencyCode": "BRL",
        },
        {
            "type": "EQUITY",
            "subtype": "STOCK",
            "code": "WEGE3",
            "name": "WEG ON",
            "sector": "Industrials",
            "quantity": 80,
            "unitPrice": 41.90,
            "value": 3352.00,
            "amount": 3600.00,
            "currencyCode": "BRL",
        },
        {
            "type": "FIXED_INCOME",
            "subtype": "LCI",
            "name": "LCI XP 96% CDI",
            "code": "LCI-XP-004",
            "balance": 5120.00,
            "amount": 4800.00,
            "rate": 96.0,
            "rateType": "PERCENTAGE_CDI",
            "dueDate": "2026-11-20",
            "currencyCode": "BRL",
        },
    ],
}
