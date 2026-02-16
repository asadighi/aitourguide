import * as fs from "node:fs";
import * as path from "node:path";
import { prisma } from "../lib/prisma.js";
import { generateTTS, type LLMProvider } from "@aitourguide/mcp";
import { logger } from "../middleware/logger.js";

const AUDIO_DIR = process.env.TTS_AUDIO_DIR || "./audio-cache";

/**
 * Ensure the audio cache directory exists.
 */
function ensureAudioDir(): void {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
}

/**
 * Build a predictable file path for a cached audio file.
 * Format: audio-cache/<guideContentId>.mp3
 */
function audioFilePath(guideContentId: string): string {
  return path.join(AUDIO_DIR, `${guideContentId}.mp3`);
}

export interface TTSResult {
  /** ID of the AudioNarration record */
  audioId: string;
  /** Filesystem path to the audio file */
  filePath: string;
  /** Whether the audio was served from cache */
  cached: boolean;
  /** Audio duration in ms (if available) */
  durationMs: number | null;
  /** Voice used */
  voice: string;
}

/**
 * Get or generate TTS audio for a guide content record.
 *
 * 1. Check DB for existing AudioNarration linked to the guide content
 * 2. If found AND file exists on disk → return cached
 * 3. If not → generate via LLM provider, save to disk, create DB record
 */
export async function getOrGenerateTTS(
  provider: LLMProvider,
  guideContentId: string,
  narrationScript: string,
  requestId?: string
): Promise<TTSResult> {
  const log = logger.child({ requestId });

  // Step 1: Check DB cache
  const existing = await prisma.audioNarration.findUnique({
    where: { guide_content_id: guideContentId },
  });

  if (existing && fs.existsSync(existing.file_path)) {
    log.info({
      event: "tts.cache_hit",
      guideContentId,
      audioId: existing.id,
    });
    return {
      audioId: existing.id,
      filePath: existing.file_path,
      cached: true,
      durationMs: existing.duration_ms,
      voice: existing.voice_id,
    };
  }

  // If DB record exists but file is missing, clean up the stale record
  if (existing) {
    log.warn({
      event: "tts.stale_record",
      guideContentId,
      audioId: existing.id,
      missingFile: existing.file_path,
    });
    await prisma.audioNarration.delete({
      where: { id: existing.id },
    });
  }

  // Step 2: Generate TTS
  log.info({ event: "tts.generate.start", guideContentId });

  const voice = process.env.TTS_VOICE || "nova";
  const model = process.env.TTS_MODEL || "tts-1";
  const speed = parseFloat(process.env.TTS_SPEED || "1.0");

  const result = await generateTTS(provider, {
    text: narrationScript,
    voice,
    model,
    speed,
  });

  log.info({
    event: "tts.generate.complete",
    guideContentId,
    model: result.model,
    latencyMs: result.latencyMs,
    audioSizeBytes: result.audioSizeBytes,
    voice: result.voice,
  });

  // Step 3: Save audio to filesystem
  ensureAudioDir();
  const filePath = audioFilePath(guideContentId);
  fs.writeFileSync(filePath, result.audioBuffer);

  log.info({
    event: "tts.file.saved",
    guideContentId,
    filePath,
    sizeBytes: result.audioSizeBytes,
  });

  // Step 4: Create DB record
  const audioRecord = await prisma.audioNarration.create({
    data: {
      guide_content_id: guideContentId,
      file_path: filePath,
      duration_ms: null, // Could be computed from audio metadata later
      voice_id: result.voice,
    },
  });

  return {
    audioId: audioRecord.id,
    filePath: audioRecord.file_path,
    cached: false,
    durationMs: null,
    voice: result.voice,
  };
}

/**
 * Look up an AudioNarration by ID and return its file path.
 * Returns null if not found or file doesn't exist.
 */
export async function getAudioById(
  audioId: string
): Promise<{ filePath: string; guideContentId: string } | null> {
  const record = await prisma.audioNarration.findUnique({
    where: { id: audioId },
  });

  if (!record || !fs.existsSync(record.file_path)) {
    return null;
  }

  return {
    filePath: record.file_path,
    guideContentId: record.guide_content_id,
  };
}

/**
 * Look up an AudioNarration by guide content ID.
 * Returns null if not found or file doesn't exist.
 */
export async function getAudioByGuideContentId(
  guideContentId: string
): Promise<{ audioId: string; filePath: string } | null> {
  const record = await prisma.audioNarration.findUnique({
    where: { guide_content_id: guideContentId },
  });

  if (!record || !fs.existsSync(record.file_path)) {
    return null;
  }

  return {
    audioId: record.id,
    filePath: record.file_path,
  };
}

