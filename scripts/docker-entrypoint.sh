#!/bin/sh
set -eu

DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR"

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="file:${DATA_DIR}/app.db"
fi

if [ -z "${SESSION_SECRET:-}" ] || [ "$SESSION_SECRET" = "change-me-in-production" ] || [ "$SESSION_SECRET" = "dev-insecure-secret" ]; then
  SECRET_FILE="${DATA_DIR}/session-secret"
  if [ -f "$SECRET_FILE" ]; then
    SESSION_SECRET="$(cat "$SECRET_FILE")"
    export SESSION_SECRET
  else
    SESSION_SECRET="$(openssl rand -hex 32)"
    export SESSION_SECRET
    umask 077
    printf '%s' "$SESSION_SECRET" > "$SECRET_FILE"
  fi
fi

npx prisma migrate deploy
exec node server.js
