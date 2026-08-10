"""Paper trading engine for Capital Scope Behavioral Lab.

No eager re-export of `routes.router` here on purpose: routes.py pulls in
yfinance transitively, and some callers (the Vercel deployment's api/index.py)
import sibling modules like `paper_trading.proxy` without wanting that chain —
package __init__.py always runs first, so an eager import here would drag
yfinance in regardless of which submodule was actually requested. Import the
router directly from `paper_trading.routes` where the full engine is needed.
"""
