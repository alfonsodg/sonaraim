/**
 * Coordinator contract and documentation integrity test suite.
 * Run with: node --test tests/contracts.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadJsonFile, validateSonaraimCard } from "../src/validate_contracts.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");

test("configs/schemas/sonaraim-card.schema.json is valid JSON Schema 2020-12", () => {
  const schema = loadJsonFile(path.join(ROOT, "configs/schemas/sonaraim-card.schema.json"));
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.ok(Array.isArray(schema.required));
  assert.deepEqual(schema.required, ["schema_version", "card_id", "title", "components"]);
});

test("samples/sample-order-card.json passes Sonaraim Card structural validation", () => {
  const card = loadJsonFile(path.join(ROOT, "samples/sample-order-card.json"));
  const result = validateSonaraimCard(card);
  assert.equal(result.valid, true, `Validation failed: ${result.errors.join(", ")}`);
});

test("validateSonaraimCard rejects invalid HTML/script injection component types", () => {
  const maliciousCard = {
    schema_version: "1.0",
    card_id: "card_9999",
    title: "Spoofed Card",
    components: [{ type: "RAW_HTML_IFRAME", id: "xss_1" }],
  };
  const result = validateSonaraimCard(maliciousCard);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("RAW_HTML_IFRAME")));
});

test("docs/ARCHITECTURE.md contains zero inline mermaid blocks and docs/DIAGRAMS.md contains mermaid diagrams", () => {
  const archContent = fs.readFileSync(path.join(ROOT, "docs/ARCHITECTURE.md"), "utf8");
  const diagContent = fs.readFileSync(path.join(ROOT, "docs/DIAGRAMS.md"), "utf8");
  assert.equal(
    archContent.includes("```mermaid"),
    false,
    "ARCHITECTURE.md must not contain inline mermaid blocks"
  );
  assert.equal(
    diagContent.includes("```mermaid"),
    true,
    "DIAGRAMS.md must contain mermaid blocks"
  );
});

test("docs/DEPLOYMENT.md documents Anti-Destruction contract, DNS names, and surgical updates", () => {
  const deploymentPath = path.join(ROOT, "docs/DEPLOYMENT.md");
  assert.equal(fs.existsSync(deploymentPath), true, "docs/DEPLOYMENT.md must exist");
  const content = fs.readFileSync(deploymentPath, "utf8");
  for (const requiredToken of [
    "up -d --no-deps",
    "down -v",
    "sonaraim-node",
    "sonaraim-b2b",
    "sonaraim-admin",
    "sonaraim-app-web",
  ]) {
    assert.equal(
      content.includes(requiredToken),
      true,
      `docs/DEPLOYMENT.md must document "${requiredToken}"`
    );
  }
});

test("deploy/compose/docker-compose.yml parameterizes images, ports, and secrets without hardcodes", () => {
  const composeContent = fs.readFileSync(
    path.join(ROOT, "deploy/compose/docker-compose.yml"),
    "utf8"
  );
  assert.match(composeContent, /\$\{POSTGRES_PASSWORD\}/);
  assert.match(composeContent, /\$\{REDIS_PASSWORD\}/);
  assert.match(composeContent, /\$\{S3_SECRET_ACCESS_KEY\}/);
  assert.match(composeContent, /\$\{B2B_KMS_MASTER_KEY\}/);
  assert.doesNotMatch(composeContent, /POSTGRES_PASSWORD:\s*["']?[A-Za-z0-9]{4,}["']?$/m);
});

test("configs/nginx/sonaraim.conf.template and configs/prometheus/alerts.yml are parameterized", () => {
  const nginx = fs.readFileSync(path.join(ROOT, "configs/nginx/sonaraim.conf.template"), "utf8");
  assert.match(nginx, /\$\{SONARAIM_PUBLIC_DOMAIN\}/);
  assert.match(nginx, /\$\{NODE_HTTP_PORT\}/);
  assert.match(nginx, /\$\{B2B_HTTP_PORT\}/);
  assert.match(nginx, /\$\{ADMIN_HTTP_PORT\}/);
  assert.match(nginx, /\$\{APP_WEB_PORT\}/);
  assert.match(nginx, /limit_req_zone/);
  assert.match(nginx, /Strict-Transport-Security/);

  const alerts = fs.readFileSync(path.join(ROOT, "configs/prometheus/alerts.yml"), "utf8");
  assert.match(alerts, /SonaraimServiceDown/);
  assert.match(alerts, /sonaraim_admin_upstream_reachable/);
  assert.match(alerts, /sonaraim_node_relay_queued_total/);
});

test("deploy/scripts/backup-sonaraim.sh exists and passes syntax validation", async () => {
  const { execFileSync } = await import("node:child_process");
  const scriptPath = path.join(ROOT, "deploy/scripts/backup-sonaraim.sh");
  const content = fs.readFileSync(scriptPath, "utf8");
  assert.match(content, /pg_dump/);
  assert.match(content, /BGSAVE/);
  execFileSync("bash", ["-n", scriptPath]);
});
