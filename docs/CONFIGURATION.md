# Configuration Reference (`docs/CONFIGURATION.md`)

In strict compliance with the **Zero-Hardcode** mandate, all runtime parameters across the **Sonaraim** ecosystem are injected via environment variables or validated configuration files. No service embeds URLs, IP addresses, ports, cryptographic keys, or rate-limit thresholds in source code.

A complete template is provided in [samples/.env.example](../samples/.env.example).

---

## 1. Global & Shared Infrastructure Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `SONARAIM_ENV` | Yes | Runtime environment identifier (`dev`, `qa`, `prod`). |
| `LOG_LEVEL` | Yes | Structured JSON log level (`ERROR`, `WARN`, `INFO`, `DEBUG`). |
| `POSTGRES_USER` | Yes | PostgreSQL master user. |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL master password (parameterized via `.env`). |
| `POSTGRES_DB` | Yes | PostgreSQL database name (`sonaraim`). |
| `POSTGRES_DSN` | Yes | Full PostgreSQL connection string for persistent B2B and identity metadata. |
| `POSTGRES_VOLUME_PATH` | Yes | Host mount directory for PostgreSQL data volume. |
| `REDIS_PASSWORD` | Yes | Redis server password (parameterized via `.env`). |
| `REDIS_URL` | Yes | Full Redis connection string for ephemeral queues, cache, and rate limiting. |
| `REDIS_VOLUME_PATH` | Yes | Host mount directory for Redis append-only persistence. |
| `S3_ENDPOINT_URL` | Yes | S3-compatible endpoint (MinIO, Cloudflare R2, AWS S3) for media and ZK vaults. |
| `S3_BUCKET_MEDIA` | Yes | Bucket name for ephemeral client-side encrypted media attachments. |
| `S3_BUCKET_VAULT` | Yes | Bucket name for Zero-Knowledge Passkey encrypted vaults. |
| `S3_ACCESS_KEY_ID` | Yes | S3 access key credential. |
| `S3_SECRET_ACCESS_KEY` | Yes | S3 secret access key credential. |
| `MINIO_VOLUME_PATH` | Yes | Host mount directory for local MinIO blob storage. |

---

## 2. Nginx TLS Reverse-Proxy & Domain Configuration

Rendered with `envsubst` from `configs/nginx/sonaraim.conf.template`:

| Variable | Required | Description |
| :--- | :--- | :--- |
| `SONARAIM_PUBLIC_DOMAIN` | Yes | Apex public domain for Nginx server names (e.g., `sonaraim.example.com`). |
| `NODE_HTTP_PORT` | Yes | Host TCP port for `sonaraim-node` (`8040`). |
| `B2B_HTTP_PORT` | Yes | Host TCP port for `sonaraim-b2b` REST (`8042`). |
| `ADMIN_HTTP_PORT` | Yes | Host TCP port for `sonaraim-admin` web UI (`8044`). |
| `APP_WEB_PORT` | Yes | Host TCP port for `sonaraim-app` Instant Web Clip (`8045`). |

---

## 3. Decentralized Core Node (`sonaraim-node`)

| Variable | Required | Description |
| :--- | :--- | :--- |
| `NODE_ID` | Yes | Unique node identifier in the P2P mesh. |
| `NODE_HTTP_HOST` | Yes | Bind address for the HTTP/DID/Health server. |
| `NODE_HTTP_PORT` | Yes | Internal bind port for HTTP server. |
| `NODE_P2P_PORT` | Yes | Host UDP port exposed for P2P gossip datagrams (`9031`). |
| `NODE_P2P_LISTEN_ADDR` | Yes | `libp2p` multiaddr for QUIC/WebTransport (e.g., `/ip4/0.0.0.0/udp/9031/quic-v1`). |
| `NODE_BOOTSTRAP_PEERS` | Yes | Comma-separated list of bootstrap peer multiaddrs. |
| `NODE_SIGNING_KEY_PATH` | Yes | Path to the node's Ed25519 private key (also derives `<path>.wal`). |
| `NODE_DATA_VOLUME_PATH` | Yes | Host mount directory for node WAL and snapshot persistence. |
| `NODE_ENVELOPE_TTL_SECONDS` | Yes | Maximum retention TTL in seconds for undelivered envelopes. |
| `NODE_API_AUTH_TOKEN` | No | Secret Bearer token protecting write endpoints (`POST /v1/relay/envelopes`, etc.). |
| `NODE_L2_ANCHOR_ENABLED` | No | Whether periodic Merkle state-root anchoring to an L2 RPC is enabled (`true`/`false`). |
| `NODE_L2_RPC_URL` | Cond. | L2 JSON-RPC endpoint (required if `NODE_L2_ANCHOR_ENABLED=true`). |

