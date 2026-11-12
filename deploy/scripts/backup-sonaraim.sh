#!/usr/bin/env bash
# Automated backup script for Sonaraim PostgreSQL, Redis, and Node WAL/snapshot volumes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${SONARAIM_ENV_FILE:-${ROOT_DIR}/.env}"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

BACKUP_ROOT="${SONARAIM_BACKUP_DIR:-${ROOT_DIR}/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
COMPOSE_FILE="${SONARAIM_COMPOSE_FILE:-${ROOT_DIR}/deploy/compose/docker-compose.yml}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET_DIR="${BACKUP_ROOT}/${TIMESTAMP}"

mkdir -p "${TARGET_DIR}"

echo "[sonaraim-backup] Starting backup at ${TIMESTAMP} -> ${TARGET_DIR}"

# 1. Logical PostgreSQL dump
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Fc > "${TARGET_DIR}/postgres.dump"

# 2. Trigger Redis background AOF/RDB save
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T redis \
  redis-cli -a "${REDIS_PASSWORD}" BGSAVE >/dev/null

# 3. Archive Node WAL/snapshot data volume if present
if [[ -n "${NODE_DATA_VOLUME_PATH:-}" && -d "${NODE_DATA_VOLUME_PATH}" ]]; then
  tar -czf "${TARGET_DIR}/node-data.tar.gz" -C "${NODE_DATA_VOLUME_PATH}" .
fi

# 4. Prune backups older than retention window
find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -exec rm -rf {} +

echo "[sonaraim-backup] Completed backup at ${TARGET_DIR}"
