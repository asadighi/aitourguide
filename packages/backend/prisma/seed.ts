import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // --- Users ---
  const admin = await prisma.user.upsert({
    where: { email: "admin@aitourguide.dev" },
    update: {},
    create: {
      email: "admin@aitourguide.dev",
      name: "Demo Admin",
      role: "admin",
      oauth_provider: "google",
      oauth_id: "admin-oauth-001",
      locale: "en",
    },
  });

  const endUser = await prisma.user.upsert({
    where: { email: "user@aitourguide.dev" },
    update: {},
    create: {
      email: "user@aitourguide.dev",
      name: "Demo User",
      role: "end_user",
      oauth_provider: "google",
      oauth_id: "user-oauth-001",
      locale: "en",
    },
  });

  const adProvider = await prisma.user.upsert({
    where: { email: "provider@aitourguide.dev" },
    update: {},
    create: {
      email: "provider@aitourguide.dev",
      name: "Demo Ad Provider",
      role: "ad_provider",
      oauth_provider: "google",
      oauth_id: "provider-oauth-001",
      locale: "en",
    },
  });

  console.log("  ✅ Users seeded:", { admin: admin.id, endUser: endUser.id, adProvider: adProvider.id });

  // --- Landmarks ---
  const eiffelTower = await prisma.landmark.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Eiffel Tower",
      city: "Paris",
      country: "France",
      lat: 48.8584,
      lng: 2.2945,
      category: "monument",
    },
  });

  const colosseum = await prisma.landmark.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Colosseum",
      city: "Rome",
      country: "Italy",
      lat: 41.8902,
      lng: 12.4922,
      category: "historical",
    },
  });

  const tajMahal = await prisma.landmark.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Taj Mahal",
      city: "Agra",
      country: "India",
      lat: 27.1751,
      lng: 78.0421,
      category: "monument",
    },
  });

  console.log("  ✅ Landmarks seeded:", {
    eiffelTower: eiffelTower.id,
    colosseum: colosseum.id,
    tajMahal: tajMahal.id,
  });

  // --- Guide Content ---
  const eiffelGuide = await prisma.guideContent.upsert({
    where: {
      landmark_id_locale_version: {
        landmark_id: eiffelTower.id,
        locale: "en",
        version: 1,
      },
    },
    update: {},
    create: {
      landmark_id: eiffelTower.id,
      locale: "en",
      version: 1,
      title: "The Eiffel Tower: Iron Lady of Paris",
      summary:
        "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. Named after engineer Gustave Eiffel, whose company designed and built the tower between 1887 and 1889.",
      facts: [
        {
          heading: "Construction",
          body: "Built between 1887 and 1889 as the entrance arch to the 1889 World's Fair. It took 2 years, 2 months, and 5 days to construct.",
        },
        {
          heading: "Height",
          body: "Standing at 330 meters (1,083 ft), it was the world's tallest man-made structure for 41 years until the Chrysler Building in New York surpassed it in 1930.",
        },
        {
          heading: "Annual Visitors",
          body: "The Eiffel Tower is the most-visited paid monument in the world, with nearly 7 million visitors per year.",
        },
      ],
      narration_script:
        "Welcome to the magnificent Eiffel Tower! Standing proudly at 330 meters tall, this iron lattice marvel was built between 1887 and 1889 for the World's Fair. Named after the brilliant engineer Gustave Eiffel, it was originally meant to be dismantled after 20 years — but the Parisians grew to love it so much, it stayed! Today, nearly 7 million visitors climb its steps each year, making it the most-visited paid monument on Earth. Fun fact: the tower actually shrinks by about 6 inches in winter due to thermal contraction!",
      fun_fact:
        "The tower was originally intended to be dismantled after 20 years, but it became so popular it was saved!",
      is_active: true,
    },
  });

  const colosseumGuide = await prisma.guideContent.upsert({
    where: {
      landmark_id_locale_version: {
        landmark_id: colosseum.id,
        locale: "en",
        version: 1,
      },
    },
    update: {},
    create: {
      landmark_id: colosseum.id,
      locale: "en",
      version: 1,
      title: "The Colosseum: Rome's Eternal Arena",
      summary:
        "The Colosseum is an oval amphitheatre in the centre of Rome, Italy. Built of travertine limestone, tuff, and brick-faced concrete, it was the largest amphitheatre ever built at the time.",
      facts: [
        {
          heading: "Construction",
          body: "Built between 70-80 AD under the emperors Vespasian and Titus of the Flavian dynasty.",
        },
        {
          heading: "Capacity",
          body: "Could hold an estimated 50,000 to 80,000 spectators for gladiatorial contests and public spectacles.",
        },
      ],
      narration_script:
        "Behold the mighty Colosseum! This magnificent arena, built nearly 2,000 years ago, once roared with the cheers of 80,000 spectators watching gladiatorial combat. Constructed under Emperor Vespasian between 70 and 80 AD, it remains the largest amphitheatre ever built!",
      fun_fact:
        "The Colosseum had a retractable awning called the 'velarium' to shade spectators from the sun!",
      is_active: true,
    },
  });

  console.log("  ✅ Guide content seeded:", {
    eiffelGuide: eiffelGuide.id,
    colosseumGuide: colosseumGuide.id,
  });

  // --- Ads ---
  const ad1 = await prisma.ad.create({
    data: {
      provider_id: adProvider.id,
      title: "Paris City Tour - 20% Off!",
      body: "Experience the best of Paris with our guided city tour. Visit the Eiffel Tower, Louvre, and more!",
      image_url: null,
      link_url: "https://example.com/paris-tour",
      status: "approved",
      admin_feedback: "Approved — relevant to Eiffel Tower visitors.",
      reviewed_by: admin.id,
      reviewed_at: new Date(),
      ad_landmarks: {
        create: [{ landmark_id: eiffelTower.id }],
      },
    },
  });

  const ad2 = await prisma.ad.create({
    data: {
      provider_id: adProvider.id,
      title: "Rome Gladiator Experience",
      body: "Walk in the footsteps of gladiators! Book your Colosseum VIP experience today.",
      image_url: null,
      link_url: "https://example.com/rome-gladiator",
      status: "pending",
      ad_landmarks: {
        create: [{ landmark_id: colosseum.id }],
      },
    },
  });

  console.log("  ✅ Ads seeded:", { ad1: ad1.id, ad2: ad2.id });

  // --- Reviews ---
  await prisma.review.upsert({
    where: {
      user_id_guide_content_id: {
        user_id: endUser.id,
        guide_content_id: eiffelGuide.id,
      },
    },
    update: {},
    create: {
      user_id: endUser.id,
      guide_content_id: eiffelGuide.id,
      rating: 5,
      text: "Amazing facts about the Eiffel Tower! The narration was very exciting.",
    },
  });

  console.log("  ✅ Reviews seeded");

  // --- Prompts ---
  await prisma.prompt.upsert({
    where: {
      prompt_id_version: {
        prompt_id: "landmark_identify",
        version: "1.0.0",
      },
    },
    update: {},
    create: {
      prompt_id: "landmark_identify",
      version: "1.0.0",
      content: "Placeholder — seeded from git file by seed:prompts script",
      schema_type: "landmark_identification.v1",
      is_active: true,
    },
  });

  await prisma.prompt.upsert({
    where: {
      prompt_id_version: {
        prompt_id: "guide_generate",
        version: "1.0.0",
      },
    },
    update: {},
    create: {
      prompt_id: "guide_generate",
      version: "1.0.0",
      content: "Placeholder — seeded from git file by seed:prompts script",
      schema_type: "guide_content.v1",
      is_active: true,
    },
  });

  console.log("  ✅ Prompts seeded");

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

