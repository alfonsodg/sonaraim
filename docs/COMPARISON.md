# Ecosystem Comparison: Sonaraim vs. Legacy & Modern Messengers

> Objective technical and product comparison across **Sonaraim**, **WhatsApp**, **Telegram**, **Signal**, **Matrix (Element)**, **Session**, and **Slack / Microsoft Teams**.

---

## 1. Executive Comparison Matrix

| Capability | **Sonaraim** | **WhatsApp** | **Telegram** | **Signal** | **Matrix (Element)** | **Session** | **Slack / MS Teams** |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Architecture** | Federated P2P (`libp2p` + QUIC + UDP Gossip) | Centralized (Meta) | Centralized (Telegram) | Centralized (Signal) | Federated Homeservers (HTTPS) | Decentralized Onion Routing | Centralized Enterprise SaaS |
| **E2EE Default** | **Yes (1:1 & Groups)** — IETF MLS RFC 9420 | **Yes (1:1 & Groups)** — Signal Protocol | **No** (opt-in Secret Chats, 1:1 only) | **Yes (1:1 & Groups)** — Signal Protocol | **Yes** (Olm / Megolm) | **Yes** (Session Protocol) | **No** (TLS in transit, provider holds keys) |
| **Metadata Privacy** | **Sealed Sender** + Blind PSI + SHA-256 Push | Phone number + social graph logged | Server sees all cloud chats & graph | Sealed Sender (1:1), phone required | Homeserver sees room & sender metadata | Onion-routed, no phone number | Full workspace audit & analytics |
| **Dual Inbox (Personal vs. B2B)** | **Native** (cryptographic separation) | Partial (mixed chat list) | No (mixed chats & bots) | No (no B2B tier) | No | No | Workspace-only |
| **Interactive B2B Forms & Cards** | **Zero-HTML Ed25519 Signed Cards** (JCS) | WhatsApp Flows (Meta-approved) | Bot Inline Keyboards / WebApps | None | Widgets / Bots | None | Block Kit / Adaptive Cards |
| **No-App Web Fallback** | **Instant Clips (`/c/:token`)** | None (app required) | `t.me` preview only | None (app required) | Web client | None | Web client |
| **B2B Per-Message Fee** | **0% markup** (self-hosted or flat SaaS) | Paid per conversation/template | Free bots (no E2EE) | No B2B API | Self-hosted | No B2B API | Paid per seat |
| **WhatsApp Cloud API Drop-In** | **Yes** (`/v1/whatsapp-compat/...`) | Native | No | No | Bridge required | No | No |
| **Built-in Payment Rails** | Stripe, Mercado Pago, Yape/Plin, USDC | Meta Pay (limited regions) | Telegram Stars / Bot Payments | MobileCoin (limited) | None | None | External integrations |
| **Open Source License** | **Apache-2.0** (full stack) | Proprietary | Client OSS / Server Proprietary | AGPLv3 | Apache-2.0 | GPLv3 | Proprietary |

---

## 2. Deep Dive: Sonaraim vs. WhatsApp (B2C & Business API)

| Dimension | **Sonaraim** | **WhatsApp / WhatsApp Business** |
| :--- | :--- | :--- |
| **Template & Form Governance** | Organizations publish and update Declarative Cards immediately without external gatekeepers. | Every Business template requires Meta review/approval and can be paused or rejected. |
| **Anti-Phishing & Integrity** | Cards are JSON Canonicalized (JCS), signed with **Ed25519**, and verified by `did:web` + Merkle Key Transparency. Zero HTML/JS execution. | Relies on Meta's green checkmark; messages carry no user-verifiable Ed25519 signature. |
| **User Consent Control** | Explicit `ConsentToken` required per business; **1-tap cryptographic revocation** (`/inbox/consent/revoke`). | Block/report buttons without portable cryptographic consent receipts. |
| **Onboarding Without App** | **Instant Clips (`/c/:token`)** let recipients inspect and cryptographically sign card actions in a browser before installing the app. | Recipients must install and register WhatsApp to interact with Flows. |
| **Contact Discovery** | **Blind PSI** (Private Set Intersection) — phone numbers are blinded locally before matching. | Uploads hashed/raw address book contacts to Meta servers. |
| **E2EE Media Storage** | Client-side **AES-256-GCM** encryption + presigned S3/MinIO upload (`/v1/media/presign`). | E2EE encrypted blobs hosted on Meta CDN. |
| **Migration Path** | Drop-in `/v1/whatsapp-compat/{phone_id}/messages` endpoint translates existing WhatsApp Cloud API calls into Sonaraim Cards. | Vendor lock-in to Meta Cloud API. |

