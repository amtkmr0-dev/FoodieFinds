# Deploy FoodieFinds to a public test URL

The repo now has everything Render needs to spin up a web service + Postgres
in one click. Total time on first deploy: ~5 minutes (mostly the Postgres
provision). Cost: $0 on the free plans.

## TL;DR

1. Go to <https://dashboard.render.com/blueprints>
2. Click **New Blueprint Instance**
3. Connect your GitHub account → select **amtkmr0-dev/FoodieFinds** → branch **main**
4. Render reads `render.yaml`, shows you a preview, click **Apply**
5. Wait for the green dot. The web service URL prints at the top.

That's it. The first build takes 4–5 min (Docker layer cache is cold), redeploys
on subsequent pushes are 1–2 min.

## What gets provisioned

| Resource | Plan | Notes |
|---|---|---|
| `foodiefinds-server` | Free web service | Docker runtime, single instance, sticky by default |
| `foodiefinds-db`     | Free Postgres   | 90-day expiry, 256 MB RAM, 1 GB storage |

`JWT_SECRET` is auto-generated and injected. `DATABASE_URL` is wired from the
database service. The Dockerfile runs migrations + seed before booting.

## After the first deploy lands

1. Note your public URL — something like `https://foodiefinds-server.onrender.com`.
2. Open the Render dashboard → `foodiefinds-server` → **Environment** tab.
3. Set `ALLOWED_ORIGINS` to that URL (e.g. `https://foodiefinds-server.onrender.com`).
4. Click **Save Changes** — Render redeploys automatically (1–2 min).

Without that, the API will refuse cross-origin requests, but the SPA loads
fine because client and server share the origin.

## Verifying it works

```bash
curl https://<your-url>.onrender.com/api/gifts
# -> [{"id":"...", "name":"Rose", "amount":20, ...}, ...]

curl https://<your-url>.onrender.com/api/v1/gifts
# -> Same response (versioning shim from PR #1)
```

Then open `https://<your-url>.onrender.com/` in a browser. You should land
on the React app. Tap a recharge amount → after PR #4 merges, you'll redirect
to `/signup`. Right now (before PR #4) you'll still see the "Payment Failed
please log in" toast.

### Smoke-test persistence (the whole point of PR #3)

1. Sign up via OTP.
2. Recharge ₹100.
3. In the Render dashboard, click **Manual Deploy** → **Deploy latest commit**.
4. After redeploy, your wallet still shows ₹100 — proves Drizzle/Postgres is
   wired correctly. (With `MemStorage` it would have reset to 0.)

## Free tier caveats

- The web service spins down after 15 min of no traffic. First request after
  cold start takes ~30s to wake it. Fine for testing, not for production.
- The Postgres free plan **expires after 90 days**. Migrate to a paid plan
  via the dashboard before then if you want to keep the data, or accept the
  reset.
- Single-instance only. Don't scale `numInstances` above 1 — the WebSocket
  gateway holds subscribers in-process. Multi-instance needs a Redis fan-out
  layer (separate PR).

## Alternatives

- **Fly.io**: same Dockerfile works. Run `fly launch` from this directory,
  pick a region, attach a Postgres app, set the env vars manually. Fly's free
  tier is more generous on uptime but no automatic Blueprints.
- **Railway**: also Docker-based, similar flow to Render, no expiry on the
  Postgres free tier (but smaller storage).
- **Vercel**: client-only. The Express + WebSocket gateway won't run on
  serverless functions; split into two services if going this route.

## If the build fails

Most common causes (in order of likelihood):

1. **`@replit/vite-plugin-runtime-error-modal` not found** — the root vite
   config imports it unconditionally. If that fails to install, pin the
   version or remove the import (it's a dev-only no-op anyway).
2. **TypeScript compile errors** — run `npx tsc --noEmit` locally; the
   Docker build doesn't strictly type-check, but `tsx` will fail at startup
   on actually-broken types.
3. **Missing migrations** — the seed step assumes the migration ran first.
   If you reset the DB manually, run `npm run db:setup` from a shell.

Render's logs are at `Service → Logs` in the dashboard. Search for `ERROR`.
