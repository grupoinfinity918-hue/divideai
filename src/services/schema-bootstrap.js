const { PrismaClient } = require('@prisma/client');

/**
 * Railway-safe, non-destructive schema compatibility bootstrap.
 * IMPORTANT: each SQL statement is executed separately because Prisma's
 * prepared PostgreSQL statements reject multiple commands in one call.
 */
async function ensureSchemaCompatibility() {
  const prisma = new PrismaClient();
  const exec = (sql) => prisma.$executeRawUnsafe(sql);

  try {
    // Existing tables: add only missing columns.
    await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "storeName" TEXT`);
    await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "storeColor" TEXT`);
    await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "storeBannerUrl" TEXT`);
    await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 5.0`);

    await exec(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryLogin" TEXT`);
    await exec(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryPassword" TEXT`);
    await exec(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryCredentials" TEXT`);

    await exec(`ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "carouselIntervalMs" INTEGER NOT NULL DEFAULT 5000`);
    await exec(`ALTER TABLE "AdminSettings" ADD COLUMN IF NOT EXISTS "platformRules" TEXT`);

    // New enum types.
    await exec(`DO $$ BEGIN CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_CONFIRMED','ORDER_STATUS','REVIEW_RECEIVED','COMMENT','NEW_ORDER','SYSTEM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await exec(`DO $$ BEGIN CREATE TYPE "CommentStatus" AS ENUM ('VISIBLE','HIDDEN','DELETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

    // New tables. Each CREATE/INDEX is its own statement for Prisma prepared statements.
    await exec(`CREATE TABLE IF NOT EXISTS "OrderEvent" ("id" TEXT PRIMARY KEY, "orderId" TEXT NOT NULL, "actorId" TEXT, "fromStatus" "OrderStatus", "toStatus" "OrderStatus" NOT NULL, "note" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await exec(`CREATE INDEX IF NOT EXISTS "OrderEvent_orderId_createdAt_idx" ON "OrderEvent" ("orderId", "createdAt")`);

    await exec(`CREATE TABLE IF NOT EXISTS "Notification" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "type" "NotificationType" NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL, "link" TEXT, "readAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await exec(`CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_createdAt_idx" ON "Notification" ("userId", "readAt", "createdAt")`);

    await exec(`CREATE TABLE IF NOT EXISTS "Comment" ("id" TEXT PRIMARY KEY, "authorId" TEXT NOT NULL, "targetType" TEXT NOT NULL, "targetId" TEXT NOT NULL, "content" TEXT NOT NULL, "status" "CommentStatus" NOT NULL DEFAULT 'VISIBLE', "moderatedBy" TEXT, "moderatedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await exec(`CREATE INDEX IF NOT EXISTS "Comment_targetType_targetId_createdAt_idx" ON "Comment" ("targetType", "targetId", "createdAt")`);

    await exec(`CREATE TABLE IF NOT EXISTS "Coupon" ("id" TEXT PRIMARY KEY, "code" TEXT NOT NULL UNIQUE, "type" "CommissionMode" NOT NULL, "value" DECIMAL(12,2) NOT NULL, "minAmount" DECIMAL(12,2), "maxUses" INTEGER, "usedCount" INTEGER NOT NULL DEFAULT 0, "startsAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3), "listingId" TEXT, "userId" TEXT, "active" BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await exec(`CREATE INDEX IF NOT EXISTS "Coupon_code_active_idx" ON "Coupon" ("code", "active")`);

    await exec(`CREATE TABLE IF NOT EXISTS "Banner" ("id" TEXT PRIMARY KEY, "eyebrow" TEXT, "title" TEXT, "description" TEXT, "buttonText" TEXT, "desktopUrl" TEXT NOT NULL, "mobileUrl" TEXT, "href" TEXT, "theme" TEXT NOT NULL DEFAULT 'DEFAULT', "sortOrder" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`);

    // If Banner existed from an earlier version, bring it up to the current shape.
    await exec(`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "eyebrow" TEXT`);
    await exec(`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "title" TEXT`);
    await exec(`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "description" TEXT`);
    await exec(`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "buttonText" TEXT`);
    await exec(`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "desktopUrl" TEXT`);
    await exec(`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "mobileUrl" TEXT`);
    await exec(`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "href" TEXT`);
    await exec(`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'DEFAULT'`);
    await exec(`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0`);
    await exec(`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT TRUE`);
    await exec(`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    await exec(`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);

    // Foreign keys are isolated and idempotent.
    await exec(`DO $$ BEGIN ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await exec(`DO $$ BEGIN ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await exec(`DO $$ BEGIN ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await exec(`DO $$ BEGIN ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await exec(`DO $$ BEGIN ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await exec(`DO $$ BEGIN ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { ensureSchemaCompatibility };
