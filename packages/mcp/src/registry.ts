import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PromptEntry {
  promptId: string;
  version: string;
  content: string;
  schemaType: string;
  isActive: boolean;
}

export interface PromptMetadata {
  description: string;
  schemaType: string;
  systemPrompt: string;
  promptContent: string;
}

/**
 * PromptRegistry manages prompt templates from the filesystem.
 * In production, this is backed by the database (via seed script).
 * In development, this reads directly from prompt files.
 */
export class PromptRegistry {
  private prompts: Map<string, PromptEntry[]> = new Map();
  private promptsDir: string;

  constructor(promptsDir?: string) {
    this.promptsDir =
      promptsDir || path.resolve(__dirname, "../prompts");
  }

  /**
   * Load all prompts from the filesystem.
   */
  loadFromFilesystem(): void {
    if (!fs.existsSync(this.promptsDir)) {
      return;
    }

    const dirs = fs
      .readdirSync(this.promptsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_"));

    for (const dir of dirs) {
      const promptId = dir.name;
      const promptPath = path.join(this.promptsDir, dir.name);
      const files = fs
        .readdirSync(promptPath)
        .filter((f) => f.startsWith("v") && f.endsWith(".md"));

      const entries: PromptEntry[] = files.map((file) => {
        const version = file.replace(".md", "").replace("v", "");
        const content = fs.readFileSync(
          path.join(promptPath, file),
          "utf-8"
        );
        const metadata = this.parsePromptMetadata(content);

        return {
          promptId,
          version,
          content,
          schemaType: metadata.schemaType,
          isActive: false,
        };
      });

      // Mark the latest version as active
      if (entries.length > 0) {
        entries.sort((a, b) => a.version.localeCompare(b.version));
        entries[entries.length - 1].isActive = true;
      }

      this.prompts.set(promptId, entries);
    }
  }

  /**
   * Register a prompt entry directly (used by seed script or tests).
   */
  register(entry: PromptEntry): void {
    const existing = this.prompts.get(entry.promptId) || [];
    existing.push(entry);
    this.prompts.set(entry.promptId, existing);
  }

  /**
   * Get the active version of a prompt.
   */
  getActive(promptId: string): PromptEntry | null {
    const entries = this.prompts.get(promptId);
    if (!entries) return null;
    return entries.find((e) => e.isActive) || null;
  }

  /**
   * Get a specific version of a prompt.
   */
  getVersion(promptId: string, version: string): PromptEntry | null {
    const entries = this.prompts.get(promptId);
    if (!entries) return null;
    return entries.find((e) => e.version === version) || null;
  }

  /**
   * List all registered prompts.
   */
  listPrompts(): Array<{ id: string; version: string; schema: string }> {
    const result: Array<{ id: string; version: string; schema: string }> = [];
    for (const [id, entries] of this.prompts) {
      const active = entries.find((e) => e.isActive);
      if (active) {
        result.push({
          id,
          version: active.version,
          schema: active.schemaType,
        });
      }
    }
    return result;
  }

  /**
   * Parse prompt metadata from markdown content.
   */
  private parsePromptMetadata(content: string): PromptMetadata {
    const descMatch = content.match(
      /## Description\s*\n([\s\S]*?)(?=\n##|\n$)/
    );
    const schemaMatch = content.match(
      /## Schema Type\s*\n([\s\S]*?)(?=\n##|\n$)/
    );
    const sysMatch = content.match(
      /## System Prompt\s*\n([\s\S]*?)(?=\n##|\n$)/
    );
    const promptMatch = content.match(
      /## Prompt Content\s*\n([\s\S]*?)$/
    );

    return {
      description: descMatch?.[1]?.trim() || "",
      schemaType: schemaMatch?.[1]?.trim() || "unknown",
      systemPrompt: sysMatch?.[1]?.trim() || "",
      promptContent: promptMatch?.[1]?.trim() || "",
    };
  }
}

