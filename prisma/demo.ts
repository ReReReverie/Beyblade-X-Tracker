import { Manufacturer, PartType, Visibility } from "@prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "../lib/prisma";

const demoEmail = "demo@local.test";

const parts: Array<{
  name: string;
  type: PartType;
  manufacturer: Manufacturer;
  weightGrams: string;
  conditionRating: string;
  notes: string;
  imageUrl: string;
}> = [
  { name: "Dran Sword", type: "BLADE", manufacturer: "TAKARA_TOMY", weightGrams: "35.42", conditionRating: "8.8", notes: "Aggressive contact points, moderate wear.", imageUrl: "https://beylocker.com/cdn/shop/files/Dran_Sword.png?v=1731483440" },
  { name: "Hells Scythe", type: "BLADE", manufacturer: "TAKARA_TOMY", weightGrams: "34.91", conditionRating: "9.4", notes: "Smooth stamina-leaning test blade.", imageUrl: "https://beylocker.com/cdn/shop/files/HellsScytheFull.png?v=1775354695" },
  { name: "Wizard Arrow", type: "BLADE", manufacturer: "HASBRO", weightGrams: "32.77", conditionRating: "9.0", notes: "Light defensive test copy.", imageUrl: "https://beylocker.com/cdn/shop/files/WizardArrowYellow.png?v=1736490694" },
  { name: "Shark Edge", type: "BLADE", manufacturer: "TAKARA_TOMY", weightGrams: "34.18", conditionRating: "7.6", notes: "High recoil, visible contact wear.", imageUrl: "https://beylocker.com/cdn/shop/files/SharkEdgeFull.png?v=1775354840" },
  { name: "Phoenix Wing", type: "BLADE", manufacturer: "TAKARA_TOMY", weightGrams: "38.52", conditionRating: "8.2", notes: "Heavy meta reference blade.", imageUrl: "https://beylocker.com/cdn/shop/files/PhoenixWing_cdf2c47a-d33f-4ab8-935e-e0350530396f.png?v=1736991457" },
  { name: "Cobalt Drake Clone", type: "BLADE", manufacturer: "FAKE", weightGrams: "36.10", conditionRating: "6.5", notes: "Fake part included for source testing.", imageUrl: "https://beylocker.com/cdn/shop/files/PhoenixWing_cdf2c47a-d33f-4ab8-935e-e0350530396f.png?v=1736991457" },
  { name: "3-60", type: "RATCHET", manufacturer: "TAKARA_TOMY", weightGrams: "6.28", conditionRating: "8.0", notes: "Common low-height attack ratchet.", imageUrl: "https://beylocker.com/cdn/shop/files/CX-173-60.png?v=1778206388" },
  { name: "4-60", type: "RATCHET", manufacturer: "HASBRO", weightGrams: "6.12", conditionRating: "9.5", notes: "Fresh Hasbro copy.", imageUrl: "https://beylocker.com/cdn/shop/files/4-60UX-18.png?v=1767830366" },
  { name: "5-60", type: "RATCHET", manufacturer: "TAKARA_TOMY", weightGrams: "6.41", conditionRating: "7.8", notes: "Balanced but worn teeth.", imageUrl: "https://beylocker.com/cdn/shop/files/5-60UnicornSting.png?v=1736496857" },
  { name: "9-60", type: "RATCHET", manufacturer: "TAKARA_TOMY", weightGrams: "6.56", conditionRating: "8.9", notes: "Stable meta ratchet.", imageUrl: "https://beylocker.com/cdn/shop/files/9-60WhiteCobaltDragoon.png?v=1778574542" },
  { name: "3-80 Clone", type: "RATCHET", manufacturer: "FAKE", weightGrams: "6.33", conditionRating: "5.5", notes: "Fake ratchet with inconsistent fit.", imageUrl: "https://beylocker.com/cdn/shop/files/CX-173-60.png?v=1778206388" },
  { name: "Flat", type: "BIT", manufacturer: "TAKARA_TOMY", weightGrams: "2.24", conditionRating: "7.2", notes: "Worn attack bit.", imageUrl: "https://beylocker.com/cdn/shop/files/BlueFlatN.png?v=1736150528" },
  { name: "Point", type: "BIT", manufacturer: "HASBRO", weightGrams: "2.17", conditionRating: "9.6", notes: "Fresh balanced movement.", imageUrl: "https://beylocker.com/cdn/shop/files/PointLeonClaw.png?v=1739160406" },
  { name: "Ball", type: "BIT", manufacturer: "TAKARA_TOMY", weightGrams: "2.09", conditionRating: "8.7", notes: "Stamina test bit.", imageUrl: "https://beylocker.com/cdn/shop/files/BallYellowN.png?v=1736150496" },
  { name: "Rush", type: "BIT", manufacturer: "TAKARA_TOMY", weightGrams: "2.31", conditionRating: "8.1", notes: "Controlled attack pattern.", imageUrl: "https://beylocker.com/cdn/shop/files/RushBlueN.png?v=1736151149" },
  { name: "Needle Clone", type: "BIT", manufacturer: "FAKE", weightGrams: "2.02", conditionRating: "6.0", notes: "Fake bit with uneven tip.", imageUrl: "https://beylocker.com/cdn/shop/files/BallYellowN.png?v=1736150496" }
];

