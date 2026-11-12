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
