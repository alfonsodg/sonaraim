# Installation & Orchestration Guide (INSTALL.md)

This guide covers cloning the **Sonaraim** coordinator repository and its modular service repositories, configuring environment variables, and running verification suites.

---

## 1. Prerequisites

Ensure the following tools (latest stable versions) are installed on your development workstation:

- **Git** (configured with SSH keys for GitHub/GitLab)
- **Rust Toolchain** (`rustup`, `cargo`, `rustfmt`, `clippy`) for `sonaraim-node`, `sonaraim-protocol`, and `sonaraim-b2b`
- **Go Toolchain** (if building Go-based connectors in `sonaraim-b2b`)
- **Node.js & `npm`** (strictly `npm`) for `sonaraim-admin` and `sonaraim-app`
- **Protobuf Compiler (`protoc` / `buf`)** for `sonaraim-protocol`
- **`markdownlint` / `markdownlint-cli2`** for documentation quality verification

> **Note**: In accordance with engineering rules, never install Docker engines or database servers directly on local workstations unless explicitly authorized; full container orchestration runs on designated remote test environments defined in `REMOTE.md`.

---

## 2. Multi-Service Workspace Layout

Clone the coordinator repository first, then clone the service repositories as siblings or nested workspace folders (already gitignored in the coordinator `.gitignore`):

```bash
# 1. Clone the Coordinator / Control repository
git clone git@github.com:alfonsodg/sonaraim.git
cd sonaraim

# 2. Checkout the integration branch
git checkout develop

# 3. Clone service repositories (as they are initialized)
git clone git@github.com:alfonsodg/sonaraim-protocol.git
git clone git@github.com:alfonsodg/sonaraim-node.git
git clone git@github.com:alfonsodg/sonaraim-b2b.git
git clone git@github.com:alfonsodg/sonaraim-admin.git
git clone git@github.com:alfonsodg/sonaraim-app.git
```

---

## 3. Environment Configuration

Copy the sample environment file and populate all required variables:

```bash
cp samples/.env.example .env
cp configs/node.example.toml configs/node.toml
```

Verify that `REMOTE.md` exists at the repository root and contains the target server coordinates for `dev`, `qa`, and `prod`.

---

## 4. Running Quality Gates & Contract Validation

Before committing any changes in the coordinator repository:

```bash
# 1. Validate all Markdown documentation (0 errors allowed)
markdownlint README.md docs/*.md

# 2. Validate JSON Schemas and sample payloads
node --input-type=module -e '
import fs from "node:fs";
JSON.parse(fs.readFileSync("configs/schemas/sonaraim-card.schema.json", "utf8"));
JSON.parse(fs.readFileSync("samples/sample-order-card.json", "utf8"));
console.log("JSON schemas and sample payloads are valid.");
'
```

---

## 5. Remote Container Orchestration (User-Directed)

When authorized to deploy on the remote target environment specified in `REMOTE.md`:

```bash
# On the remote server (with .env configured in /opt/sonaraim/<env>)
docker compose -f deploy/compose/docker-compose.yml --env-file .env up -d

# Verify health endpoints across all services
curl -fsS http://127.0.0.1:8040/health
curl -fsS http://127.0.0.1:8042/health
curl -fsS http://127.0.0.1:8044/health
curl -fsS http://127.0.0.1:8045/health
```
