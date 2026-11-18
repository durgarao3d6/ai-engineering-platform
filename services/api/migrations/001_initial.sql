CREATE TABLE users (
    id uuid PRIMARY KEY,
    external_subject text NOT NULL UNIQUE
);

CREATE TABLE workspaces (
    id uuid PRIMARY KEY,
    name text NOT NULL
);

CREATE TABLE memberships (
    workspace_id uuid NOT NULL REFERENCES workspaces(id),
    user_id uuid NOT NULL REFERENCES users(id),
    role text NOT NULL CHECK (role IN ('reader', 'admin')),
    PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE access_tokens (
    token_hash bytea PRIMARY KEY CHECK (octet_length(token_hash) = 32),
    user_id uuid NOT NULL REFERENCES users(id),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz
);

CREATE TABLE projects (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspaces(id),
    name text NOT NULL
);

CREATE TABLE datasets (
    id uuid PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id),
    name text NOT NULL,
    version text NOT NULL,
    UNIQUE (project_id, name, version),
    UNIQUE (project_id, id)
);

CREATE TABLE runs (
    id uuid PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id),
    dataset_id uuid NOT NULL,
    name text NOT NULL,
    duration_ms integer NOT NULL CHECK (duration_ms >= 0),
    estimated_cost_usd numeric(12, 6) NOT NULL CHECK (estimated_cost_usd >= 0),
    trace text[] NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (project_id, dataset_id) REFERENCES datasets(project_id, id)
);

CREATE TABLE case_results (
    run_id uuid NOT NULL REFERENCES runs(id),
    name text NOT NULL,
    position integer NOT NULL CHECK (position >= 0),
    passed boolean NOT NULL,
    summary text NOT NULL,
    PRIMARY KEY (run_id, name),
    UNIQUE (run_id, position)
);

CREATE INDEX memberships_by_user ON memberships (user_id, workspace_id);
CREATE INDEX projects_by_workspace ON projects (workspace_id);
CREATE INDEX runs_by_project ON runs (project_id, created_at DESC, id);
