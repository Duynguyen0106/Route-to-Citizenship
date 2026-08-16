-- AlterTable
ALTER TABLE "ShareLink" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE INDEX "ShareLink_userId_idx" ON "ShareLink"("userId");
