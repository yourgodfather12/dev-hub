# Enhanced Repository Scanner

A comprehensive repository scanning and analysis tool with database integration, parallel execution, caching, and extensive configuration options.

## Features

### 🔍 Comprehensive Scanning
- **Performance & Optimization**: Bundle size analysis, image optimization, code splitting, caching strategies
- **Security**: Dependency vulnerability scanning, input validation, authentication checks, API key exposure detection
- **Code Quality**: Function complexity analysis, file size monitoring, code duplication detection, error handling
- **Testing**: Mock file detection, simulation file analysis, test coverage validation
- **Documentation**: README, API docs, changelog presence
- **DevOps**: CI/CD configuration, Docker setup, environment management
- **Observability**: Logging configuration, health checks, monitoring setup
- **Repository Health**: TODO tracking, placeholder detection, development code patterns

### ⚡ Performance Optimizations
- **Parallel Execution**: Run checks concurrently with configurable concurrency limits
- **Intelligent Caching**: File-based caching with hash validation to avoid redundant operations
- **Selective Scanning**: Filter by categories, exclude specific checks, set minimum severity levels

### 🗄️ Database Integration
- **Persistent Storage**: Save scan results to SQLite via Prisma
- **Historical Tracking**: Track scan history and trends over time
- **Project Management**: Associate scans with projects for organized analysis
- **Analytics Dashboard**: Built-in statistics and reporting

### ⚙️ Configuration & Customization
- **Flexible Configuration**: JSON-based configuration files
- **Custom Thresholds**: Adjust scoring thresholds and limits
- **Category Weights**: Customize the importance of different check categories
- **Output Formats**: JSON, text, and HTML report generation

## Quick Start

### Basic Usage

```typescript
import { scanRepository } from './scanner';

const report = await scanRepository('./my-project', {
  parallel: true,
  maxConcurrency: 8,
  enableCache: true,
  categories: ['security', 'codeQuality', 'testing'],
  outputPath: './scan-report',
  format: 'json'
});

console.log(`Score: ${report.score}/100`);
console.log(`Production Ready: ${report.productionReady}`);
```

### Database Integration

```typescript
import { createScannerService, PrismaClient } from './scanner';

const prisma = new PrismaClient();
const scannerService = createScannerService(prisma);

// Scan and save to database
const result = await scannerService.scanProject({
  projectId: 'my-project',
  repoPath: './my-project'
});

// Get scan history
const history = await scannerService.getProjectScanHistory('my-project');
console.log(`Average score: ${history.stats.averageScore}/100`);
```

## Architecture

### Core Components

- **`types.ts`**: TypeScript interfaces and type definitions
- **`detector.ts`**: Repository analysis and feature detection
- **`registry.ts`**: Comprehensive check definitions and logic
- **`runner.ts`**: Check execution with parallel processing and caching
- **`scoring.ts`**: Score calculation and production readiness evaluation
- **`utils.ts`**: File system utilities with caching support
- **`constants.ts`**: Configuration constants and package mappings

### Database Layer

- **`database.ts`**: Prisma integration for scan persistence
- **`service.ts`**: High-level service API for project management
- **`config.ts`**: Configuration management and validation

### Reports & Output

- **`index.ts`**: Main exports and enhanced scanner interface
- **`example.ts`**: Comprehensive usage examples
- **`test-scanner.ts`**: Testing and validation utilities

## Check Categories

### 🔒 Security
- Dependency vulnerability detection
- API key and secret exposure
- Input validation patterns
- Authentication/authorization setup
- HTTPS enforcement
- Security headers configuration

### ⚡ Performance
- Bundle size optimization tools
- Image optimization setup
- Code splitting configuration
- Caching strategies
- Performance monitoring
- Lazy loading patterns

### 🏗️ Code Quality
- Function complexity analysis
- File size monitoring
- Code duplication detection
- Error handling patterns
- Code consistency checks
- Development code detection

### 🧪 Testing
- Test framework presence
- Mock file analysis
- Simulation file detection
- Test coverage validation
- Test configuration quality

### 📚 Documentation
- README presence and quality
- API documentation
- Changelog maintenance
- Code documentation coverage

### 🚀 DevOps
- CI/CD configuration
- Docker setup
- Environment management
- Deployment automation
- Infrastructure as code

### 📊 Observability
- Logging configuration
- Health check endpoints
- Monitoring setup
- Error tracking
- Performance metrics

### 🏥 Repository Health
- TODO tracking
- Placeholder detection
- Development code patterns
- File organization
- Version control practices

## Configuration

### Scanner Configuration

Create a `scanner-config.json` file:

```json
{
  "parallel": true,
  "maxConcurrency": 8,
  "enableCache": true,
  "cacheTTL": 300000,
  "enabledCategories": [
    "security",
    "codeQuality",
    "testing",
    "performance"
  ],
  "disabledChecks": [],
  "minSeverity": "low",
  "thresholds": {
    "maxFileSize": 50,
    "maxFunctionComplexity": 5,
    "maxCodeDuplicationRatio": 0.15,
    "maxTodoCount": 50,
    "minErrorHandlingRatio": 0.6
  },
  "ignorePaths": [
    "node_modules",
    ".git",
    "dist",
    "build"
  ],
  "categoryWeights": {
    "security": 25,
    "codeQuality": 20,
    "testing": 15,
    "performance": 10
  }
}
```

