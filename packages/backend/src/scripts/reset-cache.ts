/**
 * Reset cached guide content and/or audio narrations.
 *
 * Usage:
 *   npx tsx src/scripts/reset-cache.ts              # Reset all (guides + audio)
 *   npx tsx src/scripts/reset-cache.ts --guides      # Reset guide content only
 *   npx tsx src/scripts/reset-cache.ts --audio       # Reset audio narrations only
 *   npx tsx src/scripts/reset-cache.ts --landmark=X  # Reset only for landmark name X
 *   npx tsx src/scripts/reset-cache.ts --stale       # Reset only entries without a prompt_version (old cache)
 *   npx tsx src/scripts/reset-cache.ts --dry-run     # Preview what would be deleted
 *
 * This deactivates guide_content rows and deletes audio files + DB records.
 * Landmarks themselves are preserved.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const guidesOnly = args.includes("--guides");
const audioOnly = args.includes("--audio");
const staleOnly = args.includes("--stale");
const landmarkFilter = args
  .find((a) => a.startsWith("--landmark="))
  ?.split("=")
  .slice(1)
  .join("=");

// If neither --guides nor --audio is specified, reset both
const resetGuides = !audioOnly;
const resetAudio = !guidesOnly;

async function main() {
  const prisma = new PrismaClient();

  try {
    // ── Build filter ────────────────────────────────────────────────
    const guideWhere: Record<string, unknown> = {};

    if (staleOnly) {
      // Only target entries without a prompt_version (generated before versioning)
      guideWhere.prompt_version = null;
    }

    if (landmarkFilter) {
      const landmark = await prisma.landmark.findFirst({
        where: { name: { contains: landmarkFilter, mode: "insensitive" } },
      });

      if (!landmark) {
        console.log(`[reset-cache] No landmark found matching "${landmarkFilter}"`);
        return;
      }

      console.log(
        `[reset-cache] Targeting landmark: ${landmark.name} (${landmark.id})`
      );
      guideWhere.landmark_id = landmark.id;
    }

    // ── Count what will be affected ─────────────────────────────────
    const guidesToReset = await prisma.guideContent.findMany({
      where: guideWhere,
      include: {
        audio_narration: true,
        landmark: { select: { name: true } },
      },
    });

    const audioToReset = guidesToReset.filter((g) => g.audio_narration);

    console.log(`[reset-cache] Found:`);
    console.log(`  - ${guidesToReset.length} guide content entries`);
    console.log(`  - ${audioToReset.length} audio narration entries`);

    if (guidesToReset.length === 0) {
      console.log(`[reset-cache] Nothing to reset.`);
      return;
    }

    // Show details
    for (const g of guidesToReset) {
      const promptVer = g.prompt_version ?? "(none)";
      const hasAudio = g.audio_narration ? "🎙️" : "  ";
      console.log(
        `  ${hasAudio} ${g.landmark.name} [${g.locale}] v${g.version} prompt=${promptVer} active=${g.is_active}`
      );
    }

    if (dryRun) {
      console.log(`[reset-cache] --dry-run: no changes made.`);
      return;
    }

    // ── Delete audio files + DB records ─────────────────────────────
    if (resetAudio) {
      const audioCacheDir = path.resolve(__dirname, "../../audio-cache");
      let filesDeleted = 0;

      for (const guide of audioToReset) {
        if (guide.audio_narration) {
          // Delete the audio file from disk
          const filePath = path.resolve(
            __dirname,
            "../..",
            guide.audio_narration.file_path
          );
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              filesDeleted++;
            }
          } catch {
            // File may already be deleted
          }
        }
      }

      // Delete audio narration DB records
      const guideIds = guidesToReset.map((g) => g.id);
      const audioDeleted = await prisma.audioNarration.deleteMany({
        where: { guide_content_id: { in: guideIds } },
      });

      console.log(
        `[reset-cache] Deleted ${audioDeleted.count} audio DB records, ${filesDeleted} audio files`
      );
    }

    // ── Delete guide content DB records ─────────────────────────────
    if (resetGuides) {
      const guideIds = guidesToReset.map((g) => g.id);

      // Delete reviews referencing these guides first
      await prisma.review.deleteMany({
        where: { guide_content_id: { in: guideIds } },
      });

      const guidesDeleted = await prisma.guideContent.deleteMany({
        where: { id: { in: guideIds } },
      });

      console.log(
        `[reset-cache] Deleted ${guidesDeleted.count} guide content records`
      );
    }

    console.log(`[reset-cache] Done. Next snap will regenerate fresh content.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[reset-cache] fatal error:", err);
  process.exit(1);
});

