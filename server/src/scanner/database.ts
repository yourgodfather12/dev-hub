// @ts-ignore - Generated client might not exist during initial development
import { PrismaClient } from '../generated/client/client';
import { ScanReport } from './types';
import { scanRepository, type EnhancedScannerOptions } from './index';

export interface ScanJobOptions extends EnhancedScannerOptions {
  projectId?: string;
  repoPath: string;
  saveToDatabase?: boolean;
}

export interface ScanJobResult {
  report: ScanReport;
  scanId?: string;
  saved: boolean;
}

/**
 * Database integration for repository scanning
 */
export class ScannerDatabase {
  constructor(private prisma: PrismaClient) {}

  /**
   * Run a complete scan and optionally save to database
   */
  async scanAndSave(options: ScanJobOptions): Promise<ScanJobResult> {
    const { projectId, repoPath, saveToDatabase = true, ...scanOptions } = options;
    
    // Run the scan
    const report = await scanRepository(repoPath, scanOptions);
    
    let scanId: string | undefined;
    let saved = false;
    
    // Save to database if requested
    if (saveToDatabase) {
      try {
        const scan = await this.saveScanReport(report, projectId);
        scanId = scan.id;
        saved = true;
      } catch (error) {
        console.error('Failed to save scan to database:', error);
        saved = false;
      }
    }
    
    const result: ScanJobResult = {
      report,
      saved
    };
    
    if (scanId) {
      result.scanId = scanId;
    }
    
    return result;
  }

  /**
   * Save scan report to database
   */
  async saveScanReport(report: ScanReport, projectId?: string) {
    const scan = await this.prisma.repoScan.create({
      data: {
        ...(projectId
          ? { project: { connect: { id: projectId } } }
          : {}),
        score: report.score,
        repoPath: report.repoPath,
        categoryScoresJson: JSON.stringify(report.categoryScores || {}),
        resultsJson: JSON.stringify(report.results),
        productionReady: report.productionReady ?? null,
        readinessReasonsJson: JSON.stringify(report.readinessReasons || []),
      },
    });

    return scan;
  }

  /**
   * Get scan by ID
   */
  async getScan(scanId: string) {
    return await this.prisma.repoScan.findUnique({
      where: { id: scanId },
      include: {
        project: true,
      },
    });
  }

  /**
   * Get all scans for a project
   */
  async getProjectScans(projectId: string, limit = 50) {
    return await this.prisma.repoScan.findMany({
      where: { projectId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        project: true,
      },
    });
  }

  /**
   * Get latest scan for a project
   */
  async getLatestProjectScan(projectId: string) {
    return await this.prisma.repoScan.findFirst({
      where: { projectId },
      orderBy: { timestamp: 'desc' },
      include: {
        project: true,
      },
    });
  }

  /**
   * Get scan report with parsed JSON data
   */
  async getScanReport(scanId: string): Promise<ScanReport | null> {
    const scan = await this.getScan(scanId);
    
    if (!scan) {
      return null;
    }

    try {
      const report: ScanReport = {
        score: scan.score,
        results: JSON.parse(scan.resultsJson),
        timestamp: scan.timestamp.toISOString(),
        repoPath: scan.repoPath,
        categoryScores: JSON.parse(scan.categoryScoresJson),
        productionReady: scan.productionReady || false,
        readinessReasons: JSON.parse(scan.readinessReasonsJson || '[]'),
      };

      return report;
    } catch (error) {
      console.error('Failed to parse scan report:', error);
      return null;
    }
  }

  /**
   * Delete a scan
   */
  async deleteScan(scanId: string): Promise<boolean> {
    try {
      await this.prisma.repoScan.delete({
        where: { id: scanId },
      });
      return true;
    } catch (error) {
      console.error('Failed to delete scan:', error);
      return false;
    }
  }

  /**
   * Get scan statistics for a project
   */
  async getProjectScanStats(projectId: string) {
    const scans = await this.prisma.repoScan.findMany({
      where: { projectId },
      select: {
        score: true,
        timestamp: true,
        productionReady: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to last 100 scans for performance
    });

    if (scans.length === 0) {
      return null;
    }

    const latestScan = scans[0];
    if (!latestScan) {
      return null;
    }

    const scores = scans.map((s: any) => s.score);
    const avgScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const productionReadyCount = scans.filter((s: any) => s.productionReady).length;

    return {
      totalScans: scans.length,
      latestScore: latestScan.score,
      latestProductionReady: latestScan.productionReady,
      averageScore: Math.round(avgScore),
      maxScore,
      minScore,
      productionReadyRate: productionReadyCount / scans.length,
      lastScanDate: latestScan.timestamp,
    };
  }

  /**
   * Get recent scans across all projects
   */
  async getRecentScans(limit = 20) {
    return await this.prisma.repoScan.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            repoUrl: true,
          },
        },
      },
    });
  }

  /**
   * Search scans by score range
   */
  async getScansByScoreRange(minScore: number, maxScore: number, limit = 50) {
    return await this.prisma.repoScan.findMany({
      where: {
        score: {
          gte: minScore,
          lte: maxScore,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        project: true,
      },
    });
  }

  /**
   * Get production ready scans
   */
  async getProductionReadyScans(limit = 50) {
    return await this.prisma.repoScan.findMany({
      where: {
        productionReady: true,
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        project: true,
      },
    });
  }

  /**
   * Get scans with failing security checks
   */
  async getScansWithSecurityIssues(limit = 50) {
    const scans = await this.prisma.repoScan.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit * 2, // Get more to filter
      include: {
        project: true,
      },
    });

    // Filter scans with security issues
    const scansWithSecurityIssues = scans.filter((scan: any) => {
      try {
        const results = JSON.parse(scan.resultsJson);
        return results.some((result: any) => 
          result.category === 'security' && !result.passed
        );
      } catch {
        return false;
      }
    });

    return scansWithSecurityIssues.slice(0, limit);
  }

  /**
   * Cleanup old scans (keep only N most recent per project)
   */
  async cleanupOldScans(keepCount = 10): Promise<number> {
    const projects = await this.prisma.project.findMany({
      select: { id: true },
    });

    let deletedCount = 0;

    for (const project of projects) {
      const scans = await this.prisma.repoScan.findMany({
        where: { projectId: project.id },
        orderBy: { timestamp: 'desc' },
        select: { id: true },
      });

      if (scans.length > keepCount) {
        const scansToDelete = scans.slice(keepCount);
        
        await this.prisma.repoScan.deleteMany({
          where: {
            id: {
              in: scansToDelete.map((s: any) => s.id),
            },
          },
        });

        deletedCount += scansToDelete.length;
      }
    }

    return deletedCount;
  }
}

/**
 * Create scanner database instance
 */
export function createScannerDatabase(prisma: PrismaClient): ScannerDatabase {
  return new ScannerDatabase(prisma);
}
