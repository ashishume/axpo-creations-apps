#!/usr/bin/env bash
# Run the FastAPI backend (from backend directory).
cd "$(dirname "$0")"
exec ./venv/bin/python -m uvicorn app.main:app --reload --port 8000
