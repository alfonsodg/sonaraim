# Sonaraim Deployment & Anti-Destruction Contract

## 1. Overview

This document defines the containerized orchestration topology, internal Docker DNS names, persistent storage mounts, and surgical single-service update rules for the Sonaraim ecosystem using `deploy/compose/docker-compose.yml`.

## 2. Service Topology & Internal DNS Names

| Service Name | Internal DNS | Role | Persistent Mount |
| :--- | :--- | :--- | :--- |
| `postgres` | `postgres` | Relational metadata, KYB, billing state | `${POSTGRES_VOLUME_PATH}:/var/lib/postgresql/data` |
| `redis` | `redis` | Rate limiting and ephemeral cache | `${REDIS_VOLUME_PATH}:/data` |
| `minio` | `minio` | S3-compatible encrypted media and ZK vault | `${MINIO_VOLUME_PATH}:/data` |
| `sonaraim-node` | `sonaraim-node` | P2P QUIC relay, Key Transparency, mailbox | `${NODE_DATA_VOLUME_PATH}:/var/lib/sonaraim` |
| `sonaraim-b2b` | `sonaraim-b2b` | Enterprise B2B HTTP/gRPC gateway & webhooks | Stateless (uses `postgres` & `redis`) |
| `sonaraim-admin` | `sonaraim-admin` | Operator Console & B2B Card Studio UI | Stateless |
| `sonaraim-app-web` | `sonaraim-app-web` | Client PWA & Instant Web Clip viewer | Stateless |

## 3. Anti-Destruction Rules

1. **NEVER** run `docker compose down -v`, `docker volume rm`, or drop databases in shared/sandbox environments.
2. **NEVER** hardcode credentials, URLs, or host ports inside `deploy/compose/docker-compose.yml`; all values must use `${VARIABLE}` substitution from `.env`.
3. Every stateful service (`postgres`, `redis`, `minio`, `sonaraim-node`) must retain its host-mounted volume across updates.

## 4. Surgical Single-Service Update Procedure

To update a single service without disturbing stateful dependencies (`postgres`, `redis`, `minio`):

```bash
docker compose -f deploy/compose/docker-compose.yml --env-file .env up -d --no-deps <service_name>
```

After updating any service, verify health before routing traffic:

```bash
curl -fsS "http://127.0.0.1:${NODE_HTTP_PORT}/health"
curl -fsS "http://127.0.0.1:${B2B_HTTP_PORT}/health"
curl -fsS "http://127.0.0.1:${ADMIN_HTTP_PORT}/health"
curl -fsS "http://127.0.0.1:${APP_WEB_PORT}/health"
```
