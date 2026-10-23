#!/bin/sh
set -e

# Apply schema changes on start only when asked (set PRISMA_DB_PUSH=true in Coolify).
# `db push` refuses changes that would drop data, so a bad schema stops the deploy
# instead of deleting anything.
if [ "$PRISMA_DB_PUSH" = "true" ]; then
  echo "[entrypoint] Syncing database schema..."
  npx prisma db push --skip-generate
fi

exec npx next start -H "${HOSTNAME:-0.0.0.0}" -p "${PORT:-3000}"
