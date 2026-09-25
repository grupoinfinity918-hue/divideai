const { PrismaClient } = require('@prisma/client');

/**
 * Railway-safe, non-destructive schema compatibility bootstrap.
 * It only creates/adds structures required by newer Divide Aí versions.
 * Existing rows and tables are preserved.
 */
async function ensureSchemaCompatibility() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
        ADD COLUMN IF NOT EXISTS "storeName" TEXT,
        ADD COLUMN IF NOT EXISTS "storeColor" TEXT,
        ADD COLUMN IF NOT EXISTS "storeBannerUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "customCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 5.0;

      ALTER TABLE "Order"
        ADD COLUMN IF NOT EXISTS "deliveryLogin" TEXT,
        ADD COLUMN IF NOT EXISTS "deliveryPassword" TEXT,
        ADD COLUMN IF NOT EXISTS "deliveryCredentials" TEXT;

      ALTER TABLE "AdminSettings"
        ADD COLUMN IF NOT EXISTS "carouselIntervalMs" INTEGER NOT NULL DEFAULT 5000,
        ADD COLUMN IF NOT EXISTS "platformRules" TEXT;
    `);

    // New enum types introduced by the marketplace moderation/notification features.
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_CONFIRMED','ORDER_STATUS','REVIEW_RECEIVED','COMMENT','NEW_ORDER','SYSTEM');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE "CommentStatus" AS ENUM ('VISIBLE','HIDDEN','DELETED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // New tables. Every CREATE is idempotent so an already migrated Railway DB is untouched.
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrderEvent" (
        "id" TEXT PRIMARY KEY,
        "orderId" TEXT NOT NULL,
        "actorId" TEXT,
        "fromStatus" "OrderStatus",
        "toStatus" "OrderStatus" NOT NULL,
        "note" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "OrderEvent_orderId_createdAt_idx" ON "OrderEvent" ("orderId", "createdAt");

      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" "NotificationType" NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "link" TEXT,
        "readAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_createdAt_idx" ON "Notification" ("userId", "readAt", "createdAt");

      CREATE TABLE IF NOT EXISTS "Comment" (
        "id" TEXT PRIMARY KEY,
        "authorId" TEXT NOT NULL,
        "targetType" TEXT NOT NULL,
        "targetId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "status" "CommentStatus" NOT NULL DEFAULT 'VISIBLE',
        "moderatedBy" TEXT,
        "moderatedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "Comment_targetType_targetId_createdAt_idx" ON "Comment" ("targetType", "targetId", "createdAt");

      CREATE TABLE IF NOT EXISTS "Coupon" (
        "id" TEXT PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "type" "CommissionMode" NOT NULL,
        "value" DECIMAL(12,2) NOT NULL,
        "minAmount" DECIMAL(12,2),
        "maxUses" INTEGER,
        "usedCount" INTEGER NOT NULL DEFAULT 0,
        "startsAt" TIMESTAMP(3),
        "expiresAt" TIMESTAMP(3),
        "listingId" TEXT,
        "userId" TEXT,
        "active" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "Coupon_code_active_idx" ON "Coupon" ("code", "active");

      CREATE TABLE IF NOT EXISTS "Banner" (
        "id" TEXT PRIMARY KEY,
        "eyebrow" TEXT,
        "title" TEXT,
        "description" TEXT,
        "buttonText" TEXT,
        "desktopUrl" TEXT NOT NULL,
        "mobileUrl" TEXT,
        "href" TEXT,
        "theme" TEXT NOT NULL DEFAULT 'DEFAULT',
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "active" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Banner"
        ADD COLUMN IF NOT EXISTS "eyebrow" TEXT,
        ADD COLUMN IF NOT EXISTS "title" TEXT,
        ADD COLUMN IF NOT EXISTS "description" TEXT,
        ADD COLUMN IF NOT EXISTS "buttonText" TEXT,
        ADD COLUMN IF NOT EXISTS "desktopUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "mobileUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "href" TEXT,
        ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'DEFAULT',
        ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

    // Foreign keys are added separately and guarded so reruns do not fail.
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { ensureSchemaCompatibility };
