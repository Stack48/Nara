/*
  Warnings:

  - You are about to drop the `AnalysisJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AnalysisJob" DROP CONSTRAINT "AnalysisJob_lyricsId_fkey";

-- DropForeignKey
ALTER TABLE "AnalysisJob" DROP CONSTRAINT "AnalysisJob_requestedBy_fkey";

-- DropTable
DROP TABLE "AnalysisJob";

-- DropEnum
DROP TYPE "AnalysisStatus";
