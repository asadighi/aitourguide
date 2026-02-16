import { describe, it, expect, beforeEach } from "vitest";
import { PromptRegistry } from "../registry.js";

describe("PromptRegistry", () => {
  let registry: PromptRegistry;

  beforeEach(() => {
    registry = new PromptRegistry();
  });

  it("registers and retrieves a prompt", () => {
    registry.register({
      promptId: "test_prompt",
      version: "1.0.0",
      content: "test content",
      schemaType: "test.v1",
      isActive: true,
    });

    const result = registry.getActive("test_prompt");
    expect(result).not.toBeNull();
    expect(result!.promptId).toBe("test_prompt");
    expect(result!.version).toBe("1.0.0");
    expect(result!.schemaType).toBe("test.v1");
  });

  it("returns null for unknown prompt", () => {
    const result = registry.getActive("nonexistent");
    expect(result).toBeNull();
  });

  it("retrieves specific version", () => {
    registry.register({
      promptId: "test_prompt",
      version: "1.0.0",
      content: "v1 content",
      schemaType: "test.v1",
      isActive: false,
    });
    registry.register({
      promptId: "test_prompt",
      version: "1.1.0",
      content: "v1.1 content",
      schemaType: "test.v1",
      isActive: true,
    });

    const v1 = registry.getVersion("test_prompt", "1.0.0");
    expect(v1).not.toBeNull();
    expect(v1!.content).toBe("v1 content");

    const active = registry.getActive("test_prompt");
    expect(active).not.toBeNull();
    expect(active!.content).toBe("v1.1 content");
  });

  it("lists all registered prompts", () => {
    registry.register({
      promptId: "prompt_a",
      version: "1.0.0",
      content: "a",
      schemaType: "a.v1",
      isActive: true,
    });
    registry.register({
      promptId: "prompt_b",
      version: "2.0.0",
      content: "b",
      schemaType: "b.v1",
      isActive: true,
    });

    const list = registry.listPrompts();
    expect(list).toHaveLength(2);
    expect(list.find((p) => p.id === "prompt_a")).toBeDefined();
    expect(list.find((p) => p.id === "prompt_b")).toBeDefined();
  });

  it("loads prompts from filesystem", () => {
    const fsRegistry = new PromptRegistry();
    fsRegistry.loadFromFilesystem();

    const prompts = fsRegistry.listPrompts();
    // Should find at least landmark_identify and guide_generate
    expect(prompts.length).toBeGreaterThanOrEqual(2);

    const landmark = prompts.find((p) => p.id === "landmark_identify");
    expect(landmark).toBeDefined();
    expect(landmark!.version).toBe("1.0.0");
  });
});

