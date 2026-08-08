"""Curated catalog of public portfolios worth tracking.

Each entry carries an EXECUTIVE SUMMARY of the manager's publicly documented
strategy — style, concentration, turnover, edge and what to watch when copying.
These are factual descriptions of well-known public approaches, NOT performance
promises and NOT investment advice.

Holdings themselves are never hard-coded: they are fetched live from the manager's
SEC 13F filings (see edgar.py). Only the qualitative profile lives here.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class PublicPortfolio:
    slug: str
    name: str
    manager: str
    cik: str
    category: str          # mega_fund | activist | value | macro | quant | growth
    size_tier: str         # large | mid | boutique
    # ── executive summary ──
    headline: str          # one-line positioning
    strategy: str          # how they invest
    edge: str              # where the alleged edge comes from
    style_tags: list[str] = field(default_factory=list)
    concentration: str = ""     # how concentrated the book is
    turnover: str = ""          # typical trading cadence
    replication_note: str = ""  # what breaks when a retail investor copies it
    caveats: list[str] = field(default_factory=list)


CATALOG: list[PublicPortfolio] = [
    PublicPortfolio(
        slug="berkshire", name="Berkshire Hathaway", manager="Warren Buffett / Todd Combs / Ted Weschler",
        cik="1067983", category="mega_fund", size_tier="large",
        headline="Concentrated quality-value with permanent capital and multi-decade holding periods.",
        strategy="Buys durable, cash-generative businesses at prices below estimated intrinsic value and holds "
                 "them for years. The equity book is deliberately concentrated in a handful of very large "
                 "positions, funded partly by insurance float rather than redeemable investor capital.",
        edge="Permanent capital (no redemptions), an extreme tolerance for inactivity, and scale that grants "
             "access to deals unavailable to other buyers.",
        style_tags=["value", "quality", "buy-and-hold", "concentrated"],
        concentration="Very high — the top 5 positions historically dominate the equity portfolio.",
        turnover="Very low. Core positions are often held for a decade or more.",
        replication_note="The listed equities are copyable; the insurance operations, private subsidiaries and "
                         "preferred/warrant deals that drive much of the returns are not.",
        caveats=["A large share of Berkshire's value sits in wholly-owned private businesses invisible in the 13F.",
                 "Position changes are disclosed with up to a 45-day lag."],
    ),
    PublicPortfolio(
        slug="pershing-square", name="Pershing Square", manager="Bill Ackman",
        cik="1336528", category="activist", size_tier="large",
        headline="Very concentrated activist bets on large-cap North American businesses.",
        strategy="Runs a book of roughly 6–12 positions in simple, predictable, free-cash-flow-generative "
                 "companies, frequently pushing publicly for operational or governance change. Also uses "
                 "asymmetric macro hedges outside the equity book.",
        edge="Concentration plus public activism — the manager can act as a catalyst rather than waiting for one.",
        style_tags=["activist", "concentrated", "large-cap", "catalyst-driven"],
        concentration="Extreme — often fewer than 12 names.",
        turnover="Low on the core book, but entries and exits are decisive.",
        replication_note="Copying the equities misses the derivative and macro hedges, which have driven several "
                         "of the fund's most dramatic outcomes.",
        caveats=["Single-name risk is very high by design.",
                 "Macro hedges and options are not visible in the 13F."],
    ),
    PublicPortfolio(
        slug="scion", name="Scion Asset Management", manager="Michael Burry",
        cik="1649339", category="value", size_tier="boutique",
        headline="Deep-value contrarian book that turns over aggressively and often runs very small.",
        strategy="Concentrated, deliberately unpopular positions — frequently in out-of-favour sectors or "
                 "companies under stress — sized in a small portfolio and rotated far more often than a "
                 "traditional value manager.",
        edge="Willingness to hold genuinely uncomfortable positions and to exit quickly when the thesis changes.",
        style_tags=["deep-value", "contrarian", "high-turnover", "small-book"],
        concentration="High, in a book that is small in absolute dollars.",
        turnover="High — the portfolio can look completely different quarter to quarter.",
        replication_note="This is the worst-case profile for 13F copying: by the time a filing is public the "
                         "manager may already have exited, because the holding period is often shorter than the "
                         "45-day disclosure lag.",
        caveats=["Frequently uses puts and calls, which distort what the 13F appears to show.",
                 "Position turnover is faster than the disclosure cycle."],
    ),
    PublicPortfolio(
        slug="duquesne", name="Duquesne Family Office", manager="Stanley Druckenmiller",
        cik="1536411", category="macro", size_tier="mid",
        headline="Top-down macro views expressed through a rotating book of equities.",
        strategy="Builds equity exposure around a macro thesis — rates, liquidity, the dollar, the economic "
                 "cycle — and shifts aggressively when that thesis changes. Position sizing follows conviction "
                 "rather than a fixed diversification rule.",
        edge="Willingness to concentrate hard when conviction is high and to reverse quickly when wrong.",
        style_tags=["macro", "rotational", "conviction-sized", "flexible"],
        concentration="Moderate to high, and unstable by design.",
        turnover="High — the book reflects a current macro view, not a permanent portfolio.",
        replication_note="Copying the holdings without the macro view behind them means inheriting the positions "
                         "but none of the exit discipline.",
        caveats=["Family office capital, so there is no client mandate constraining the risk taken.",
                 "The macro expression often includes instruments outside the 13F."],
    ),
    PublicPortfolio(
        slug="appaloosa", name="Appaloosa LP", manager="David Tepper",
        cik="1656456", category="value", size_tier="mid",
        headline="Opportunistic, cycle-aware equity and distressed investing.",
        strategy="Historically rooted in distressed debt, the equity book concentrates on beaten-down cyclicals, "
                 "financials and, more recently, large technology — taken with size when the manager believes "
                 "the market has mispriced a recovery.",
        edge="Comfort with situations most investors avoid, and a strong read on policy and credit cycles.",
        style_tags=["opportunistic", "cyclical", "distressed", "concentrated"],
        concentration="High in the top names.",
        turnover="Moderate to high depending on the cycle.",
        replication_note="The equity sleeve is copyable; the credit and distressed positions that define the "
                         "firm's history are not.",
        caveats=["Sizing shifts sharply with the manager's macro read.", "Disclosed with a lag."],
    ),
    PublicPortfolio(
        slug="third-point", name="Third Point", manager="Daniel Loeb",
        cik="1040273", category="activist", size_tier="mid",
        headline="Event-driven and activist equity investing across the capital structure.",
        strategy="Combines constructivist stakes — where the manager pushes for change — with event-driven "
                 "positions around spin-offs, restructurings and corporate actions.",
        edge="Situational analysis plus the credibility to force corporate change.",
        style_tags=["event-driven", "activist", "special-situations"],
        concentration="Moderate — more diversified than a pure activist book.",
        turnover="Moderate; event timelines dictate holding periods.",
        replication_note="Event-driven positions depend on timing around a catalyst, which the 45-day lag erodes.",
        caveats=["Credit and structured positions sit outside the 13F."],
    ),
    PublicPortfolio(
        slug="tiger-global", name="Tiger Global Management", manager="Chase Coleman",
        cik="1167483", category="growth", size_tier="large",
        headline="Long-duration growth and technology investing spanning public and private markets.",
        strategy="Concentrates on internet, software and consumer-technology businesses judged capable of "
                 "compounding revenue for many years, with the public book mirroring themes also expressed "
                 "in a very large private portfolio.",
        edge="Deep sector specialisation and a private-market vantage point on the same themes.",
        style_tags=["growth", "technology", "long-duration", "thematic"],
        concentration="Moderate — a broader book than the classic activist funds.",
        turnover="Moderate, with sharp de-risking in growth drawdowns.",
        replication_note="The public names are copyable, but the private book — invisible here — carries much of "
                         "the firm's risk and return.",
        caveats=["Highly sensitive to interest rates and growth multiples.",
                 "Experienced severe drawdowns when long-duration growth de-rated."],
    ),
    PublicPortfolio(
        slug="bridgewater", name="Bridgewater Associates", manager="Ray Dalio (founded)",
        cik="1350694", category="macro", size_tier="large",
        headline="Systematic global macro; the 13F shows mostly index and diversification sleeves.",
        strategy="Runs risk-balanced, systematic macro strategies across asset classes. The disclosed US equity "
                 "portfolio is broad and heavily indexed rather than a set of stock-picking bets.",
        edge="Systematic diversification across economic environments rather than security selection.",
        style_tags=["systematic", "macro", "risk-parity", "diversified"],
        concentration="Low — very broad, often dominated by ETFs.",
        turnover="Moderate and rules-driven.",
        replication_note="Poor copy candidate: the equity filing is a sleeve of a much larger multi-asset "
                         "machine, so replicating it reproduces neither the strategy nor its risk profile.",
        caveats=["The 13F is not representative of the firm's actual strategy.",
                 "Most of the real exposure is in futures and other instruments not disclosed here."],
    ),
    PublicPortfolio(
        slug="renaissance", name="Renaissance Technologies", manager="Quantitative team",
        cik="1037389", category="quant", size_tier="large",
        headline="Statistical, highly diversified quantitative equity — hundreds of small positions.",
        strategy="Systematic models trade a very large number of names with small individual weights. Signals "
                 "are short-horizon and statistical rather than fundamental.",
        edge="Proprietary statistical models, execution infrastructure and scale.",
        style_tags=["quant", "systematic", "diversified", "short-horizon"],
        concentration="Very low — hundreds of positions, none dominant.",
        turnover="Very high; far faster than quarterly disclosure.",
        replication_note="Effectively impossible to copy — the signals decay long before the filing is public, "
                         "and the book's edge comes from breadth and execution, not from the names themselves.",
        caveats=["Holding periods are much shorter than the disclosure lag.",
                 "The flagship internal fund is not what the 13F reflects."],
    ),
    PublicPortfolio(
        slug="baupost", name="The Baupost Group", manager="Seth Klarman",
        cik="1061768", category="value", size_tier="mid",
        headline="Absolute-return value investing that treats cash as a legitimate position.",
        strategy="Margin-of-safety value investing across equities, distressed debt and real assets, willing to "
                 "hold very large cash balances when opportunities are scarce.",
        edge="Patience, a mandate that permits idleness, and expertise in illiquid and distressed situations.",
        style_tags=["value", "absolute-return", "patient", "cash-tolerant"],
        concentration="Moderate in the disclosed equity book.",
        turnover="Low to moderate.",
        replication_note="The equity slice is copyable, but the defining feature — holding large cash and waiting "
                         "years — is a behavioural discipline, not a holdings list.",
        caveats=["A large share of the portfolio sits in assets not disclosed in the 13F.",
                 "Cash levels, central to the strategy, are invisible here."],
    ),
]

CATALOG_BY_SLUG = {p.slug: p for p in CATALOG}


def get_portfolio(slug: str) -> PublicPortfolio:
    if slug not in CATALOG_BY_SLUG:
        raise KeyError(f"unknown public portfolio: {slug}")
    return CATALOG_BY_SLUG[slug]
