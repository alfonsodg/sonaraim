# Configuration Reference (CONFIGURATION.md)

In strict compliance with the **Zero-Hardcode** mandate, all runtime parameters across the **Sonaraim** ecosystem are injected via environment variables or validated configuration files. No service may embed URLs, IP addresses, ports, cryptographic keys, or rate-limit thresholds in source code.

A complete template is provided in [samples/.env.example](../samples/.env.example).

---

## 1. Global & Shared Infrastructure Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `SONARAIM_ENV` | Yes | Runtime environment identifier (`dev`, `qa`, `prod`). |
| `LOG_LEVEL` | Yes | Structured JSON log level (`ERROR`, `WARN`, `INFO`, `DEBUG`). |
| `POSTGRES_DSN` | Yes | PostgreSQL connection string for persistent B2B state and identity snapshots. |
| `REDIS_URL` | Yes | Redis connection URL for ephemeral queues and rate limiting. |
| `S3_ENDPOINT_URL` | Yes | S3-compatible endpoint (MinIO, Cloudflare R2, or AWS S3) for encrypted blobs and ZK vaults. |
| `S3_BUCKET_MEDIA` | Yes | Bucket name for ephemeral client-encrypted media attachments. |
| `S3_BUCKET_VAULT` | Yes | Bucket name for Zero-Knowledge Passkey encrypted vaults. |
| `S3_ACCESS_KEY_ID` | Yes | S3 access key credential. |
| `S3_SECRET_ACCESS_KEY` | Yes | S3 secret access key credential. |

---

## 2. Decentralized Core Node (`sonaraim-node`)

| Variable | Required | Description |
| :--- | :--- | :--- |
| `NODE_ID` | Yes | Unique node identifier in the P2P mesh. |
| `NODE_HTTP_HOST` | Yes | Bind address for the HTTP/DID/Health server. |
| `NODE_HTTP_PORT` | Yes | Bind port for the HTTP server (mapped to `8040` on host). |
| `NODE_P2P_LISTEN_ADDR` | Yes | `libp2p` multiaddr for QUIC/WebTransport (e.g., `/ip4/0.0.0.0/udp/8041/quic-v1`). |
| `NODE_BOOTSTRAP_PEERS` | Yes | Comma-separated list of bootstrap peer multiaddrs. |
| `NODE_SIGNING_KEY_PATH` | Yes | Path to the node's Ed25519 private key for signing Merkle tree heads. |
| `NODE_ENVELOPE_TTL_SECONDS` | Yes | Maximum retention TTL for undelivered store-and-forward envelopes. |
| `NODE_L2_ANCHOR_ENABLED` | No | Whether periodic Merkle state-root anchoring to an L2 RPC is enabled (`true`/`false`). |
| `NODE_L2_RPC_URL` | Cond. | L2 JSON-RPC endpoint if `NODE_L2_ANCHOR_ENABLED=true`. |

---

## 3. Enterprise B2B Gateway (`sonaraim-b2b`)

| Variable | Required | Description |
| :--- | :--- | :--- |
| `B2B_HTTP_HOST` | Yes | Bind address for REST and WhatsApp compatibility endpoints. |
| `B2B_HTTP_PORT` | Yes | Bind port for HTTP REST server (mapped to `8042` on host). |
| `B2B_GRPC_PORT` | Yes | Bind port for gRPC AI agent and CRM streaming server (mapped to `8043` on host). |
| `B2B_NODE_RPC_URL` | Yes | Internal URL of the paired `sonaraim-node` relay daemon. |
| `B2B_KMS_MASTER_KEY` | Yes | KMS key URI or secret used to seal tenant MLS bridge credentials at rest. |
| `B2B_PROMO_RATE_LIMIT_RPS` | Yes | Default per-tenant promotional campaign rate limit (enforced alongside ConsentTokens). |
| `B2B_INSTANT_CLIP_BASE_URL` | Yes | Base URL used by the Smart Fallback Engine to generate signed Instant Card links. |
| `B2B_WEBHOOK_TIMEOUT_MS` | Yes | Timeout in milliseconds for outbound merchant webhook deliveries. |

---

## 4. Admin Console (`sonaraim-admin`) & Client App (`sonaraim-app`)

| Variable | Required | Description |
| :--- | :--- | :--- |
| `ADMIN_HTTP_PORT` | Yes | Host port serving the `sonaraim-admin` web bundle (`8044`). |
| `VITE_B2B_API_BASE_URL` | Yes | Public URL of the `sonaraim-b2b` gateway for the admin console. |
| `VITE_NODE_API_BASE_URL` | Yes | Public URL of the `sonaraim-node` telemetry/DID endpoint. |
| `APP_WEB_PORT` | Yes | Host port serving the `sonaraim-app` Instant Web / App Clip client (`8045`). |
| `PUBLIC_LIVEKIT_URL` | Yes | Public WebRTC SFU endpoint (`wss://...`) for E2EE voice and video calls. |
| `LIVEKIT_API_KEY` | Yes | LiveKit server API key for generating short-lived call room tokens. |
| `LIVEKIT_API_SECRET` | Yes | LiveKit server API secret. |
