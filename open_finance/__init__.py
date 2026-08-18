"""Open Finance integration — pulls a user's real investment portfolio via
Pluggy (an Open Finance Brasil aggregator) so it can populate the Portfolio
Builder in place of manual entry.

Stateless by design (no disk writes): same architectural family as the Yahoo
proxy, so it can run on any deployment target this project already uses,
including the size-constrained Vercel function (see api/index.py).

Mock vs live mode: without PLUGGY_CLIENT_ID/PLUGGY_CLIENT_SECRET set, every
endpoint here returns clearly-labeled fixture data shaped exactly like
Pluggy's real /investments response (see mock_data.py) instead of failing —
same fallback pattern the frontend already uses for the Claude API key. This
was never exercised against Pluggy's real servers (no account was created for
this integration); the mock path is what's actually been run end to end.
"""
