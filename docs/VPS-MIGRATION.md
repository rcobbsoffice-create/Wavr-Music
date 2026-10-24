# Moving WAVR from Vercel + Supabase to the ipserver.app VPS (Coolify)

## What moves where

| Piece | Before | After |
|---|---|---|
| Web app (Next.js) | Vercel | Coolify app on ipserver.app, built from `Dockerfile.web` |
| Database | Supabase Postgres | Postgres 17 in Coolify (same server) |
| Images (artwork, avatars, merch) | Supabase Storage | S3-compatible bucket (**Cloudflare R2** recommended, or Garage self-hosted) |
| Audio (beats, stems, kits) | Hugging Face dataset | Same bucket as images |
| Stems worker (Demucs) | Hugging Face Space | **Stays on the HF Space** (it needs more RAM than the VPS can spare) — it now saves stems to the bucket |

The app stores files as `/api/files/<key>` links. That route hands the browser a
1-hour signed URL, so the bucket stays private and audio streams straight from
storage instead of through the 4 GB server.

### Why R2 instead of self-hosting files
Any S3-compatible store works with no code changes (same `S3_*` env vars).
Don't use MinIO: its free edition stopped shipping Docker images in Oct 2025
and the project was archived in Apr 2026. For self-hosting use **Garage**. R2 is recommended because
the VPS already runs Coolify, Appwrite and Crypto Radar on 4 GB RAM, audio
libraries grow fast, and R2 has no download/egress fees (10 GB free, then about
$0.015/GB-month). Choose Garage if you want everything on your own box and have plenty of disk
(plus an off-server backup).

---

## 0. Before you start
- Rotate your **Hugging Face token**. The old code shipped it to every browser
  (`NEXT_PUBLIC_HF_TOKEN`), so treat it as leaked. Create a new read+write token
  and use it only in server env vars below.
- Make sure the VPS has swap (Next.js builds need ~1.5 GB):
  `fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab`
- Push this branch to GitHub (or merge it into `master`).

## 1. Database: Supabase → Postgres on the VPS
1. Coolify → your project → **+ New → Database → PostgreSQL**, version **17**. Note its
   **internal URL** (`postgres://postgres:…@<name>:5432/postgres`). Leave it un-exposed.
