FROM ghcr.io/astral-sh/uv:0.13.6 AS uv
FROM python:3.12-slim

COPY --from=uv /uv /usr/local/bin/uv
ENV UV_PYTHON_DOWNLOADS=never UV_NO_CACHE=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN --mount=type=secret,id=build_ca \
    if [ -f /run/secrets/build_ca ]; then export SSL_CERT_FILE=/run/secrets/build_ca; fi; \
    uv sync --locked --no-dev
COPY --chmod=0555 app ./app
COPY --chmod=0555 migrations ./migrations

USER 10001:10001
EXPOSE 10000
CMD ["sh", "-c", "exec /app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port \"${PORT:-10000}\""]
