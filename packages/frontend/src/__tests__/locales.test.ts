import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock expo-secure-store before importing the module ─────────────
const mockStore: Record<string, string> = {};

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async (key: string) => mockStore[key] ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    mockStore[key] = value;
  }),
}));

import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  loadSavedLocale,
  saveLocale,
  getLocaleOption,
} from "../config/locales";

describe("locales config", () => {
  beforeEach(() => {
    // Clear mock store between tests
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  });

  // ── SUPPORTED_LOCALES ────────────────────────────────────────

  it("exports at least 5 supported locales", () => {
    expect(SUPPORTED_LOCALES.length).toBeGreaterThanOrEqual(5);
  });

  it("each locale has required fields", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(loc.code).toBeTruthy();
      expect(loc.label).toBeTruthy();
      expect(loc.englishName).toBeTruthy();
      expect(loc.flag).toBeTruthy();
    }
  });

  it("locale codes are unique", () => {
    const codes = SUPPORTED_LOCALES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("includes English as a locale", () => {
    expect(SUPPORTED_LOCALES.some((l) => l.code === "en")).toBe(true);
  });

  it("default locale is 'en'", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  // ── getLocaleOption ──────────────────────────────────────────

  it("returns correct locale option for known code", () => {
    const fr = getLocaleOption("fr");
    expect(fr.code).toBe("fr");
    expect(fr.englishName).toBe("French");
  });

  it("falls back to first locale for unknown code", () => {
    const fallback = getLocaleOption("xx");
    expect(fallback.code).toBe(SUPPORTED_LOCALES[0].code);
  });

  // ── Persistence ──────────────────────────────────────────────

  it("loadSavedLocale returns default when store is empty", async () => {
    const result = await loadSavedLocale();
    expect(result).toBe(DEFAULT_LOCALE);
  });

  it("saveLocale + loadSavedLocale round-trips", async () => {
    await saveLocale("es");
    const result = await loadSavedLocale();
    expect(result).toBe("es");
  });

  it("loadSavedLocale ignores unsupported stored values", async () => {
    mockStore["user_locale"] = "klingon";
    const result = await loadSavedLocale();
    expect(result).toBe(DEFAULT_LOCALE);
  });

  it("loadSavedLocale accepts any supported locale", async () => {
    for (const loc of SUPPORTED_LOCALES) {
      await saveLocale(loc.code);
      const result = await loadSavedLocale();
      expect(result).toBe(loc.code);
    }
  });
});

