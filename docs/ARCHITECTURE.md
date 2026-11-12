# System Architecture (ARCHITECTURE.md)

> **Note**: In compliance with project documentation rules, this file contains architectural specifications and ASCII diagrams only. For visual Mermaid diagrams, see [docs/DIAGRAMS.md](DIAGRAMS.md).

---

## 1. Executive Summary & Architectural Philosophy

**Sonaraim** is a decentralized, high-throughput B2C messaging and B2B transactional platform designed to eliminate two structural flaws of legacy messaging ecosystems:

1. **Surveillance & Metadata Centralization (B2C)**: Centralized messengers monetize social graphs and metadata, while naive blockchain messengers suffer from multi-second latency, permanent metadata exposure on public ledgers, and per-message gas fees.
2. **Predatory Per-Message Tolls & Phishing Vulnerability (B2B)**: Incumbent B2B APIs charge punitive per-template fees for utility/OTP notifications, restrict AI agent integrations, and force users out of chat into slow mobile browsers.

Sonaraim resolves both challenges by decoupling **Real-Time Encrypted Transport (Data Plane)** from **Verifiable Identity & Governance (Control Plane)** across **5 modular services**.

---

## 2. High-Level System Topology (ASCII)

```text
+-----------------------------------------------------------------------------------+
|                            CLIENT & EXPERIENCE LAYER                              |
|                                                                                   |
|  +-------------------------------------+   +-----------------------------------+  |
|  |            sonaraim-app             |   |          sonaraim-admin           |  |
|  |  (Mobile iOS/Android, Desktop, Web) |   |   (Node Operator & B2B Console)   |  |
|  |  - Dual Inbox (Personal / Services) |   |  - Mesh Telemetry & KYB Approval  |  |
|  |  - Native Zero-HTML Card Renderer   |   |  - Tenant Seats & RBAC            |  |
|  |  - Passkey + WebAuthn PRF ZK Vault  |   |  - Visual Card Studio & Preview   |  |
|  |  - Instant Web / App Clip Fallback  |   |  - Webhook, AI & CRM Routing      |  |
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
|  - Blind Push Wake-Up Dispatcher       |   |  - AI Agent gRPC & CRM Connectors    |
|                                        |   |  - Smart Fallback (SMS / Magic Link) |
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
|                        MEDIA, STORAGE & INFRASTRUCTURE LAYER                      |
|                                                                                   |
|  +------------------------+  +------------------------+  +---------------------+  |
|  |     LiveKit Edge       |  |   S3 / MinIO / R2      |  | PostgreSQL + Redis  |  |
|  |  (WebRTC E2EE Voice &  |  | (Client-Side Encrypted |  | (B2B State, Queues, |  |
|  |   Video SFU Mesh)      |  |  Media & ZK Vaults)    |  |  Merkle Snapshots)  |  |
|  +------------------------+  +------------------------+  +---------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Separation of Responsibilities (The 5 Core Services)

### 3.1 `sonaraim-protocol` (Shared Specifications, Crypto & SDKs)

- **Scope**: Single source of truth for wire contracts and cryptographic primitives.
- **Responsibilities**:
  - Protobuf definitions for P2P relay envelopes, MLS key packages, Key Transparency proofs, and B2B gRPC services.
  - Formal JSON Schema for **Sonaraim Cards** ([configs/schemas/sonaraim-card.schema.json](../configs/schemas/sonaraim-card.schema.json)).
  - Core Rust library (`sonaraim-crypto`) compiled to native targets and WebAssembly (Wasm) for `sonaraim-node`, `sonaraim-b2b`, and `sonaraim-app`.

### 3.2 `sonaraim-node` (Decentralized P2P Transport & Identity Core — Rust)

- **Scope**: High-performance, low-footprint daemon that forms the decentralized messaging mesh and verifiable identity directory. Can be operated by the core network, community operators, or enterprises running **Sovereign Nodes** (banks, hospitals, universities).
- **Responsibilities**:
  - **P2P Transport Mesh**: Built on `libp2p` over QUIC and WebTransport. Routes encrypted **Sealed Sender** envelopes across nodes with sub-50ms hop latency.
  - **IETF MLS Delivery Service**: Stores public `KeyPackage` bundles so peers can initiate asynchronous 1:1 or group sessions (up to 50,000+ members with logarithmic ratcheting cost).
  - **Ephemeral Store-and-Forward**: Holds undelivered encrypted envelopes in bounded, TTL-expiring buckets while recipient devices are offline.
  - **Blind Push Notification Dispatcher**: Emits zero-payload wake-up signals via APNs, FCM, or UnifiedPush so mobile OS background tasks pull and decrypt messages locally without exposing metadata to Apple or Google.
  - **Verifiable Key Transparency & DID Directory**: Maintains an append-only Merkle Tree of identity bindings (`did:sonaraim` for users/nodes, `did:web` + DNSSEC + Ed25519 certificates for verified businesses). Periodically checkpoints Merkle state roots across validator nodes (with optional L2 anchoring).

### 3.3 `sonaraim-b2b` (Enterprise Gateway & E2EE Termination Bridge — Rust/Go)

- **Scope**: Developer-first B2B API platform and cryptographic termination bridge connecting enterprise backends, CRMs, and AI agents to the Sonaraim P2P mesh.
- **Responsibilities**:
  - **Enterprise E2EE Termination Bridge**: Solves the incompatibility between device-bound E2EE and multi-agent enterprise workflows. End users encrypt messages to the enterprise's verified MLS group/identity; `sonaraim-b2b` (running either as a managed isolated enclave or on-premise alongside a Sovereign Node) terminates the MLS session and translates payloads into clean REST/gRPC events for the business's internal tools.
  - **1-Click WhatsApp Cloud API Adapter**: Accepts standard Meta WhatsApp Business Cloud API payloads (`/v1/whatsapp-compat/messages`), translating legacy templates and interactive flows into native **Sonaraim Cards** in real time.
  - **Signed Declarative Card Engine**: Validates card payloads against `sonaraim-card.schema.json`, attaches an Ed25519 signature using the business's verified DID key, and processes signed user action callbacks (cart checkout, appointment confirmation, document signing).
  - **Cryptographic Consent & Anti-Spam Gate**: Enforces a strict separation between **Transactional Messages** (unlimited under flat-rate seat/capacity plans) and **Promotional Campaigns** (which require a cryptographically signed, non-expired `ConsentToken` issued by the recipient).
  - **Smart Fallback Engine**: When a business messages a phone number or alias not yet onboarded on Sonaraim, returns an immediate structured status and optionally dispatches an SMS/RCS/Email fallback containing a cryptographic **Magic Link** that renders the interactive card inside an **Instant Web / App Clip** experience.

### 3.4 `sonaraim-admin` (Admin & B2B Console Frontend — React/TypeScript)

- **Scope**: Multi-role web management portal separated into two permissioned workspaces:
  1. **Network & Node Operator Console (Super Admin)**:
     - Live P2P mesh topology, relay throughput, queue depth, and Merkle root synchronization status.
     - KYB (Know Your Business) verification workflows, DNSSEC/`did:web` attestation audits, and spam reputation circuit breakers.
  2. **Enterprise Tenant Console (B2B SaaS)**:
     - Seat management, agent assignment, and role-based access control (RBAC).
     - **Visual Card Studio**: Drag-and-drop and JSON editor for building, signing, and testing interactive `Sonaraim Cards`.
     - Webhook, gRPC AI agent, and CRM connector configuration (Chatwoot, Zendesk, HubSpot).
     - Delivery telemetry, conversion funnels, and flat-rate subscription billing.

### 3.5 `sonaraim-app` (B2C Mobile, Desktop & Instant Web Client — React Native/TypeScript)

- **Scope**: End-user application across iOS, Android, Desktop, and Instant Web / App Clips.
- **Responsibilities**:
  - **Intelligent Dual Inbox**: Hardware-accelerated tab separation between **Personal** (friends, family, private groups) and **Services** (verified banks, clinics, retailers, deliveries) with per-merchant consent toggles.
  - **Native Zero-HTML Card Renderer**: Parses validated `Sonaraim Card` JSON payloads into native OS UI components (maps, date pickers, seat grids, payment sheets) and signs user interactions with the user's device key.
  - **Passkey + WebAuthn PRF Zero-Knowledge Vault**: Generates hardware-bound passkeys on registration and derives a 256-bit key-encryption key via the **WebAuthn PRF extension** (plus cross-ecosystem PIN fallback) to unlock an encrypted cloud vault containing MLS state and chat backups.
  - **Real-Time Voice & Video Calls**: Integrates **LiveKit** WebRTC SFUs with end-to-end media encryption (WebRTC Insertable Streams using MLS-derived epoch keys).
  - **Private Contact Discovery**: Uses blinded hashes and Private Set Intersection (PSI) so users discover which contacts are on Sonaraim without uploading plaintext address books.

---

## 4. Deep-Dive: Solving the 6 Architectural Challenges

### 4.1 Why Decentralized P2P Mesh Instead of Blockchain Message Routing?

```text
+---------------------------+----------------------------+----------------------------+
| Metric                    | Blockchain Routing (L1/L2) | Sonaraim P2P Mesh + DID    |
+---------------------------+----------------------------+----------------------------+
| Message Delivery Latency  | 1,000 ms - 12,000 ms       | < 50 ms (QUIC Stream)      |
| Per-Message Marginal Cost | Gas fee per tx / batch     | Near zero (flat relay)     |
| Metadata Privacy          | Public ledger graph leak   | Sealed Sender (blinded)    |
| Offline Mobile Support    | Polling RPC nodes          | Ephemeral queue + Push     |
| Brand Verification        | On-chain smart contract    | Merkle Log + did:web/L2    |
+---------------------------+----------------------------+----------------------------+
```

- **Data Plane (`sonaraim-node`)**: Operates entirely off-chain over `libp2p` QUIC streams. Every message is wrapped in an **MLS Ciphertext** and outer **Sealed Sender Envelope** encrypted to the recipient's ephemeral mailbox public key. The relay node sees only an opaque routing tag (`MailboxID`) and an anti-DoS proof/token—never the sender's identity.
- **Control Plane (Key Transparency)**: Only identity registrations, key rotations, and B2B verification certificates enter the **Key Transparency Merkle Tree**. Nodes gossip signed Merkle tree heads (`SignedTreeHead`), and an optional periodic job anchors the 32-byte Merkle root hash to an L2 blockchain once per hour for immutable historical auditability at virtually zero cost.

### 4.2 Passkey Onboarding & Cross-OS Zero-Knowledge Recovery

```text
[User Device: iOS or Android]
       |
       +-- 1. Authenticate via Passkey (FaceID / TouchID / Biometrics)
       |
       +-- 2. Evaluate WebAuthn PRF Extension (or Cross-OS Recovery PIN + Argon2id)
       |
       v
