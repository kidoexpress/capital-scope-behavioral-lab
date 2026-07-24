"""Paper trading engine for Capital Scope Behavioral Lab."""

from .routes import router  # noqa: F401 — re-export for app.include_router()

__all__ = ["router"]
