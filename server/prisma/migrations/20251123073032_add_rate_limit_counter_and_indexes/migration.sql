-- CreateTable
CREATE TABLE "RateLimitCounter" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL,
    "resetAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "RepoScan_repoPath_timestamp_idx" ON "RepoScan"("repoPath", "timestamp");