---

## 4. Enterprise B2B Gateway (`sonaraim-b2b`)

| Variable | Required | Description |
| :--- | :--- | :--- |
| `B2B_HTTP_HOST` | Yes | Bind address for REST and WhatsApp compatibility endpoints. |
| `B2B_HTTP_PORT` | Yes | Internal bind port for HTTP REST server. |
| `B2B_GRPC_PORT` | Yes | Internal bind port for gRPC AI agent and CRM streaming server (`8043`). |
| `B2B_NODE_RPC_URL` | Yes | Internal URL of the paired `sonaraim-node` relay daemon. |
| `B2B_KMS_MASTER_KEY` | Yes | KMS key URI or secret used to seal tenant MLS bridge credentials at rest. |
| `B2B_PROMO_RATE_LIMIT_RPS` | Yes | Default per-tenant promotional rate limit (enforced alongside ConsentTokens). |
| `B2B_INSTANT_CLIP_BASE_URL` | Yes | Base URL used by Smart Fallback Engine to generate signed Instant Card links. |
| `B2B_WEBHOOK_TIMEOUT_MS` | No | Timeout in milliseconds for outbound merchant webhook deliveries (default `5000`). |
| `B2B_BOOTSTRAP_TENANT_DID` | No | Pre-provisioned bootstrap tenant DID for initial bootstrapping. |
| `B2B_BOOTSTRAP_API_KEY` | No | Pre-provisioned API key for the bootstrap tenant. |
| `B2B_ADMIN_API_KEY` | No | Master administrator API key for tenant provisioning (`POST /v1/tenants`). |
| `B2B_STORAGE_PATH` | No | Path for durable JSONL snapshot persistence. |

---

## 5. Admin Console (`sonaraim-admin`) & Client App (`sonaraim-app`)

| Variable | Required | Description |
| :--- | :--- | :--- |
| `ADMIN_HTTP_HOST` | No | Bind host for `sonaraim-admin` server (`0.0.0.0`). |
| `ADMIN_HTTP_PORT` | Yes | Port serving `sonaraim-admin` web UI (`8044`). |
| `VITE_B2B_API_BASE_URL` | Yes | Public or internal URL of `sonaraim-b2b` gateway. |
| `VITE_NODE_API_BASE_URL` | Yes | Public or internal URL of `sonaraim-node` relay. |
| `ADMIN_OPERATOR_TOKEN` | No | Secret token protecting the Operator Console and Card Studio. |
| `APP_WEB_PORT` | Yes | Port serving `sonaraim-app` Instant Web Clip client (`8045`). |
| `SONARAIM_APP_HOST` | No | Host bind address for `sonaraim-app-web`. |
| `PUBLIC_LIVEKIT_URL` | Yes | Public WebRTC SFU endpoint (`wss://...`) for E2EE voice and video calls. |
| `LIVEKIT_API_KEY` | Yes | LiveKit server API key for generating short-lived room tokens. |
| `LIVEKIT_API_SECRET` | Yes | LiveKit server API secret. |
| `APP_SESSION_SECRET` | No | Session cookie encryption secret for client PWA. |
| `SONARAIM_REQUIRE_AUTH` | No | Whether the web clip client enforces user authentication (`true`/`false`). |

---

## 6. Backup & Disaster Recovery Automation

Configured in `deploy/scripts/backup-sonaraim.sh`:

| Variable | Required | Description |
| :--- | :--- | :--- |
| `SONARAIM_BACKUP_DIR` | No | Directory where automated backup archives are written (default `backups/`). |
| `BACKUP_RETENTION_DAYS` | No | Retention window in days for automated snapshot pruning (default `14`). |
| `SONARAIM_COMPOSE_FILE` | No | Path to multi-service Docker Compose file (default `deploy/compose/docker-compose.yml`). |
| `SONARAIM_ENV_FILE` | No | Path to environment variable file (default `.env`). |
