import { describe, it, expect, beforeAll } from "vitest";
import { PromptRegistry } from "../registry.js";
import { renderPromptFromRegistry } from "../renderer.js";

describe("[milestone-a] renderPromptFromRegistry", () => {
  let registry: PromptRegistry;

  beforeAll(() => {
    registry = new PromptRegistry();
    registry.loadFromFilesystem();
  });

  it("renders landmark_identify prompt with fragment injection", () => {
    const result = renderPromptFromRegistry(registry, "landmark_identify", {
      gps_context: "GPS: lat=48.85, lng=2.29",
    });

    expect(result).not.toBeNull();
    expect(result!.version).toBe("1.0.0");
    expect(result!.schemaType).toBe("landmark_identification.v1");

    // Should contain the safety rules fragment (injected from {{fragment:safety_rules}})
    expect(result!.rendered).toContain("Never generate politically biased");
    expect(result!.rendered).toContain("Never fabricate historical events");

    // Should contain the GPS context variable
    expect(result!.rendered).toContain("GPS: lat=48.85, lng=2.29");
  });

  it("renders guide_generate prompt with all variables and fragments", () => {
    const result = renderPromptFromRegistry(registry, "guide_generate", {
      landmark_name: "Colosseum",
      locale: "en",
      admin_prompt_context: "",
    });

    expect(result).not.toBeNull();
    expect(result!.version).toBe("1.0.0");
    expect(result!.schemaType).toBe("guide_content.v1");

    // Should contain both fragments
    expect(result!.rendered).toContain("Never generate politically biased");
    expect(result!.rendered).toContain("enthusiastic, knowledgeable tour guide tone");

    // Should contain variable values
    expect(result!.rendered).toContain("Colosseum");
  });

  it("marks missing variables", () => {
    const result = renderPromptFromRegistry(
      registry,
      "landmark_identify",
      {}
    );

    expect(result).not.toBeNull();
    // gps_context not provided — should show placeholder
    expect(result!.rendered).toContain("[MISSING VAR: gps_context]");
  });

  it("returns null for unknown prompt", () => {
    const result = renderPromptFromRegistry(registry, "nonexistent_prompt");
    expect(result).toBeNull();
  });

  it("supports rendering specific version", () => {
    const result = renderPromptFromRegistry(
      registry,
      "landmark_identify",
      { gps_context: "" },
      { version: "1.0.0" }
    );

    expect(result).not.toBeNull();
    expect(result!.version).toBe("1.0.0");
  });
});

