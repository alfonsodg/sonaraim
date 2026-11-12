# Sonaraim

> Next-Generation Decentralized B2C Messaging & Verifiable B2B Transactional Ecosystem

Sonaraim is an open, high-performance messaging and interactive commerce platform engineered to replace legacy centralized messengers and predatory per-message B2B toll gates. It combines a **Rust-powered decentralized P2P relay mesh (`libp2p` + QUIC + IETF MLS)** with a **developer-first Enterprise B2B Gateway**, **Zero-HTML Declarative Interactive Cards**, and **Passkey-backed Zero-Knowledge identity**.

---

## Why Sonaraim?

To overcome the network effect of incumbent platforms like WhatsApp, Sonaraim delivers immediate, asymmetric value to both sides of the market:

### For End Users (B2C)

- **True Sovereignty & Metadata Privacy**: End-to-end encryption (IETF MLS RFC 9420) paired with **Sealed Sender** routing—relay nodes deliver encrypted envelopes to cryptographic mailboxes without knowing who is messaging whom.
- **Intelligent Dual Inbox (Personal vs. Services)**: Native separation from day one between **Personal Chats** (family, friends, private groups) and **Verified Service Channels** (banks, healthcare clinics, deliveries, invoices). Zero commercial clutter in personal spaces, with one-tap cryptographic consent revocation.
- **Zero-Redirect Actionable Chat (`Sonaraim Cards`)**: Instead of slow external web links or insecure HTML WebViews, verified businesses send native, cryptographically signed declarative cards directly inside the conversation—live delivery tracking, interactive seat selection, shopping carts, appointment booking, and one-tap payments.
- **Frictionless Portable Identity**: Instant onboarding via **Passkeys (WebAuthn PRF)** backed by a cross-platform **Zero-Knowledge Encrypted Vault**. Users never manage raw seed phrases and never lose encrypted history when switching between iOS and Android.

### For Businesses & Developers (B2B)

- **End of the "Per-Message Tax"**: Predictable flat-rate SaaS capacity pricing per seat or node capacity—no arbitrary per-template fees for OTPs, utility alerts, or transactional notifications.
- **Toll-Free AI & Native CRM Orchestration**: Connect custom AI agents and existing CRMs (Chatwoot, Zendesk, HubSpot, Salesforce) via low-latency gRPC and signed Webhooks with zero token markups or commercial content lock-in.
- **Cryptographic Brand Verification (`did:sonaraim` & `did:web`)**: Unforgeable enterprise identity backed by a distributed **Key Transparency Merkle Log** and DNSSEC/Ed25519 certificates, eliminating brand impersonation and phishing.
- **1-Click WhatsApp Cloud API Migration + Smart Fallback**: Drop-in translation layer for existing Meta Cloud API templates and webhooks, combined with **Instant Web / App Clip Cards** so 100% of customers can interact with rich notifications on day one—even before installing the native mobile app.

---

## Multi-Service Ecosystem Architecture

This repository (`sonaraim`) serves as the **Coordinator / Control Repository** for the Sonaraim ecosystem. It holds global architecture specifications, cross-service contracts, deployment orchestration, and shared schemas.

| Service Repository | Primary Stack | Responsibility |
| :--- | :--- | :--- |
| **`sonaraim`** *(This Repo)* | Markdown, JSON Schema, Docker, Helm | Control repository: global architecture, protocol & card schemas, multi-service orchestration, and cross-cutting milestones. |
| **`sonaraim-protocol`** | Protobuf, Rust, TypeScript, Go | Formal wire specifications, OpenMLS cryptographic wrappers, Sealed Sender envelopes, `Sonaraim Card Spec` validator, and SDKs. |
| **`sonaraim-node`** | Rust (`libp2p`, QUIC, OpenMLS) | Decentralized P2P/Federated core relay node, ephemeral store-and-forward queues, blind push dispatcher, and Key Transparency / DID directory node. |
| **`sonaraim-b2b`** | Rust / Go (gRPC, REST, PostgreSQL, Redis) | Enterprise E2EE Termination Bridge, WhatsApp Cloud API compatibility adapter, Signed Card Engine, Consent & Anti-Spam Gate, and Smart Fallback Engine. |
| **`sonaraim-admin`** | React, TypeScript, Vite | Unified web console for **Node Operators / Super Admins** (mesh telemetry, KYB verification, anti-spam policies) and **B2B Tenants** (seat management, visual Card Studio, webhooks, analytics). |
| **`sonaraim-app`** | React Native, TypeScript, WebRTC (LiveKit) | B2C Mobile (iOS/Android), Desktop, and **Instant Web / App Clip** client with Dual Inbox, native Zero-HTML Card Renderer, Passkey ZK Vault, and Private Set Intersection (PSI) contact discovery. |