---

## 3. Deep Dive: Sonaraim vs. Telegram

| Dimension | **Sonaraim** | **Telegram** |
| :--- | :--- | :--- |
| **Encryption Model** | End-to-end encrypted by default across 1:1, MLS Groups, Status, and Media. | Cloud chats & groups are **server-encrypted** (Telegram holds keys); Secret Chats lack multi-device & groups. |
| **Decentralization** | Any organization or community can run `sonaraim-node` and federate via `/v1/p2p/sync` & UDP gossip. | Single centralized infrastructure controlled by Telegram. |
| **B2B WebApps Security** | **Zero-HTML Declarative Cards** eliminate third-party WebView XSS/script injection risks. | Telegram Mini Apps run arbitrary HTML/JS inside WebViews. |
| **Dual Inbox & Spam Isolation** | Verified Services live in a separate stream gated by `ConsentToken`. | Channels, bots, and personal chats share one unified list unless manually foldered. |

---

## 4. Deep Dive: Sonaraim vs. Signal

| Dimension | **Sonaraim** | **Signal** |
| :--- | :--- | :--- |
| **Target Scope** | Full B2C private messaging **plus** verifiable B2B transactional workflows, payments, and federation. | Pure B2C private messaging; intentionally excludes B2B APIs and enterprise channels. |
| **Federation & Self-Hosting** | **Yes** — sovereign nodes (`sonaraim-node`) + enterprise bridge (`sonaraim-b2b`) + admin console (`sonaraim-admin`). | **No** — running an independent federated Signal server connected to the main network is not supported. |
| **Identity & Recovery** | Phone E.164 + Passkeys (WebAuthn PRF) + **Zero-Knowledge Vault** + 6-digit/QR device pairing. | Phone number + Signal PIN (SVR). |
| **Group Scalability** | **IETF MLS (RFC 9420)** designed for efficient logarithmic key updates (`O(log N)`). | Sender Keys (`O(N)` pairwise key distribution). |

---

## 5. Deep Dive: Extended Ecosystem Comparison

| Platform | Primary Strength | Key Limitation vs. Sonaraim |
| :--- | :--- | :--- |
| **Matrix (Element)** | Mature open federation protocol & bridges. | Heavy homeserver state synchronization, no native Dual Inbox/ConsentToken model, no WhatsApp Cloud API drop-in or Zero-HTML signed cards. |
| **Session** | Strong anonymity via Oxen onion network without phone numbers. | No B2B transactional layer, no Instant Clips web fallback, slower message latency, no LiveKit SFU calling or payment rails. |
| **Slack / MS Teams** | Rich internal workplace workflows & enterprise compliance. | Zero E2EE (provider/admin reads all messages), no cross-company P2P federation, high per-seat SaaS cost for external customers. |
| **XMPP (OMEMO)** | Decades-old open federated XML standard. | Fragmented client UX, XML overhead, no native WebAuthn ZK Vault, no declarative signed commerce cards or WhatsApp Cloud API compatibility. |

---

## 6. Recommended Use Cases for Sonaraim

| Use Case | Why Sonaraim Fits Best |
| :--- | :--- |
| **Healthcare, Fintech & Regulated B2B** | E2EE delivery, `did:web` brand verification, Zero-HTML anti-phishing cards, and signed user consent receipts. |
| **High-Volume Transactional Messaging** | Eliminates WhatsApp per-conversation fees while keeping `/v1/whatsapp-compat/...` compatibility. |
| **Sovereign Communities & Governments** | Self-hosted `sonaraim-node` clusters with `/v1/p2p/sync` federation and Apache-2.0 licensing. |
| **Privacy-Conscious B2C Users** | WhatsApp-familiar mobile UX (`sonaraim-app/mobile`) with Dual Inbox, Blind PSI, Sealed Sender, and 1-tap consent revocation. |
