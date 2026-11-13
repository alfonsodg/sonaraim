# Contributing to Sonaraim

Thank you for contributing to the Sonaraim ecosystem! This repository (`sonaraim`) serves as the Coordinator and Control Repository for global architecture specifications, cross-service contracts, JSON schemas, and deployment orchestration across all Sonaraim services.

To maintain architectural coherence, security guarantees, and strict code quality, all contributors must adhere to the engineering standards described below.

---

## 1. Branching & Git Workflow

- **`develop` Branch**: The central integration branch. All feature and bugfix branches must branch from and merge into `develop`.
- **`main` Branch**: Reserved strictly for production releases (`vMAJOR.MINOR.PATCH`). Never merge directly to `main`.
- **Branch Naming Conventions**:
  - Feature branches: `feature/<feature-name>` (e.g., `feature/backup-automation`)
  - Fix branches: `fix/<issue-description>` (e.g., `fix/nginx-upstream-ports`)
- **Pull Requests**: Open Pull Requests targeting `develop`. Every PR must pass all CI/CD quality gates, contract validations, and markdown linting before review.

---

## 2. Test-Driven Development (TDD) Mandatory

All cross-service contracts and validator scripts in this repository must follow strict Test-Driven Development:

1. **Red**: Write a failing contract or schema test in `tests/contracts.test.mjs` reproducing the problem or defining the new architectural invariant before changing code or schemas.
2. **Green**: Make the minimal changes required to pass the test assertions.
3. **Refactor**: Clean up and optimize while ensuring all existing and new tests pass.
4. **Coverage**: Zero production changes without automated verification tests.

---

## 3. Code Quality & Modularity Standards

- **File Length Limit**: Every source file must remain under 300 lines. Split large scripts or schemas into cohesive, single-responsibility files.
- **Mandatory Documentation**: Every exported function, class, and procedure must have docstrings/comments explaining its purpose, parameters, and return value. Complex logic must have inline comments explaining *why*.
- **Zero-Hardcode Policy**: Never embed fixed IP addresses, hostnames, ports, credentials, or magic numbers. All values must be parameterized via `.env` or explicit configuration arguments.
- **Anti-Destruction Contract**: Deployment configurations must protect persistent storage volumes across service upgrades. Destructive volume commands (`down -v`) are strictly forbidden in shared environments.

---

## 4. Conventional Commits

All commit messages must strictly follow the Conventional Commits specification and reference an issue number:

```text
<type>(<scope>): <subject> (Ref #N)
```

- **Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `infra`.
- **Scopes**: `governance`, `contracts`, `deploy`, `nginx`, `prometheus`, `schemas`, `backup`.
- **Issue Reference**: Always reference the tracked issue using `Ref #N` (never `Closes #N`, as issues undergo manual verification before closing).

Example:

```text
docs(governance): add Apache 2.0 license, collaboration guides, and Phase 3 docs (Ref #16)
```

---

## 5. Tooling, Verification & Quality Gates

Run and verify the following commands locally before submitting changes:

```bash
# 1. Run cross-service contract and integrity test suite
node --test tests/contracts.test.mjs

# 2. Markdown quality and linting verification
npx --yes markdownlint-cli2 "*.md" "docs/*.md"
```

Both commands must pass with zero errors.

---

## 6. Documentation & Architecture Standards

- **Language**: English only for code, documentation, comments, schemas, and commit messages.
- **Mermaid Diagrams**: Mermaid diagrams belong **exclusively** inside `docs/DIAGRAMS.md`. Never embed ```` ```mermaid ```` code blocks in `README.md` or `ARCHITECTURE.md` (use text or ASCII art instead).
- **Markdown Linting**: All markdown files must pass `markdownlint` without errors.
