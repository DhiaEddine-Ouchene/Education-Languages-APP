-- Portable, game-agnostic content lists (WordSet).
-- A saved list of items that ANY game type can be filled from (via lib/fill-game),
-- so one set is reusable across every game instead of being tied to a single game's fields.

-- CreateTable
CREATE TABLE "WordSet" (
    "id" TEXT NOT NULL,
    "educatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'English',
    "nativeLanguage" TEXT NOT NULL DEFAULT 'English',
    "level" TEXT NOT NULL DEFAULT 'B1',
    "contentType" TEXT NOT NULL DEFAULT 'words',
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "items" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WordSet_educatorId_idx" ON "WordSet"("educatorId");

-- AddForeignKey
ALTER TABLE "WordSet" ADD CONSTRAINT "WordSet_educatorId_fkey" FOREIGN KEY ("educatorId") REFERENCES "EducatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
