/*
  Warnings:

  - The values [LEAD_PAROLIER,PAROLIER,LECTURE_SEULE] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'LEAD_LYRICIST', 'LYRICIST', 'READONLY');
ALTER TABLE "public"."Invitation" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "ProjectMember" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "Invitation" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "Invitation" ALTER COLUMN "role" SET DEFAULT 'LYRICIST';
ALTER TABLE "ProjectMember" ALTER COLUMN "role" SET DEFAULT 'LYRICIST';
COMMIT;

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "role" SET DEFAULT 'LYRICIST';

-- AlterTable
ALTER TABLE "ProjectMember" ALTER COLUMN "role" SET DEFAULT 'LYRICIST';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "cognitoId" SET DEFAULT '';