### Service Configuration

```typescript
const scannerService = createScannerService(prisma, {
  enableAutoCleanup: true,
  maxScansPerProject: 20,
  defaultScanOptions: {
    parallel: true,
    maxConcurrency: 6,
    enableCache: true,
  },
});
```

## Database Schema

The scanner uses a Prisma-managed SQLite database with the following main model:

```prisma
model RepoScan {
  id                   String   @id @default(cuid())
  project              Project? @relation(fields: [projectId], references: [id])
  projectId            String?
  score                Int
  timestamp            DateTime @default(now())
  repoPath             String
  categoryScoresJson   String
  resultsJson          String
  productionReady      Boolean?
  readinessReasonsJson String?

  @@index([projectId, timestamp])
}
```

## API Examples

### Basic Scanning

```typescript
// Simple scan
const report = await scanRepository('./my-repo');

// Advanced scan with options
const report = await scanRepository('./my-repo', {
  parallel: true,
  maxConcurrency: 4,
  categories: ['security', 'performance'],
  excludeChecks: ['doc-001'],
  outputPath: './report.html',
  format: 'html'
});
```

### Database Operations

```typescript
const scannerDB = createScannerDatabase(prisma);

// Scan and save
const result = await scannerDB.scanAndSave({
  repoPath: './my-repo',
  projectId: 'project-123',
  saveToDatabase: true
});

// Get scan history
const scans = await scannerDB.getProjectScans('project-123');

// Get statistics
const stats = await scannerDB.getProjectScanStats('project-123');
```

### Service Layer

```typescript
const scannerService = createScannerService(prisma);

// Scan project
const result = await scannerService.scanProject({
  projectId: 'project-123',
  repoPath: './my-repo'
});

// Get dashboard data
const dashboard = await scannerService.getDashboardStats();

// Compare scans
const comparison = await scannerService.compareScans('scan-1', 'scan-2');
```

## Output Formats

### JSON Report
```json
{
  "score": 85,
  "results": [...],
  "timestamp": "2025-01-15T10:30:00.000Z",
  "repoPath": "./my-repo",
  "categoryScores": {
    "security": 90,
    "codeQuality": 80,
    "testing": 85
  },
  "productionReady": true,
  "readinessReasons": []
}
```

### HTML Report
Interactive HTML report with:
- Visual score indicators
- Category breakdowns
- Detailed check results
- Export capabilities
- Responsive design

### Text Report
Human-readable text format suitable for:
- CLI output
- Logging
- Simple reporting
- Email notifications

## Performance Considerations

### Parallel Execution
- Default concurrency: 10 checks
- Configurable via `maxConcurrency` option
- Automatic chunking for large check sets
- Error isolation prevents one failure from stopping others

### Caching Strategy
- File content caching with hash validation
- Directory walk caching with mtime checking
- 5-minute default TTL (configurable)
- Automatic cache invalidation on file changes

### Memory Management
- Streaming file operations for large repositories
- Bounded cache size to prevent memory leaks
- Garbage collection friendly patterns
- Efficient data structures for large result sets

## Extending the Scanner

### Adding New Checks

```typescript
// In registry.ts
const newCheck: Check = {
  id: 'custom-001',
  title: 'Custom Check',
  category: 'codeQuality',
  severity: 'medium',
  automated: true,
  checker: async (ctx: RepoContext) => {
    // Your check logic here
    return {
      passed: true,
      message: 'Custom check passed'
    };
  },
};

BASE_CHECKS.push(newCheck);
```

### Custom Categories

```typescript
// In types.ts
export type CategoryId = 
  | 'security'
  | 'codeQuality'
  | 'testing'
  | 'performance'
  | 'customCategory'; // Add your category

// In constants.ts
export const CATEGORY_WEIGHTS: Record<CategoryId, number> = {
  // ... existing categories
  customCategory: 10,
};
```

### Package Detection

```typescript
// In constants.ts
export const NICHE_PACKAGES: Record<string, PackageInfo> = {
  'my-package': { category: 'custom', riskLevel: 'medium' },
};
```

## Testing

```bash
# Run scanner tests
npm test

# Run with coverage
npm run test:coverage

# Test specific functionality
npx tsx scanner/test-scanner.ts
```

## Troubleshooting

### Common Issues

1. **Memory Issues**: Reduce `maxConcurrency` or enable more aggressive caching
2. **Slow Scans**: Enable caching and increase concurrency limits
3. **False Positives**: Adjust thresholds in configuration
4. **Database Errors**: Check Prisma schema and migrations

### Debug Mode

```typescript
const report = await scanRepository('./my-repo', {
  verboseOutput: true,
  enableCache: false, // Disable for debugging
});
```

## License

This enhanced scanner is part of the DevHub project and follows the same licensing terms.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

For detailed contribution guidelines, see the main project README.
