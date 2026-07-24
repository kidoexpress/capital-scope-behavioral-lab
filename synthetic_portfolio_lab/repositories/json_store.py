"""Minimal JSON persistence (Phase 1).

Mirrors the JSON-repository pattern from paper_trading/repository.py. SQLite / API
persistence arrive in later phases. Output files are gitignored.
"""
from __future__ import annotations

import json
from pathlib import Path

DEFAULT_DIR = Path(__file__).resolve().parent.parent / "_experiments_output"


class JsonExperimentRepository:
    def __init__(self, base_dir: Path = DEFAULT_DIR) -> None:
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _path(self, experiment_id: str) -> Path:
        return self.base_dir / f"{experiment_id}.experiment.json"

    def save(self, result: dict) -> Path:
        experiment_id = result.get("reproducibility", {}).get("experiment_id", "experiment")
        path = self._path(experiment_id)
        path.write_text(json.dumps(result, indent=2, ensure_ascii=False))
        return path

    def load(self, experiment_id: str) -> dict:
        return json.loads(self._path(experiment_id).read_text())


def export_json(result: dict, path: str | Path) -> Path:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(result, indent=2, ensure_ascii=False))
    return p
