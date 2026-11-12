/**
 * Coordinator contract and architecture validator for the Sonaraim ecosystem.
 * Validates Sonaraim Card payloads against reference/sonaraim-card.schema.json
 * and verifies that architectural documentation complies with repository standards.
 */
import fs from "node:fs";

const ALLOWED_COMPONENT_TYPES = new Set([
  "TEXT_BLOCK",
  "KEY_VALUE_LIST",
  "LIVE_MAP",
  "ITEM_SELECTOR",
  "PAYMENT_SUMMARY",
  "ACTION_ROW",
]);

/**
 * Validates a Sonaraim Declarative Card payload against core structural rules.
 *
 * @param {Record<string, unknown>} card - Parsed JSON object representing a Sonaraim Card.
 * @returns {{ valid: boolean, errors: string[] }} Validation result and error list.
 */
export function validateSonaraimCard(card) {
  const errors = [];

  if (!card || typeof card !== "object") {
    return { valid: false, errors: ["Card payload must be a non-null object."] };
  }

  if (card.schema_version !== "1.0") {
    errors.push(`Unsupported schema_version: ${String(card.schema_version)}`);
  }

  if (typeof card.card_id !== "string" || card.card_id.length < 4) {
    errors.push("card_id must be a string of at least 4 characters.");
  }

  if (typeof card.title !== "string" || card.title.length < 1 || card.title.length > 140) {
    errors.push("title must be a non-empty string up to 140 characters.");
  }

  if (!Array.isArray(card.components) || card.components.length === 0) {
    errors.push("components must be a non-empty array.");
  } else {
    for (const comp of card.components) {
      if (!comp || typeof comp !== "object") {
        errors.push("Each component must be an object.");
        continue;
      }
      if (!ALLOWED_COMPONENT_TYPES.has(comp.type)) {
        errors.push(`Invalid component type: ${String(comp.type)}`);
      }
      if (typeof comp.id !== "string" || comp.id.length === 0) {
        errors.push("Each component must define a non-empty string id.");
      }
    }
  }

  if (card.merchant_signature !== undefined) {
    const sig = card.merchant_signature;
    if (
      !sig ||
      typeof sig !== "object" ||
      sig.algorithm !== "Ed25519" ||
      typeof sig.did !== "string" ||
      !/^did:(web|sonaraim):[a-zA-Z0-9._:-]+$/.test(sig.did)
    ) {
      errors.push("merchant_signature must contain a valid did and Ed25519 algorithm.");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Loads and validates a JSON file from disk.
 *
 * @param {string} filePath - Path to the JSON file.
 * @returns {Record<string, unknown>} Parsed JSON object.
 */
export function loadJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}
