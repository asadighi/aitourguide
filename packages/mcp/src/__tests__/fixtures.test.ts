import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { validateOutput } from "../validator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.resolve(__dirname, "../../../..", "manual-fixtures");

function loadFixture(name: string): unknown {
  const filePath = path.join(fixturesDir, name);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

describe("[fixtures] landmark_identify", () => {
  it("simple expected output validates against schema", () => {
    const expected = loadFixture("landmark_identify_simple_expected.json");
    const result = validateOutput("landmark_identification.v1", expected);
    expect(result.ok).toBe(true);
  });

  it("uncertain expected output validates against schema", () => {
    const expected = loadFixture("landmark_identify_uncertain_expected.json");
    const result = validateOutput("landmark_identification.v1", expected);
    expect(result.ok).toBe(true);
  });

  it("uncertain result has needs_clarification set to true", () => {
    const expected = loadFixture("landmark_identify_uncertain_expected.json") as {
      needs_clarification: boolean;
      landmarks: Array<{ confidence: number }>;
    };
    expect(expected.needs_clarification).toBe(true);
    expect(expected.landmarks.length).toBe(2);
    expect(expected.landmarks[0].confidence).toBeLessThan(0.7);
  });
});

describe("[fixtures] guide_generate", () => {
  it("english expected output validates against schema", () => {
    const expected = loadFixture("guide_generate_english_expected.json");
    const result = validateOutput("guide_content.v1", expected);
    expect(result.ok).toBe(true);
  });

  it("english expected output has required fields", () => {
    const expected = loadFixture("guide_generate_english_expected.json") as {
      facts: Array<{ heading: string; body: string }>;
      narration_script: string;
      locale: string;
    };
    expect(expected.facts.length).toBeGreaterThanOrEqual(3);
    expect(expected.narration_script.length).toBeGreaterThan(50);
    expect(expected.locale).toBe("en");
  });
});

