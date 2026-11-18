# Showcase deployment

## Vercel frontend

- After the owner authorizes hosting, import the GitHub repository in Vercel.
- Set Root Directory to `apps/web`, Framework Preset to Next.js, and Node.js to 22.
- Use `npm ci` as the install command and `npm run build` as the build command.
- Leave API integration settings unset for the fixture showcase. Set `NEXT_TELEMETRY_DISABLED=1` if you want deployment builds to match CI telemetry settings.
- Verify the preview before promoting it. Check the landing page, dashboard, run detail, and comparison at desktop and mobile widths. Confirm that each results view identifies the data as sample data.
- From the repository root, run `sh scripts/smoke-web.sh https://YOUR-VERCEL-HOST` against the promoted deployment, then add the verified production URL to the README.
- If verification fails after promotion, restore the previous verified deployment from the Vercel Deployments view.
