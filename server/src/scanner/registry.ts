import { promises as fs } from 'fs';
import * as path from 'path';
import { Check, RepoContext } from './types';
import { fileExists, readTextIfExists, walkFiles } from './utils';

const BASE_CHECKS: Check[] = [
  {
    id: 'doc-001',
    title: 'README.md present',
    category: 'documentation',
    severity: 'blocker',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const hasReadme = await fileExists(path.join(ctx.path, 'README.md'));
      return {
        passed: hasReadme,
        message: hasReadme
          ? 'README.md found'
          : 'README.md is missing at repository root',
      };
    },
  },
  {
    id: 'doc-002',
    title: 'README has at least 100 words',
    category: 'documentation',
    severity: 'high',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const readme = await readTextIfExists(path.join(ctx.path, 'README.md'));
      if (!readme) {
        return {
          passed: false,
          message: 'README.md not found',
        };
      }
      const words = readme.split(/\s+/).filter(Boolean);
      return {
        passed: words.length >= 100,
        message: `README contains ${words.length} words`,
      };
    },
  },
  {
    id: 'devops-001',
    title: 'Continuous integration configuration present',
    category: 'devops',
    severity: 'high',
    automated: true,
    checker: async (ctx: RepoContext) => {
      return {
        passed: ctx.hasCI,
        message: ctx.hasCI
          ? 'CI configuration detected (.github/, .gitlab-ci.yml, or azure-pipelines.yml)'
          : 'No CI configuration detected',
      };
    },
  },
  {
    id: 'devops-002',
    title: 'Dockerfile present',
    category: 'devops',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      return {
        passed: ctx.hasDockerfile,
        message: ctx.hasDockerfile
          ? 'Dockerfile present at repository root'
          : 'Dockerfile not found at repository root',
      };
    },
  },
  {
    id: 'deps-001',
    title:
      'Lockfile present (package-lock.json / yarn.lock / pnpm-lock.yaml)',
    category: 'dependencies',
    severity: 'high',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const lockfiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
      let found = false;
      for (const lf of lockfiles) {
        if (await fileExists(path.join(ctx.path, lf))) {
          found = true;
          break;
        }
      }
      return {
        passed: found,
        message: found
          ? 'Dependency lockfile found'
          : 'No dependency lockfile found',
      };
    },
  },
  {
    id: 'sec-001',
    title: 'No obvious .env files committed',
    category: 'security',
    severity: 'blocker',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path);
      const present: string[] = [];

      for (const file of files) {
        const base = path.basename(file);
        if (!/^\.env(\..+)?$/i.test(base)) continue;
        const lower = base.toLowerCase();
        if (
          lower.includes('example') ||
          lower.includes('template') ||
          lower.includes('sample')
        ) {
          continue;
        }
        present.push(path.relative(ctx.path, file));
      }

      return {
        passed: present.length === 0,
        message:
          present.length === 0
            ? 'No committed runtime .env files detected in repository'
            : `Potential runtime .env files detected: ${present.join(', ')}`,
      };
    },
  },
  {
    id: 'code-001',
    title: 'TODO / FIXME markers are limited',
    category: 'codeQuality',
    severity: 'low',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, [
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '.py',
        '.ipynb',
        '.md',
        '.yml',
        '.yaml',
      ]);
      let count = 0;
      for (const file of files) {
        const content = await readTextIfExists(file);
        if (!content) continue;
        const matches = content.match(/TODO|FIXME/gi);
        if (matches) {
          count += matches.length;
        }
      }
      return {
        passed: count <= 50,
        message: `Found ${count} TODO/FIXME markers`,
      };
    },
  },
  {
    id: 'test-001',
    title: 'Test files present',
    category: 'testing',
    severity: 'blocker',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, [
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
      ]);
      const hasTestFile = files.some((file) => {
        const lower = file.toLowerCase();
        return (
          lower.includes('__tests__') || /\.test\.(t|j)sx?$/.test(lower)
        );
      });
      return {
        passed: hasTestFile,
        message: hasTestFile
          ? 'Test files detected (e.g. *.test.ts, __tests__)'
          : 'No test files detected',
      };
    },
  },
  {
    id: 'test-020',
    title: 'Python tests present (tests/ or test_*.py)',
    category: 'testing',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pyFiles = await walkFiles(ctx.path, ['.py']);
      const hasPython = pyFiles.length > 0;
      if (!hasPython) {
        return {
          passed: true,
          message: 'No Python source files detected; skipping Python tests check',
        };
      }

      const hasPyTests = pyFiles.some((file) => {
        const lower = file.toLowerCase();
        return (
          lower.includes('/tests/') ||
          lower.includes('\\tests\\') ||
          /(^|[\\/])test_.*\.py$/.test(lower) ||
          /(^|[\\/]).*_test\.py$/.test(lower)
        );
      });

      return {
        passed: hasPyTests,
        message: hasPyTests
          ? 'Python test files detected (tests/ or test_*.py/_test.py)'
          : 'No Python test files detected alongside Python source',
      };
    },
  },
  {
    id: 'sec-020',
    title: 'No use of eval() or Function() in source',
    category: 'security',
    severity: 'blocker',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, [
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
      ]);
      const matches: string[] = [];
      for (const file of files) {
        const content = await readTextIfExists(file);
        if (!content) continue;
        if (
          /\beval\s*\(/.test(content) ||
          /\bnew\s+Function\s*\(/.test(content)
        ) {
          matches.push(file);
        }
      }
      return {
        passed: matches.length === 0,
        message:
          matches.length === 0
            ? 'No eval()/Function() usage detected'
            : `Potential eval()/Function() usage in: ${matches.join(', ')}`,
      };
    },
  },
  {
    id: 'sec-015',
    title: 'No obvious wildcard CORS configuration',
    category: 'security',
    severity: 'blocker',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, [
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
      ]);
      const offenders: string[] = [];
      for (const file of files) {
        const content = await readTextIfExists(file);
        if (!content) continue;
        if (
          /Access-Control-Allow-Origin\s*['"`]?:?\s*['"`]\*/.test(
            content,
          ) ||
          /origin\s*:\s*['"`]\*/.test(content)
        ) {
          offenders.push(file);
        }
      }
      return {
        passed: offenders.length === 0,
        message:
          offenders.length === 0
            ? 'No obvious CORS wildcard origins detected'
            : `Wildcard CORS origins detected in: ${offenders.join(', ')}`,
      };
    },
  },
  {
    id: 'sec-010',
    title: 'No obvious secrets or access tokens in source',
    category: 'security',
    severity: 'high',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, [
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '.py',
        '.ipynb',
        '.yml',
        '.yaml',
        '.json',
        '.env',
      ]);
      const offenders: string[] = [];
      const secretPatterns: RegExp[] = [
        /ghp_[0-9A-Za-z]{20,}/, // GitHub PAT
        /sk-[A-Za-z0-9]{20,}/, // OpenAI-style keys
        /AIza[0-9A-Za-z\-_]{20,}/, // Google API keys
        /xox[baprs]-[0-9A-Za-z-]{10,}/, // Slack tokens
        /-----BEGIN (RSA|DSA|EC) PRIVATE KEY-----/, // private keys
        /(aws_access_key_id|aws_secret_access_key)\s*[:=]\s*['\"]?[A-Za-z0-9\/+=]{16,}/i,
        /(api_key|apikey|secret_key)\s*[:=]\s*['\"]?[A-Za-z0-9_-]{16,}/i,
      ];

      for (const file of files) {
        const content = await readTextIfExists(file);
        if (!content) continue;
        if (secretPatterns.some((re) => re.test(content))) {
          offenders.push(file);
        }
      }

      return {
        passed: offenders.length === 0,
        message:
          offenders.length === 0
            ? 'No obvious secret tokens detected in source'
            : `Potential secrets detected in: ${offenders.join(', ')}`,
      };
    },
  },
  {
    id: 'deps-010',
    title: 'No git URL dependencies in package.json',
    category: 'dependencies',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pkg = ctx.packageJson;
      if (!pkg) {
        return {
          passed: true,
          message: 'No package.json found; skipping git URL dependency check',
        };
      }

      const offenders: string[] = [];
      const addOffenders = (deps: Record<string, unknown> | undefined) => {
        if (!deps) return;
        for (const [name, rawVersion] of Object.entries(deps)) {
          const version =
            typeof rawVersion === 'string' ? rawVersion : String(rawVersion ?? '');
          if (/^(git\+|https?:\/\/|github:)/.test(version)) {
            offenders.push(name);
          }
        }
      };

      addOffenders(pkg.dependencies as Record<string, unknown> | undefined);
      addOffenders(pkg.devDependencies as Record<string, unknown> | undefined);

      return {
        passed: offenders.length === 0,
        message:
          offenders.length === 0
            ? 'No git URL dependencies detected in package.json'
            : `Git URL dependencies detected for: ${offenders.join(', ')}`,
      };
    },
  },
  {
    id: 'devops-010',
    title: 'Environment template file present',
    category: 'devops',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const candidates = ['.env.example', '.env.template', '.env.sample'];
      let found = false;
      for (const name of candidates) {
        if (await fileExists(path.join(ctx.path, name))) {
          found = true;
          break;
        }
      }
      return {
        passed: found,
        message: found
          ? 'Environment template file detected (.env.example / .env.template / .env.sample)'
          : 'No environment template file detected at repo root',
      };
    },
  },
  {
    id: 'test-010',
    title: 'Test script defined in package.json',
    category: 'testing',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pkg = ctx.packageJson;
      const scripts =
        pkg && (pkg as { scripts?: Record<string, unknown> }).scripts;
      const hasTestScript =
        scripts && typeof scripts === 'object' && 'test' in scripts;
      return {
        passed: Boolean(hasTestScript),
        message: hasTestScript
          ? 'package.json contains a test script'
          : 'No test script found in package.json',
      };
    },
  },
  {
    id: 'repo-001',
    title: 'Manifest file present (package.json or requirements.txt)',
    category: 'repoHealth',
    severity: 'high',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const hasPackageJson = await fileExists(path.join(ctx.path, 'package.json'));
      const hasRequirements = await fileExists(path.join(ctx.path, 'requirements.txt'));
      const passed = hasPackageJson || hasRequirements;
      return {
        passed,
        message: passed
          ? 'Found package.json or requirements.txt'
          : 'No package.json or requirements.txt found at repository root',
      };
    },
  },
  {
    id: 'repo-010',
    title: 'License file present',
    category: 'repoHealth',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const candidates = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'];
      let found = false;
      for (const name of candidates) {
        if (await fileExists(path.join(ctx.path, name))) {
          found = true;
          break;
        }
      }
      return {
        passed: found,
        message: found
          ? 'License file detected at repository root'
          : 'No license file detected at repository root',
      };
    },
  },
  {
    id: 'repo-020',
    title: 'Changelog or release notes present',
    category: 'repoHealth',
    severity: 'low',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const candidates = ['CHANGELOG.md', 'CHANGES.md', 'RELEASES.md'];
      let found = false;
      for (const name of candidates) {
        if (await fileExists(path.join(ctx.path, name))) {
          found = true;
          break;
        }
      }
      return {
        passed: found,
        message: found
          ? 'Changelog or release notes detected'
          : 'No changelog or release notes detected at repository root',
      };
    },
  },
  {
    id: 'devops-020',
    title: 'Build script defined in package.json',
    category: 'devops',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pkg = ctx.packageJson;
      const scripts =
        pkg && (pkg as { scripts?: Record<string, unknown> }).scripts;
      const hasBuild =
        scripts && typeof scripts === 'object' && 'build' in scripts;
      return {
        passed: Boolean(hasBuild),
        message: hasBuild
          ? 'package.json contains a build script'
          : 'No build script found in package.json',
      };
    },
  },
  {
    id: 'devops-030',
    title: 'Lint or format script defined in package.json',
    category: 'devops',
    severity: 'low',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pkg = ctx.packageJson;
      const scripts =
        pkg && (pkg as { scripts?: Record<string, unknown> }).scripts;
      const hasLintOrFormat =
        scripts &&
        typeof scripts === 'object' &&
        ('lint' in scripts || 'format' in scripts);
      return {
        passed: Boolean(hasLintOrFormat),
        message: hasLintOrFormat
          ? 'package.json contains lint or format scripts'
          : 'No lint or format script found in package.json',
      };
    },
  },
  {
    id: 'code-020',
    title: 'Lint configuration present for JavaScript/TypeScript projects',
    category: 'codeQuality',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const candidates = [
        '.eslintrc',
        '.eslintrc.json',
        '.eslintrc.js',
        '.eslintrc.cjs',
        '.eslintrc.yml',
        '.eslintrc.yaml',
        'eslint.config.js',
        'eslint.config.mjs',
        'eslint.config.cjs',
        'eslint.config.ts',
        'biome.json',
        'biome.jsonc',
      ];
      let found = false;
      for (const name of candidates) {
        if (await fileExists(path.join(ctx.path, name))) {
          found = true;
          break;
        }
      }
      return {
        passed: found,
        message: found
          ? 'Lint configuration detected (ESLint/Biome)'
          : 'No lint configuration file detected at repository root',
      };
    },
  },
  {
    id: 'code-030',
    title: 'Formatter configuration present for JavaScript/TypeScript projects',
    category: 'codeQuality',
    severity: 'low',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const candidates = [
        '.prettierrc',
        '.prettierrc.json',
        '.prettierrc.js',
        '.prettierrc.cjs',
        '.prettierrc.yml',
        '.prettierrc.yaml',
        'prettier.config.js',
        'prettier.config.cjs',
        'prettier.config.mjs',
      ];
      let found = false;
      for (const name of candidates) {
        if (await fileExists(path.join(ctx.path, name))) {
          found = true;
          break;
        }
      }
      return {
        passed: found,
        message: found
          ? 'Prettier or formatter configuration detected'
          : 'No Prettier/formatter configuration detected at repository root',
      };
    },
  },
  {
    id: 'deps-020',
    title: 'No wildcard or "latest" dependency versions in package.json',
    category: 'dependencies',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pkg = ctx.packageJson;
      if (!pkg) {
        return {
          passed: true,
          message:
            'No package.json found; skipping dependency version quality check',
        };
      }

      const offenders: string[] = [];
      const checkVersions = (deps: Record<string, unknown> | undefined) => {
        if (!deps) return;
        for (const [name, rawVersion] of Object.entries(deps)) {
          const version =
            typeof rawVersion === 'string'
              ? rawVersion.trim()
              : String(rawVersion ?? '').trim();
          if (!version) continue;
          if (version === '*' || version.toLowerCase() === 'latest') {
            offenders.push(name);
            continue;
          }
          if (/^\^?0\./.test(version)) {
            offenders.push(name);
          }
        }
      };

      checkVersions(pkg.dependencies as Record<string, unknown> | undefined);
      checkVersions(
        pkg.devDependencies as Record<string, unknown> | undefined,
      );

      return {
        passed: offenders.length === 0,
        message:
          offenders.length === 0
            ? 'No obviously unstable dependency version ranges detected'
            : `Potentially unstable versions detected for: ${offenders.join(
                ', ',
              )}`,
      };
    },
  },
  {
    id: 'test-030',
    title: 'Testing framework or runner detected',
    category: 'testing',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pkg = ctx.packageJson;
      if (!pkg) {
        return {
          passed: true,
          message:
            'No package.json found; skipping JavaScript/TypeScript testing tooling check',
        };
      }

      const deps = (pkg.dependencies ?? {}) as Record<string, unknown>;
      const devDeps = (pkg.devDependencies ?? {}) as Record<string, unknown>;
      const hasAny = (...names: string[]) =>
        names.some(
          (name) =>
            Object.prototype.hasOwnProperty.call(deps, name) ||
            Object.prototype.hasOwnProperty.call(devDeps, name),
        );

      const hasTestFramework =
        hasAny('jest', 'vitest', '@playwright/test', 'cypress') ||
        hasAny(
          '@testing-library/react',
          '@testing-library/vue',
          '@testing-library/angular',
        );

      return {
        passed: hasTestFramework,
        message: hasTestFramework
          ? 'Testing framework detected (Jest, Vitest, Playwright, Cypress, or Testing Library)'
          : 'No common JavaScript/TypeScript testing framework detected in dependencies',
      };
    },
  },
  {
    id: 'code-010',
    title: 'TypeScript configuration present for TypeScript projects',
    category: 'codeQuality',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const tsFiles = await walkFiles(ctx.path, ['.ts', '.tsx']);
      const hasTs = tsFiles.length > 0;
      if (!hasTs) {
        return {
          passed: true,
          message: 'No TypeScript source files detected; skipping tsconfig check',
        };
      }
      const hasTsconfig = await fileExists(path.join(ctx.path, 'tsconfig.json'));
      return {
        passed: hasTsconfig,
        message: hasTsconfig
          ? 'tsconfig.json present at repository root'
          : 'TypeScript files detected but tsconfig.json is missing at repository root',
      };
    },
  },
  {
    id: 'arch-001',
    title: 'Conventional src/ directory present',
    category: 'architecture',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      let hasSrc = false;
      try {
        const stats = await fs.stat(path.join(ctx.path, 'src'));
        hasSrc = stats.isDirectory();
      } catch {
        hasSrc = false;
      }
      return {
        passed: hasSrc,
        message: hasSrc
          ? 'src/ directory present at repository root'
          : 'src/ directory not found at repository root',
      };
    },
  },
  {
    id: 'mock-001',
    title: 'Mock/stub file patterns are limited',
    category: 'codeQuality',
    severity: 'high',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path);
      const mockPatterns = [
        /\.mock\./,
        /\.stub\./,
        /\.fake\./,
        /\.dummy\./,
        /\.test\./,
        /\.spec\./,
        /mock(s)?\//,
        /stub(s)?\//,
        /fake(s)?\//,
        /dummy(s)?\//,
        /test(s)?\//,
        /spec(s)?\//
      ];
      
      const mockFiles: string[] = [];
      const totalCodeFiles = files.filter(file => 
        /\.(ts|tsx|js|jsx|py|java|cpp|c|h|go|rs|php|rb|scala|kt)$/.test(file)
      ).length;

      for (const file of files) {
        const relativePath = path.relative(ctx.path, file);
        const isMockFile = mockPatterns.some(pattern => pattern.test(relativePath));
        if (isMockFile) {
          mockFiles.push(relativePath);
        }
      }

      // Calculate ratio - if mock files are more than 20% of code files, flag it
      const mockRatio = totalCodeFiles > 0 ? mockFiles.length / totalCodeFiles : 0;
      const passed = mockFiles.length <= 5 || mockRatio <= 0.2;

      return {
        passed,
        message: passed 
          ? `Found ${mockFiles.length} mock/stub files (${(mockRatio * 100).toFixed(1)}% of code files)`
          : `High concentration of mock/stub files: ${mockFiles.length} files (${(mockRatio * 100).toFixed(1)}% of code files). May indicate non-production-ready code.`
      };
    },
  },
  {
    id: 'mock-002', 
    title: 'Simulation/demo file patterns are limited',
    category: 'codeQuality',
    severity: 'high',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path);
      const simulationPatterns = [
        /simulation(s)?/i,
        /demo(s)?/i,
        /example(s)?/i,
        /sample(s)?/i,
        /prototype(s)?/i,
        /proof[-_]?of[-_]?concept/i,
        /poc/i,
        /sandbox/i,
        /experimental/i
      ];

      const simulationFiles: string[] = [];
      const totalCodeFiles = files.filter(file => 
        /\.(ts|tsx|js|jsx|py|java|cpp|c|h|go|rs|php|rb|scala|kt)$/.test(file)
      ).length;

      for (const file of files) {
        const relativePath = path.relative(ctx.path, file);
        const isSimulationFile = simulationPatterns.some(pattern => pattern.test(relativePath));
        if (isSimulationFile) {
          simulationFiles.push(relativePath);
        }
      }

      const simRatio = totalCodeFiles > 0 ? simulationFiles.length / totalCodeFiles : 0;
      const passed = simulationFiles.length <= 3 || simRatio <= 0.15;

      return {
        passed,
        message: passed
          ? `Found ${simulationFiles.length} simulation/demo files (${(simRatio * 100).toFixed(1)}% of code files)`
          : `High concentration of simulation/demo files: ${simulationFiles.length} files (${(simRatio * 100).toFixed(1)}% of code files). May indicate non-production-ready code.`
      };
    },
  },
  {
    id: 'mock-003',
    title: 'Placeholder code patterns limited',
    category: 'codeQuality', 
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.c', '.go', '.rs']);
      const placeholderPatterns = [
        /TODO[^\n]*implement/i,
        /TODO[^\n]*add logic/i,
        /TODO[^\n]*write code/i,
        /FIXME[^\n]*implement/i,
        /XXX[^\n]*implement/i,
        /HACK[^\n]*implement/i,
        /NOTE[^\n]*placeholder/i,
        /\/\/ PLACEHOLDER/i,
        /# PLACEHOLDER/i,
        /function.*\{[\s\n]*\}/, // Empty function bodies
        /class.*\{[\s\n]*\}/, // Empty class bodies  
        /if\s*\(.*\)\s*\{[\s\n]*\}/, // Empty if blocks
        /for\s*\(.*\)\s*\{[\s\n]*\}/, // Empty for loops
        /while\s*\(.*\)\s*\{[\s\n]*\}/, // Empty while loops
        /throw new Error\(["']?(not implemented|todo|placeholder|coming soon)/i,
        /raise NotImplementedError/i,
        /pass\s*(?=#.*placeholder)/i,
        /return null;?\s*(?=\n.*placeholder)/i,
        /return undefined;?\s*(?=\n.*placeholder)/i
      ];

      let totalPlaceholders = 0;
      const filesWithPlaceholders: string[] = [];

      for (const file of files) {
        const content = await readTextIfExists(file);
        if (!content) continue;

        let filePlaceholders = 0;
        for (const pattern of placeholderPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            filePlaceholders += matches.length;
          }
        }

        if (filePlaceholders > 0) {
          totalPlaceholders += filePlaceholders;
          filesWithPlaceholders.push(`${path.relative(ctx.path, file)} (${filePlaceholders})`);
        }
      }

      const passed = totalPlaceholders <= 10;
      return {
        passed,
        message: passed
          ? `Found ${totalPlaceholders} placeholder patterns across ${filesWithPlaceholders.length} files`
          : `High number of placeholder patterns: ${totalPlaceholders} found. Files: ${filesWithPlaceholders.slice(0, 5).join(', ')}${filesWithPlaceholders.length > 5 ? '...' : ''}`
      };
    },
  },
  {
    id: 'mock-004',
    title: 'Hard-coded test/simulation data limited',
    category: 'codeQuality',
    severity: 'medium', 
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, ['.ts', '.tsx', '.js', '.jsx', '.py', '.json']);
      const testDataPatterns = [
        /const.*test.*data.*=.*\[/i,
        /const.*mock.*data.*=.*\[/i,
        /const.*dummy.*data.*=.*\[/i,
        /test.*user.*=.*\{/i,
        /mock.*user.*=.*\{/i,
        /dummy.*user.*=.*\{/i,
        /example.*data.*=.*\{/i,
        /sample.*data.*=.*\{/i,
        /"test@example\.com"/i,
        /"mock.*@.*\.com"/i,
        /"123.*test.*street"/i,
        /"555-.*test"/i,
        /\b(test|mock|dummy|example|sample)_?(id|name|email|phone|address)\b.*[:=].*["'`][^"'`]+["'`]/i
      ];

      let totalMatches = 0;
      const filesWithTestData: string[] = [];

      for (const file of files) {
        const content = await readTextIfExists(file);
        if (!content) continue;

        // Skip obvious test files
        const relativePath = path.relative(ctx.path, file);
        if (/test|spec|mock|stub/.test(relativePath)) continue;

        let fileMatches = 0;
        for (const pattern of testDataPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            fileMatches += matches.length;
          }
        }

        if (fileMatches > 2) { // More than 2 matches suggests significant test data
          totalMatches += fileMatches;
          filesWithTestData.push(`${path.relative(ctx.path, file)} (${fileMatches})`);
        }
      }

      const passed = totalMatches <= 15;
      return {
        passed,
        message: passed
          ? `Found ${totalMatches} hard-coded test data patterns`
          : `Extensive hard-coded test data found: ${totalMatches} patterns. Files: ${filesWithTestData.slice(0, 3).join(', ')}${filesWithTestData.length > 3 ? '...' : ''}`
      };
    },
  },
  {
    id: 'mock-005',
    title: 'Development/debug code patterns limited',
    category: 'codeQuality',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, ['.ts', '.tsx', '.js', '.jsx', '.py', '.java']);
      const devCodePatterns = [
        /console\.log\(['"`]test|['"`]debug|['"`]todo/i,
        /console\.log\(['"`].*placeholder/i,
        /debugger;/,
        /alert\(['"`]test/i,
        /print\(['"`]test/i,
        /System\.out\.println\(['"`]test/i,
        /System\.out\.println\(['"`]debug/i,
        /\/\/ DEBUG/i,
        /\/\/ TEST/i,
        /# DEBUG/i,
        /# TEST/i,
        /if\s*\(\s*false\s*\)\s*\{[\s\S]*?console\.log/i,
        /if\s*\(\s*true\s*\)\s*\{[\s\S]*?console\.log/i,
        /\/\/.*remove.*before.*production/i,
        /\/\/.*delete.*before.*deploy/i
      ];

      let totalDevCode = 0;
      const filesWithDevCode: string[] = [];

      for (const file of files) {
        const content = await readTextIfExists(file);
        if (!content) continue;

        let fileDevCode = 0;
        for (const pattern of devCodePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            fileDevCode += matches.length;
          }
        }

        if (fileDevCode > 0) {
          totalDevCode += fileDevCode;
          filesWithDevCode.push(`${path.relative(ctx.path, file)} (${fileDevCode})`);
        }
      }

      const passed = totalDevCode <= 8;
      return {
        passed,
        message: passed
          ? `Found ${totalDevCode} development/debug code patterns`
          : `High number of development/debug patterns: ${totalDevCode} found. Files: ${filesWithDevCode.slice(0, 3).join(', ')}${filesWithDevCode.length > 3 ? '...' : ''}`
      };
    },
  },
  {
    id: 'perf-001',
    title: 'Bundle size optimization present',
    category: 'performance',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pkg = ctx.packageJson;
      if (!pkg) {
        return {
          passed: true,
          message: 'No package.json found; skipping bundle optimization check',
        };
      }

      const scripts = (pkg as { scripts?: Record<string, unknown> }).scripts;
      const hasBundleOptimization = scripts && (
        'analyze' in scripts ||
        'bundle-analyzer' in scripts ||
        'build:analyze' in scripts ||
        'webpack-bundle-analyzer' in scripts
      );

      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) } as Record<string, unknown>;
      const hasAnalyzerDeps = Object.keys(deps).some(dep =>
        dep.includes('webpack-bundle-analyzer') ||
        dep.includes('bundle-analyzer') ||
        dep.includes('rollup-plugin-visualizer')
      );

      const passed = hasBundleOptimization || hasAnalyzerDeps;
      return {
        passed,
        message: passed
          ? 'Bundle size optimization tools detected'
          : 'No bundle size optimization tools or scripts found'
      };
    },
  },
  {
    id: 'perf-002',
    title: 'Image optimization configuration present',
    category: 'performance',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, ['.js', '.jsx', '.ts', '.tsx', '.json', '.config.js', '.config.ts']);
      const imageOptPatterns = [
        /next-optimized-images/,
        /next-image/,
        /image-loader/,
        /sharp/,
        /imagemin/,
        /webp-loader/,
        /responsive-loader/,
        /lqip-loader/,
        /blurhash/,
        /plaiceholder/
      ];

      const hasImageOptimization = files.some(async file => {
        const content = await readTextIfExists(file);
        return content && imageOptPatterns.some(pattern => pattern.test(content));
      });

      const nextConfigFiles = ['next.config.js', 'next.config.ts', 'next.config.mjs'];
      let hasNextImageOpt = false;
      for (const configFile of nextConfigFiles) {
        const config = await readTextIfExists(path.join(ctx.path, configFile));
        if (config && (
          config.includes('images') ||
          config.includes('loader') ||
          config.includes('domains') ||
          config.includes('remotePatterns')
        )) {
          hasNextImageOpt = true;
          break;
        }
      }

      const passed = hasNextImageOpt;
      return {
        passed,
        message: passed
          ? 'Image optimization configuration detected'
          : 'No image optimization configuration found'
      };
    },
  },
  {
    id: 'perf-003',
    title: 'Code splitting configuration present',
    category: 'performance',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const configFiles = [
        'webpack.config.js', 'webpack.config.ts', 'webpack.config.mjs',
        'vite.config.js', 'vite.config.ts', 'vite.config.mjs',
        'rollup.config.js', 'rollup.config.ts', 'rollup.config.mjs',
        'next.config.js', 'next.config.ts', 'next.config.mjs'
      ];

      let hasCodeSplitting = false;
      for (const configFile of configFiles) {
        const config = await readTextIfExists(path.join(ctx.path, configFile));
        if (config && (
          config.includes('splitChunks') ||
          config.includes('codeSplit') ||
          config.includes('dynamicImport') ||
          config.includes('lazy') ||
          config.includes('import(')
        )) {
          hasCodeSplitting = true;
          break;
        }
      }

      const jsFiles = await walkFiles(ctx.path, ['.js', '.jsx', '.ts', '.tsx']);
      let hasDynamicImports = false;
      for (const file of jsFiles.slice(0, 20)) { // Check first 20 files for performance
        const content = await readTextIfExists(file);
        if (content && (
          content.includes('import(') ||
          content.includes('React.lazy') ||
          content.includes('lazy(') ||
          content.includes('defineAsyncComponent')
        )) {
          hasDynamicImports = true;
          break;
        }
      }

      const passed = hasCodeSplitting || hasDynamicImports;
      return {
        passed,
        message: passed
          ? 'Code splitting configuration or usage detected'
          : 'No code splitting configuration or dynamic imports found'
      };
    },
  },
  {
    id: 'perf-004',
    title: 'Caching strategies implemented',
    category: 'performance',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java']);
      const cachingPatterns = [
        /cache-control/i,
        /etag/i,
        /last-modified/i,
        /expires/i,
        /max-age/i,
        /swr/i,
        /react-query/,
        /@tanstack\/react-query/,
        /apollo-client/,
        /urql/,
        /useSWR/,
        /useQuery/,
        /localStorage/,
        /sessionStorage/,
        /indexedDB/,
        /redis/,
        /memcached/
      ];

      let hasCaching = false;
      const filesWithCaching: string[] = [];

      for (const file of files.slice(0, 30)) { // Limit for performance
        const content = await readTextIfExists(file);
        if (content && cachingPatterns.some(pattern => pattern.test(content))) {
          hasCaching = true;
          filesWithCaching.push(path.relative(ctx.path, file));
        }
      }

      // Check for HTTP caching headers in server files
      const serverFiles = files.filter(file => 
        file.includes('server') || file.includes('api') || file.includes('app')
      );
      for (const serverFile of serverFiles.slice(0, 10)) {
        const content = await readTextIfExists(serverFile);
        if (content && (
          content.includes('Cache-Control') ||
          content.includes('ETag') ||
          content.includes('Last-Modified')
        )) {
          hasCaching = true;
          break;
        }
      }

      return {
        passed: hasCaching,
        message: hasCaching
          ? 'Caching strategies detected'
          : 'No caching strategies found'
      };
    },
  },
  {
    id: 'perf-005',
    title: 'Performance monitoring tools present',
    category: 'performance',
    severity: 'low',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pkg = ctx.packageJson;
      if (!pkg) {
        return {
          passed: true,
          message: 'No package.json found; skipping performance monitoring check',
        };
      }

      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) } as Record<string, unknown>;
      const performanceTools = [
        'web-vitals',
        '@sentry/browser',
        '@sentry/node',
        'newrelic',
        'datadog',
        'bugsnag',
        'rollbar',
        'logrocket',
        'fullstory',
        'hotjar',
        'clarity',
        'analytics'
      ];

      const hasPerformanceTools = performanceTools.some(tool => deps[tool]);

      return {
        passed: hasPerformanceTools,
        message: hasPerformanceTools
          ? 'Performance monitoring tools detected'
          : 'No performance monitoring tools found'
      };
    },
  },
  {
    id: 'sec-030',
    title: 'Dependency vulnerability scanning',
    category: 'security',
    severity: 'high',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pkg = ctx.packageJson;
      if (!pkg) {
        return {
          passed: true,
          message: 'No package.json found; skipping dependency vulnerability check',
        };
      }

      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) } as Record<string, unknown>;
      const securityTools = [
        'npm audit',
        'yarn audit',
        'pnpm audit',
        'snyk',
        'audit-ci',
        'npm-audit-resolver',
        'audit-resolve-core'
      ];

      // Check for audit scripts
      const scripts = (pkg as { scripts?: Record<string, unknown> }).scripts;
      const hasAuditScript = scripts && Object.keys(scripts).some(script =>
        securityTools.some(tool => script.includes(tool.toLowerCase()))
      );

      // Check for security-related dependencies
      const securityDeps = [
        'snyk',
        'audit-ci',
        '@sentry/cli',
        'helmet',
        'bcrypt',
        'jsonwebtoken',
        'passport',
        'cors'
      ];

      const hasSecurityDeps = securityDeps.some(dep => deps[dep]);

      const passed = hasAuditScript || hasSecurityDeps;
      return {
        passed,
        message: passed
          ? 'Security scanning tools or dependencies detected'
          : 'No dependency vulnerability scanning tools found'
      };
    },
  },
  {
    id: 'sec-040',
    title: 'Input validation and sanitization',
    category: 'security',
    severity: 'high',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, ['.js', '.jsx', '.ts', '.tsx', '.py', '.php', '.java', '.go']);
      const validationPatterns = [
        /joi/,
        /yup/,
        /zod/,
        /validator/,
        /express-validator/,
        /sanitize/,
        /escape/,
        /htmlspecialchars/,
        /DOMPurify/,
        /bleach/,
        /input.*validation/i,
        /form.*validation/i,
        /req\.body/,
        /req\.query/,
        /req\.params/
      ];

      let hasValidation = false;
      const filesWithValidation: string[] = [];

      for (const file of files.slice(0, 25)) { // Limit for performance
        const content = await readTextIfExists(file);
        if (content && validationPatterns.some(pattern => pattern.test(content))) {
          hasValidation = true;
          filesWithValidation.push(path.relative(ctx.path, file));
        }
      }

      return {
        passed: hasValidation,
        message: hasValidation
          ? 'Input validation or sanitization detected'
          : 'No input validation or sanitization found'
      };
    },
  },
  {
    id: 'sec-050',
    title: 'Authentication and authorization implementation',
    category: 'security',
    severity: 'high',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pkg = ctx.packageJson;
      if (!pkg) {
        return {
          passed: true,
          message: 'No package.json found; skipping auth check',
        };
      }

      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) } as Record<string, unknown>;
      const authLibraries = [
        'passport',
        'jsonwebtoken',
        'bcrypt',
        'argon2',
        'next-auth',
        '@auth0/nextjs-auth0',
        'supertokens-node',
        'firebase-admin',
        'aws-amplify',
        'cognito',
        'keycloak',
        'auth0-js',
        '@okta/okta-react',
        'clerk'
      ];

      const hasAuthLibs = authLibraries.some(lib => deps[lib]);

      // Check for auth-related files
      const files = await walkFiles(ctx.path);
      const authFiles = files.filter(file =>
        file.includes('auth') ||
        file.includes('login') ||
        file.includes('signin') ||
        file.includes('register') ||
        file.includes('middleware')
      );

      let hasAuthImplementation = false;
      for (const authFile of authFiles.slice(0, 10)) {
        const content = await readTextIfExists(authFile);
        if (content && (
          content.includes('authenticate') ||
          content.includes('authorize') ||
          content.includes('login') ||
          content.includes('signin') ||
          content.includes('jwt') ||
          content.includes('token')
        )) {
          hasAuthImplementation = true;
          break;
        }
      }

      const passed = hasAuthLibs || hasAuthImplementation;
      return {
        passed,
        message: passed
          ? 'Authentication/authorization libraries or implementation detected'
          : 'No authentication or authorization implementation found'
      };
    },
  },
  {
    id: 'complex-001',
    title: 'Function complexity monitoring',
    category: 'codeQuality',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, ['.js', '.jsx', '.ts', '.tsx', '.py']);
      let totalFunctions = 0;
      let complexFunctions = 0;
      const complexFiles: string[] = [];

      for (const file of files.slice(0, 20)) { // Limit for performance
        const content = await readTextIfExists(file);
        if (!content) continue;

        // Simple complexity detection based on patterns
        const functions = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(|def\s+\w+/g) || [];
        totalFunctions += functions.length;

        // Count complexity indicators
        const complexityIndicators = [
          /if\s*\(.*\)/g,
          /else\s*if/g,
          /for\s*\(/g,
          /while\s*\(/g,
          /switch\s*\(/g,
          /try\s*\{/g,
          /catch\s*\(/g,
          /&&|\|\|/g
        ];

        let fileComplexity = 0;
        for (const pattern of complexityIndicators) {
          const matches = content.match(pattern);
          if (matches) fileComplexity += matches.length;
        }

        // If average complexity per function is high, flag it
        if (functions.length > 0 && fileComplexity / functions.length > 5) {
          complexFunctions += functions.length;
          complexFiles.push(path.relative(ctx.path, file));
        }
      }

      const complexityRatio = totalFunctions > 0 ? complexFunctions / totalFunctions : 0;
      const passed = complexityRatio <= 0.3; // Allow up to 30% complex functions

      return {
        passed,
        message: passed
          ? `Function complexity acceptable: ${complexFunctions}/${totalFunctions} functions flagged as complex`
          : `High function complexity detected: ${complexFunctions}/${totalFunctions} functions flagged. Files: ${complexFiles.slice(0, 3).join(', ')}${complexFiles.length > 3 ? '...' : ''}`
      };
    },
  },
  {
    id: 'complex-002',
    title: 'File size and length monitoring',
    category: 'codeQuality',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs']);
      const largeFiles: string[] = [];
      let totalSize = 0;

      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          totalSize += stats.size;
          
          if (stats.size > 50000) { // Files larger than 50KB
            largeFiles.push(`${path.relative(ctx.path, file)} (${Math.round(stats.size / 1024)}KB)`);
          }
        } catch {
          continue;
        }
      }

      const passed = largeFiles.length <= 3;
      return {
        passed,
        message: passed
          ? `File sizes acceptable: ${largeFiles.length} files > 50KB`
          : `Large files detected: ${largeFiles.length} files > 50KB. Files: ${largeFiles.slice(0, 5).join(', ')}${largeFiles.length > 5 ? '...' : ''}`
      };
    },
  },
  {
    id: 'maintain-001',
    title: 'Code duplication detection',
    category: 'codeQuality',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, ['.js', '.jsx', '.ts', '.tsx', '.py']);
      const codeBlocks = new Map<string, number>();
      let totalBlocks = 0;

      for (const file of files.slice(0, 15)) { // Limit for performance
        const content = await readTextIfExists(file);
        if (!content) continue;

        // Split into blocks (functions, classes, etc.)
        const blocks = content.split(/\n\s*\n|\n\s*(function|class|def)\s+/);
        
        for (const block of blocks) {
          const trimmed = block.trim();
          if (trimmed.length > 50) { // Only consider substantial blocks
            const hash = require('crypto').createHash('md5').update(trimmed).digest('hex');
            codeBlocks.set(hash, (codeBlocks.get(hash) || 0) + 1);
            totalBlocks++;
          }
        }
      }

      const duplicatedBlocks = Array.from(codeBlocks.values()).filter(count => count > 1).length;
      const duplicationRatio = totalBlocks > 0 ? duplicatedBlocks / totalBlocks : 0;
      const passed = duplicationRatio <= 0.15; // Allow up to 15% duplication

      return {
        passed,
        message: passed
          ? `Code duplication acceptable: ${duplicatedBlocks}/${totalBlocks} blocks duplicated`
          : `High code duplication detected: ${duplicatedBlocks}/${totalBlocks} blocks duplicated (${(duplicationRatio * 100).toFixed(1)}%)`
      };
    },
  },
  {
    id: 'maintain-002',
    title: 'Error handling patterns',
    category: 'codeQuality',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go']);
      let filesWithErrorHandling = 0;
      let totalFiles = 0;
      const filesWithoutHandling: string[] = [];

      for (const file of files.slice(0, 20)) { // Limit for performance
        const content = await readTextIfExists(file);
        if (!content) continue;

        totalFiles++;
        
        const hasErrorHandling = (
          content.includes('try') && content.includes('catch') ||
          content.includes('try:') && content.includes('except') ||
          content.includes('if.*error') ||
          content.includes('.catch(') ||
          content.includes('error') && content.includes('handle')
        );

        if (hasErrorHandling) {
          filesWithErrorHandling++;
        } else {
          filesWithoutHandling.push(path.relative(ctx.path, file));
        }
      }

      const errorHandlingRatio = totalFiles > 0 ? filesWithErrorHandling / totalFiles : 0;
      const passed = errorHandlingRatio >= 0.6; // Expect at least 60% of files to have error handling

      return {
        passed,
        message: passed
          ? `Error handling adequate: ${filesWithErrorHandling}/${totalFiles} files have error handling`
          : `Insufficient error handling: only ${filesWithErrorHandling}/${totalFiles} files have error handling. Files without: ${filesWithoutHandling.slice(0, 5).join(', ')}${filesWithoutHandling.length > 5 ? '...' : ''}`
      };
    },
  },
  {
    id: 'obs-001',
    title: 'Logging implementation',
    category: 'observability',
    severity: 'medium',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pkg = ctx.packageJson;
      const files = await walkFiles(ctx.path, ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go']);
      
      // Check for logging libraries
      const deps = pkg ? { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) } as Record<string, unknown> : {};
      const loggingLibs = [
        'winston',
        'pino',
        'bunyan',
        'log4js',
        'debug',
        'morgan',
        'helmet',
        '@sentry/node',
        'loglevel',
        'consola'
      ];

      const hasLoggingLibs = loggingLibs.some(lib => deps[lib]);

      // Check for logging patterns in code
      let filesWithLogging = 0;
      for (const file of files.slice(0, 15)) { // Limit for performance
        const content = await readTextIfExists(file);
        if (!content) continue;

        const hasLogging = (
          content.includes('console.log') ||
          content.includes('console.error') ||
          content.includes('console.warn') ||
          content.includes('logger.') ||
          content.includes('log.') ||
          content.includes('print(') ||
          content.includes('logging.')
        );

        if (hasLogging) {
          filesWithLogging++;
        }
      }

      const passed = hasLoggingLibs || filesWithLogging > 0;
      return {
        passed,
        message: passed
          ? 'Logging implementation detected'
          : 'No logging implementation found'
      };
    },
  },
  {
    id: 'obs-002',
    title: 'Health check endpoints',
    category: 'observability',
    severity: 'low',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const files = await walkFiles(ctx.path, ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go']);
      let hasHealthCheck = false;

      for (const file of files.slice(0, 20)) { // Limit for performance
        const content = await readTextIfExists(file);
        if (!content) continue;

        const healthPatterns = [
          /health/i,
          /status/i,
          /ping/i,
          /alive/i,
          /ready/i,
          /\/health/,
          /\/status/,
          /\/ping/
        ];

        if (healthPatterns.some(pattern => pattern.test(content))) {
          hasHealthCheck = true;
          break;
        }
      }

      return {
        passed: hasHealthCheck,
        message: hasHealthCheck
          ? 'Health check endpoints detected'
          : 'No health check endpoints found'
      };
    },
  },
  {
    id: 'obs-003',
    title: 'Metrics and monitoring configuration',
    category: 'observability',
    severity: 'low',
    automated: true,
    checker: async (ctx: RepoContext) => {
      const pkg = ctx.packageJson;
      if (!pkg) {
        return {
          passed: true,
          message: 'No package.json found; skipping metrics check',
        };
      }

      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) } as Record<string, unknown>;
      const monitoringTools = [
        'prometheus-client',
        'prom-client',
        'metrics',
        'statsd',
        'datadog',
        'newrelic',
        'appdynamics',
        'dynatrace',
        '@opentelemetry/api',
        '@elastic/apm'
      ];

      const hasMonitoringTools = monitoringTools.some(tool => deps[tool]);

      // Check for monitoring configuration files
      const configFiles = await walkFiles(ctx.path, ['.js', '.ts', '.json', '.yml', '.yaml']);
      let hasMonitoringConfig = false;
      
      for (const configFile of configFiles.slice(0, 10)) {
        const content = await readTextIfExists(configFile);
        if (content && (
          content.includes('metrics') ||
          content.includes('monitoring') ||
          content.includes('prometheus') ||
          content.includes('datadog') ||
          content.includes('newrelic')
        )) {
          hasMonitoringConfig = true;
          break;
        }
      }

      const passed = hasMonitoringTools || hasMonitoringConfig;
      return {
        passed,
        message: passed
          ? 'Metrics and monitoring configuration detected'
          : 'No metrics and monitoring configuration found'
      };
    },
  },
];

