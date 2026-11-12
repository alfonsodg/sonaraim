# API & Protocol Reference (API.md)

This document defines the external and inter-service API contracts for the **Sonaraim** platform, spanning `sonaraim-b2b` (Enterprise REST/gRPC & WhatsApp Cloud API Compatibility Adapter) and `sonaraim-node` (DID Resolution, Key Transparency & P2P Relay Status).

---

## 1. Authentication & Security Headers

All requests to `sonaraim-b2b` require tenant authentication via Bearer API tokens or mutual TLS (mTLS) for Sovereign Node bridges:

- `Authorization: Bearer <B2B_API_KEY>`
- `X-Sonaraim-Tenant-ID: <did:web:example.com>`
- `X-Sonaraim-Idempotency-Key: <UUIDv7>`
- `X-Sonaraim-Signature: <Ed25519-Hex-Signature>` (Required on outgoing webhooks and card callbacks)

---

## 2. Enterprise B2B Gateway API (`sonaraim-b2b`)

### 2.1 Send Text or Declarative Interactive Card

`POST /v1/messages`

Dispatches an E2EE message or signed declarative `Sonaraim Card` to a user's **Services Inbox**, automatically invoking the **Smart Fallback Engine** if the recipient has not yet onboarded.

#### Request Payload

```json
{
  "recipient": {
    "did": "did:sonaraim:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
    "phone_e164": "+51999888777"
  },
  "category": "TRANSACTIONAL",
  "consent_token": null,
  "fallback": {
    "enabled": true,
    "channels": ["RCS", "SMS"],
    "ttl_seconds": 900
  },
  "content": {
    "type": "SONARAIM_CARD",
    "card": {
      "schema_version": "1.0",
      "card_id": "ord_0193218a-7c40-7000-8000-1a2b3c4d5e6f",
      "title": "Live Delivery Tracking — Order #4821",
      "subtitle": "Arriving in 8 minutes",
      "components": [
        {
          "type": "LIVE_MAP",
          "id": "courier_map",
          "courier_label": "Carlos M. (Motorcycle)",
          "eta_iso8601": "2026-11-12T19:55:00Z"
        },
        {
          "type": "ACTION_ROW",
          "id": "delivery_actions",
          "actions": [
            {
              "action_id": "confirm_handover",
              "label": "Confirm Code 8492",
              "style": "PRIMARY",
              "requires_user_signature": true
            },
            {
              "action_id": "contact_support",
              "label": "Talk to Support",
              "style": "SECONDARY",
              "requires_user_signature": false
            }
          ]
        }
      ]
    }
  }
}
```

#### Response (`202 Accepted`)

```json
{
  "message_id": "msg_0193218a-8f12-7000-9120-abcdef012345",
  "delivery_mode": "NATIVE_MLS_E2EE",
  "recipient_did": "did:sonaraim:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
  "card_signature": "ed25519:9a8b7c6d5e4f...",
  "fallback_triggered": false,
  "timestamp": "2026-11-12T19:45:01Z"
}
```

> **Note**: If the recipient is not yet registered on Sonaraim and `fallback.enabled` is `true`, `delivery_mode` returns `"SMART_FALLBACK_INSTANT_CLIP"` along with `instant_card_url`.

---

### 2.2 1-Click WhatsApp Business Cloud API Adapter

`POST /v1/whatsapp-compat/{phone_number_id}/messages`

Accepts unmodified Meta WhatsApp Business Cloud API JSON requests (`template`, `interactive`, `text`) and translates them transparently into native `Sonaraim Cards` or E2EE messages.

#### Request Payload (Standard WhatsApp Cloud API Format)

```json
{
  "messaging_product": "whatsapp",
  "to": "51999888777",
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

---

### 2.3 Outgoing Webhook: Signed User Card Action

When a user taps an interactive button, submits a form, or completes a payment inside a `Sonaraim Card`, `sonaraim-b2b` verifies the user's device signature and sends an HTTP `POST` webhook (or gRPC stream event) to the merchant:

```json
{
  "event_id": "evt_0193218b-1122-7000-8000-fedcba987654",
  "event_type": "CARD_ACTION_SUBMITTED",
  "tenant_did": "did:web:clinic.example.com",
  "user_did": "did:sonaraim:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
  "card_id": "ord_0193218a-7c40-7000-8000-1a2b3c4d5e6f",
  "action_id": "confirm_handover",
  "inputs": {},
  "user_proof": {
    "algorithm": "Ed25519",
    "public_key": "z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
    "signature": "4f8d2e1a9c0b..."
  },
  "timestamp": "2026-11-12T19:46:12Z"
}
```

---

## 3. Core Relay & Identity Node API (`sonaraim-node`)

### 3.1 Resolve DID & Key Transparency Proof

`GET /v1/identity/{did}`

Returns the latest verified DID document, MLS `KeyPackage` bundle, and Merkle Inclusion Proof against the current `SignedTreeHead`.

#### Response (`200 OK`)

```json
{
  "did": "did:web:bank.example.com",
  "verified_b2b": true,
  "display_name": "Pacific Reserve Bank",
  "signing_key_ed25519": "MCowBQYDK2VwAyEA...",
  "merkle_proof": {
    "tree_size": 1482910,
    "root_hash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "inclusion_path": ["sha256:4a1b...", "sha256:9c8d..."],
    "validator_signatures": [
      { "node_id": "node-us-east-1", "signature": "ed25519:112233..." }
    ]
  }
}
```

### 3.2 Health Check Endpoint (All Services)

`GET /health`

```json
{
  "status": "ok",
  "service": "sonaraim-node",
  "version": "0.1.0",
  "p2p_peers_connected": 24,
  "merkle_tree_epoch": 9821
}
```
