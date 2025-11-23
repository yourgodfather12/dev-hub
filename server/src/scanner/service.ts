// @ts-ignore - Generated client might not exist during initial development
import { PrismaClient } from '../generated/client/client';
import { ScannerDatabase, ScanJobOptions, ScanJobResult } from './database';
import { EnhancedScannerOptions, ScanReport, analyzeRepo } from './index';

export interface ScanServiceOptions {
  enableAutoCleanup?: boolean;
  maxScansPerProject?: number;
  defaultScanOptions?: EnhancedScannerOptions;
}

export interface ProjectScanRequest {
  projectId: string;
  repoPath: string;
  options?: EnhancedScannerOptions;
}

export interface ScanHistory {
  scans: ScanJobResult[];
  stats: {
    totalScans: number;
    averageScore: number;
    productionReadyRate: number;
    lastScanDate: Date | null;
  };
}

/**
 * High-level scanner service with project management
 */
export class ScannerService {
  private database: ScannerDatabase;
  private options: ScanServiceOptions;

  constructor(
    prisma: PrismaClient,
    options: ScanServiceOptions = {}
  ) {
    this.database = new ScannerDatabase(prisma);
    this.options = {
      enableAutoCleanup: true,
      maxScansPerProject: 20,
      defaultScanOptions: {
        parallel: true,
        maxConcurrency: 8,
        enableCache: true,
      },
      ...options,
    };
  }

  /**
   * Scan a project repository
   */
  async scanProject(request: ProjectScanRequest): Promise<ScanJobResult> {
    const { projectId, repoPath, options = {} } = request;

    const scanOptions: ScanJobOptions = {
      projectId,
      repoPath,
      saveToDatabase: true,
      ...this.options.defaultScanOptions,
      ...options,
    };

    const result = await this.database.scanAndSave(scanOptions);

    // Auto cleanup if enabled
    if (this.options.enableAutoCleanup) {
      await this.cleanupProject(projectId);
    }

    return result;
  }

  /**
   * Scan repository without saving to database
   */
  async scanRepository(repoPath: string, options?: EnhancedScannerOptions): Promise<ScanReport> {
    const scanOptions = {
      ...this.options.defaultScanOptions,
      ...options,
    };

    const result = await this.database.scanAndSave({
      repoPath,
      saveToDatabase: false,
      ...scanOptions,
    });
    return result.report;
  }

  /**
   * Get scan history for a project
   */
  async getProjectScanHistory(projectId: string): Promise<ScanHistory> {
    const scans = await this.database.getProjectScans(projectId, 100);
    const stats = await this.database.getProjectScanStats(projectId);

    const scanResults: ScanJobResult[] = [];
    
    for (const scan of scans) {
      try {
        const report = await this.database.getScanReport(scan.id);
        if (report) {
          scanResults.push({
            report,
            scanId: scan.id,
            saved: true,
          });
        }
      } catch (error) {
        console.error(`Failed to load scan ${scan.id}:`, error);
      }
    }

    return {
      scans: scanResults,
      stats: stats || {
        totalScans: 0,
        averageScore: 0,
        productionReadyRate: 0,
        lastScanDate: null,
      },
    };
  }

  /**
   * Get latest scan for a project
   */
  async getLatestProjectScan(projectId: string): Promise<ScanJobResult | null> {
    const scan = await this.database.getLatestProjectScan(projectId);
    
    if (!scan) {
      return null;
    }

    try {
      const report = await this.database.getScanReport(scan.id);
      if (!report) {
        return null;
      }

      return {
        report,
        scanId: scan.id,
        saved: true,
      };
    } catch (error) {
      console.error(`Failed to load latest scan for project ${projectId}:`, error);
      return null;
    }
  }

  /**
   * Get scan by ID
   */
  async getScan(scanId: string): Promise<ScanJobResult | null> {
    const report = await this.database.getScanReport(scanId);
    
    if (!report) {
      return null;
    }

    return {
      report,
      scanId,
      saved: true,
    };
  }

  /**
   * Delete a scan
   */
  async deleteScan(scanId: string): Promise<boolean> {
    return await this.database.deleteScan(scanId);
  }

