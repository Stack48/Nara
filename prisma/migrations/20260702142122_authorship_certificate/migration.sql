-- CreateTable
CREATE TABLE "AuthorshipCertificate" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contentHashHex" TEXT NOT NULL,
    "canonicalSnapshot" JSONB NOT NULL,
    "projectRef" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tsaName" TEXT NOT NULL,
    "qualified" BOOLEAN NOT NULL DEFAULT false,
    "tsrB64" TEXT NOT NULL DEFAULT '',
    "sealedAt" TIMESTAMP(3) NOT NULL,
    "confidentialityNotice" TEXT NOT NULL,
    "lyricsId" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorshipCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthorshipCertificate_authorId_idx" ON "AuthorshipCertificate"("authorId");

-- CreateIndex
CREATE INDEX "AuthorshipCertificate_lyricsId_idx" ON "AuthorshipCertificate"("lyricsId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorshipCertificate_authorId_projectRef_version_key" ON "AuthorshipCertificate"("authorId", "projectRef", "version");

-- AddForeignKey
ALTER TABLE "AuthorshipCertificate" ADD CONSTRAINT "AuthorshipCertificate_lyricsId_fkey" FOREIGN KEY ("lyricsId") REFERENCES "Lyrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorshipCertificate" ADD CONSTRAINT "AuthorshipCertificate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