export function getApplicableChecks(context: RepoContext): Check[] {
  const applicable = [...BASE_CHECKS];
  
  // Add package-specific checks based on detected packages
  for (const pkg of context.detectedPackages) {
    const packageChecks = PACKAGE_CHECKS[pkg.name];
    if (packageChecks) {
      applicable.push(...packageChecks);
    }
  }
  
  return applicable;
}

const PACKAGE_CHECKS: Record<string, Check[]> = {
  // Example package-specific check for OpenAI-style keys.
  openai: [
    {
      id: 'ai-001',
      title: 'OpenAI-style API keys not exposed in source',
      category: 'security',
      severity: 'blocker',
      automated: true,
      checker: async (ctx: RepoContext) => {
        const files = await walkFiles(ctx.path, [
          '.ts',
          '.tsx',
          '.js',
          '.jsx',
        ]);
        const foundInFiles: string[] = [];
        for (const file of files) {
          const content = await readTextIfExists(file);
          if (!content) continue;
          if (/sk-[A-Za-z0-9]{20,}/.test(content)) {
            foundInFiles.push(file);
          }
        }
        return {
          passed: foundInFiles.length === 0,
          message:
            foundInFiles.length === 0
              ? 'No OpenAI-style API keys detected in source'
              : `Possible OpenAI-style keys found in: ${foundInFiles.join(', ')}`,
        };
      },
    },
  ],
  playwright: [
    {
      id: 'pw-001',
      title: 'Avoid hard-coded waits in Playwright tests',
      category: 'testing',
      severity: 'medium',
      automated: true,
      checker: async (ctx: RepoContext) => {
        const files = await walkFiles(ctx.path, [
          '.ts',
          '.tsx',
          '.js',
          '.jsx',
        ]);
        const offenders: string[] = [];
        for (const file of files) {
          const content = await readTextIfExists(file);
          if (!content) continue;
          if (/\.waitForTimeout\s*\(/.test(content)) {
            offenders.push(file);
          }
        }
        return {
          passed: offenders.length === 0,
          message:
            offenders.length === 0
              ? 'No hard-coded Playwright waits detected'
              : `page.waitForTimeout found in: ${offenders.join(', ')}`,
        };
      },
    },
  ],
};
