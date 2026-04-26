-- Prisma schema cannot represent PostgreSQL partial unique indexes directly.
-- Enforce only one active pending suggestion for each analysis/tag pair while
-- preserving accepted/rejected suggestion history.
CREATE UNIQUE INDEX "AnalysisTagSuggestion_pending_analysisId_tagId_key"
ON "AnalysisTagSuggestion"("analysisId", "tagId")
WHERE "status" = 'pending';