[256-bit Master Wrapping Key (Never leaves client RAM)]
       |
       +-- 3. Fetch & Decrypt Zero-Knowledge Key Vault Blob from S3/MinIO
       |
       v
[Restored Identity Key + MLS Group Ratchet State + Encrypted History Index]
```

This eliminates the "lost history on phone switch" problem of device-bound messengers while preserving strict zero-knowledge privacy—neither `sonaraim-node` nor storage providers can ever decrypt the vault.

### 4.3 Enterprise E2EE Termination & Cryptographic Consent Gate

```text
[End User (sonaraim-app)]
   |
   |  1. User grants ConsentToken(scope="transactional,orders", exp=...)
   |  2. Bidirectional MLS E2EE Session (User <-> Verified Merchant DID)
   v
[sonaraim-node (P2P Relay Mesh)]
   |  - Verifies merchant Ed25519 signature & user ConsentToken for promos
   |  - Drops unauthorized promotional spam at the edge
   v
[sonaraim-b2b (Enterprise Bridge — Cloud Enclave or Sovereign On-Prem)]
   |  - Terminates Merchant MLS Session
   |  - Emits/Accepts Clean JSON/gRPC or WhatsApp-Compatible Payloads
   v
[Merchant AI Agents (gRPC) / CRM (Chatwoot, Zendesk) / Payment Gateways]
```

### 4.4 B2B2C "Trojan Horse" Cold-Start Onboarding (Smart Fallback)

During Phase 1 adoption, businesses send critical transactional alerts (e.g., bank OTPs, lab results, live delivery tracking) to customers who may not yet have `sonaraim-app` installed:

1. The merchant calls `POST /v1/messages` (or the WhatsApp compatibility endpoint) on `sonaraim-b2b`.
2. `sonaraim-b2b` checks recipient reachability via blinded identity lookup.
3. **If onboarded**: Delivers the native `Sonaraim Card` directly to the user's **Services Inbox** in < 50ms.
4. **If not yet onboarded**: Triggers the **Smart Fallback Engine**, sending a compact SMS/RCS/Email containing a one-time signed URL (`https://go.sonaraim.com/c/<ephemeral-token>`).
5. Tapping the link opens the **Instant Web / App Clip (`sonaraim-app` Web)** instantly—allowing the customer to track their order, confirm their medical appointment, or pay with 1 tap, followed by a frictionless **"Save with Passkey & Enable Instant Alerts"** prompt.

---

## 5. Data Storage & Persistence Boundaries

| Data Category | Storage Engine | Encryption Model | Retention Policy |
| :--- | :--- | :--- | :--- |
| In-Transit Envelopes | `sonaraim-node` (Redis / RocksDB) | MLS Ciphertext + Sealed Sender | Ephemeral (TTL max 30 days until ACK) |
| Media & Voice Notes | S3 / MinIO / Cloudflare R2 | Client-side AES-256-GCM (key inside MLS message) | Ephemeral transit (30 days) or Vault quota |
| ZK Key & History Vault | S3 / MinIO / Cloudflare R2 | Client-side XChaCha20-Poly1305 (WebAuthn PRF key) | Persistent per user account |
| Identity & DID Log | `sonaraim-node` (RocksDB + PostgreSQL) | Public keys + Ed25519 Merkle signatures | Append-only verifiable log |
| B2B Tenant & Seat State | `sonaraim-b2b` (PostgreSQL) | At-rest disk encryption + field-level KMS | Persistent per B2B tenant |
