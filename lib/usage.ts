import { prisma } from "@/lib/prisma";

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const limits = {
  parts: {
    daily: 20,
    total: 200
  },
  combos: {
    daily: 20,
    total: 150
  },
  battles: {
    daily: 40,
    total: 500
  },
  uploads: {
    daily: 10,
    total: 120
  },
  catalogImport: {
    request: 12
  }
};

export async function enforcePartCreation(ownerId: string) {
  const total = await prisma.part.count({ where: { ownerId } });
  if (total >= limits.parts.total) {
    throw new Error("Part limit reached. Delete unused parts before adding more.");
  }

  const dailyCreated = await prisma.part.count({
    where: {
      ownerId,
      createdAt: { gte: startOfUtcDay() }
    }
  });
  if (dailyCreated >= limits.parts.daily) {
    throw new Error("Daily part creation limit reached. Try again tomorrow.");
  }
}

export async function enforceComboCreation(ownerId: string) {
  const total = await prisma.combo.count({ where: { ownerId } });
  if (total >= limits.combos.total) {
    throw new Error("Combo limit reached. Delete old combos before adding more.");
  }

  const dailyCreated = await prisma.combo.count({
    where: {
      ownerId,
      createdAt: { gte: startOfUtcDay() }
    }
  });
  if (dailyCreated >= limits.combos.daily) {
    throw new Error("Daily combo creation limit reached. Try again tomorrow.");
  }
}

export async function enforceBattleCreation(ownerId: string) {
  const total = await prisma.battle.count({ where: { ownerId } });
  if (total >= limits.battles.total) {
    throw new Error("Battle limit reached. Delete old battles before adding more.");
  }

  const dailyCreated = await prisma.battle.count({
    where: {
      ownerId,
      createdAt: { gte: startOfUtcDay() }
    }
  });
  if (dailyCreated >= limits.battles.daily) {
    throw new Error("Daily battle creation limit reached. Try again tomorrow.");
  }
}

export async function enforceUploadCreation(ownerId: string) {
  const partPhotos = await prisma.partPhoto.count({ where: { ownerId } });
  const comboPhotos = await prisma.comboPhoto.count({ where: { ownerId } });
  const total = partPhotos + comboPhotos;
  if (total >= limits.uploads.total) {
    throw new Error("Image upload limit reached. Delete older photos before adding more.");
  }

  const today = startOfUtcDay();
  const dailyPartPhotos = await prisma.partPhoto.count({
    where: {
      ownerId,
      createdAt: { gte: today }
    }
  });
  const dailyComboPhotos = await prisma.comboPhoto.count({
    where: {
      ownerId,
      createdAt: { gte: today }
    }
  });
  if (dailyPartPhotos + dailyComboPhotos >= limits.uploads.daily) {
    throw new Error("Daily image upload limit reached. Try again tomorrow.");
  }
}

export function enforceCatalogImportRequestSize(requestCount: number) {
  if (requestCount > limits.catalogImport.request) {
    throw new Error(`Catalog import is limited to ${limits.catalogImport.request} parts per request.`);
  }
}
