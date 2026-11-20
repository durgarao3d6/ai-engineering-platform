# Evaluation API

Use Python 3.12 and uv. From `services/api`:

```sh
uv sync --locked
PLATFORM_ENVIRONMENT=development PLATFORM_CORS_ORIGINS='["http://localhost:3000"]' uv run uvicorn app.main:app --reload
```

Check `http://localhost:8000/health` and interactive API documentation at `http://localhost:8000/docs`.
The API accepts an optional local `.env` file. By default it starts with production settings and an empty CORS allowlist.

Run tests with `uv run --locked pytest`.

## PostgreSQL and private access

Set `PLATFORM_DATABASE_URL` to a PostgreSQL connection string and run
`uv run --locked python -m app.migrate`. Migrations apply in order in a
transaction and subsequent runs skip installed versions.

Private reads require an opaque bearer token. An administrator provisions a user,
workspace membership, and high-entropy token through a trusted administrative
process. Store only the token's SHA-256 digest in `access_tokens` with an expiry.
The caller supplies the original token over HTTPS. Revocation sets `revoked_at`,
and removing membership immediately removes read access to that workspace.
The reader and admin roles can both read their workspace. Write routes and
external identity-provider integration are outside the read-only showcase.

Every private read joins through project ownership and the caller's current
workspace membership. Requests for another workspace's individual records return
the same response as requests for unknown records. Use a migration role with
schema privileges and a separate runtime role with SELECT on the required tables.

To run PostgreSQL integration tests, set `PLATFORM_TEST_DATABASE_URL` to a
disposable database. The test suite creates and removes a unique schema per test.

## Read endpoints

The OpenAPI document at `/openapi.json` describes the versioned routes. Workspace
endpoints are:

- `GET /v1/projects` lists projects in the caller's workspaces.
- `GET /v1/projects/{project_id}/datasets`
- `GET /v1/projects/{project_id}/runs`
- `GET /v1/runs/{run_id}`
- `GET /v1/runs/{run_id}/results`

Successful workspace responses identify their source as `workspace`. In
development, `/v1/demo/datasets`, `/v1/demo/runs`, `/v1/demo/runs/{run_id}` and
`/v1/demo/runs/{run_id}/results` provide deterministic seeded samples. The API
labels every sample response with `source: "sample"` and omits these routes from
production.

## Issue a starter workspace token on Windows

From `services/api` in PowerShell, copy the **External Database URL** for the
migration administrator in Render. Then type this command by hand to preserve
the URL on your clipboard.

```powershell
uv run --locked python -m app.provision_workspace --subject first-login --windows-clipboard
```

The first run creates a reader and a project. Rerunning with the same subject
issues another one-hour token for the same reader. The command prints progress
and replaces the clipboard contents with the token on success. Paste the token
into the private workspace sign-in form. The project starts empty.

On other platforms, set `PLATFORM_DATABASE_URL` or enter the administrator URL
when prompted, and omit `--windows-clipboard`. The command writes the token
to standard output and progress to standard error.
