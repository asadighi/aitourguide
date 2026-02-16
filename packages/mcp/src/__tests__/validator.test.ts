import { describe, it, expect } from "vitest";
import { validateOutput } from "../validator.js";

describe("validateOutput", () => {
  it("validates correct landmark identification output", () => {
    const result = validateOutput("landmark_identification.v1", {
      schema: "landmark_identification.v1",
      landmarks: [
        {
          name: "Eiffel Tower",
          confidence: 0.95,
          location: {
            city: "Paris",
            country: "France",
            coordinates: { lat: 48.8584, lng: 2.2945 },
          },
          category: "monument",
          brief_description: "Iconic iron lattice tower",
        },
      ],
      needs_clarification: false,
      clarification_message: null,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects invalid landmark identification output", () => {
    const result = validateOutput("landmark_identification.v1", {
      schema: "landmark_identification.v1",
      landmarks: "not an array",
    });
    expect(result.ok).toBe(false);
    expect(result.error).not.toBeNull();
  });

  it("returns error for unknown schema", () => {
    const result = validateOutput("nonexistent.v1", { data: "test" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Unknown schema");
  });

  it("validates correct guide content output", () => {
    const result = validateOutput("guide_content.v1", {
      schema: "guide_content.v1",
      landmark_name: "Eiffel Tower",
      locale: "en",
      title: "The Eiffel Tower",
      summary: "An iconic tower in Paris.",
      facts: [{ heading: "History", body: "Built in 1889." }],
      narration_script: "Welcome to the Eiffel Tower!",
      fun_fact: "It was meant to be temporary!",
      confidence_note: null,
    });
    expect(result.ok).toBe(true);
  });

  it("validates error response schema", () => {
    const result = validateOutput("error.v1", {
      schema: "error.v1",
      error_type: "identification_failed",
      message: "Could not identify landmark",
      recoverable: true,
      suggested_action: "Try again",
    });
    expect(result.ok).toBe(true);
  });
});

