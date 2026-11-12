# System Architecture Diagrams (DIAGRAMS.md)

This document contains all Mermaid diagrams for the **Sonaraim** ecosystem. Architectural prose and ASCII representations are maintained in [docs/ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. Multi-Service Ecosystem Topology

```mermaid
flowchart TB
    subgraph Clients["Client & Console Layer"]
        App["sonaraim-app<br/>(Mobile, Desktop, Instant Web/Clip)"]
        Admin["sonaraim-admin<br/>(Node Operator & B2B SaaS Console)"]
    end

    subgraph Shared["Shared Contracts & Crypto"]
        Proto["sonaraim-protocol<br/>(Protobuf, OpenMLS, Card Schema, SDKs)"]
    end

    subgraph CoreMesh["Decentralized Core Layer (Rust)"]
        Node1["sonaraim-node (Relay & DID #1)"]
        Node2["sonaraim-node (Relay & DID #2)"]
        SovNode["sonaraim-node (Enterprise Sovereign Node)"]
        Node1 <-->|"libp2p QUIC + Gossipsub<br/>Merkle Log Sync"| Node2
        Node2 <-->|"libp2p QUIC + Gossipsub"| SovNode
    end

    subgraph Enterprise["Enterprise B2B Layer (Rust / Go)"]
        B2B["sonaraim-b2b<br/>(Enterprise E2EE Bridge & API Gateway)"]
        WAAdapter["1-Click WhatsApp Cloud API Adapter"]
        CardEngine["Signed Declarative Card Engine"]
        ConsentGate["Cryptographic Consent & Anti-Spam Gate"]
        Fallback["Smart Fallback Engine (SMS / Magic Link)"]
        B2B --- WAAdapter
        B2B --- CardEngine
        B2B --- ConsentGate
        B2B --- Fallback
    end

    subgraph External["External Integrations & Media Infrastructure"]
        LiveKit["LiveKit Edge SFU<br/>(E2EE WebRTC Calls)"]
        S3["S3 / MinIO / R2<br/>(Encrypted Media & ZK Vault)"]
        BizBackend["Merchant AI Agents (gRPC) & CRMs<br/>(Chatwoot, Zendesk, HubSpot)"]
    end

    App <-->|"QUIC / WebTransport<br/>(MLS E2EE + Sealed Sender)"| Node1
    App <-->|"WebRTC E2EE Media"| LiveKit
    App <-->|"Encrypted Blobs & ZK Vault"| S3

    Admin <-->|"HTTPS REST / gRPC"| B2B
    Admin <-->|"Operator Telemetry & KYB"| Node1

    B2B <-->|"MLS Envelopes & DID Proofs"| Node2
    B2B <-->|"Sovereign On-Prem Link"| SovNode
    BizBackend <-->|"Webhooks / gRPC / WA Cloud API"| B2B

    Proto -.->|"Schemas & Crypto"| App
    Proto -.->|"Schemas & Crypto"| Node1
    Proto -.->|"Schemas & Crypto"| B2B
    Proto -.->|"Schemas & Crypto"| Admin
```

---

## 2. Decentralized Data Plane vs. Control Plane

```mermaid
flowchart LR
    subgraph ControlPlane["Control Plane (Verifiable Identity & Governance)"]
        DID["W3C DIDs<br/>(did:sonaraim & did:web + DNSSEC)"]
        KT["Key Transparency Merkle Tree<br/>(Append-Only Signed Tree Heads)"]
        L2["Optional Periodic L2 Anchor<br/>(Hourly 32-Byte State Root)"]
        DID --> KT --> L2
    end

    subgraph DataPlane["Data Plane (Sub-50ms Real-Time Transport)"]
        MLS["IETF MLS (RFC 9420)<br/>1:1 & Group Ratchet"]
        Sealed["Sealed Sender Envelope<br/>(Blinded Sender Metadata)"]
        QUIC["libp2p QUIC Mesh Routing<br/>(Ephemeral Store-and-Forward)"]
        Push["Blind Push Wake-Up<br/>(Zero-Metadata APNs/FCM/UnifiedPush)"]
        MLS --> Sealed --> QUIC --> Push
    end

    KT -.->|"Verified Public KeyPackages<br/>& Merchant Signatures"| MLS
```

---

## 3. Enterprise B2B E2EE Bridge & Interactive Card Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as End User (sonaraim-app)
    participant Node as sonaraim-node (P2P Relay)
    participant Bridge as sonaraim-b2b (Enterprise Bridge)
    participant Merchant as Merchant CRM / AI Agent
    participant Pay as Payment / Order Backend

    Merchant->>Bridge: POST /v1/messages (or WhatsApp Compat API)<br/>Interactive Order Card Payload
    Bridge->>Bridge: Validate JSON against sonaraim-card.schema.json
    Bridge->>Bridge: Check User ConsentToken (Transactional vs. Promo)
    Bridge->>Bridge: Sign Card with Merchant Ed25519 DID Key & Encrypt via MLS
    Bridge->>Node: Publish Sealed Sender MLS Envelope (MailboxID)
    Node->>User: Deliver Envelope over QUIC Stream (or Blind Push Wake-Up)
    User->>User: Decrypt MLS -> Verify Merchant DID Proof -> Render Native Card in Services Inbox
    User->>User: Select Items & Tap "Pay Now" (Sign Action with User Device Key)
    User->>Node: Send Signed Card Action Envelope (MLS E2EE)
    Node->>Bridge: Route Envelope to Enterprise Bridge
    Bridge->>Bridge: Decrypt MLS & Verify User Action Signature
    Bridge->>Pay: Trigger Signed Webhook / gRPC Action Callback
    Pay-->>Bridge: 200 OK (Updated Card State: "Order Confirmed #4821")
    Bridge->>Node: Push Ephemeral Card State Update (MLS E2EE)
    Node->>User: Update Native Card In-Place (Zero Redirect)
```

---

## 4. Passkey Onboarding & Cross-OS Zero-Knowledge Key Vault

```mermaid
sequenceDiagram
    autonumber
    actor User as End User
    participant App as sonaraim-app (Client)
    participant Enclave as OS Passkey / WebAuthn PRF
    participant Vault as S3 / MinIO (ZK Vault Storage)
    participant Node as sonaraim-node (DID Directory)

    Note over User,Node: Initial Device Registration
    User->>App: Tap "Create Account with Passkey"
    App->>Enclave: navigator.credentials.create (with PRF extension)
    Enclave-->>App: Passkey Credential + 256-bit PRF Output
    App->>App: Generate Master Recovery Key + Identity Ed25519 & MLS KeyPackages
    App->>App: Encrypt Vault (XChaCha20-Poly1305) using PRF Key + Optional Recovery PIN
    App->>Vault: Upload Encrypted Zero-Knowledge Vault Blob
    App->>Node: Register did:sonaraim + Public KeyPackages in Merkle Log

    Note over User,Node: Cross-Device / Cross-OS Recovery (e.g. Android to iOS)
    User->>App: Authenticate via Passkey or Recovery PIN on New Device
    App->>Vault: Download Encrypted Vault Blob
    App->>App: Derive Wrapping Key (PRF or Argon2id PIN) & Decrypt Vault Locally in RAM
    App->>Node: Rotate MLS Leaf Key & Resume All Chats Without Losing History
```

---

## 5. B2B2C "Trojan Horse" Smart Fallback & Instant Onboarding Flow

```mermaid
stateDiagram-v2
    [*] --> LookupRecipient: Merchant sends Transactional Card via sonaraim-b2b
    LookupRecipient --> NativeDelivery: Recipient has sonaraim-app installed
    LookupRecipient --> SmartFallback: Recipient NOT yet onboarded

    state NativeDelivery {
        [*] --> RouteQUIC: Route via sonaraim-node P2P Mesh
        RouteQUIC --> RenderServicesInbox: Render in Services Inbox (<50ms)
    }

    state SmartFallback {
        [*] --> DispatchLink: Send Compact SMS / RCS / Email with Signed Magic Link
        DispatchLink --> OpenInstantCard: User taps link -> Opens Instant Web / App Clip Card
        OpenInstantCard --> CompleteAction: User tracks delivery / books appointment / pays in-place
        CompleteAction --> OneTapPasskey: Prompt "Save with Passkey for Instant Future Alerts"
        OneTapPasskey --> ActivateSocialGraph: Private Set Intersection (PSI) finds contacts on Sonaraim
    }

    NativeDelivery --> [*]
    ActivateSocialGraph --> [*]
```
