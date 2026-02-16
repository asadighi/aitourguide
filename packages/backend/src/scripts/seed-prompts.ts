/**
 * Seed prompts from filesystem into the database.
 *
 * Usage:
 *   npx tsx src/scripts/seed-prompts.ts
 *   npx tsx src/scripts/seed-prompts.ts --activate
 *   npx tsx src/scripts/seed-prompts.ts --prompt=landmark_identify
 *   npx tsx src/scripts/seed-prompts.ts --dry-run
 *
 * Reads prompt files from packages/mcp/prompts/ and upserts them
 * into the database Prompt table via Prisma.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PromptRegistry } from "@aitourguide/mcp";

// Load .env from the backend package root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const args = process.argv.slice(2);
const activate = args.includes("--activate");
const dryRun = args.includes("--dry-run");
const promptFilter = args
  .find((a) => a.startsWith("--prompt="))
  ?.split("=")[1];

async function main() {
  const promptsDir = path.resolve(__dirname, "../../../mcp/prompts");
  const registry = new PromptRegistry(promptsDir);

  console.log("[seed-prompts] scanning prompts directory:", promptsDir);
  registry.loadFromFilesystem();

  const prompts = registry.listPrompts();
  console.log(`[seed-prompts] found ${prompts.length} prompt(s) on disk`);

  // Get all entries from the registry
  const allEntries = getAllEntries(registry);

  // Apply filter if specified
  const filtered = promptFilter
    ? allEntries.filter((e) => e.promptId === promptFilter)
    : allEntries;

  if (filtered.length === 0) {
    console.log("[seed-prompts] no prompts to seed");
    return;
  }

  console.log(`[seed-prompts] will seed ${filtered.length} prompt version(s):`);
  for (const entry of filtered) {
    console.log(
      `  - ${entry.promptId} v${entry.version} (schema: ${entry.schemaType}, active: ${entry.isActive})`
    );
  }

  if (dryRun) {
    console.log("[seed-prompts] --dry-run flag set, skipping DB writes");
    return;
  }

  const prisma = new PrismaClient();

  try {
    let seeded = 0;
    let activated = 0;

    for (const entry of filtered) {
      await prisma.prompt.upsert({
        where: {
          prompt_id_version: {
            prompt_id: entry.promptId,
            version: entry.version,
          },
        },
        update: {
          content: entry.content,
          schema_type: entry.schemaType,
          ...(activate ? { is_active: entry.isActive } : {}),
        },
        create: {
          prompt_id: entry.promptId,
          version: entry.version,
          content: entry.content,
          schema_type: entry.schemaType,
          is_active: activate ? entry.isActive : false,
        },
      });
      seeded++;

      if (activate && entry.isActive) {
        await prisma.prompt.updateMany({
          where: {
            prompt_id: entry.promptId,
            version: { not: entry.version },
          },
          data: { is_active: false },
        });
        activated++;
      }
    }

    console.log(`[seed-prompts] seeded ${seeded} prompt version(s)`);
    if (activated > 0) {
      console.log(
        `[seed-prompts] activated latest version for ${activated} prompt(s)`
      );
    } else if (!activate) {
      console.log(
        "[seed-prompts] use --activate to set latest versions as active"
      );
    }

    // List final state
    const dbPrompts = await prisma.prompt.findMany({
      where: { is_active: true },
      select: { prompt_id: true, version: true, schema_type: true },
      orderBy: { prompt_id: "asc" },
    });

    if (dbPrompts.length > 0) {
      console.log("[seed-prompts] currently active prompts in DB:");
      for (const p of dbPrompts) {
        console.log(
          `  - ${p.prompt_id} v${p.version} (schema: ${p.schema_type})`
        );
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log("[seed-prompts] done");
}

function getAllEntries(
  registry: PromptRegistry
): Array<{
  promptId: string;
  version: string;
  content: string;
  schemaType: string;
  isActive: boolean;
}> {
  const prompts = registry.listPrompts();
  const entries: Array<{
    promptId: string;
    version: string;
    content: string;
    schemaType: string;
    isActive: boolean;
  }> = [];

  for (const p of prompts) {
    const entry = registry.getActive(p.id);
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}

main().catch((err) => {
  console.error("[seed-prompts] fatal error:", err);
  process.exit(1);
});

