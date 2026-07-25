"""Consent, export and deletion (privacy).

Sensitive fields are never required and never affect the portfolio. Consent is
versioned. Users can choose not to save, and can delete or export their twin.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

CONSENT_VERSION = "consent-1.0.0"


@dataclass
class Consent:
    version: str = CONSENT_VERSION
    granted: bool = False
    save_responses: bool = True
    allow_external_llm: bool = False
    granted_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class DeletionRequest:
    twin_id: str
    requested_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed: bool = False
