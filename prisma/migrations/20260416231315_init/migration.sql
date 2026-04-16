-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mineral" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scientificName" TEXT,
    "category" TEXT,
    "description" TEXT,
    "hardnessMin" DOUBLE PRECISION,
    "hardnessMax" DOUBLE PRECISION,
    "crystalSystem" TEXT,
    "colorNotes" TEXT,
    "lusterNotes" TEXT,
    "transparencyNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mineral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MineralAlias" (
    "id" TEXT NOT NULL,
    "mineralId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "aliasType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MineralAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT,
    "status" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisImage" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisInteraction" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisResult" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "primaryMineralId" TEXT,
    "confidence" DOUBLE PRECISION,
    "explanation" TEXT,
    "alternativesJson" JSONB,
    "sourceType" TEXT NOT NULL,
    "rawOutputJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisComment" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisFeedback" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Mineral_slug_key" ON "Mineral"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MineralAlias_mineralId_alias_key" ON "MineralAlias"("mineralId", "alias");

-- CreateIndex
CREATE INDEX "Analysis_userId_idx" ON "Analysis"("userId");

-- CreateIndex
CREATE INDEX "Analysis_visibility_publishedAt_idx" ON "Analysis"("visibility", "publishedAt");

-- CreateIndex
CREATE INDEX "AnalysisImage_analysisId_idx" ON "AnalysisImage"("analysisId");

-- CreateIndex
CREATE INDEX "AnalysisInteraction_analysisId_idx" ON "AnalysisInteraction"("analysisId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisResult_analysisId_key" ON "AnalysisResult"("analysisId");

-- CreateIndex
CREATE INDEX "AnalysisResult_primaryMineralId_idx" ON "AnalysisResult"("primaryMineralId");

-- CreateIndex
CREATE INDEX "AnalysisComment_analysisId_idx" ON "AnalysisComment"("analysisId");

-- CreateIndex
CREATE INDEX "AnalysisComment_userId_idx" ON "AnalysisComment"("userId");

-- CreateIndex
CREATE INDEX "AnalysisFeedback_userId_idx" ON "AnalysisFeedback"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisFeedback_analysisId_userId_key" ON "AnalysisFeedback"("analysisId", "userId");

-- AddForeignKey
ALTER TABLE "MineralAlias" ADD CONSTRAINT "MineralAlias_mineralId_fkey" FOREIGN KEY ("mineralId") REFERENCES "Mineral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisImage" ADD CONSTRAINT "AnalysisImage_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisInteraction" ADD CONSTRAINT "AnalysisInteraction_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisResult" ADD CONSTRAINT "AnalysisResult_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisResult" ADD CONSTRAINT "AnalysisResult_primaryMineralId_fkey" FOREIGN KEY ("primaryMineralId") REFERENCES "Mineral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisComment" ADD CONSTRAINT "AnalysisComment_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisComment" ADD CONSTRAINT "AnalysisComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisFeedback" ADD CONSTRAINT "AnalysisFeedback_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisFeedback" ADD CONSTRAINT "AnalysisFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
