# Evaluation API

Use Python 3.12 and uv. From `services/api`:

```sh
uv sync --locked
PLATFORM_ENVIRONMENT=development PLATFORM_CORS_ORIGINS='["http://localhost:3000"]' uv run uvicorn app.main:app --reload
```

Check `http://localhost:8000/health` and interactive API documentation at `http://localhost:8000/docs`.
The API accepts an optional local `.env` file. By default it starts with production settings and an empty CORS allowlist.

Run tests with `uv run --locked pytest`.