  /**
   * Get recent scans across all projects
   */
  async getRecentScans(limit = 20): Promise<ScanJobResult[]> {
    const scans = await this.database.getRecentScans(limit);
    const results: ScanJobResult[] = [];

    for (const scan of scans) {
      try {
        const report = await this.database.getScanReport(scan.id);
        if (report) {
          results.push({
            report,
            scanId: scan.id,
            saved: true,
          });
        }
      } catch (error) {
        console.error(`Failed to load scan ${scan.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Get production ready projects
   */
  async getProductionReadyProjects(): Promise<ScanJobResult[]> {
    const scans = await this.database.getProductionReadyScans(50);
    const results: ScanJobResult[] = [];

    for (const scan of scans) {
      try {
        const report = await this.database.getScanReport(scan.id);
        if (report) {
          results.push({
            report,
            scanId: scan.id,
            saved: true,
          });
        }
      } catch (error) {
        console.error(`Failed to load scan ${scan.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Get projects with security issues
   */
  async getProjectsWithSecurityIssues(): Promise<ScanJobResult[]> {
    const scans = await this.database.getScansWithSecurityIssues(50);
    const results: ScanJobResult[] = [];

    for (const scan of scans) {
      try {
        const report = await this.database.getScanReport(scan.id);
        if (report) {
          results.push({
            report,
            scanId: scan.id,
            saved: true,
          });
        }
      } catch (error) {
        console.error(`Failed to load scan ${scan.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Get scan statistics dashboard data
   */
  async getDashboardStats() {
    const recentScans = await this.database.getRecentScans(100);
    
    if (recentScans.length === 0) {
      return {
        totalScans: 0,
        averageScore: 0,
        productionReadyCount: 0,
        securityIssuesCount: 0,
        recentActivity: [],
      };
    }

    const scores = recentScans.map((s: any) => s.score);
    const averageScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
    const productionReadyCount = recentScans.filter((s: any) => s.productionReady).length;

    // Get security issues count
    const securityIssuesScans = await this.database.getScansWithSecurityIssues(100);
    const securityIssuesCount = securityIssuesScans.length;

    // Recent activity (last 10 scans)
    const recentActivity = recentScans.slice(0, 10).map((scan: any) => ({
      scanId: scan.id,
      projectName: scan.project?.name || 'Unknown',
      score: scan.score,
      timestamp: scan.timestamp,
      productionReady: scan.productionReady,
    }));

    return {
      totalScans: recentScans.length,
      averageScore: Math.round(averageScore),
      productionReadyCount,
      securityIssuesCount,
      recentActivity,
    };
  }

  /**
   * Cleanup old scans for a specific project
   */
  async cleanupProject(projectId: string): Promise<number> {
    if (!this.options.enableAutoCleanup) {
      return 0;
    }

    const scans = await this.database.getProjectScans(projectId, 100);
    const keepCount = this.options.maxScansPerProject || 20;

    if (scans.length <= keepCount) {
      return 0;
    }

    const scansToDelete = scans.slice(keepCount);
    let deletedCount = 0;

    for (const scan of scansToDelete) {
      const deleted = await this.database.deleteScan((scan as any).id);
      if (deleted) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Cleanup old scans across all projects
   */
  async cleanupAllProjects(): Promise<number> {
    if (!this.options.enableAutoCleanup) {
      return 0;
    }

    return await this.database.cleanupOldScans(this.options.maxScansPerProject || 20);
  }

  /**
   * Analyze repository without running full scan
   */
  async analyzeRepository(repoPath: string) {
    return await analyzeRepo(repoPath);
  }

  /**
   * Compare two scans
   */
  async compareScans(scanId1: string, scanId2: string) {
    const [scan1, scan2] = await Promise.all([
      this.database.getScanReport(scanId1),
      this.database.getScanReport(scanId2),
    ]);

    if (!scan1 || !scan2) {
      throw new Error('One or both scans not found');
    }

    const scoreDiff = scan2.score - scan1.score;
    const categoryDiffs: Record<string, number> = {};

    if (scan1.categoryScores && scan2.categoryScores) {
      Object.keys(scan2.categoryScores).forEach((category: string) => {
        const score1 = scan1.categoryScores?.[category as keyof typeof scan1.categoryScores] || 0;
        const score2 = scan2.categoryScores?.[category as keyof typeof scan2.categoryScores] || 0;
        categoryDiffs[category] = score2 - score1;
      });
    }

    const newIssues = scan2.results.filter(r2 => 
      !r2.passed && !scan1.results.some(r1 => r1.checkId === r2.checkId && !r1.passed)
    );

    const resolvedIssues = scan1.results.filter(r1 => 
      !r1.passed && !scan2.results.some(r2 => r2.checkId === r1.checkId && !r2.passed)
    );

    return {
      scan1: {
        id: scanId1,
        score: scan1.score,
        timestamp: scan1.timestamp,
        productionReady: scan1.productionReady,
      },
      scan2: {
        id: scanId2,
        score: scan2.score,
        timestamp: scan2.timestamp,
        productionReady: scan2.productionReady,
      },
      scoreDifference: scoreDiff,
      categoryDifferences: categoryDiffs,
      newIssues,
      resolvedIssues,
      improvement: scoreDiff > 0,
    };
  }
}

/**
 * Create scanner service instance
 */
export function createScannerService(
  prisma: PrismaClient,
  options?: ScanServiceOptions
): ScannerService {
  return new ScannerService(prisma, options);
}
