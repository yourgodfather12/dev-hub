// Main scanner exports
import { analyzeRepo } from './detector';
import { runAllChecks, ScanOptions, clearCache, getCacheStats } from './runner';
import { getApplicableChecks } from './registry';
import { 
  calculateScore, 
  calculateCategoryScores, 
  evaluateProductionReadiness 
} from './scoring';
import { 
  fileExists, 
  readJsonIfExists, 
  readTextIfExists, 
  walkFiles,
  getFileHash,
  clearCache as clearUtilsCache,
  getCacheStats as getUtilsCacheStats
} from './utils';
import { 
  DEFAULT_CONFIG, 
  ScannerConfig, 
  loadConfig, 
  validateConfig, 
  saveConfig 
} from './config';
import { 
  ScannerDatabase, 
  createScannerDatabase,
  ScanJobOptions,
  ScanJobResult 
} from './database';
import { 
  ScannerService,
  createScannerService,
  ScanServiceOptions,
  ProjectScanRequest,
  ScanHistory
} from './service';
import type {
  PackageCategory,
  RiskLevel,
  DetectedPackage,
  PackageJsonLike,
  RepoContext,
  CategoryId,
  Severity,
  CheckResult,
  CheckExecutionResult,
  Check,
  QuickWin,
  ScanReport
} from './types';
import { NICHE_PACKAGES, CATEGORY_WEIGHTS, SEVERITY_IMPACT } from './constants';

// Re-export for external use
export { analyzeRepo };
export type { ScanOptions };
export { runAllChecks, clearCache, getCacheStats };
export { getApplicableChecks };
export { 
  calculateScore, 
  calculateCategoryScores, 
  evaluateProductionReadiness 
};
export { 
  fileExists, 
  readJsonIfExists, 
  readTextIfExists, 
  walkFiles,
  getFileHash,
  clearCache as clearUtilsCache,
  getCacheStats as getUtilsCacheStats
};
export { DEFAULT_CONFIG };
export type { ScannerConfig };
export { 
  loadConfig, 
  validateConfig, 
  saveConfig 
};

// Type exports
export type {
  PackageCategory,
  RiskLevel,
  DetectedPackage,
  PackageJsonLike,
  RepoContext,
  CategoryId,
  Severity,
  CheckResult,
  CheckExecutionResult,
  Check,
  QuickWin,
  ScanReport
};

// Constants
export { NICHE_PACKAGES, CATEGORY_WEIGHTS, SEVERITY_IMPACT };

// Database and service exports
export { 
  ScannerDatabase, 
  createScannerDatabase,
  ScannerService,
  createScannerService
};
export type { 
  ScanJobOptions,
  ScanJobResult
} from './database';
export type {
  ScanServiceOptions,
  ProjectScanRequest,
  ScanHistory
} from './service';

// Enhanced scanner interface
export interface EnhancedScannerOptions extends ScanOptions {
  configPath?: string;
  outputPath?: string;
  format?: 'json' | 'text' | 'html';
}

/**
 * Enhanced scanner with configuration support and multiple output formats
 */
export async function scanRepository(
  repoPath: string,
  options: EnhancedScannerOptions = {}
): Promise<ScanReport> {
  const { configPath, outputPath, format, ...scanOptions } = options;
  
  // Load configuration if provided
  const config = configPath ? loadConfig(configPath) : undefined;
  
  // Merge config with scan options
  const finalOptions: ScanOptions = {
    parallel: config?.parallel ?? true,
    maxConcurrency: config?.maxConcurrency ?? 10,
    enableCache: config?.enableCache ?? true,
    ...(config?.enabledCategories && config.enabledCategories.length > 0
      ? { categories: config.enabledCategories }
      : {}),
    ...(config?.disabledChecks && config.disabledChecks.length > 0
      ? { excludeChecks: config.disabledChecks }
      : {}),
    ...scanOptions
  };
  
  // Analyze repository
  const context = await analyzeRepo(repoPath);
  
  // Run checks with enhanced options
  const report = await runAllChecks(context, finalOptions);
  
  // Save report if output path specified
  if (outputPath) {
    await saveReport(report, outputPath, format || 'json');
  }
  
  return report;
}

/**
 * Save scan report to file in specified format
 */
export async function saveReport(
  report: ScanReport,
  outputPath: string,
  format: 'json' | 'text' | 'html' = 'json'
): Promise<void> {
  const fs = require('fs').promises;
  const path = require('path');
  
  let content: string;
  let extension: string;
  
  switch (format) {
    case 'json':
      content = JSON.stringify(report, null, 2);
      extension = '.json';
      break;
      
    case 'text':
      content = generateTextReport(report);
      extension = '.txt';
      break;
      
    case 'html':
      content = generateHtmlReport(report);
      extension = '.html';
      break;
      
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  
  const fullPath = outputPath.endsWith(extension) 
    ? outputPath 
    : outputPath + extension;
    
  await fs.writeFile(fullPath, content, 'utf8');
  console.log(`Report saved to: ${fullPath}`);
}

/**
 * Generate human-readable text report
 */
function generateTextReport(report: ScanReport): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push('REPOSITORY SCAN REPORT');
  lines.push('='.repeat(60));
  lines.push(`Repository: ${report.repoPath}`);
  lines.push(`Timestamp: ${report.timestamp}`);
  lines.push(`Overall Score: ${report.score}/100`);
  lines.push(`Production Ready: ${report.productionReady ? 'YES' : 'NO'}`);
  lines.push('');
  
  if (report.readinessReasons && report.readinessReasons.length > 0) {
    lines.push('READINESS ISSUES:');
    report.readinessReasons.forEach(reason => {
      lines.push(`  - ${reason}`);
    });
    lines.push('');
  }
  
  if (report.categoryScores) {
    lines.push('CATEGORY SCORES:');
    Object.entries(report.categoryScores).forEach(([category, score]) => {
      lines.push(`  ${category}: ${score}/100`);
    });
    lines.push('');
  }
  
  lines.push('CHECK RESULTS:');
  lines.push('-'.repeat(40));
  
  // Group results by category
  const groupedResults = report.results.reduce((groups, result) => {
    const category = result.category || 'unknown';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(result);
    return groups;
  }, {} as Record<string, CheckResult[]>);
  
  Object.entries(groupedResults).forEach(([category, results]) => {
    lines.push(`\n${category.toUpperCase()}:`);
    results.forEach(result => {
      const status = result.passed ? '✓' : '✗';
      const severity = result.severity.toUpperCase();
      lines.push(`  ${status} [${severity}] ${result.title}`);
      
      if (result.message) {
        lines.push(`    ${result.message}`);
      }
      
      if (result.error) {
        lines.push(`    ERROR: ${result.error}`);
      }
      
      if (result.autoFixable) {
        lines.push(`    Auto-fixable: Yes`);
      }
    });
  });
  
  lines.push('');
  lines.push('='.repeat(60));
  
  return lines.join('\n');
}

