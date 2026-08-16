-- CreateTable
CREATE TABLE "GovukSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceKey" TEXT NOT NULL,
    "govukPath" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "publicUpdatedAt" DATETIME,
    "contentHash" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "GovukSnapshot_sourceKey_fetchedAt_idx" ON "GovukSnapshot"("sourceKey", "fetchedAt");

-- CreateTable
CREATE TABLE "AnonymousBenchmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pathwayId" TEXT NOT NULL,
    "currentVisaId" TEXT NOT NULL,
    "nationalityGroup" TEXT NOT NULL,
    "applyFromInside" BOOLEAN NOT NULL,
    "yearsToIlrTenths" INTEGER,
    "typicalWaitWeeks" INTEGER,
    "reportedWaitWeeks" INTEGER,
    "asOfMonth" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "AnonymousBenchmark_pathwayId_currentVisaId_idx" ON "AnonymousBenchmark"("pathwayId", "currentVisaId");
