# Ubiquitous Domain Glossary (GLOSSARY.md)

This glossary defines the canonical domain terminology used across code, schemas, APIs, and documentation in the **Sonaraim** ecosystem.

---

## Core Concepts

### Blind Push Notification

A zero-metadata wake-up signal dispatched via Apple APNs, Google FCM, or UnifiedPush containing only a random wake-up token. The mobile client wakes up in the background, connects to `sonaraim-node` over QUIC, fetches the pending **Sealed Sender** envelope, and decrypts it locally—preventing Apple and Google from observing who messaged the user or what the message contains.

### Consent Token (`ConsentToken`)

A cryptographically signed, category-scoped permission artifact issued by a B2C user's device granting a specific verified merchant (`did:web`) the right to send proactive promotional messages. Users can revoke a `ConsentToken` with one tap in the **Services Inbox**, causing `sonaraim-node` and `sonaraim-b2b` to drop subsequent promotional campaigns at the edge.

### Dual Inbox (Intelligent Dual Inbox)

The foundational UI/UX separation in `sonaraim-app` that isolates **Personal Chats** (friends, family, private groups) from **Service Channels** (banks, healthcare clinics, deliveries, commerce) at the protocol and storage layers.

### Enterprise E2EE Termination Bridge

The cryptographic boundary inside `sonaraim-b2b` (or an enterprise's on-premise **Sovereign Node**) where an organization's end-to-end encrypted MLS session is terminated so that stateless AI agents, webhooks, and multi-seat CRM platforms (e.g., Chatwoot, Zendesk) can process plaintext JSON/gRPC events securely within the enterprise's trust perimeter.

### Instant Web / App Clip Card

A lightweight, zero-install web or mobile OS App Clip / Instant App surface launched via a signed link from the **Smart Fallback Engine**. It allows a recipient who has not yet installed `sonaraim-app` to interact with a `Sonaraim Card` (track an order, confirm an appointment, or pay) and onboard via Passkey with a single tap.

### Key Transparency Merkle Log

An append-only, cryptographically verifiable Merkle tree maintained across `sonaraim-node` validators that maps Decentralized Identifiers (`did:sonaraim` and `did:web`) to public signing keys and MLS `KeyPackage` bundles. Prevents Man-in-the-Middle (MitM) key substitution attacks without requiring per-message blockchain transactions.

### MLS (Messaging Layer Security — IETF RFC 9420)

The IETF standard cryptographic protocol used by Sonaraim for end-to-end encrypted 1:1 and group messaging, providing forward secrecy, post-compromise security, and logarithmic scaling for large groups.

### Private Set Intersection (PSI)

A privacy-preserving cryptographic technique used during social graph activation so `sonaraim-app` can identify which contacts in a user's address book are already on Sonaraim without revealing unhashed phone numbers or contact graphs to the server.

### Sealed Sender

An outer cryptographic envelope that encrypts the sender's identity certificate and MLS ciphertext toward the recipient's mailbox key. Relay nodes (`sonaraim-node`) see only the destination `MailboxID` and an anti-abuse token, hiding the sender's identity from the transport network.

### Smart Fallback Engine

The component in `sonaraim-b2b` that detects when a target recipient has not yet onboarded onto Sonaraim and automatically delivers a compact SMS, RCS, or Email containing a signed **Instant Web / App Clip Card** link—guaranteeing 100% day-one deliverability for enterprise migrations.

### Sonaraim Card (`Sonaraim Card Spec`)

A strictly typed, Ed25519-signed declarative JSON payload ([configs/schemas/sonaraim-card.schema.json](../configs/schemas/sonaraim-card.schema.json)) rendered using native OS UI primitives inside the chat timeline. Enables zero-redirect commerce, payments, live tracking, and document signing while forbidding arbitrary HTML/JavaScript execution.

### Sovereign Node

A dedicated instance of `sonaraim-node` (and optionally `sonaraim-b2b`) deployed within a regulated enterprise's own infrastructure (e.g., banking, healthcare, government) that federates with the global Sonaraim P2P mesh while keeping all customer payloads and audit logs strictly inside the organization's compliance boundary.

### Zero-Knowledge Key Vault (ZK Vault)

A client-side encrypted backup blob (XChaCha20-Poly1305) unlocked via the **WebAuthn PRF extension** of a user's Passkey (or a cross-ecosystem Argon2id Recovery PIN). Stores the user's master identity key and MLS ratchet state so switching between iOS and Android never results in lost chat history.
