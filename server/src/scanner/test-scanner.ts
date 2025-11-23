import { scanRepository, analyzeRepo, runAllChecks } from './index';
import * as path from 'path';

async function testEnhancedScanner() {
  console.log('🔍 Testing Enhanced Repository Scanner...\n');
  
  const repoPath = path.resolve(__dirname, '../../../..'); // Go to project root
  
  try {
    console.log('📁 Analyzing repository structure...');
    const startTime = Date.now();
    
    // Test the enhanced scanner with all new features
    const report = await scanRepository(repoPath, {
      parallel: true,
      maxConcurrency: 8,
      enableCache: true,
      categories: [
        'codeQuality',
        'security',
        'dependencies', 
        'devops',
        'testing',
        'documentation',
        'performance',
        'observability',
        'repoHealth'
      ],
      outputPath: path.join(__dirname, 'test-report'),
      format: 'json'
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`\n✅ Scan completed in ${duration}ms\n`);
    console.log(`📊 Overall Score: ${report.score}/100`);
    console.log(`🏭 Production Ready: ${report.productionReady ? '✅ Yes' : '❌ No'}`);
    console.log(`📋 Total Checks: ${report.results.length}`);
    
    const passed = report.results.filter(r => r.passed).length;
    const failed = report.results.length - passed;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (report.readinessReasons && report.readinessReasons.length > 0) {
      console.log('\n🚨 Production Readiness Issues:');
      report.readinessReasons.forEach(reason => {
        console.log(`   • ${reason}`);
      });
    }
    
    console.log('\n📈 Category Scores:');
    if (report.categoryScores) {
      Object.entries(report.categoryScores).forEach(([category, score]) => {
        console.log(`   ${category}: ${score}/100`);
      });
    }
    
    console.log('\n🔍 Failed Checks Summary:');
    const failedByCategory = report.results
      .filter(r => !r.passed)
      .reduce((groups, result) => {
        if (!groups[result.category]) groups[result.category] = [];
        groups[result.category].push(result);
        return groups;
      }, {} as Record<string, any[]>);
    
    Object.entries(failedByCategory).forEach(([category, failures]) => {
      console.log(`\n   ${category.toUpperCase()}:`);
      failures.forEach(failure => {
        console.log(`     ❌ [${failure.severity.toUpperCase()}] ${failure.title}`);
        if (failure.message) {
          console.log(`        ${failure.message}`);
        }
      });
    });
    
    // Test performance comparison
    console.log('\n⚡ Performance Test:');
    await testPerformanceComparison(repoPath);
    
  } catch (error) {
    console.error('❌ Scanner test failed:', error);
  }
}

async function testPerformanceComparison(repoPath: string) {
  const context = await analyzeRepo(repoPath);
  
  // Test sequential execution
  console.log('   Running sequential execution...');
  const sequentialStart = Date.now();
  const sequentialReport = await runAllChecks(context, { parallel: false });
  const sequentialTime = Date.now() - sequentialStart;
  
  // Test parallel execution
  console.log('   Running parallel execution...');
  const parallelStart = Date.now();
  const parallelReport = await runAllChecks(context, { parallel: true, maxConcurrency: 8 });
  const parallelTime = Date.now() - parallelStart;
  
  console.log(`   Sequential: ${sequentialTime}ms`);
  console.log(`   Parallel: ${parallelTime}ms`);
  console.log(`   Speedup: ${(sequentialTime / parallelTime).toFixed(2)}x`);
  
  // Verify results are consistent
  const resultsMatch = JSON.stringify(sequentialReport.results) === JSON.stringify(parallelReport.results);
  console.log(`   Results consistent: ${resultsMatch ? '✅' : '❌'}`);
}

// Run the test
if (require.main === module) {
  testEnhancedScanner().catch(console.error);
}

export { testEnhancedScanner };