---

## Core Architectural Pillars

1. **Dual-Plane Decentralization (Speed without Blockchain Bottlenecks)**:
   - **Data Plane (`sonaraim-node`)**: Real-time message routing runs over a `libp2p` QUIC/WebTransport mesh with sub-50ms latency, MLS group ratcheting, and S3-compatible client-encrypted blob storage. No message ever waits for blockchain block finality or pays per-message gas fees.
   - **Control Plane (Identity & Governance)**: Enterprise identities (`did:web` / `did:sonaraim`), public key packages, and revocation certificates are recorded in a verifiable **Merkle Tree Key Transparency Log** synchronized across validator nodes, with optional periodic state-root anchoring to low-cost L2 networks.
2. **Enterprise E2EE Termination Bridge**:
   - In B2C chats, encryption is strictly device-to-device. In B2B channels where dozens of support agents and stateless AI webhooks collaborate, the user encrypts end-to-end against the verified organization's public key, and the organization's isolated **Enterprise Bridge** (`sonaraim-b2b` or sovereign on-premise node) terminates MLS and dispatches clean, signed JSON/gRPC payloads to internal systems.
3. **Cryptographic Consent & Anti-Spam Governance**:
   - Transactional and user-initiated service messages are unlimited under flat-rate plans. Proactive promotional campaigns require a **Cryptographic Consent Token** signed by the user's device, which can be revoked with a single swipe—enforced at the relay node level.
4. **Zero-HTML Native Declarative Cards (`Sonaraim Cards`)**:
   - Interactive experiences are defined via strict, cryptographically signed JSON schemas ([configs/schemas/sonaraim-card.schema.json](configs/schemas/sonaraim-card.schema.json)) and rendered using native OS primitives—eliminating WebView XSS, UI spoofing, and phishing vectors.

---

## Repository Structure

```text
sonaraim/
├── configs/                # Shared service and reverse-proxy configuration templates
├── debug/                  # Local debugging artifacts and screenshots (gitignored)
├── deploy/                 # Deployment orchestration manifests
│   ├── compose/            # Multi-service Docker Compose definitions
│   └── helm/               # Kubernetes Helm chart templates
├── docs/                   # Comprehensive English documentation suite
│   ├── ARCHITECTURE.md     # System design, protocols, and ASCII diagrams
│   ├── API.md              # B2B REST/gRPC API, WhatsApp adapter, and P2P RPC specs
│   ├── CONFIGURATION.md    # Environment variable and zero-hardcode config reference
│   ├── DIAGRAMS.md         # Mermaid architecture, sequence, and state diagrams
│   ├── GLOSSARY.md         # Ubiquitous domain language and cryptographic terms
│   ├── INSTALL.md          # Setup, multi-repo checkout, and orchestration guide
│   └── STANDARDS.md        # Engineering, TDD, security, and git workflow standards
├── reference/              # Formal schemas (Sonaraim Card JSON Schema, OpenAPI, Proto)
├── samples/                # Sample environment files and interactive card payloads
├── src/                    # Coordinator validation scripts and contract runners
└── tests/                  # Cross-service integration and schema contract tests
```

---

## Documentation Catalog

- **[Architecture Specification](docs/ARCHITECTURE.md)** — Detailed breakdown of the 5 services, P2P MLS transport, Key Transparency log, Enterprise E2EE Bridge, and B2B2C adoption mechanics.
- **[Visual Diagrams (Mermaid)](docs/DIAGRAMS.md)** — End-to-end sequence, topology, and state diagrams.
- **[API & Protocol Reference](docs/API.md)** — B2B Gateway endpoints, WhatsApp migration compatibility endpoints, Webhook signatures, and `Sonaraim Card` actions.
- **[Configuration Guide](docs/CONFIGURATION.md)** — Complete environment variable catalog for all services.
- **[Installation & Orchestration](docs/INSTALL.md)** — Local and remote setup instructions.
- **[Engineering Standards](docs/STANDARDS.md)** — Mandatory coding, testing (TDD), security, and CI/CD rules.
- **[Domain Glossary](docs/GLOSSARY.md)** — Definitions of core domain and cryptographic concepts.

---

## License

Copyright (c) 2026 Alfonso de la Guarda. All rights reserved.
