-- CreateTable
CREATE TABLE "InaccuracyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeKey" TEXT,
    "message" TEXT NOT NULL,
    "contactEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
