"""CLI for the Financial Twin Lab (Phase 1).

    python -m financial_twin_lab.cli demo --kind cautious --out twin.json
    python -m financial_twin_lab.cli demo --kind aggressive
"""
from __future__ import annotations

import argparse

from .privacy.consent import Consent
from .repositories.json_store import TwinRepository
from .samples import SAMPLE_KINDS, make_sample_session
from .scoring.triggers import compute_triggers
from .twin.profile import build_twin_profile


def _summary(profile, scores, triggers) -> str:
    rp = profile.risk_profile
    lines = [
        f"twin_id={profile.twin_id} style={profile.decision_style.primary_style}",
        f"versions: quiz={profile.quiz_version} scoring={profile.scoring_version} profile={profile.profile_version}",
        "",
        f"risk_capacity      = {rp.risk_capacity:.3f}  (what the situation allows)",
        f"risk_tolerance     = {rp.risk_tolerance:.3f}  (what they declare)",
        f"revealed_behavior  = {rp.revealed_risk_behavior:.3f}  (scenario decisions)",
        f"effective_budget   = {rp.effective_risk_budget:.3f}  (min of declared, capacity)",
        f"declared_vs_revealed_gap = {rp.declared_vs_revealed_gap:+.3f}",
        "",
        f"profile_confidence = {profile.confidence.overall:.3f}  consistency={profile.response_consistency:.3f}",
        f"adaptive_triggers  = {triggers}",
    ]
    return "\n".join(lines)


def cmd_demo(args: argparse.Namespace) -> int:
    context, responses, scen = make_sample_session(args.kind)
    profile, scores = build_twin_profile(f"demo_{args.kind}", context, responses, scen)
    triggers = compute_triggers(scores, responses, scen)
    print(_summary(profile, scores, triggers))
    if args.out:
        repo = TwinRepository()
        repo.save(profile, scores, Consent(granted=True, save_responses=True), responses, scen)
        path = repo.export(profile.twin_id, args.out)
        print(f"\nexported -> {path}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="financial_twin_lab", description=__doc__)
    sub = p.add_subparsers(dest="command", required=True)
    demo = sub.add_parser("demo", help="build a sample twin")
    demo.add_argument("--kind", choices=SAMPLE_KINDS, default="balanced")
    demo.add_argument("--out", default="", help="export twin JSON to this path")
    demo.set_defaults(func=cmd_demo)
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
