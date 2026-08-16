-- AlterTable
ALTER TABLE "User" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'basic';

-- CreateTable
CREATE TABLE "BillingEnquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "seatLimit" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organisation_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SponsoredWorker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "visaType" TEXT NOT NULL,
    "visaExpiresOn" DATETIME NOT NULL,
    "jobTitle" TEXT,
    "rtwCheckedOn" DATETIME,
    "hasCos" BOOLEAN NOT NULL DEFAULT 0,
    "hasBrpCopy" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SponsoredWorker_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BillingEnquiry_kind_idx" ON "BillingEnquiry"("kind");

-- CreateIndex
CREATE INDEX "BillingEnquiry_email_idx" ON "BillingEnquiry"("email");

-- CreateIndex
CREATE INDEX "Organisation_ownerUserId_idx" ON "Organisation"("ownerUserId");

-- CreateIndex
CREATE INDEX "SponsoredWorker_organisationId_idx" ON "SponsoredWorker"("organisationId");

-- CreateIndex
CREATE INDEX "SponsoredWorker_visaExpiresOn_idx" ON "SponsoredWorker"("visaExpiresOn");