2. In Supabase → **Connect → Session pooler**, copy the connection string
   (use the pooler: the direct host is IPv6-only and many VPSes can't reach it).
3. Open the new Postgres resource's **Terminal** in Coolify and run:
   ```sh
   pg_dump "SUPABASE_SESSION_POOLER_URL" --schema=public --no-owner --no-acl -Fc -f /tmp/wavr.dump
   pg_restore --no-owner --no-acl -d "postgres://postgres:YOUR_PASSWORD@localhost:5432/postgres" /tmp/wavr.dump
   ```
4. Check row counts match: `psql -d postgres -c 'select count(*) from "Beat"; select count(*) from "User";'`

## 2. Storage bucket
**Cloudflare R2 (recommended)**
1. Cloudflare dashboard → R2 → **Create bucket** `wavr` (keep it private).
2. R2 → **Manage API tokens → Create token**, permission *Object Read & Write*, scoped to `wavr`.
   Note the Access Key ID, Secret, and the S3 endpoint `https://<account-id>.r2.cloudflarestorage.com`.
3. Bucket → Settings → **CORS policy** (browser uploads need it):
   ```json
   [{ "AllowedOrigins": ["https://wavr.ipserver.app"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
   ```
   Env values: `S3_REGION=auto`, `S3_FORCE_PATH_STYLE=false`.

**Or Garage on the VPS (self-hosted)**
Run Garage as a Docker Compose service in Coolify with its S3 API on a domain such as
`s3.ipserver.app`, create bucket `wavr` and an access key with `garage bucket create` /
`garage key create`, and allow CORS for your site. Env values:
`S3_ENDPOINT=https://s3.ipserver.app`, `S3_REGION=garage`, `S3_FORCE_PATH_STYLE=true`.

## 3. The app in Coolify
1. **+ New → Application → GitHub** → `rcobbsoffice-create/Wavr-Music`, branch with these changes.
2. Build Pack **Dockerfile**, Dockerfile Location **`/Dockerfile.web`**, Port **3000**.
3. Domain: e.g. `https://wavr.ipserver.app` (or your own domain pointed at the server's IP).
4. Environment variables (tick **Build Variable** on the two `NEXT_PUBLIC_` ones):

| Variable | Value |
|---|---|
| `DATABASE_URL` | internal Postgres URL from step 1 |
| `DIRECT_URL` | same as `DATABASE_URL` |
| `NEXT_PUBLIC_APP_URL` | `https://wavr.ipserver.app` *(build variable)* |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | from Vercel *(build variable)* |
| `STRIPE_SECRET_KEY` | from Vercel |
| `STRIPE_WEBHOOK_SECRET` | new one from step 6 |
| `JWT_SECRET` | from Vercel (**keep the same** or everyone gets logged out) |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE` | from step 2 |
| `STEMS_WORKER_URL` | your HF Space URL, e.g. `https://ipdevgroup-wavr-stems.hf.space` |
| `WORKER_SECRET` | any long random string (same value on the HF Space) |
| `HF_TOKEN`, `HF_REPO` | new token; `ipdevgroup/wavr-music-storage` (only needed until the file migration is done, and for the private Space) |
| `RESEND_API_KEY`, `FROM_EMAIL`, `PRINTFUL_*` | copy from Vercel |
| `PRISMA_DB_PUSH` | `true` for the first deploy (creates the new wallet table), then remove |

Delete these, they're no longer used: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_HF_TOKEN`, `NEXT_PUBLIC_HF_REPO`.

5. **Deploy.** Then remove `PRISMA_DB_PUSH` (or set it to `false`).

## 4. Copy the files and fix the links
Open the app's **Terminal** in Coolify (it already has every env var) and run:
```sh
DRY_RUN=1 node scripts/migrate-storage.mjs   # lists every file and where it's used
node scripts/migrate-storage.mjs             # copies them and rewrites the database
```
It copies only files the database points at, skips anything already copied, and
can be re-run safely. Failed files keep their old URL; fix and re-run.

## 5. Stems worker (HF Space)
1. Copy the updated `worker.py` and `requirements.txt` (adds `boto3`) into the Space repo.
2. Space → Settings → **Variables and secrets**: add `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`,
   `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, `WORKER_SECRET`.
3. Optional keep-awake: Coolify app → **Scheduled Tasks**, daily: `node -e "fetch(process.env.NEXT_PUBLIC_APP_URL+'/api/keep-alive')"`
   (replaces the Vercel cron in `vercel.json`).

## 6. Stripe
Stripe Dashboard (test mode first) → Developers → Webhooks → **Add endpoint**
`https://wavr.ipserver.app/api/webhooks/stripe` with events `payment_intent.succeeded` and
`checkout.session.completed`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`, redeploy.
Repeat in live mode when you switch.

## 7. Test before switching over
- [ ] Log in with an existing account (same `JWT_SECRET`)
- [ ] Marketplace plays previews; artwork shows
- [ ] Upload a beat with artwork (browser → bucket upload + CORS)
- [ ] Detect BPM/key on upload; stem separation finishes and stems play
- [ ] Wallet top-up with `4242 4242 4242 4242` and `4000 0025 0000 3155` (3D Secure)
- [ ] Buy a beat; the buyer's download saves a file
- [ ] Profile avatar/cover upload

## 8. Cut over and clean up
1. Point your real domain at the VPS in Coolify (or add a redirect on Vercel to the new URL), update
   `NEXT_PUBLIC_APP_URL` and the Stripe webhook URL to match, redeploy.
2. Pause the Vercel project.
3. Keep Supabase and the HF dataset for ~2 weeks as a backup, then delete them.
