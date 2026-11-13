# Sonaraim Deployment & Anti-Destruction Contract (`docs/DEPLOYMENT.md`)

## 1. Overview

This document defines the containerized orchestration topology, internal Docker DNS names, persistent storage mounts, edge Nginx reverse-proxy configuration, Prometheus alerting rules, automated backup procedures, and surgical single-service update rules for the Sonaraim ecosystem.

---

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

---

## 3. Anti-Destruction Rules

1. **NEVER** run `docker compose down -v`, `docker volume rm`, or drop database tables in shared, staging, or production environments.
2. **NEVER** hardcode credentials, URLs, or host ports inside `deploy/compose/docker-compose.yml`; all values must use `${VARIABLE}` substitution from `.env`.
3. Every stateful service (`postgres`, `redis`, `minio`, `sonaraim-node`) must retain its host-mounted volume across updates.
4. Backups must be verified before executing schema migrations or significant infrastructure refactors.

---

## 4. Edge Nginx Reverse Proxy & Certbot TLS Automation

System Nginx acts as the TLS-terminating reverse proxy protecting internal containers:

```bash
# 1. Obtain Let's Encrypt certificates via Certbot
certbot certonly --webroot -w /var/www/certbot \
  -d "${SONARAIM_PUBLIC_DOMAIN}" \
  -d "node.${SONARAIM_PUBLIC_DOMAIN}" \
  -d "b2b.${SONARAIM_PUBLIC_DOMAIN}" \
  -d "admin.${SONARAIM_PUBLIC_DOMAIN}"

# 2. Render and apply Nginx configuration template
envsubst '${SONARAIM_PUBLIC_DOMAIN} ${NODE_HTTP_PORT} ${B2B_HTTP_PORT} ${ADMIN_HTTP_PORT} ${APP_WEB_PORT}' \
  < configs/nginx/sonaraim.conf.template > /etc/nginx/sites-available/sonaraim.conf
ln -sf /etc/nginx/sites-available/sonaraim.conf /etc/nginx/sites-enabled/sonaraim.conf
nginx -t && systemctl reload nginx
```

Features enforced by `configs/nginx/sonaraim.conf.template`:

- Strict-Transport-Security (HSTS) with 2-year max-age and preload.
- Content-Security-Policy (CSP), X-Frame-Options (`DENY`), and X-Content-Type-Options (`nosniff`).
- Rate limiting zones for general API requests (`30r/s`) and authentication endpoints (`10r/m`).

---

## 5. Prometheus Observability & Alerting Rules

Prometheus actively scrapes `/metrics` across services using alert definitions from `configs/prometheus/alerts.yml`:

- **`SonaraimServiceDown`** (Critical): Triggers when any Sonaraim service target is unreachable for more than 1 minute.
- **`SonaraimAdminUpstreamUnreachable`** (Warning): Triggers when `sonaraim-admin` operator telemetry probes to `sonaraim-node` or `sonaraim-b2b` fail for 2 minutes.
- **`SonaraimRelayQueueBacklogHigh`** (Warning): Triggers when `sonaraim-node` store-and-forward queue depth exceeds 10,000 envelopes for 5 minutes.

---

## 6. Automated Backup & Disaster Recovery

Backups are executed automatically via `deploy/scripts/backup-sonaraim.sh`:

```bash
# Execute manual backup or trigger via cron
bash deploy/scripts/backup-sonaraim.sh
```

The script performs:

1. **Logical PostgreSQL Dump**: Creates a custom-format dump (`pg_dump -Fc`) of relational tenant and identity metadata.
2. **Redis Snapshot**: Triggers a background point-in-time save (`BGSAVE`) for append-only state.
3. **Node Data Volume Archive**: Archives `${NODE_DATA_VOLUME_PATH}` containing node WALs and snapshot logs into a compressed tarball (`node-data.tar.gz`).
4. **Pruning**: Automatically purges backup archives older than `${BACKUP_RETENTION_DAYS}` (default 14 days).

---

## 7. Surgical Single-Service Update Procedure

To update a single service without disturbing stateful dependencies (`postgres`, `redis`, `minio`):

```bash
docker compose -f deploy/compose/docker-compose.yml --env-file .env up -d --no-deps <service_name>
```

Supported service targets:

- `sonaraim-node`
- `sonaraim-b2b`
- `sonaraim-admin`
- `sonaraim-app-web`

After updating any service, verify health endpoints before opening production traffic:

```bash
curl -fsS "http://127.0.0.1:${NODE_HTTP_PORT}/health"
curl -fsS "http://127.0.0.1:${B2B_HTTP_PORT}/health"
curl -fsS "http://127.0.0.1:${ADMIN_HTTP_PORT}/health"
curl -fsS "http://127.0.0.1:${APP_WEB_PORT}/health"
```
