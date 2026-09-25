const { PrismaClient } = require('@prisma/client');

/**
 * Small, non-destructive compatibility bootstrap for Railway deployments.
 * It only adds columns that may be missing from an older production database.
 * Existing rows/data are never dropped or recreated.
 */
async function ensureSchemaCompatibility() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AdminSettings"
        ADD COLUMN IF NOT EXISTS "carouselIntervalMs" INTEGER NOT NULL DEFAULT 5000,
        ADD COLUMN IF NOT EXISTS "platformRules" TEXT
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Banner"
        ADD COLUMN IF NOT EXISTS "eyebrow" TEXT,
        ADD COLUMN IF NOT EXISTS "description" TEXT,
        ADD COLUMN IF NOT EXISTS "buttonText" TEXT
    `);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { ensureSchemaCompatibility };
