# Installation & Orchestration Guide (`docs/INSTALL.md`)

This guide covers cloning the **Sonaraim** coordinator repository and its modular service repositories, configuring zero-hardcode environment variables, running quality gates, and deploying on remote target servers.

---

## 1. Prerequisites

Ensure the following tools (latest stable versions) are installed on your workstation:

- **Git** (configured with SSH keys for GitHub/GitLab access)
- **Rust Toolchain** (`rustup`, `cargo`, `rustfmt`, `clippy`) for `sonaraim-protocol`, `sonaraim-node`, and `sonaraim-b2b`
- **Node.js & `npm`** (`>=22.0.0`, strictly `npm`) for `sonaraim-admin`, coordinator contract tests, and `sonaraim-app`
- **React Native Toolchain** (Android SDK, Xcode CLI tools, Watchman) for `sonaraim-app/mobile`
- **Markdownlint CLI** (`npx --yes markdownlint-cli2`) for documentation quality assurance
- **OpenSSL & Certbot** (on target deployment hosts for TLS automation)

### Hardware, OS & Network Requirements (Per Node)

| Deployment Profile | OS / Architecture | CPU | RAM | Storage (NVMe/SSD) | Network |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Relay Node Only (`sonaraim-node`)** | Linux x86_64 / arm64 | 2 vCPU | 2 GB | 20 GB (WAL & Merkle log) | 100 Mbps+ |
| **Full Stack (Node + B2B + Admin + App + DB/MinIO)** | Linux x86_64 / arm64 | 4 vCPU | 8 GB | 80 GB | 1 Gbps |
| **Full Stack + LiveKit Video SFU (`--profile calls`)** | Linux x86_64 / arm64 | 8 vCPU | 16 GB | 100 GB+ | 1 Gbps+ low-latency |

Required firewall ports on the public host:

- **`80/tcp`, `443/tcp`**: Nginx reverse proxy & Certbot TLS termination.
- **`9031/udp`**: P2P QUIC / UDP datagram gossip (`NODE_P2P_PORT`).
- **`7881/tcp`** *(optional `--profile calls`)*: LiveKit WebRTC media transport.
- Internal service ports (`8031`, `8041`, `8051`, `8061`) remain bound to `127.0.0.1` behind Nginx.

> **Important**: In compliance with engineering rules, never install Docker engines or database servers directly on local development workstations; full multi-container orchestration runs on designated remote test environments documented in `REMOTE.md`.

---

## 2. Multi-Service Workspace Layout

Clone the coordinator repository first, then clone the modular service repositories as siblings or nested submodules (already excluded in `.gitignore`):

```bash
# 1. Clone the Coordinator / Control repository
git clone git@github.com:alfonsodg/sonaraim.git
cd sonaraim

# 2. Checkout the integration branch
git checkout develop

# 3. Clone all modular service repositories
git clone git@github.com:alfonsodg/sonaraim-protocol.git
git clone git@github.com:alfonsodg/sonaraim-node.git
git clone git@github.com:alfonsodg/sonaraim-b2b.git
git clone git@github.com:alfonsodg/sonaraim-admin.git
git clone git@github.com:alfonsodg/sonaraim-app.git
```

---

## 3. Environment Configuration

Copy the sample environment configuration and generate cryptographic secrets:

```bash
# Copy sample environment configuration
cp samples/.env.example .env

# Verify host deployment details in REMOTE.md
cat REMOTE.md
```

Ensure all variables in `.env` are populated according to [docs/CONFIGURATION.md](CONFIGURATION.md).

---

## 4. Running Verification Suites & Quality Gates

Before committing in any repository, execute its canonical test suite and markdown linter:

```bash
# 1. Coordinator contract & schema tests
node --test tests/contracts.test.mjs
npx --yes markdownlint-cli2 "*.md" "docs/*.md"

# 2. Protocol crate verification
cargo test --manifest-path sonaraim-protocol/Cargo.toml
(cd sonaraim-protocol && npx --yes markdownlint-cli2 "*.md" "docs/*.md")

# 3. Node relay crate verification
cargo test --manifest-path sonaraim-node/Cargo.toml
(cd sonaraim-node && npx --yes markdownlint-cli2 "*.md" "docs/*.md")

# 4. Enterprise B2B crate verification
cargo test --manifest-path sonaraim-b2b/Cargo.toml
(cd sonaraim-b2b && npx --yes markdownlint-cli2 "*.md" "docs/*.md")

# 5. Admin console test verification
npm test --prefix sonaraim-admin
(cd sonaraim-admin && npx --yes markdownlint-cli2 "*.md" "docs/*.md")

# 6. Mobile app verification
npm test --prefix sonaraim-app/mobile
(cd sonaraim-app && npx --yes markdownlint-cli2 "*.md" "docs/*.md")
```

---

## 5. Remote Container Deployment (User-Directed)

When authorized to deploy to the remote host defined in `REMOTE.md`:

```bash
# 1. Render Nginx TLS configuration
envsubst '${SONARAIM_PUBLIC_DOMAIN} ${NODE_HTTP_PORT} ${B2B_HTTP_PORT} ${ADMIN_HTTP_PORT} ${APP_WEB_PORT}' \
  < configs/nginx/sonaraim.conf.template > /etc/nginx/sites-available/sonaraim.conf
systemctl reload nginx

# 2. Launch container stack via Docker Compose
docker compose -f deploy/compose/docker-compose.yml --env-file .env up -d

# Optional: launch LiveKit SFU for voice/video calls
docker compose -f deploy/compose/docker-compose.yml --profile calls --env-file .env up -d

# 3. Verify health across all services
curl -fsS "http://127.0.0.1:${NODE_HTTP_PORT}/health"
curl -fsS "http://127.0.0.1:${B2B_HTTP_PORT}/health"
curl -fsS "http://127.0.0.1:${ADMIN_HTTP_PORT}/health"
curl -fsS "http://127.0.0.1:${APP_WEB_PORT}/health"
```

---

## 6. React Native Mobile App (EAS Build)

The mobile client is packaged under `sonaraim-app/mobile` and provides full WhatsApp-parity messaging with Expo Application Services (EAS) native build profiles (`development`, `preview`, `production`) defined in `eas.json`:

```bash
# 1. Install dependencies and run tests
cd sonaraim-app/mobile
npm install
npm test

# 2. Build native release artifacts with EAS CLI
npm run build:android    # eas build --platform android --profile production (AAB)
npm run build:ios        # eas build --platform ios --profile production (IPA)
```
