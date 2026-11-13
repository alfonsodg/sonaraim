# System Architecture (`docs/ARCHITECTURE.md`)

> **Note**: In compliance with project documentation rules, this file contains architectural specifications and ASCII diagrams only. For visual Mermaid diagrams, see [docs/DIAGRAMS.md](DIAGRAMS.md).

---

## 1. Executive Summary & Architectural Philosophy

**Sonaraim** is a decentralized, high-throughput B2C messaging and B2B transactional platform designed to eliminate two structural flaws of legacy messaging ecosystems:

1. **Surveillance & Metadata Centralization (B2C)**: Centralized messengers monetize social graphs and metadata, while naive blockchain messengers suffer from multi-second latency, permanent metadata exposure on public ledgers, and per-message gas fees.
2. **Predatory Per-Message Tolls & Phishing Vulnerability (B2B)**: Incumbent B2B APIs charge punitive per-template fees for utility/OTP notifications, restrict AI agent integrations, and force users out of chat into slow mobile browsers.

Sonaraim resolves both challenges by decoupling **Real-Time Encrypted Transport (Data Plane)** from **Verifiable Identity & Governance (Control Plane)** across **6 modular repositories**.

---

## 2. High-Level System Topology (ASCII)

```text
+-----------------------------------------------------------------------------------+
|                            CLIENT & EXPERIENCE LAYER                              |
|                                                                                   |
|  +-------------------------------------+   +-----------------------------------+  |
|  |            sonaraim-app             |   |          sonaraim-admin           |  |
|  |  (Mobile iOS/Android React Native,  |   |   (Node Operator & B2B Console)   |  |
|  |   Desktop, Instant Web/App Clip)    |   |  - Mesh Telemetry & KYB Approval  |  |
|  |  - Dual Inbox (Personal / Services) |   |  - Tenant Seats & RBAC            |  |
|  |  - Native Zero-HTML Card Renderer   |   |  - Visual Card Studio & Preview   |  |
|  |  - Passkey + WebAuthn PRF ZK Vault  |   |  - Webhook, AI & CRM Routing      |  |
|  |  - Instant Web / App Clip Fallback  |   |  - Prometheus Scrape (/metrics)   |  |
|  +------------------+------------------+   +-----------------+-----------------+  |
+---------------------|----------------------------------------|--------------------+
                      | QUIC / WebTransport                    | HTTPS / REST / gRPC
                      | (MLS E2EE + Sealed Sender)             |
                      v                                        v
+----------------------------------------+   +--------------------------------------+
|       DECENTRALIZED CORE LAYER         |   |        ENTERPRISE B2B LAYER          |
|             sonaraim-node              |<->|            sonaraim-b2b              |
|  (Rust P2P Relay & Identity Daemon)    |   |  (Enterprise Bridge & SaaS Gateway)  |
|                                        |   |                                      |
|  [Data Plane]                          |   |  - Enterprise MLS E2EE Termination   |
|  - libp2p QUIC Mesh & Gossipsub        |   |  - 1-Click WhatsApp Cloud Adapter    |
|  - Sealed Sender Mailbox Routing       |   |  - Ed25519 Signed Card Engine        |
|  - Ephemeral Store-and-Forward         |   |  - Cryptographic Consent Gate        |
|  - Live UDP Gossip Transport           |   |  - AI Agent gRPC & CRM Connectors    |
|  - Blind Push Wake-Up Dispatcher       |   |  - Smart Fallback (SMS / Magic Link) |
|                                        |   |  - Zero-Markup Payment Intents       |
|  [Control Plane]                       |   +------------------+-------------------+
|  - Key Transparency Merkle Tree        |                      |
|  - DID Resolver (did:sonaraim/did:web) |                      |
|  - PSI Contact Discovery Blind Signer  |                      |
+-------------------+--------------------+                      |
                    |                                           |
                    +---------------------+---------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                  EDGE REVERSE PROXY, MONITORING & STORAGE LAYER                   |
|                                                                                   |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  |     System Nginx    |  |     Prometheus      |  |     Backup Automation     |  |
|  |  - TLS (Certbot)    |  |  - Scrape /metrics  |  |  - Logical pg_dump        |  |
|  |  - HSTS / CSP       |  |  - Service Down     |  |  - Redis BGSAVE           |  |
|  |  - Rate Limiting    |  |  - High Queue Depth |  |  - Node WAL tar archive   |  |
|  +----------+----------+  +----------+----------+  +-------------+-------------+  |
|             |                        |                           |                |
|             v                        v                           v                |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  |   PostgreSQL 17     |  |       Redis 7       |  |     S3 / MinIO / R2       |  |
|  | (B2B Tenant State)  |  | (Rate Limit/Cache)  |  | (Encrypted Media/ZK Vault)|  |
|  +---------------------+  +---------------------+  +---------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Separation of Responsibilities (The 6 Services)

### 3.1 `sonaraim` (Coordinator / Control Repository)

- **Scope**: Single source of truth for global architectural specifications, shared schemas, and deployment orchestration.
- **Responsibilities**:
  - Centralized documentation suite (`ARCHITECTURE.md`, `DIAGRAMS.md`, `API.md`, `CONFIGURATION.md`, `DEPLOYMENT.md`, `INSTALL.md`, `STANDARDS.md`, `GLOSSARY.md`).
  - Formal JSON Schema definition for interactive **Sonaraim Cards** (`configs/schemas/sonaraim-card.schema.json`).
  - Parameterized Nginx TLS reverse-proxy templates (`configs/nginx/sonaraim.conf.template`) and Certbot automation.
  - Prometheus alerting rule specifications (`configs/prometheus/alerts.yml`).
  - Multi-service Docker Compose orchestration (`deploy/compose/docker-compose.yml`) and automated disaster recovery scripts (`deploy/scripts/backup-sonaraim.sh`).
  - Cross-service contract integrity tests (`tests/contracts.test.mjs`).

### 3.2 `sonaraim-protocol` (Shared Specifications, Cryptography & Invariants)

- **Scope**: Canonical wire formats, envelope models, and cryptographic primitives.
- **Responsibilities**:
  - Sealed Sender outer envelope model (`src/envelope.rs`) enforcing 32-byte X25519 public keys, anonymous mailbox IDs, and TTL bounds.
  - Declarative Sonaraim Card model and structural validator (`src/card.rs`) rejecting raw HTML and script execution.
  - JSON Canonicalization Scheme (RFC 8785) hashing and Ed25519 signature validation (`src/crypto.rs`).
  - Identity keyring rotation and revocation tracking (`src/keyring.rs`).
  - MLS group tree ratcheting, epoch progression, and transcript hashing (`src/mls_group.rs`).
  - Private Set Intersection blinded token evaluation (`src/psi.rs`).
  - Anti-replay sliding window with FIFO eviction (`src/replay.rs`).
  - Length-prefixed wire framing codec (`src/wire.rs`).

### 3.3 `sonaraim-node` (Decentralized P2P Relay & Key Transparency Core — Rust)

- **Scope**: High-performance, low-footprint relay daemon maintaining the messaging mesh and verifiable identity directory.
- **Responsibilities**:
  - **Sealed Sender Relay**: Routes encrypted envelopes exclusively by `mailbox_id` with TTL-bounded store-and-forward buckets.
  - **Key Transparency Merkle Log**: Append-only cryptographic ledger tracking `did:sonaraim:` and `did:web:` public key commitments with logarithmic inclusion proofs.
  - **Live UDP Gossip Transport**: Non-blocking UDP socket (`src/udp_gossip.rs`) exchanging compact `SignedTreeHead` datagrams with equivocation detection.
  - **P2P Federation Sync**: Exchanges tree heads and peer lists over QUIC and HTTP.
  - **Private Set Intersection (PSI)**: Blind contact discovery service (`/v1/contacts/psi`) matching blinded tokens without learning non-matching contacts.
  - **S3 Presigning & Atomic WAL Compaction**: Generates presigned PUT upload URLs and compacts WAL storage files atomically upon envelope ACK.
  - **Observability**: Exposes `/health` JSON status and `/metrics` Prometheus counters.

### 3.4 `sonaraim-b2b` (Enterprise Gateway & E2EE Termination Bridge — Rust/Go)

- **Scope**: Developer-first B2B API gateway connecting enterprise backends, CRMs, and AI bots to the Sonaraim P2P mesh.
- **Responsibilities**:
  - **Enterprise E2EE Termination Bridge**: Terminates organization MLS 1.0 sessions inside an isolated cryptographic boundary and dispatches clean REST/gRPC events.
  - **1-Click WhatsApp Cloud API Adapter**: Translates Meta WhatsApp Business Cloud API JSON payloads into native declarative cards with zero code changes.
  - **Signed Declarative Card Engine**: Validates card payloads, attaches tenant Ed25519 signatures, and handles user action callbacks.
  - **Cryptographic Consent Gate**: Distinguishes unlimited Transactional messages from Promotional campaigns requiring active, unrevoked user `ConsentTokens`.
  - **Smart Fallback Engine**: Generates signed Instant Web / App Clip magic links (`{B2B_INSTANT_CLIP_BASE_URL}/c/{token}`) for un-onboarded recipients.
  - **CRM Connectors**: Standardized webhooks for Chatwoot, Zendesk, HubSpot, and Salesforce.
  - **Zero-Markup Payment Intents**: In-card checkout intent processing with zero per-message toll fees.

### 3.5 `sonaraim-admin` (Dual-Console Web Application — React/Vite/Node.js)

- **Scope**: Administrative web management portal separating infrastructure governance from commercial tenant tools.
- **Responsibilities**:
  - **Super Admin & Node Operator Console**: Real-time P2P relay mesh telemetry, Merkle epoch drift detection, and automated KYB (`did:web`) audits.
  - **B2B Tenant Console & Visual Card Studio**: Declarative card builder, schema validation, JCS signing manifest generation, and live dispatch to `sonaraim-b2b`.
  - **Zero-Trust Operator Authentication Gate**: HMAC-SHA256 session cookie generation (`sonaraim_operator_session`) and constant-time Bearer token comparison (`src/authGate.mjs`).
  - **Dynamic Management**: Peer node registration (`POST /operator/peers`) and tenant provisioning (`POST /operator/tenants`).
  - **Flat-Rate Billing Ledger**: Seat quota tracking and zero per-message fee verification.

### 3.6 `sonaraim-app` (Client Application Layer & React Native Mobile)

- **Scope**: B2C Mobile (iOS & Android via `sonaraim-app/mobile`), Desktop, and Instant Web / App Clip client.
- **Responsibilities**:
  - **`sonaraim-app/mobile` (React Native)**: Native cross-platform mobile client for iOS and Android with hardware biometric authentication, native push notification handlers, and low-latency QUIC sockets.
  - **Intelligent Dual Inbox**: Protocol-level tab separation between **Personal Chats** (family, friends, private groups) and **Verified Service Channels** (banks, clinics, delivery alerts).
  - **Native Zero-HTML Card Renderer**: Renders declarative cards using native OS widgets (maps, date pickers, payment sheets) while forbidding WebView execution.
  - **Passkey + WebAuthn PRF ZK Vault**: Derives a 256-bit key-encryption key via WebAuthn PRF extension (with cross-OS PIN fallback) to unlock an encrypted cloud vault containing MLS ratchet states.
  - **E2EE Voice & Video Calls**: Integrates LiveKit WebRTC SFUs with WebRTC Insertable Streams media encryption.
  - **Private Contact Discovery**: Blinds address book phone hashes using client-side secrets before querying the node PSI service.

---

## 4. Production Infrastructure, Security & Disaster Recovery

### 4.1 Edge Nginx Reverse Proxy & Certbot TLS

System Nginx acts as the single TLS ingress point:

- **Virtual Hosts**: Routes traffic to `node.${DOMAIN}`, `b2b.${DOMAIN}`, `admin.${DOMAIN}`, and the apex client domain.
- **Security Headers**: Enforces HTTP Strict Transport Security (HSTS) with 2-year max-age, CSP, X-Frame-Options (`DENY`), and X-Content-Type-Options (`nosniff`).
- **Rate Limiting**: Defends endpoints using token bucket zones for API calls (`30r/s`) and authentication (`10r/m`).

### 4.2 Prometheus Metrics & Real-Time Alerting

Continuous telemetry collection across services using `configs/prometheus/alerts.yml`:

- `SonaraimServiceDown`: Immediate critical alert when any service stops responding to `/metrics`.
- `SonaraimAdminUpstreamUnreachable`: Warning alert when `sonaraim-admin` cannot reach upstream `sonaraim-node` or `sonaraim-b2b`.
- `SonaraimRelayQueueBacklogHigh`: Warning alert when store-and-forward queued envelopes exceed 10,000 for 5 minutes.

### 4.3 Automated Backup & Disaster Recovery (`deploy/scripts/backup-sonaraim.sh`)

Automated script providing complete ecosystem recovery:

```text
[backup-sonaraim.sh]
        |
        +---> 1. PostgreSQL logical dump (pg_dump -Fc) -> postgres.dump
        |
        +---> 2. Redis background snapshot (BGSAVE) -> appendonly.aof / dump.rdb
        |
        +---> 3. Node WAL and snapshot data volume -> node-data.tar.gz
        |
        +---> 4. Prune backups older than BACKUP_RETENTION_DAYS (default 14d)
```

---

## 5. License

The Sonaraim project is licensed under the Apache License, Version 2.0. See [LICENSE](file:///home/alfonsodg/Devel/oss-projects/sonaraim/LICENSE) for details.

Copyright 2026 Sonaraim Contributors.