const comboSpecs = [
  { name: "Dran Sword 3-60 Flat", blade: "Dran Sword", ratchet: "3-60", bit: "Flat", notes: "Baseline attack test." },
  { name: "Hells Scythe 9-60 Ball", blade: "Hells Scythe", ratchet: "9-60", bit: "Ball", notes: "Stamina/control reference." },
  { name: "Wizard Arrow 4-60 Point", blade: "Wizard Arrow", ratchet: "4-60", bit: "Point", notes: "Off-meta Hasbro defense balance." },
  { name: "Shark Edge 5-60 Rush", blade: "Shark Edge", ratchet: "5-60", bit: "Rush", notes: "Recoil attack experiment." },
  { name: "Phoenix Wing 9-60 Point", blade: "Phoenix Wing", ratchet: "9-60", bit: "Point", notes: "Meta-heavy benchmark." },
  { name: "Clone Drake 3-80 Needle", blade: "Cobalt Drake Clone", ratchet: "3-80 Clone", bit: "Needle Clone", notes: "Fake-source stress test." }
];

async function main() {
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { username: "demo", name: "Demo Tester", passwordHash: await hash("123456789", 12) },
    create: {
      email: demoEmail,
      username: "demo",
      name: "Demo Tester",
      passwordHash: await hash("123456789", 12)
    }
  });

  await prisma.battle.deleteMany({ where: { ownerId: user.id } });
  await prisma.combo.deleteMany({ where: { ownerId: user.id } });
  await prisma.part.deleteMany({ where: { ownerId: user.id } });

  const createdParts = new Map<string, string>();
  for (const part of parts) {
    const { imageUrl, ...partData } = part;
    const created = await prisma.part.create({
      data: {
        ownerId: user.id,
        visibility: Visibility.PUBLIC,
        ...partData
      }
    });
    await prisma.partPhoto.create({
      data: {
        partId: created.id,
        ownerId: user.id,
        url: imageUrl,
        fileName: `${part.name}.webp`,
        mimeType: "image/webp",
        sizeBytes: 0,
        visibility: Visibility.PUBLIC
      }
    });
    createdParts.set(part.name, created.id);
  }

  const createdCombos = new Map<string, string>();
  for (const combo of comboSpecs) {
    const created = await prisma.combo.create({
      data: {
        ownerId: user.id,
        name: combo.name,
        notes: combo.notes,
        visibility: Visibility.PUBLIC,
        parts: {
          create: [
            { role: "BLADE", partId: createdParts.get(combo.blade)! },
            { role: "RATCHET", partId: createdParts.get(combo.ratchet)! },
            { role: "BIT", partId: createdParts.get(combo.bit)! }
          ]
        }
      }
    });
    createdCombos.set(combo.name, created.id);
  }

  const names = [...createdCombos.keys()];
  const daysAgo = 70;
  for (let i = 0; i < 72; i++) {
    const comboAName = names[i % names.length];
    const comboBName = names[(i * 2 + 1) % names.length] === comboAName ? names[(i + 1) % names.length] : names[(i * 2 + 1) % names.length];
    const comboAId = createdCombos.get(comboAName)!;
    const comboBId = createdCombos.get(comboBName)!;
    const metaBias = comboAName.includes("Phoenix") || comboBName.includes("Phoenix");
    const offMetaUpset = i % 11 === 0;
    const winnerName = offMetaUpset
      ? comboAName
      : metaBias
        ? comboAName.includes("Phoenix") ? comboAName : comboBName
        : i % 3 === 0 ? comboBName : comboAName;

    await prisma.battle.create({
      data: {
        ownerId: user.id,
        comboAId,
        comboBId,
        winnerId: createdCombos.get(winnerName)!,
        visibility: i % 13 === 0 ? Visibility.PRIVATE : Visibility.PUBLIC,
        playedAt: new Date(Date.now() - (daysAgo - i) * 24 * 60 * 60 * 1000),
        notes: i % 10 === 0 ? "Demo session note: launcher angle varied." : undefined
      }
    });
  }

  console.log("Demo dataset ready: login demo / 123456789");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
