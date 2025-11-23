-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "techStackJson" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "lastDeployedAt" DATETIME NOT NULL,
    "healthScore" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "commitHash" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    CONSTRAINT "Deployment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DependencyIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "currentVersion" TEXT NOT NULL,
    "latestVersion" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "cveId" TEXT,
    CONSTRAINT "DependencyIssue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppIdea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "featuresJson" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "revenueModel" TEXT NOT NULL,
    "marketingStrategy" TEXT NOT NULL,
    "techStackSuggestion" TEXT NOT NULL,
    "mermaidDiagram" TEXT NOT NULL,
    "tagsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "ApiRequestLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "requestBody" TEXT,
    "responseBody" TEXT,
    "statusCode" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
