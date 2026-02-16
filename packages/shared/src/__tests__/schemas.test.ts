import { describe, it, expect } from "vitest";
import {
  HealthResponseSchema,
  LandmarkIdentificationSchema,
  GuideContentSchema,
  ErrorResponseSchema,
  ClarificationRequiredSchema,
  ContentSafetyCheckSchema,
  SocialShareContentSchema,
} from "../index.js";

describe("HealthResponseSchema", () => {
  it("validates correct health response", () => {
    const result = HealthResponseSchema.safeParse({ status: "ok" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid health response", () => {
    const result = HealthResponseSchema.safeParse({ status: "error" });
    expect(result.success).toBe(false);
  });
});

describe("LandmarkIdentificationSchema", () => {
  it("validates a correct landmark identification response", () => {
    const result = LandmarkIdentificationSchema.safeParse({
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
          brief_description: "Iconic iron lattice tower in Paris",
        },
      ],
      needs_clarification: false,
      clarification_message: null,
    });
    expect(result.success).toBe(true);
  });

  it("validates a low-confidence response with clarification", () => {
    const result = LandmarkIdentificationSchema.safeParse({
      schema: "landmark_identification.v1",
      landmarks: [
        {
          name: "Tower Bridge",
          confidence: 0.45,
          location: { city: "London", country: "UK" },
          category: "building",
          brief_description: "Historic drawbridge over the Thames",
        },
        {
          name: "London Bridge",
          confidence: 0.35,
          location: { city: "London", country: "UK" },
          category: "building",
          brief_description: "Bridge crossing the Thames",
        },
      ],
      needs_clarification: true,
      clarification_message: "I found two possible matches. Which landmark did you photograph?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid confidence value", () => {
    const result = LandmarkIdentificationSchema.safeParse({
      schema: "landmark_identification.v1",
      landmarks: [
        {
          name: "Test",
          confidence: 1.5,
          location: { city: null, country: null },
          category: "other",
          brief_description: "test",
        },
      ],
      needs_clarification: false,
      clarification_message: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("GuideContentSchema", () => {
  it("validates correct guide content", () => {
    const result = GuideContentSchema.safeParse({
      schema: "guide_content.v1",
      landmark_name: "Eiffel Tower",
      locale: "en",
      title: "The Eiffel Tower: Iron Lady of Paris",
      summary:
        "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris.",
      facts: [
        {
          heading: "Construction",
          body: "Built between 1887 and 1889 for the 1889 World's Fair.",
        },
        {
          heading: "Height",
          body: "Standing at 330 meters, it was the world's tallest structure for 41 years.",
        },
      ],
      narration_script:
        "Welcome to the magnificent Eiffel Tower! Standing proudly at 330 meters tall...",
      fun_fact:
        "The tower was originally intended to be dismantled after 20 years!",
      confidence_note: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("ErrorResponseSchema", () => {
  it("validates correct error response", () => {
    const result = ErrorResponseSchema.safeParse({
      schema: "error.v1",
      error_type: "identification_failed",
      message: "Could not identify any landmarks in the image",
      recoverable: true,
      suggested_action: "Try taking a clearer photo or moving closer to the landmark",
    });
    expect(result.success).toBe(true);
  });
});

describe("ClarificationRequiredSchema", () => {
  it("validates correct clarification response", () => {
    const result = ClarificationRequiredSchema.safeParse({
      schema: "clarification_required.v1",
      reason: "Multiple landmarks detected with similar confidence",
      options: [
        { label: "Eiffel Tower", description: "Iron tower in Paris" },
        { label: "Tokyo Tower", description: "Communications tower in Tokyo" },
      ],
      original_input_summary: "Image of a tall metal tower",
    });
    expect(result.success).toBe(true);
  });
});

describe("ContentSafetyCheckSchema", () => {
  it("validates safe content check", () => {
    const result = ContentSafetyCheckSchema.safeParse({
      schema: "content_safety_check.v1",
      is_safe: true,
      violations: [],
      recommendation: "approve",
    });
    expect(result.success).toBe(true);
  });
});

describe("SocialShareContentSchema", () => {
  it("validates correct social share content", () => {
    const result = SocialShareContentSchema.safeParse({
      schema: "social_share_content.v1",
      landmark_name: "Eiffel Tower",
      share_text: "Just discovered the amazing Eiffel Tower with AI Tour Guide!",
      hashtags: ["EiffelTower", "Paris", "AITourGuide"],
      locale: "en",
    });
    expect(result.success).toBe(true);
  });
});

