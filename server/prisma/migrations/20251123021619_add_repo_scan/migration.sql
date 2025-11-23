-- CreateTable
CREATE TABLE "RepoScan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "score" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repoPath" TEXT NOT NULL,
    "categoryScoresJson" TEXT NOT NULL,
    "resultsJson" TEXT NOT NULL,
    "productionReady" BOOLEAN,
    "readinessReasonsJson" TEXT,
    CONSTRAINT "RepoScan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RepoScan_projectId_timestamp_idx" ON "RepoScan"("projectId", "timestamp");
