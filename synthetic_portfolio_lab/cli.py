"""Command-line interface for the Synthetic Portfolio Lab (Phase 1).

Examples:
    python -m synthetic_portfolio_lab.cli run --seed 42 --out results.json
    python -m synthetic_portfolio_lab.cli run --personas conservative_wealth_preserver,contrarian_investor
    python -m synthetic_portfolio_lab.cli list
"""
from __future__ import annotations

import argparse
import json

from .experiments.config import ExperimentConfig
from .experiments.runner import run_experiment
from .personas.templates import PERSONA_TEMPLATES
from .repositories.json_store import export_json
from .scenarios.templates import SCENARIO_TEMPLATES


def _summary(result: dict) -> str:
    lines = []
    rep = result["reproducibility"]
    lines.append(f"experiment_id={rep['experiment_id']} seed={rep['seed']} "
                 f"code={rep['code_version']} model={rep['model_version']}")
    lines.append(f"personas={len(result['results'])} scenarios={rep['scenarios'].__len__()} "
                 f"assets={len(rep['asset_universe'])}")
    lines.append("")
    lines.append(f"{'persona':26s} {'bhv_action_mix':>0s}")
    for r in result["results"]:
        bs = r["portfolios"]["behavioral_scenario"]
        fit = r["behavioral_portfolio_fit"]["behavioral_portfolio_fit"]
        eq = sum(w for a, w in bs["weights"].items() if a.startswith("EQ_") or a.startswith("ETF_"))
        cash = bs["weights"].get("CASH", 0.0)
        m = bs["metrics"]
        lines.append(
            f"{r['persona_id']:26s} fit={fit:.3f} equity~={eq:.2f} cash={cash:.2f} "
            f"ann_ret={m['annualized_return']:+.3f} vol={m['volatility']:.3f} "
            f"survival={m['scenario_survival_rate']:.2f} viol={len(bs['constraint_violations'])}"
        )
    sep = result["behavioral_separation"]
    lines.append("")
    lines.append(f"behavioral_separation: accuracy={sep['classification_accuracy']:.3f} "
                 f"random={sep['random_baseline']:.3f} dist={sep['mean_pairwise_distance']:.3f}")
    return "\n".join(lines)


def cmd_run(args: argparse.Namespace) -> int:
    config = ExperimentConfig(
        experiment_id=args.experiment_id,
        seed=args.seed,
        persona_keys=[k for k in args.personas.split(",") if k] if args.personas else [],
        scenario_keys=[k for k in args.scenarios.split(",") if k] if args.scenarios else None,
        horizon_days=args.horizon,
        universe_seed=args.universe_seed,
        universe_days=args.universe_days,
        use_memory=not args.no_memory,
    )
    result = run_experiment(config)
    print(_summary(result))
    if args.out:
        path = export_json(result, args.out)
        print(f"\nexported JSON -> {path}")
    return 0


def cmd_list(_args: argparse.Namespace) -> int:
    print("Personas:")
    for k in PERSONA_TEMPLATES:
        print(f"  - {k}")
    print("\nScenarios:")
    for k in SCENARIO_TEMPLATES:
        print(f"  - {k}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="synthetic_portfolio_lab", description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    run = sub.add_parser("run", help="run an experiment")
    run.add_argument("--experiment-id", dest="experiment_id", default="exp_cli")
    run.add_argument("--seed", type=int, default=42)
    run.add_argument("--personas", default="", help="comma-separated persona keys (default: all)")
    run.add_argument("--scenarios", default="", help="comma-separated scenario keys (default: all)")
    run.add_argument("--horizon", type=int, default=90)
    run.add_argument("--universe-seed", dest="universe_seed", type=int, default=12345)
    run.add_argument("--universe-days", dest="universe_days", type=int, default=756)
    run.add_argument("--no-memory", dest="no_memory", action="store_true")
    run.add_argument("--out", default="", help="write full result JSON to this path")
    run.set_defaults(func=cmd_run)

    lst = sub.add_parser("list", help="list persona and scenario templates")
    lst.set_defaults(func=cmd_list)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if getattr(args, "scenarios", "") == "":
        args.scenarios = ""
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
