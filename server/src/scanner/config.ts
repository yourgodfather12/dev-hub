import { CategoryId, Severity } from './types';

export interface ScannerConfig {
  // Performance settings
  parallel: boolean;
  maxConcurrency: number;
  enableCache: boolean;
  cacheTTL: number;
  
  // Filtering options
  enabledCategories: CategoryId[];
  disabledChecks: string[];
  minSeverity: Severity;
  
  // Thresholds and limits
  thresholds: {
    maxFileSize: number; // KB
    maxFunctionComplexity: number;
    maxCodeDuplicationRatio: number;
    maxTodoCount: number;
    maxMockFileRatio: number;
    maxSimulationFileRatio: number;
    maxPlaceholderCount: number;
    maxDevCodePatterns: number;
    minErrorHandlingRatio: number;
  };
  
  // Paths to ignore
  ignorePaths: string[];
  ignoreExtensions: string[];
  
  // Custom weights for scoring
  categoryWeights?: Partial<Record<CategoryId, number>>;
  severityImpact?: Partial<Record<Severity, number>>;
  
  // Reporting options
  includeQuickWins: boolean;
  includeAutoFixSuggestions: boolean;
  verboseOutput: boolean;
}

export const DEFAULT_CONFIG: ScannerConfig = {
  parallel: true,
  maxConcurrency: 10,
  enableCache: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  
  enabledCategories: [
    'codeQuality',
    'security', 
    'dependencies',
    'devops',
    'architecture',
    'frameworkSpecific',
    'testing',
    'documentation',
    'performance',
    'aiSpecific',
    'accessibility',
    'observability',
    'dataQuality',
    'repoHealth'
  ],
  disabledChecks: [],
  minSeverity: 'low',
  
  thresholds: {
    maxFileSize: 50, // KB
    maxFunctionComplexity: 5,
    maxCodeDuplicationRatio: 0.15, // 15%
    maxTodoCount: 50,
    maxMockFileRatio: 0.2, // 20%
    maxSimulationFileRatio: 0.15, // 15%
    maxPlaceholderCount: 10,
    maxDevCodePatterns: 8,
    minErrorHandlingRatio: 0.6 // 60%
  },
  
  ignorePaths: [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    'coverage',
    '.nyc_output',
    '.vscode',
    '.idea',
    '.DS_Store'
  ],
  ignoreExtensions: [
    '.log',
    '.tmp',
    '.cache'
  ],
  
  includeQuickWins: true,
  includeAutoFixSuggestions: true,
  verboseOutput: false
};

export function loadConfig(configPath?: string): ScannerConfig {
  if (!configPath) {
    return DEFAULT_CONFIG;
  }
  
  try {
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.resolve(configPath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`Config file not found: ${configPath}, using defaults`);
      return DEFAULT_CONFIG;
    }
    
    const rawConfig = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    
    // Merge with defaults
    return {
      ...DEFAULT_CONFIG,
      ...rawConfig,
      thresholds: {
        ...DEFAULT_CONFIG.thresholds,
        ...(rawConfig.thresholds || {})
      },
      categoryWeights: {
        ...DEFAULT_CONFIG.categoryWeights,
        ...(rawConfig.categoryWeights || {})
      },
      severityImpact: {
        ...DEFAULT_CONFIG.severityImpact,
        ...(rawConfig.severityImpact || {})
      }
    };
  } catch (error) {
    console.error(`Error loading config from ${configPath}:`, error);
    return DEFAULT_CONFIG;
  }
}

export function validateConfig(config: ScannerConfig): string[] {
  const errors: string[] = [];
  
  if (config.maxConcurrency < 1 || config.maxConcurrency > 50) {
    errors.push('maxConcurrency must be between 1 and 50');
  }
  
  if (config.cacheTTL < 0) {
    errors.push('cacheTTL must be non-negative');
  }
  
  if (config.thresholds.maxFileSize < 0) {
    errors.push('maxFileSize threshold must be non-negative');
  }
  
  if (config.thresholds.maxFunctionComplexity < 0) {
    errors.push('maxFunctionComplexity threshold must be non-negative');
  }
  
  if (config.thresholds.maxCodeDuplicationRatio < 0 || config.thresholds.maxCodeDuplicationRatio > 1) {
    errors.push('maxCodeDuplicationRatio must be between 0 and 1');
  }
  
  if (config.thresholds.maxMockFileRatio < 0 || config.thresholds.maxMockFileRatio > 1) {
    errors.push('maxMockFileRatio must be between 0 and 1');
  }
  
  if (config.thresholds.maxSimulationFileRatio < 0 || config.thresholds.maxSimulationFileRatio > 1) {
    errors.push('maxSimulationFileRatio must be between 0 and 1');
  }
  
  if (config.thresholds.minErrorHandlingRatio < 0 || config.thresholds.minErrorHandlingRatio > 1) {
    errors.push('minErrorHandlingRatio must be between 0 and 1');
  }
  
  return errors;
}

export function saveConfig(config: ScannerConfig, configPath: string): void {
  try {
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.resolve(configPath);
    
    fs.writeFileSync(fullPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`Config saved to: ${fullPath}`);
  } catch (error) {
    console.error(`Error saving config to ${configPath}:`, error);
    throw error;
  }
}
