import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { PromptRegistry } from "./registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Render a prompt from the registry with variable and fragment injection.
 */
export function renderPromptFromRegistry(
  registry: PromptRegistry,
  promptId: string,
  variables: Record<string, string> = {},
  options: { version?: string; fragmentsDir?: string } = {}
): { rendered: string; version: string; schemaType: string } | null {
  const entry = options.version
    ? registry.getVersion(promptId, options.version)
    : registry.getActive(promptId);

  if (!entry) return null;

  let rendered = entry.content;

  // Resolve fragment injections: {{fragment:name}}
  const fragmentsDir =
    options.fragmentsDir ||
    path.resolve(__dirname, "../prompts/_fragments");

  rendered = rendered.replace(
    /\{\{fragment:(\w+)\}\}/g,
    (_match, fragmentName: string) => {
      const fragmentPath = path.join(fragmentsDir, `${fragmentName}.md`);
      if (fs.existsSync(fragmentPath)) {
        return fs.readFileSync(fragmentPath, "utf-8");
      }
      return `[MISSING FRAGMENT: ${fragmentName}]`;
    }
  );

  // Resolve variable injections: {{variable_name}}
  rendered = rendered.replace(
    /\{\{(\w+)\}\}/g,
    (_match, varName: string) => {
      return variables[varName] ?? `[MISSING VAR: ${varName}]`;
    }
  );

  return {
    rendered,
    version: entry.version,
    schemaType: entry.schemaType,
  };
}

