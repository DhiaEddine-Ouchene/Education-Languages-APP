-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GameType" ADD VALUE 'CROSSWORD';
ALTER TYPE "GameType" ADD VALUE 'COLLOCATION_BUILDER';
ALTER TYPE "GameType" ADD VALUE 'FLASHCARD_3D';
ALTER TYPE "GameType" ADD VALUE 'MINIMAL_PAIR';
ALTER TYPE "GameType" ADD VALUE 'PICTURE_TO_WORD';

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_vocabularySetId_fkey";

-- CreateTable
CREATE TABLE "FlashcardData" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "FlashcardData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardPair" (
    "id" TEXT NOT NULL,
    "flashcardDataId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "exampleSentence" TEXT,
    "audioUrl" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FlashcardPair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizData" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "QuizData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "quizDataId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrosswordData" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gridSize" INTEGER NOT NULL DEFAULT 8,
    "words" JSONB NOT NULL,

    CONSTRAINT "CrosswordData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerbConjugationData" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "verb" TEXT NOT NULL,
    "tense" TEXT NOT NULL,
    "forms" JSONB NOT NULL,

    CONSTRAINT "VerbConjugationData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryData" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "wordBank" JSONB,
    "template" TEXT,

    CONSTRAINT "StoryData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlashcardData_gameId_key" ON "FlashcardData"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizData_gameId_key" ON "QuizData"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "CrosswordData_gameId_key" ON "CrosswordData"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "VerbConjugationData_gameId_key" ON "VerbConjugationData"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryData_gameId_key" ON "StoryData"("gameId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_vocabularySetId_fkey" FOREIGN KEY ("vocabularySetId") REFERENCES "VocabularySet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardData" ADD CONSTRAINT "FlashcardData_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardPair" ADD CONSTRAINT "FlashcardPair_flashcardDataId_fkey" FOREIGN KEY ("flashcardDataId") REFERENCES "FlashcardData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizData" ADD CONSTRAINT "QuizData_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizDataId_fkey" FOREIGN KEY ("quizDataId") REFERENCES "QuizData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrosswordData" ADD CONSTRAINT "CrosswordData_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerbConjugationData" ADD CONSTRAINT "VerbConjugationData_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryData" ADD CONSTRAINT "StoryData_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
