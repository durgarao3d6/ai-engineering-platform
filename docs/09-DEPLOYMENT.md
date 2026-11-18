# Showcase deployment

## Vercel frontend

- After the owner authorizes hosting, import the GitHub repository in Vercel.
- Set Root Directory to `apps/web`, Framework Preset to Next.js, and Node.js to 22.
- Use `npm ci` as the install command and `npm run build` as the build command.
- Leave API integration settings unset for the fixture showcase. Set `NEXT_TELEMETRY_DISABLED=1` if you want deployment builds to match CI telemetry settings.
- Verify the preview before promoting it. Check the landing page, dashboard, run detail, and comparison at desktop and mobile widths. Confirm that each results view identifies the data as sample data.
- From the repository root, run `sh scripts/smoke-web.sh https://YOUR-VERCEL-HOST` against the promoted deployment, then add the verified production URL to the README.
- If verification fails after promotion, restore the previous verified deployment from the Vercel Deployments view.

## Render API and PostgreSQL

1. After approval, provision a PostgreSQL database in the API's region. Use
   encrypted connections and keep the database off the public network where
   the hosting plan permits it.
2. With a migration role, run `uv run --locked python -m app.migrate` from
   `services/api` in an environment that can reach the database. Supply the
   migration connection string through `PLATFORM_DATABASE_URL` as a secret.
3. Create a separate runtime database role with schema `USAGE` and `SELECT` on
   `access_tokens`, `memberships`, `projects`, `datasets`, `runs`, and
   `case_results`. Supply its connection string through Render's secret
   `PLATFORM_DATABASE_URL` setting. Keep schema and data writes with the
   administrative roles.
4. Import the root `render.yaml` Blueprint in Render. Set
   `PLATFORM_CORS_ORIGINS` to a JSON array of verified Vercel origins, for
   example `["https://YOUR-VERCEL-HOST"]`. Use exact origins and keep automatic
   deploys off until the initial smoke checks pass.
5. Deploy the approved revision. The container binds to Render's `PORT`.
   `/health` reports process liveness and `/ready` checks that the runtime can
   reach the migrated database. The public frontend uses bundled samples.
   Leave `EVALUATION_API_URL` unset in Vercel production. The production API
   enables authenticated workspace reads, and the local development API
   serves the sample data used for frontend integration testing.
6. Run `sh scripts/smoke-deployment.sh https://YOUR-VERCEL-HOST https://YOUR-RENDER-HOST`.
   For the authenticated check, provision a disposable workspace and a
   short-lived reader token, verify that the token can only read that
   workspace through the versioned API, then revoke it. Publish verified
   public URLs in the README after the checks pass.
7. If checks fail, restore the previously verified frontend and API revisions.
   Restore the database from backup if needed. Keep schema changes compatible
   with the previous application revision during the rollout window.
