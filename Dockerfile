# Backend-only image for Railway (or any container host). The frontend is
# deployed separately on Vercel; see vercel.json for how the two are wired
# together in production.
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .
COPY paper_trading/ ./paper_trading/
COPY synthetic_portfolio_lab/ ./synthetic_portfolio_lab/
COPY public_portfolios/ ./public_portfolios/

# Railway (and most container platforms) inject $PORT at runtime; the shell
# form lets it expand. 8100 is only the local-dev fallback.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8100}"]
