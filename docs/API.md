# API & Protocol Reference (`docs/API.md`)

This document defines the external and inter-service API contracts for the **Sonaraim** ecosystem, spanning `sonaraim-b2b` (Enterprise REST/gRPC & WhatsApp Cloud API Compatibility Adapter), `sonaraim-node` (P2P Relay, Key Transparency, and PSI), and `sonaraim-admin` (Dual-Console Web Application).

---

## 1. Authentication & Security Headers

All requests to `sonaraim-b2b` and `sonaraim-node` enforce zero-trust authentication headers:

- `Authorization: Bearer <API_KEY>` (Required on enterprise and protected relay write endpoints)
- `X-Sonaraim-Tenant-DID: <did:web:example.com>` (Identifies the enterprise tenant)
- `X-Sonaraim-Idempotency-Key: <UUIDv7>` (Prevents duplicate processing of payments and actions)
- `X-Sonaraim-Signature: <Ed25519-Hex-Signature>` (Required on outgoing webhooks and user card callbacks)

---

## 2. Enterprise B2B Gateway API (`sonaraim-b2b`)

### 2.1 Send Text or Declarative Interactive Card

`POST /v1/messages`

Dispatches an E2EE message or signed declarative `Sonaraim Card` to a user's **Services Inbox**, automatically invoking the **Smart Fallback Engine** if the recipient has not yet onboarded.

**Request Payload**:

```json
{
  "recipient_did": "did:sonaraim:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
  "recipient_phone": "+51999888777",
  "category": "TRANSACTIONAL",
  "card_title": "Live Delivery Tracking — Order #4821",
  "action_label": "Track Delivery",
  "card_json": {
    "schema_version": "1.0",
    "card_id": "ord_0193218a-7c40-7000-8000-1a2b3c4d5e6f",
    "title": "Live Delivery Tracking — Order #4821",
    "components": []
  }
}
```

**Response (`200 OK`)**:

```json
{
  "status": "dispatched",
  "delivery_route": "NATIVE_MLS_E2EE",
  "message_id": "msg_0193218a-7c40-7000-8000-1a2b3c4d5e6f",
  "relay_status": "forwarded"
}
```

### 2.2 1-Click WhatsApp Business Cloud API Adapter

`POST /v1/whatsapp-compat/{phone_number_id}/messages`

Accepts unmodified Meta WhatsApp Business Cloud API JSON requests (`template`, `interactive`, `text`) and translates them transparently into native `Sonaraim Cards` or E2EE messages.

**Request Payload (Meta WhatsApp Format)**:

```json
{
  "messaging_product": "whatsapp",
  "to": "+51999888777",
  "type": "template",
  "template": {
    "name": "appointment_confirmation",
    "language": { "code": "en_US" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Dr. Elena Rostova" },
          { "type": "text", "text": "Tomorrow at 10:30 AM" }
        ]
      }
    ]
  }
}
```

**Response (`200 OK`)**:

```json
{
  "messaging_product": "whatsapp",
  "contacts": [{ "input": "+51999888777", "wa_id": "+51999888777" }],
  "messages": [{ "id": "wamid.0193218a-7c40-7000" }]
}
```

### 2.3 User Card Action Callback

`POST /v1/cards/actions`

Processes inbound signed action proofs executed by users tapping interactive buttons or submitting forms inside native cards.

**Request Payload**:

```json
{
  "action_id": "confirm_handover",
  "card_id": "ord_0193218a-7c40-7000-8000-1a2b3c4d5e6f",
  "tenant_did": "did:web:courier.example.com",
  "user_did": "did:sonaraim:alice",
  "signature_hex": "4f8d2e1a9c0b...",
  "inputs": {}
}
```

**Response (`200 OK`)**:

```json
{
  "status": "processed",
  "action_id": "confirm_handover",
  "verified": true
}
```

### 2.4 Cryptographic Consent Revocation

`POST /v1/consents/revoke`

Revokes a user's promotional consent token for a verified tenant. Drops subsequent promotional campaigns immediately at the edge.

**Request Payload**:

```json
{
  "tenant_did": "did:web:courier.example.com",
  "user_did": "did:sonaraim:alice",
  "revocation_timestamp": 1700000000,
  "signature_hex": "4f8d2e1a9c0b..."
}
```

**Response (`200 OK`)**:

```json
{
  "status": "consent_revoked",
  "tenant_did": "did:web:courier.example.com",
  "user_did": "did:sonaraim:alice"
}
```

### 2.5 In-Card Zero-Markup Payment Intents

`POST /v1/payments/intents`

