/**
 * List prompts from filesystem (dry-run / listing tool).
 *
 * For actual DB seeding, use the backend's seed:prompts script:
 *   cd packages/backend && npx tsx src/scripts/seed-prompts.ts --activate
 *
 * This script is a convenience for listing what's on disk:
 *   npx tsx src/scripts/seed-prompts.ts
 *   npx tsx src/scripts/seed-prompts.ts --prompt=landmark_identify
 */

import { PromptRegistry } from "../registry.js";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const promptFilter = args
  .find((a) => a.startsWith("--prompt="))
  ?.split("=")[1];

const promptsDir = path.resolve(__dirname, "../../prompts");
const registry = new PromptRegistry(promptsDir);

console.log("[seed-prompts] scanning prompts directory:", promptsDir);
registry.loadFromFilesystem();

const prompts = registry.listPrompts();

if (promptFilter) {
  const filtered = prompts.filter((p) => p.id === promptFilter);
  console.log(
    `[seed-prompts] found ${filtered.length} prompt(s) matching "${promptFilter}"`
  );
  filtered.forEach((p) => {
    console.log(`  - ${p.id} v${p.version} (schema: ${p.schema})`);
  });
} else {
  console.log(`[seed-prompts] found ${prompts.length} prompt(s)`);
  prompts.forEach((p) => {
    console.log(`  - ${p.id} v${p.version} (schema: ${p.schema})`);
  });
}

console.log(
  "\n[seed-prompts] To seed into DB, run from backend package:"
);
console.log(
  "  cd packages/backend && npx tsx src/scripts/seed-prompts.ts --activate"
);
