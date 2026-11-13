# Security Policy (`sonaraim`)

## 1. Supported Versions

Security updates and vulnerability patches are actively provided for the following releases:

| Version | Supported | Security Policy |
| :--- | :--- | :--- |
| `develop` | :white_check_mark: Yes | Bleeding edge; security fixes land here first |
| `0.1.x` | :white_check_mark: Yes | Current minor release series |
| `< 0.1.0` | :x: No | Unsupported pre-release builds |

---

## 2. Reporting a Vulnerability

The Sonaraim engineering team treats all security issues with paramount urgency. We request that all security reports be handled through coordinated responsible disclosure.

### Reporting Procedure

- **Email**: Send vulnerability reports directly to [security@sonaraim.org](mailto:security@sonaraim.org).
- **PGP Encryption**: For proof-of-concept exploits, please encrypt your message with the Sonaraim Security PGP Key (`https://sonaraim.org/security.asc`).
- **Required Information**:
  - Detailed description of the vulnerability, affected service, or contract schema.
  - Reproducible steps, curl scripts, or test vectors.
  - Impact assessment across confidentiality, integrity, or network availability.

### Response SLAs

- **Initial Acknowledgment**: Within **24 hours**.
- **Triage & Classification**: Within **48 hours**.
- **Remediation & Patch Target**: Critical severity issues are patched within **7 days**; high severity issues within **14 days**.
- **Coordinated Disclosure**: We request a **90-day embargo** from initial notification before public release.

---

## 3. Ecosystem Threat Model & Zero-Trust Architecture

The Sonaraim ecosystem enforces end-to-end encryption and zero-trust verification across all 6 core repositories:

### 3.1 End-to-End Encryption & Sealed Sender Routing

- **Messaging Layer Security (MLS 1.0 / RFC 9420)**: Group ratcheting, forward secrecy, and post-compromise security protect all 1:1 and group communications.
- **Sealed Sender Outer Envelope**: Transport relays (`sonaraim-node`) see only an opaque `mailbox_id` and an ephemeral 32-byte X25519 public key. Relay operators cannot observe who messages whom.
- **Zero Plaintext Storage**: Relay nodes store only encrypted payloads in ephemeral, TTL-bounded store-and-forward buckets.

### 3.2 Key Transparency & Verifiable Identity

- **Append-Only Merkle Ledger**: User (`did:sonaraim`) and enterprise (`did:web`) public keys are recorded in an append-only Key Transparency log.
- **Equivocation Detection**: Federated nodes gossip `SignedTreeHead` datagrams over UDP to cryptographically detect split-brain key substitution attacks.
- **Cryptographic Inclusion Proofs**: Clients verify Merkle audit paths before establishing encrypted communication sessions.

### 3.3 Declarative Rich Cards (Zero-HTML & Zero-Eval)

- **Strict Schema Boundaries**: Sonaraim Cards forbid raw HTML tags (`<script>`, `<iframe>`), arbitrary CSS, and remote executable scripts.
- **URI Sanitization**: Action URLs must use `https://` or `sonaraim://` schemes. Unsafe schemes (`javascript:`, `data:`, `file:`) are rejected at the protocol boundary.
- **Native OS Rendering**: Cards are rendered exclusively by native platform UI widgets in `sonaraim-app` and App Clips.

### 3.4 Contact Discovery & Social Graph Privacy

- **Private Set Intersection (PSI)**: Social graph discovery uses blinded phone hashes. The server evaluates intersection sets without observing unhashed phone numbers or contact graphs.

### 3.5 Infrastructure & Network Isolation

- **Reverse Proxy TLS**: System Nginx with Let's Encrypt Certbot terminates TLS at the edge, enforcing HSTS and rate limits.
- **Zero Hardcoding**: All credentials, database passwords, and KMS master keys are parameterized via `.env` and Docker Compose secrets substitution.
- **Anti-Destruction Contract**: Stateful database and storage volumes are protected against accidental deletion across upgrades.

---

## 4. Out-of-Scope Vulnerabilities

- Compromise of user client devices via rootkits or physical hardware tampering.
- Volumetric denial of service (DDoS) against edge network providers.
- Social engineering or phishing conducted outside Sonaraim verified channels.
