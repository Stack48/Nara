-- AlterTable
ALTER TABLE "WordSuggestion" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "language" TEXT;

-- CreateTable
CREATE TABLE "WordVote" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "WordVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WordVote_wordId_userId_key" ON "WordVote"("wordId", "userId");

-- AddForeignKey
ALTER TABLE "WordSuggestion" ADD CONSTRAINT "WordSuggestion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordVote" ADD CONSTRAINT "WordVote_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "WordSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordVote" ADD CONSTRAINT "WordVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

