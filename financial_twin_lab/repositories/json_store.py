"""Minimal JSON persistence for financial twins (privacy-aware).

A stored twin session holds the profile, scores, responses and consent. Supports
save / load / delete / export. If consent.save_responses is False, raw responses
are not persisted (data minimization).
"""
from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

from ..privacy.consent import Consent
from ..schemas import to_dict
from ..schemas.models import QuizResponse, ScenarioResponse, TwinProfile

DEFAULT_DIR = Path(__file__).resolve().parent.parent / "_twins_output"


class TwinRepository:
    def __init__(self, base_dir: Path = DEFAULT_DIR) -> None:
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _path(self, twin_id: str) -> Path:
        return self.base_dir / f"{twin_id}.twin.json"

    def save(
        self,
        profile: TwinProfile,
        scores: dict,
        consent: Consent,
        responses: list[QuizResponse] | None = None,
        scenario_responses: list[ScenarioResponse] | None = None,
    ) -> Path:
        payload = {
            "twin": to_dict(profile),
            "scores": scores,
            "consent": asdict(consent),
        }
        # data minimization: only persist raw responses if allowed
        if consent.save_responses and responses is not None:
            payload["responses"] = [to_dict(r) for r in responses]
            payload["scenario_responses"] = [to_dict(r) for r in (scenario_responses or [])]
        path = self._path(profile.twin_id)
        path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
        return path

    def load(self, twin_id: str) -> dict:
        return json.loads(self._path(twin_id).read_text())

    def exists(self, twin_id: str) -> bool:
        return self._path(twin_id).exists()

    def delete(self, twin_id: str) -> bool:
        """Hard-delete the stored twin. Returns True if a file was removed."""
        path = self._path(twin_id)
        if path.exists():
            path.unlink()
            return True
        return False

    def export(self, twin_id: str, out_path: str | Path) -> Path:
        data = self.load(twin_id)
        p = Path(out_path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(data, indent=2, ensure_ascii=False))
        return p
