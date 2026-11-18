import hashlib
from uuid import uuid4

import psycopg
from fastapi.testclient import TestClient

from app.main import create_app
from app.settings import Settings


def client(**settings):
    return TestClient(create_app(Settings(_env_file=None, **settings)))


def test_development_contract():
    with client(environment="development") as api:
        assert api.get("/v1/demo/datasets").json() == {
            "source": "sample", "data": [{"id": "checkout-v1", "name": "Checkout", "version": "v1"}],
        }
        runs = api.get("/v1/demo/runs").json()
        assert runs["source"] == "sample"
        baseline = runs["data"][0]
        assert set(baseline) == {"id", "name", "datasetId", "durationMs", "estimatedCostUsd"}
        run_url = f"/v1/demo/runs/{baseline['id']}"
        assert api.get(run_url).json() == {"source": "sample", "data": baseline}
        results = api.get(f"{run_url}/results").json()
        assert results["source"] == "sample"
        assert any(not check["passed"] for check in results["data"]["checks"])
        assert api.get("/v1/demo/runs/unknown").status_code == 404
        assert api.get("/v1/demo/runs/unknown/results").status_code == 404
        paths = api.get("/openapi.json").json()["paths"]
        assert "/v1/demo/runs/{run_id}/results" in paths
        assert paths["/v1/runs/{run_id}"]["get"]["security"] == [{"HTTPBearer": []}]


def test_production_excludes_sample_routes():
    with client(environment="production") as api:
        assert api.get("/v1/demo/runs").status_code == 404
        assert "/v1/demo/runs" not in api.get("/openapi.json").json()["paths"]
        assert api.get(f"/v1/runs/{uuid4()}").status_code == 401


def test_workspace_read_isolation(db_url):
    user, outsider, workspace, other_workspace, project, dataset, run = (uuid4() for _ in range(7))
    token, other_token = uuid4().hex, uuid4().hex
    with psycopg.connect(db_url) as conn:
        conn.execute("INSERT INTO users VALUES (%s, 'reader'), (%s, 'outsider')", (user, outsider))
        conn.execute("INSERT INTO workspaces VALUES (%s, 'private'), (%s, 'other')", (workspace, other_workspace))
        conn.execute("INSERT INTO memberships VALUES (%s, %s, 'reader'), (%s, %s, 'reader')",
                     (workspace, user, other_workspace, outsider))
        for member, credential in ((user, token), (outsider, other_token)):
            conn.execute(
                "INSERT INTO access_tokens VALUES (%s, %s, now() + interval '1 hour', NULL)",
                (hashlib.sha256(credential.encode()).digest(), member),
            )
        conn.execute("INSERT INTO projects VALUES (%s, %s, 'Private project')", (project, workspace))
        conn.execute("INSERT INTO datasets VALUES (%s, %s, 'Private dataset', 'v1')", (dataset, project))
        conn.execute(
            """
            INSERT INTO runs (id, project_id, dataset_id, name, duration_ms, estimated_cost_usd, trace)
            VALUES (%s, %s, %s, 'Private run', 125, 0.02, ARRAY['Ran tests'])
            """,
            (run, project, dataset),
        )
        conn.execute("INSERT INTO case_results VALUES (%s, 'Private check', 0, true, 'Passed')", (run,))

    owner = {"Authorization": f"Bearer {token}"}
    other = {"Authorization": f"Bearer {other_token}"}
    with client(database_url=db_url) as api:
        for collection, record in (("datasets", dataset), ("runs", run)):
            url = f"/v1/projects/{project}/{collection}"
            assert api.get(url).status_code == 401
            assert api.get(url, headers=owner).json()["data"][0]["id"] == str(record)
            assert api.get(url, headers=other).json() == {"source": "workspace", "data": []}
        for url in (f"/v1/runs/{run}", f"/v1/runs/{run}/results"):
            assert api.get(url).status_code == 401
            assert api.get(url, headers=other).status_code == 404
        run_response = api.get(f"/v1/runs/{run}", headers=owner)
        assert run_response.headers["Cache-Control"] == "private, no-store"
        assert run_response.json()["data"]["estimatedCostUsd"] == 0.02
        response = api.get(f"/v1/runs/{run}/results", headers=owner).json()
        assert response["source"] == "workspace"
        assert response["data"]["checks"][0]["name"] == "Private check"
        assert response["data"]["trace"] == ["Ran tests"]
