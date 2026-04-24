-- CreateTable
CREATE TABLE "AnalysisTagSuggestion" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "suggestedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisTagSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisTagSuggestion_analysisId_status_idx" ON "AnalysisTagSuggestion"("analysisId", "status");

-- CreateIndex
CREATE INDEX "AnalysisTagSuggestion_tagId_idx" ON "AnalysisTagSuggestion"("tagId");

-- CreateIndex
CREATE INDEX "AnalysisTagSuggestion_suggestedByUserId_idx" ON "AnalysisTagSuggestion"("suggestedByUserId");

-- CreateIndex
CREATE INDEX "AnalysisTagSuggestion_reviewedByUserId_idx" ON "AnalysisTagSuggestion"("reviewedByUserId");

-- AddForeignKey
ALTER TABLE "AnalysisTagSuggestion" ADD CONSTRAINT "AnalysisTagSuggestion_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisTagSuggestion" ADD CONSTRAINT "AnalysisTagSuggestion_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisTagSuggestion" ADD CONSTRAINT "AnalysisTagSuggestion_suggestedByUserId_fkey" FOREIGN KEY ("suggestedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisTagSuggestion" ADD CONSTRAINT "AnalysisTagSuggestion_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
