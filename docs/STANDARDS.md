# Engineering & Development Standards (STANDARDS.md)

This document synthesizes the mandatory engineering, architectural, testing, security, and operational standards applied across the **Sonaraim** coordinator repository and all service repositories (`sonaraim-protocol`, `sonaraim-node`, `sonaraim-b2b`, `sonaraim-admin`, `sonaraim-app`).

---

## 1. Language & Communication Policy

- **Repository Artifacts**: All source code, inline comments, docstrings, documentation, commit messages, pull requests, and issue descriptions MUST be written exclusively in **English**.
- **Internationalization (i18n)**: User-facing interfaces (`sonaraim-app` and `sonaraim-admin`) MUST load all strings through structured i18n resource catalogs—never hardcoded UI text.

---

## 2. Technology Stack & Tooling by Service

Always use the **latest stable version** of each language, runtime, and dependency. Never hardcode obsolete version numbers.

| Layer / Service | Language & Runtime | Package & Build Tooling | Linting & Formatting Gate | Testing Framework |
| :--- | :--- | :--- | :--- | :--- |
| `sonaraim-protocol` | Protobuf, Rust, TypeScript, Go | `buf`, `cargo`, `npm`, `go mod` | `buf lint`, `cargo clippy`, `eslint` | `cargo test`, `vitest`, `go test` |
| `sonaraim-node` | Rust (latest stable) | `cargo` | `cargo fmt --check`, `cargo clippy -- -D warnings` | `cargo test`, property & fuzz tests |
| `sonaraim-b2b` | Rust or Go (latest stable) | `cargo` / `go mod` | `clippy` + `rustfmt` / `golangci-lint` + `gofmt` | Unit, integration, OpenAPI/gRPC contract tests |
| `sonaraim-admin` | TypeScript + React (latest stable) | `npm` (strictly `npm`, never yarn/pnpm) | `eslint`, `prettier`, `tsc --noEmit` | `vitest`, `@testing-library/react`, Playwright E2E |
| `sonaraim-app` | TypeScript + React Native (latest stable) | `npm` | `eslint`, `prettier`, `tsc --noEmit` | `jest` / `vitest`, Detox / Playwright Web |
| Auxiliary / Scripts | Python (latest stable, when required) | `uv` (mandatory, never raw `pip`) | `ruff check`, `ruff format`, `mypy` | `pytest` |
| Documentation | GitHub-Flavored Markdown | `markdownlint` | `markdownlint` (0 errors required) | Schema & link validation |

---

## 3. Code Quality & Modularity Rules

1. **File Size Limit**: Every source code file MUST remain under **300 lines**. Each file has a single, well-defined responsibility (SOLID principles).
2. **Mandatory Documentation Comments**:
   - Every module, struct/class, trait/interface, function, and method MUST have a doc comment explaining its purpose, arguments, return values, and error conditions.
   - Complex cryptographic, routing, or state-machine blocks MUST include inline comments explaining **WHY** a design choice exists, not merely restating what the syntax does.
3. **Zero Hardcoded Values**:
   - URLs, IP addresses, ports, cryptographic keys, rate limits, timeouts, retry counts, and feature flags MUST NEVER be hardcoded in source files.
   - All configurable parameters MUST be injected via environment variables, validated configuration files, or database settings with explicit schema validation at startup.
4. **Explicit Error Handling & Structured Logging**:
   - No silent catch blocks or ignored results (`unwrap()` / `expect()` are forbidden in production Rust paths outside infallible static initialization; use typed errors via `thiserror`).
   - All services emit structured JSON logs with standardized levels (`ERROR`, `WARN`, `INFO`, `DEBUG`) and correlation IDs (`trace_id`, `tenant_id`, `node_id`).
   - **Zero Secret Logging**: Private keys, Passkey PRF outputs, session tokens, and plaintext message bodies MUST NEVER appear in logs.

---

## 4. Test-Driven Development (TDD) & Verification Hierarchy

TDD is mandatory across all repositories (**Red → Green → Refactor**):

1. **Red**: Write a failing test that reproduces the bug or specifies the new behavior before writing production code.
2. **Green**: Implement the minimal, clean production code required to pass the test.
3. **Refactor**: Optimize modularity and readability while keeping all tests green.

### Mandatory Test Categories

- **Unit Tests**: Cryptographic envelope validation, MLS state transitions, `Sonaraim Card` schema validation, consent token verification, and billing quota math.
- **Contract Tests**: Protobuf and OpenAPI compatibility between `sonaraim-node`, `sonaraim-b2b`, `sonaraim-admin`, and `sonaraim-app`.
- **Integration Tests**: Database migrations (with mandatory rollback verification), Redis ephemeral queues, S3/MinIO encrypted blob presigning, and WhatsApp Cloud API payload translation.
- **E2E Smoke & UI Validation**: Playwright multi-viewport verification for `sonaraim-admin` and `sonaraim-app` (Instant Web Card view and Dual Inbox flows).

---

## 5. Git Workflow & Issue Lifecycle

### Branching Strategy

- `main`: Production-ready releases only, tagged with immutable SemVer (`vMAJOR.MINOR.PATCH`).
- `develop`: Primary integration branch. Created from `main` before any feature work begins.
- `feature/<name>`, `fix/<name>`, `hotfix/<name>`: Branched from `develop` (or `main` for hotfixes). Merge decisions are strictly manual and controlled by the maintainer.

### Issue-First Discipline & Conventional Commits

- **No Orphan Commits**: Every finding, feature, bug, or architectural change MUST have a tracked issue with priority (`priority::critical|high|medium|low`) and type (`type::bug|feature|improvement|refactor|security|performance|docs|infra`) labels BEFORE code changes are committed.
- **Commit Format**:

  ```text
  <type>(<scope>): <subject> (#<issue>)

  Ref #<issue>
  ```

- **Review State**: Issues are never closed autonomously by agents. Once all acceptance criteria are verified with evidence and linked commits, the issue is labeled `status::review` for human validation.

---

## 6. Security & Cryptographic Mandates

1. **End-to-End Encryption (E2EE) by Default**:
   - Personal B2C 1:1 and group conversations use IETF MLS (RFC 9420) with forward secrecy and post-compromise security.
   - B2B conversations terminate encryption exclusively at the verified tenant's **Enterprise E2EE Bridge** (`sonaraim-b2b` or tenant sovereign node), never in unverified third-party proxies.
2. **Zero-HTML Card Rendering**:
   - `sonaraim-app` MUST NEVER execute arbitrary HTML, JavaScript, or untrusted `iframe` WebViews inside chat timelines. All interactive cards MUST validate against [configs/schemas/sonaraim-card.schema.json](../configs/schemas/sonaraim-card.schema.json) and carry a valid Ed25519 signature matching the sender's verified DID.
3. **Container & Deployment Hygiene**:
   - Multi-stage Dockerfiles with minimal, non-root runtime images.
   - Persistent services (PostgreSQL, Redis, MinIO) require explicit volume mounts.
   - Every service exposes a `/health` endpoint verified after deployment.