/**
 * Generate HTML report with interactive features
 */
function generateHtmlReport(report: ScanReport): string {
  const passedCount = report.results.filter(r => r.passed).length;
  const failedCount = report.results.length - passedCount;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repository Scan Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2em; }
        .header .meta { margin-top: 10px; opacity: 0.9; }
        .score-section { padding: 30px; text-align: center; }
        .score-circle { width: 120px; height: 120px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 2em; font-weight: bold; color: white; }
        .score-good { background: #28a745; }
        .score-warning { background: #ffc107; color: #333; }
        .score-bad { background: #dc3545; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 0 30px 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #495057; }
        .stat-label { color: #6c757d; margin-top: 5px; }
        .results { padding: 0 30px 30px; }
        .category { margin-bottom: 30px; }
        .category-title { font-size: 1.2em; font-weight: bold; margin-bottom: 15px; color: #495057; }
        .check-item { background: #f8f9fa; border-left: 4px solid #dee2e6; padding: 15px; margin-bottom: 10px; border-radius: 0 4px 4px 0; }
        .check-item.passed { border-left-color: #28a745; }
        .check-item.failed { border-left-color: #dc3545; }
        .check-title { font-weight: 600; margin-bottom: 5px; }
        .check-message { color: #6c757d; font-size: 0.9em; }
        .severity { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: 600; margin-left: 10px; }
        .severity.blocker { background: #dc3545; color: white; }
        .severity.high { background: #fd7e14; color: white; }
        .severity.medium { background: #ffc107; color: #333; }
        .severity.low { background: #6c757d; color: white; }
        .auto-fixable { background: #17a2b8; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-left: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Repository Scan Report</h1>
            <div class="meta">
                <div>Repository: ${report.repoPath}</div>
                <div>Timestamp: ${new Date(report.timestamp).toLocaleString()}</div>
            </div>
        </div>
        
        <div class="score-section">
            <div class="score-circle ${getScoreClass(report.score)}">${report.score}</div>
            <h2>Production Ready: ${report.productionReady ? '✅ Yes' : '❌ No'}</h2>
            ${report.readinessReasons && report.readinessReasons.length > 0 ? 
              `<div class="readiness-reasons">
                ${report.readinessReasons.map(reason => `<div>• ${reason}</div>`).join('')}
              </div>` : ''}
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${report.results.length}</div>
                <div class="stat-label">Total Checks</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${passedCount}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${failedCount}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.categoryScores ? Object.keys(report.categoryScores).length : 0}</div>
                <div class="stat-label">Categories</div>
            </div>
        </div>
        
        ${report.categoryScores ? `
        <div class="results">
            <h2>Category Scores</h2>
            <div class="stats">
                ${Object.entries(report.categoryScores).map(([category, score]) => `
                    <div class="stat-card">
                        <div class="stat-number">${score}</div>
                        <div class="stat-label">${category}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="results">
            <h2>Detailed Results</h2>
            ${generateResultsHTML(report.results)}
        </div>
    </div>
</body>
</html>`;
}

function getScoreClass(score: number): string {
  if (score >= 85) return 'score-good';
  if (score >= 70) return 'score-warning';
  return 'score-bad';
}

function generateResultsHTML(results: CheckResult[]): string {
  const grouped = results.reduce((groups, result) => {
    const category = result.category || 'unknown';
    if (!groups[category]) groups[category] = [];
    groups[category].push(result);
    return groups;
  }, {} as Record<string, CheckResult[]>);
  
  return Object.entries(grouped).map(([category, categoryResults]) => `
    <div class="category">
        <div class="category-title">${category.toUpperCase()}</div>
        ${categoryResults.map(result => `
            <div class="check-item ${result.passed ? 'passed' : 'failed'}">
                <div class="check-title">
                    ${result.passed ? '✅' : '❌'} ${result.title}
                    <span class="severity ${result.severity}">${result.severity}</span>
                    ${result.autoFixable ? '<span class="auto-fixable">Auto-fixable</span>' : ''}
                </div>
                ${result.message ? `<div class="check-message">${result.message}</div>` : ''}
                ${result.error ? `<div class="check-message" style="color: #dc3545;">Error: ${result.error}</div>` : ''}
            </div>
        `).join('')}
    </div>
  `).join('');
}
