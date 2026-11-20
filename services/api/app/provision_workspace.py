"""Issue a short-lived reader token using an administrator database connection."""

import argparse
import getpass
import hashlib
import os
import re
import secrets
import subprocess
import sys
from uuid import uuid4

import psycopg
from psycopg import sql

from .migrate import migrate


def issue_token(conn: psycopg.Connection, subject: str) -> str:
    token = secrets.token_urlsafe(32)
    with conn.transaction():
        conn.execute("SET LOCAL statement_timeout = '15s'")
        inserted = conn.execute(
            """
            INSERT INTO users (id, external_subject) VALUES (%s, %s)
            ON CONFLICT (external_subject) DO NOTHING
            RETURNING id
            """,
            (uuid4(), subject),
        ).fetchone()
        if inserted:
            user_id = inserted[0]
            workspace_id = uuid4()
            conn.execute("INSERT INTO workspaces (id, name) VALUES (%s, 'My workspace')", (workspace_id,))
            conn.execute(
                "INSERT INTO memberships (workspace_id, user_id, role) VALUES (%s, %s, 'reader')",
                (workspace_id, user_id),
            )
            conn.execute(
                "INSERT INTO projects (id, workspace_id, name) VALUES (%s, %s, 'First project')",
                (uuid4(), workspace_id),
            )
        else:
            user_id = conn.execute(
                """
                SELECT u.id FROM users u
                WHERE u.external_subject = %s
                  AND EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id)
                """,
                (subject,),
            ).fetchone()
            if user_id is None:
                raise ValueError("This reader has no workspace membership. Ask an administrator to restore access.")
            user_id = user_id[0]
        conn.execute(
            """
            INSERT INTO access_tokens (token_hash, user_id, expires_at)
            VALUES (%s, %s, now() + interval '1 hour')
            """,
            (hashlib.sha256(token.encode()).digest(), user_id),
        )
    return token


def link_github_account(conn: psycopg.Connection, subject: str, github_id: int) -> None:
    with conn.transaction():
        conn.execute("SET LOCAL statement_timeout = '15s'")
        linked = conn.execute(
            """
            UPDATE users u SET github_user_id = %s
            WHERE u.external_subject = %s
              AND (u.github_user_id IS NULL OR u.github_user_id = %s)
              AND EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id)
            RETURNING u.id
            """,
            (github_id, subject, github_id),
        ).fetchone()
        if linked is None:
            raise ValueError("This local account has no workspace access or is linked to another GitHub user.")


def read_clipboard() -> str:
    result = subprocess.run(
        ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", "Get-Clipboard -Raw"],
        check=True,
        capture_output=True,
        text=True,
        timeout=10,
    )
    return result.stdout


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--subject", required=True, help="Stable local account name. Reuse it to issue a new token.")
    parser.add_argument("--windows-clipboard", action="store_true", help="Read the admin URL from the clipboard and replace it with the token.")
    parser.add_argument("--github-user-id", type=int, help="Link a GitHub numeric user ID to an existing local account.")
    parser.add_argument(
        "--setup-github-runtime-role", metavar="ROLE",
        help="Apply migrations and grant the named API database role read access to the GitHub identity columns.",
    )
    args = parser.parse_args()
    if args.setup_github_runtime_role and args.github_user_id is None:
        parser.error("--setup-github-runtime-role requires --github-user-id.")
    if args.github_user_id is not None and not 0 < args.github_user_id < 10**15:
        parser.error("--github-user-id must be a positive GitHub numeric user ID.")
    if not re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", args.subject):
        parser.error("--subject must contain 1 to 64 letters, digits, hyphens, or underscores.")
    if args.windows_clipboard and os.name != "nt":
        parser.error("--windows-clipboard requires Windows.")

    if args.windows_clipboard:
        print("Reading the administrator database URL from the clipboard…", file=sys.stderr, flush=True)
        try:
            url = read_clipboard().strip()
        except (OSError, subprocess.SubprocessError):
            print("Could not read the Windows clipboard.", file=sys.stderr)
            return 1
    else:
        url = (os.environ.get("PLATFORM_DATABASE_URL") or getpass.getpass("Administrator database URL: ")).strip()

    if not re.fullmatch(r"postgres(?:ql)?://\S+", url) or url.endswith("\\"):
        print("Use the Render External Database URL for the migration administrator.", file=sys.stderr)
        return 1

    subject = f"local:{args.subject}"
    print("Connecting to PostgreSQL…", file=sys.stderr, flush=True)
    try:
        with psycopg.connect(url, sslmode="require", connect_timeout=10) as conn:
            if args.setup_github_runtime_role:
                migrate(conn)
                conn.execute(sql.SQL("GRANT SELECT (id, github_user_id) ON users TO {}").format(
                    sql.Identifier(args.setup_github_runtime_role),
                ))
            if args.github_user_id is not None:
                link_github_account(conn, subject, args.github_user_id)
            else:
                token = issue_token(conn, subject)
    except psycopg.OperationalError:
        print("Could not complete the PostgreSQL operation. Check the external URL, credentials, and Render IP allowlist.", file=sys.stderr)
        return 1
    except psycopg.Error as error:
        print(f"Database rejected provisioning ({error.__class__.__name__}). Use the migration administrator and confirm migrations are applied.", file=sys.stderr)
        return 1
    except ValueError as error:
        print(error, file=sys.stderr)
        return 1

    if args.github_user_id is not None:
        print("GitHub account linked. You can now use GitHub sign-in when it is enabled.", file=sys.stderr)
        return 0

    if args.windows_clipboard:
        try:
            subprocess.run(["clip.exe"], input=token.encode("ascii"), check=True, timeout=10)
        except (OSError, subprocess.SubprocessError):
            print("Could not copy the token. Retry with the same subject to issue a new one.", file=sys.stderr)
            return 1
        print("Workspace token copied to your clipboard. It is valid for one hour.", file=sys.stderr)
    else:
        print(token)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