Creates a payment intent for zero-redirect card checkout with zero per-message fees.

**Request Payload**:

```json
{
  "tenant_did": "did:web:store.example.com",
  "amount_cents": 4250,
  "currency": "USD",
  "order_id": "ord_4821"
}
```

**Response (`200 OK`)**:

```json
{
  "status": "created",
  "payment_intent_id": "pi_0193218a-7c40",
  "amount_cents": 4250,
  "currency": "USD",
  "fee_cents": 0
}
```

### 2.6 Tenant Provisioning & Key Rotation

- `POST /v1/tenants`: Provisions new enterprise tenant with seat quotas (`B2B_ADMIN_API_KEY` auth).
- `POST /v1/tenants/rotate-key`: Rotates tenant Ed25519 signing key while retaining historical signature verification.
- `GET /v1/tenants/{did}/analytics`: Retrieves delivery volume, conversion rates, and consent stats.
- `GET /v1/tenants/{did}/subscription`: Retrieves active seat consumption and flat-rate billing limits.

### 2.7 CRM Integration Connectors

`POST /v1/integrations/crm/{provider}/events`

Ingests external webhook events from Chatwoot, Zendesk, HubSpot, and Salesforce.

---

## 3. Core Relay & Identity Node API (`sonaraim-node`)

### 3.1 Sealed Sender Relay Endpoints

- `POST /v1/relay/envelopes`: Submits an encrypted Sealed Sender envelope into an ephemeral mailbox queue (Bearer auth).
- `GET /v1/relay/mailboxes/{mailbox_id}`: Drains non-expired envelopes for the recipient's anonymous mailbox.
- `POST /v1/relay/mailboxes/{mailbox_id}/ack`: Acknowledges envelope delivery, evicting items and triggering atomic WAL compaction (Bearer auth).

### 3.2 Key Transparency & Identity Endpoints

`GET /v1/identity/{did}`

Returns the latest verified DID document, MLS KeyPackage bundle, and cryptographic Merkle Inclusion Proof. Supports percent-encoded DID paths.

**Response (`200 OK`)**:

```json
{
  "did": "did:web:bank.example.com",
  "key_commitment": "ed25519:MCowBQYDK2VwAyEA...",
  "leaf_index": 12,
  "merkle_proof": {
    "tree_size": 13,
    "leaf_index": 12,
    "root_hash": "e3b0c442...",
    "inclusion_path": ["sha256:4a1b...", "sha256:9c8d..."]
  }
}
```

- `POST /v1/identity`: Registers or updates a public identity commitment (Bearer auth).
- `GET /v1/identity/by-phone/{token}`: Looks up a registered DID by blinded or hashed phone token.
- `GET /v1/identity/anchors/latest`: Returns the latest L2 state-root anchor receipt.

### 3.3 P2P Federation & Live UDP Gossip

- `GET /v1/p2p/sync`: Returns local Merkle tree size, root hash, and connected peer states.
- `POST /v1/p2p/gossip`: Ingests gossiped Signed Tree Head datagrams and evaluates equivocation.
- `POST /v1/p2p/peers`: Registers or updates a peer's QUIC multiaddr and RPC endpoint (Bearer auth).
- `GET /v1/p2p/peers`: Lists active mesh peers.

### 3.4 Private Set Intersection & Media Presigning

- `POST /v1/contacts/psi`: Evaluates blinded phone hashes against the registered phone directory without exposing address books.
- `POST /v1/media/presign`: Generates S3/MinIO presigned PUT upload URLs for client-side encrypted attachments.

---

## 4. Admin Console & Dual-Console Web API (`sonaraim-admin`)

- `GET /health`: Admin server health and upstream service connectivity.
- `GET /metrics`: Prometheus telemetry metrics.
- `GET /login` / `POST /login`: Operator zero-trust authentication gate; validates operator token and issues HMAC-SHA256 session cookie (`sonaraim_operator_session`).
- `GET /operator`: Super Admin & Node Operator Console view (P2P mesh health, Merkle epoch drift, KYB checklist).
- `POST /operator/tenants`: Provisions enterprise tenants on upstream `sonaraim-b2b`.
- `POST /operator/peers`: Registers P2P peers on upstream `sonaraim-node`.
- `GET /studio`: Declarative Visual Card Studio editor view.
- `POST /studio/cards`: Validates declarative card schemas, creates JCS signing manifests, and dispatches cards live to `sonaraim-b2b`.
- `GET /api/live-telemetry`: Probes upstream Node and B2B health with timeout protection.
- `GET /api/billing/summary`: Flat-rate seat quotas and zero per-message fee ledger.
