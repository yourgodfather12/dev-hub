// @ts-ignore - Generated client might not exist during initial development
import { PrismaClient } from '../generated/client';
import { 
  createScannerService, 
  scanRepository, 
  createScannerDatabase,
  type EnhancedScannerOptions,
  type ScanReport
} from './index';

/**
 * Example usage of the enhanced repository scanner
 */
async function scannerExample() {
  console.log('🚀 Enhanced Repository Scanner Examples\n');

  // Initialize Prisma client
  const prisma = new PrismaClient();

  try {
    // Example 1: Basic repository scan
    console.log('📁 Example 1: Basic Repository Scan');
    await basicScanExample();

    console.log('\n🗄️ Example 2: Database Integration');
    await databaseIntegrationExample(prisma);

    console.log('\n⚙️ Example 3: Service Layer Usage');
    await serviceLayerExample(prisma);

    console.log('\n📊 Example 4: Dashboard Analytics');
    await dashboardAnalyticsExample(prisma);

  } catch (error) {
    console.error('❌ Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Example 1: Basic repository scan
 */
async function basicScanExample() {
  const repoPath = process.cwd(); // Scan current directory
  
  const options: EnhancedScannerOptions = {
    parallel: true,
    maxConcurrency: 8,
    enableCache: true,
    categories: [
      'codeQuality',
      'security',
      'dependencies',
      'testing',
      'documentation',
      'performance'
    ],
    outputPath: './scan-report',
    format: 'json'
  };

  const report: ScanReport = await scanRepository(repoPath, options);
  
  console.log(`   Score: ${report.score}/100`);
  console.log(`   Production Ready: ${report.productionReady ? '✅' : '❌'}`);
  console.log(`   Checks Run: ${report.results.length}`);
  console.log(`   Passed: ${report.results.filter(r => r.passed).length}`);
  console.log(`   Failed: ${report.results.filter(r => !r.passed).length}`);
}

/**
 * Example 2: Database integration
 */
async function databaseIntegrationExample(prisma: PrismaClient) {
  const scannerDB = createScannerDatabase(prisma);
  const repoPath = process.cwd();

  // Scan and save to database
  const result = await scannerDB.scanAndSave({
    repoPath,
    projectId: 'example-project-id',
    saveToDatabase: true,
    parallel: true,
    enableCache: true,
  });

  console.log(`   Scan saved with ID: ${result.scanId}`);
  console.log(`   Score: ${result.report.score}/100`);

  if (result.scanId) {
    // Retrieve the scan
    const retrievedScan = await scannerDB.getScanReport(result.scanId);
    if (retrievedScan) {
      console.log(`   Retrieved scan score: ${retrievedScan.score}/100`);
    }

    // Get project statistics
    const stats = await scannerDB.getProjectScanStats('example-project-id');
    if (stats) {
      console.log(`   Project average score: ${stats.averageScore}/100`);
      console.log(`   Production ready rate: ${(stats.productionReadyRate * 100).toFixed(1)}%`);
    }
  }
}

/**
 * Example 3: Service layer usage
 */
async function serviceLayerExample(prisma: PrismaClient) {
  const scannerService = createScannerService(prisma, {
    enableAutoCleanup: true,
    maxScansPerProject: 10,
    defaultScanOptions: {
      parallel: true,
      maxConcurrency: 6,
      enableCache: true,
    },
  });

  // Scan a project
  const scanResult = await scannerService.scanProject({
    projectId: 'example-project-id',
    repoPath: process.cwd(),
    options: {
      categories: ['security', 'codeQuality', 'testing'],
    },
  });

  console.log(`   Project scan completed: ${scanResult.report.score}/100`);

  // Get project scan history
  const history = await scannerService.getProjectScanHistory('example-project-id');
  console.log(`   Total scans for project: ${history.stats.totalScans}`);
  console.log(`   Average score: ${history.stats.averageScore}/100`);

  // Get recent scans
  const recentScans = await scannerService.getRecentScans(5);
  console.log(`   Recent scans: ${recentScans.length}`);

  // Get production ready projects
  const productionReady = await scannerService.getProductionReadyProjects();
  console.log(`   Production ready projects: ${productionReady.length}`);
}

/**
 * Example 4: Dashboard analytics
 */
async function dashboardAnalyticsExample(prisma: PrismaClient) {
  const scannerService = createScannerService(prisma);

  // Get dashboard statistics
  const dashboardStats = await scannerService.getDashboardStats();
  console.log(`   Total scans: ${dashboardStats.totalScans}`);
  console.log(`   Average score: ${dashboardStats.averageScore}/100`);
  console.log(`   Production ready: ${dashboardStats.productionReadyCount}`);
  console.log(`   Security issues: ${dashboardStats.securityIssuesCount}`);

  // Show recent activity
  console.log('   Recent activity:');
  dashboardStats.recentActivity.slice(0, 3).forEach((activity: any) => {
    console.log(`     - ${activity.projectName}: ${activity.score}/100 (${new Date(activity.timestamp).toLocaleDateString()})`);
  });

  // Get projects with security issues
  const securityIssues = await scannerService.getProjectsWithSecurityIssues();
  console.log(`   Projects with security issues: ${securityIssues.length}`);

  // Compare two scans (if we have at least 2)
  const recentScans = await scannerService.getRecentScans(2);
  if (recentScans.length >= 2) {
    const comparison = await scannerService.compareScans(
      recentScans[1].scanId!,
      recentScans[0].scanId!
    );
    
    console.log(`   Scan comparison:`);
    console.log(`     Score change: ${comparison.scoreDifference > 0 ? '+' : ''}${comparison.scoreDifference}`);
    console.log(`     New issues: ${comparison.newIssues?.length || 0}`);
    console.log(`     Resolved issues: ${comparison.resolvedIssues?.length || 0}`);
    console.log(`     Overall improvement: ${comparison.improvement ? '✅' : '❌'}`);
  }
}

/**
 * Example 5: Custom configuration
 */
async function customConfigurationExample() {
  console.log('\n⚙️ Example 5: Custom Configuration');
  
  const customOptions: EnhancedScannerOptions = {
    parallel: true,
    maxConcurrency: 4,
    enableCache: true,
    categories: ['security', 'performance', 'codeQuality'],
    excludeChecks: ['test-020'], // Exclude Python tests check
    outputPath: './custom-scan-report',
    format: 'html',
    configPath: './scanner-config.json',
  };

  const report = await scanRepository(process.cwd(), customOptions);
  
  console.log(`   Custom scan completed: ${report.score}/100`);
  console.log(`   Report saved as HTML`);
}

/**
 * Example 6: Batch scanning multiple repositories
 */
async function batchScanningExample(prisma: PrismaClient) {
  console.log('\n📦 Example 6: Batch Scanning');
  
  const scannerService = createScannerService(prisma);
  const repositories = [
    { projectId: 'proj-1', repoPath: './project-1' },
    { projectId: 'proj-2', repoPath: './project-2' },
    { projectId: 'proj-3', repoPath: './project-3' },
  ];

  const results = await Promise.allSettled(
    repositories.map(repo => 
      scannerService.scanProject({
        projectId: repo.projectId,
        repoPath: repo.repoPath,
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`   Batch scan completed: ${successful} successful, ${failed} failed`);
}

/**
 * Example 7: Monitoring and alerts
 */
async function monitoringExample(prisma: PrismaClient) {
  console.log('\n🚨 Example 7: Monitoring and Alerts');
  
  const scannerService = createScannerService(prisma);

  // Check for projects that need attention
  const securityIssues = await scannerService.getProjectsWithSecurityIssues();
  if (securityIssues.length > 0) {
    console.log(`   🚨 ALERT: ${securityIssues.length} projects have security issues`);
    
    securityIssues.slice(0, 3).forEach((scan: any) => {
      const securityFails = scan.report.results.filter((r: any) => 
        r.category === 'security' && !r.passed
      );
      console.log(`     - ${scan.report.repoPath}: ${securityFails.length} security issues`);
    });
  }

  // Check for low-scoring projects
  const recentScans = await scannerService.getRecentScans(20);
  const lowScoringProjects = recentScans.filter((scan: any) => scan.report.score < 70);
  
  if (lowScoringProjects.length > 0) {
    console.log(`   ⚠️  WARNING: ${lowScoringProjects.length} projects scoring below 70`);
    
    lowScoringProjects.forEach((scan: any) => {
      console.log(`     - ${scan.report.repoPath}: ${scan.report.score}/100`);
    });
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  scannerExample().catch(console.error);
}

export {
  scannerExample,
  basicScanExample,
  databaseIntegrationExample,
  serviceLayerExample,
  dashboardAnalyticsExample,
  customConfigurationExample,
  batchScanningExample,
  monitoringExample,
};
