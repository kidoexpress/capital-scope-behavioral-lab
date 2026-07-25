"""Tests: twin creation, distinct profiles, reproducibility, consent, deletion."""
from __future__ import annotations

import json

from financial_twin_lab.privacy.consent import Consent
from financial_twin_lab.repositories.json_store import TwinRepository
from financial_twin_lab.samples import make_sample_session
from financial_twin_lab.schemas import to_dict
from financial_twin_lab.twin.profile import build_twin_profile


def _build(kind: str, twin_id: str | None = None):
    ctx, resp, scen = make_sample_session(kind)
    return build_twin_profile(f"u_{kind}", ctx, resp, scen, twin_id=twin_id)


def test_twin_creation_has_all_sections():
    profile, _ = _build("balanced")
    assert profile.personality and profile.behavioral_traits
    assert profile.risk_profile.effective_risk_budget >= 0
    assert profile.decision_style.primary_style


def test_different_profiles_differ():
    cautious, _ = _build("cautious")
    aggressive, _ = _build("aggressive")
    assert cautious.risk_profile.effective_risk_budget < aggressive.risk_profile.effective_risk_budget
    assert cautious.decision_style.primary_style != aggressive.decision_style.primary_style or \
        cautious.risk_profile.risk_tolerance != aggressive.risk_profile.risk_tolerance


def test_reproducible_same_inputs():
    a, _ = _build("cautious", twin_id="twin_fixed")
    b, _ = _build("cautious", twin_id="twin_fixed")
    da, db = to_dict(a), to_dict(b)
    da["created_at"] = db["created_at"] = ""
    assert da == db


def test_effective_budget_never_exceeds_capacity():
    for kind in ("cautious", "balanced", "aggressive"):
        p, _ = _build(kind)
        assert p.risk_profile.effective_risk_budget <= p.risk_profile.risk_capacity + 1e-9


def test_persistence_save_load_export_delete(tmp_path):
    repo = TwinRepository(base_dir=tmp_path)
    profile, scores = _build("balanced", twin_id="twin_persist")
    ctx, resp, scen = make_sample_session("balanced")
    repo.save(profile, scores, Consent(granted=True, save_responses=True), resp, scen)
    assert repo.exists("twin_persist")
    loaded = repo.load("twin_persist")
    assert loaded["twin"]["twin_id"] == "twin_persist"
    assert "responses" in loaded
    out = repo.export("twin_persist", tmp_path / "export.json")
    assert json.loads(out.read_text())["twin"]["twin_id"] == "twin_persist"
    # deletion
    assert repo.delete("twin_persist") is True
    assert repo.exists("twin_persist") is False


def test_consent_no_save_responses_minimizes(tmp_path):
    repo = TwinRepository(base_dir=tmp_path)
    profile, scores = _build("balanced", twin_id="twin_min")
    ctx, resp, scen = make_sample_session("balanced")
    repo.save(profile, scores, Consent(granted=True, save_responses=False), resp, scen)
    loaded = repo.load("twin_min")
    assert "responses" not in loaded  # data minimization respected
