from collections.abc import Iterator
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import HTTPAuthorizationCredentials
from psycopg import Connection

from .auth import authenticate, bearer, unauthorized
from .db import connection
from .models import Check, Dataset, Payload, Project, Run, RunResults

router = APIRouter(prefix="/v1", tags=["Workspace reads"])


def private_reader(
    request: Request,
    response: Response,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> Iterator[tuple[Connection, UUID]]:
    if credentials is None:
        raise unauthorized()
    response.headers["Cache-Control"] = "private, no-store"
    with connection(request.app.state.settings.database_url) as conn:
        conn.read_only = True
        yield conn, authenticate(conn, credentials.credentials)


Reader = Annotated[tuple[Connection, UUID], Depends(private_reader)]
RUN_COLUMNS = "r.id::text, r.name, r.dataset_id::text, r.duration_ms, r.estimated_cost_usd"


@router.get("/projects")
def list_projects(reader: Reader) -> Payload[list[Project]]:
    conn, user = reader
    rows = conn.execute(
        """
        SELECT p.id::text, p.name
        FROM projects p JOIN memberships m ON m.workspace_id = p.workspace_id
        WHERE m.user_id = %s
        ORDER BY p.name, p.id
        """,
        (user,),
    )
    return Payload(source="workspace", data=[Project(**row) for row in rows])


@router.get("/projects/{project_id}/datasets")
def list_datasets(project_id: UUID, reader: Reader) -> Payload[list[Dataset]]:
    conn, user = reader
    rows = conn.execute(
        """
        SELECT d.id::text, d.name, d.version
        FROM datasets d JOIN projects p ON p.id = d.project_id
        JOIN memberships m ON m.workspace_id = p.workspace_id
        WHERE p.id = %s AND m.user_id = %s
        ORDER BY d.name, d.version, d.id
        """,
        (project_id, user),
    )
    return Payload(source="workspace", data=[Dataset(**row) for row in rows])


@router.get("/projects/{project_id}/runs")
def list_runs(project_id: UUID, reader: Reader) -> Payload[list[Run]]:
    conn, user = reader
    rows = conn.execute(
        f"""
        SELECT {RUN_COLUMNS}
        FROM runs r JOIN projects p ON p.id = r.project_id
        JOIN memberships m ON m.workspace_id = p.workspace_id
        WHERE p.id = %s AND m.user_id = %s
        ORDER BY r.created_at DESC, r.id
        """,
        (project_id, user),
    )
    return Payload(source="workspace", data=[Run(**row) for row in rows])


@router.get("/runs/{run_id}")
def get_run(run_id: UUID, reader: Reader) -> Payload[Run]:
    conn, user = reader
    row = conn.execute(
        f"""
        SELECT {RUN_COLUMNS}
        FROM runs r JOIN projects p ON p.id = r.project_id
        JOIN memberships m ON m.workspace_id = p.workspace_id
        WHERE r.id = %s AND m.user_id = %s
        """,
        (run_id, user),
    ).fetchone()
    if row is None:
        raise HTTPException(404, "Run not found")
    return Payload(source="workspace", data=Run(**row))


@router.get("/runs/{run_id}/results")
def get_results(run_id: UUID, reader: Reader) -> Payload[RunResults]:
    conn, user = reader
    rows = conn.execute(
        """
        SELECT r.trace, c.name, c.passed, c.summary
        FROM runs r JOIN projects p ON p.id = r.project_id
        JOIN memberships m ON m.workspace_id = p.workspace_id
        LEFT JOIN case_results c ON c.run_id = r.id
        WHERE r.id = %s AND m.user_id = %s
        ORDER BY c.position
        """,
        (run_id, user),
    ).fetchall()
    if not rows:
        raise HTTPException(404, "Run not found")
    checks = [Check(name=row["name"], passed=row["passed"], summary=row["summary"])
              for row in rows if row["name"] is not None]
    return Payload(source="workspace", data=RunResults(checks=checks, trace=rows[0]["trace"]))
