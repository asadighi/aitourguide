import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("[milestone-a] Database Schema", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("can query users", async () => {
    const users = await prisma.user.findMany();
    expect(users.length).toBeGreaterThan(0);

    const admin = users.find((u) => u.role === "admin");
    expect(admin).toBeDefined();
    expect(admin!.email).toBe("admin@aitourguide.dev");
  });

  it("can query landmarks", async () => {
    const landmarks = await prisma.landmark.findMany();
    expect(landmarks.length).toBeGreaterThanOrEqual(3);

    const eiffel = landmarks.find((l) => l.name === "Eiffel Tower");
    expect(eiffel).toBeDefined();
    expect(eiffel!.category).toBe("monument");
    expect(eiffel!.lat).toBeCloseTo(48.8584, 2);
  });

  it("can query guide content with landmark relation", async () => {
    const guide = await prisma.guideContent.findFirst({
      where: { is_active: true, locale: "en" },
      include: { landmark: true },
    });
    expect(guide).not.toBeNull();
    expect(guide!.landmark.name).toBeDefined();
    expect(guide!.title).toBeDefined();
    expect(guide!.facts).toBeDefined();
    expect(Array.isArray(guide!.facts)).toBe(true);
  });

  it("enforces unique constraint on guide content (landmark + locale + version)", async () => {
    // Attempt to create a duplicate guide content
    const existingGuide = await prisma.guideContent.findFirst({
      where: { is_active: true },
    });
    expect(existingGuide).not.toBeNull();

    await expect(
      prisma.guideContent.create({
        data: {
          landmark_id: existingGuide!.landmark_id,
          locale: existingGuide!.locale,
          version: existingGuide!.version,
          title: "Duplicate",
          summary: "Should fail",
          facts: [],
          narration_script: "Should fail",
        },
      })
    ).rejects.toThrow();
  });

  it("can query ads with landmark associations", async () => {
    const ads = await prisma.ad.findMany({
      include: {
        ad_landmarks: { include: { landmark: true } },
        provider: true,
      },
    });
    expect(ads.length).toBeGreaterThan(0);

    const approvedAd = ads.find((a) => a.status === "approved");
    expect(approvedAd).toBeDefined();
    expect(approvedAd!.ad_landmarks.length).toBeGreaterThan(0);
    expect(approvedAd!.provider.role).toBe("ad_provider");
  });

  it("can query reviews with user and guide content relations", async () => {
    const reviews = await prisma.review.findMany({
      include: { user: true, guide_content: true },
    });
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0].rating).toBeGreaterThanOrEqual(1);
    expect(reviews[0].rating).toBeLessThanOrEqual(5);
  });

  it("can query prompts by prompt_id", async () => {
    const prompt = await prisma.prompt.findFirst({
      where: { prompt_id: "landmark_identify", is_active: true },
    });
    expect(prompt).not.toBeNull();
    expect(prompt!.schema_type).toBe("landmark_identification.v1");
  });

  it("can create a new guide content version and deactivate the old one", async () => {
    const landmark = await prisma.landmark.findFirst();
    expect(landmark).not.toBeNull();

    // Get current active guide
    const activeGuide = await prisma.guideContent.findFirst({
      where: {
        landmark_id: landmark!.id,
        locale: "en",
        is_active: true,
      },
    });
    expect(activeGuide).not.toBeNull();

    // Create new version in a transaction
    const newVersion = await prisma.$transaction(async (tx) => {
      // Deactivate old version
      await tx.guideContent.update({
        where: { id: activeGuide!.id },
        data: { is_active: false },
      });

      // Create new version
      return tx.guideContent.create({
        data: {
          landmark_id: landmark!.id,
          locale: "en",
          version: activeGuide!.version + 1,
          title: "Updated Guide V2",
          summary: "Updated summary",
          facts: [{ heading: "New Fact", body: "New fact body" }],
          narration_script: "Updated narration",
          admin_prompt: "Make it more exciting",
          is_active: true,
        },
      });
    });

    expect(newVersion.version).toBe(activeGuide!.version + 1);
    expect(newVersion.is_active).toBe(true);

    // Verify old version is deactivated
    const oldGuide = await prisma.guideContent.findUnique({
      where: { id: activeGuide!.id },
    });
    expect(oldGuide!.is_active).toBe(false);

    // Clean up: restore original state
    await prisma.$transaction(async (tx) => {
      await tx.guideContent.delete({ where: { id: newVersion.id } });
      await tx.guideContent.update({
        where: { id: activeGuide!.id },
        data: { is_active: true },
      });
    });
  });
});

