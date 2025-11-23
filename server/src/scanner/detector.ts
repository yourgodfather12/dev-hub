import { promises as fs } from 'fs';
import * as path from 'path';
import { NICHE_PACKAGES } from './constants';
import { DetectedPackage, PackageJsonLike, RepoContext } from './types';
import { readJsonIfExists, readTextIfExists, walkFiles } from './utils';

export async function analyzeRepo(repoPath: string): Promise<RepoContext> {
  const context: RepoContext = {
    path: repoPath,
    packageJson: undefined,
    requirementsTxt: undefined,
    hasDockerfile: false,
    hasCI: false,
    frameworks: [],
    detectedPackages: [],
    languages: [],
    packageJsonPaths: [],
    requirementsPaths: [],
  };

  context.packageJson = await readJsonIfExists<PackageJsonLike>(
    path.join(repoPath, 'package.json'),
  );
  context.requirementsTxt = await readTextIfExists(
    path.join(repoPath, 'requirements.txt'),
  );

  let rootEntries: import('fs').Dirent[] = [];
  try {
    rootEntries = await fs.readdir(repoPath, { withFileTypes: true });
  } catch {
    rootEntries = [];
  }

  context.hasDockerfile = rootEntries.some(
    (e) => e.isFile() && e.name === 'Dockerfile',
  );
  context.hasCI = rootEntries.some(
    (e) =>
      (e.isDirectory() && e.name === '.github') ||
      (e.isFile() &&
        (e.name === '.gitlab-ci.yml' ||
          e.name === 'azure-pipelines.yml' ||
          e.name === '.circleci')),
  );

  const allFiles = await walkFiles(repoPath);

  const packageJsonPaths: string[] = [];
  const requirementsPaths: string[] = [];
  for (const filePath of allFiles) {
    const base = path.basename(filePath).toLowerCase();
    if (base === 'package.json') {
      packageJsonPaths.push(filePath);
      continue;
    }
    if (
      base === 'requirements.txt' ||
      base === 'pyproject.toml' ||
      base === 'pipfile'
    ) {
      requirementsPaths.push(filePath);
      continue;
    }
  }
  context.packageJsonPaths = packageJsonPaths.map((p) =>
    path.relative(repoPath, p),
  );
  context.requirementsPaths = requirementsPaths.map((p) =>
    path.relative(repoPath, p),
  );

  const frameworks: string[] = [];
  const addFramework = (name: string) => {
    if (!frameworks.includes(name)) {
      frameworks.push(name);
    }
  };

  const detectFrameworksFromPackageJson = async (
    pkgPath: string,
  ): Promise<void> => {
    const pkg = await readJsonIfExists<PackageJsonLike>(pkgPath);
    if (!pkg) return;
    const deps = pkg.dependencies ?? {};
    const devDeps = pkg.devDependencies ?? {};
    const hasDep = (name: string) => Boolean(deps[name] || devDeps[name]);

    if (hasDep('next')) addFramework('nextjs');
    if (hasDep('react')) addFramework('react');
    if (hasDep('remix')) addFramework('remix');
    if (hasDep('nuxt') || hasDep('nuxt3')) addFramework('nuxt');
    if (hasDep('svelte') || hasDep('@sveltejs/kit')) addFramework('sveltekit');
    if (hasDep('@nestjs/core')) addFramework('nestjs');
    if (hasDep('express')) addFramework('express');
    if (hasDep('fastify')) addFramework('fastify');
    if (hasDep('koa')) addFramework('koa');
    if (hasDep('react-native')) addFramework('react-native');
    if (hasDep('expo')) addFramework('expo');

    const hasWorkspaces =
      (pkg as { workspaces?: unknown }).workspaces !== undefined ||
      Boolean((pkg as { packages?: unknown }).packages);
    if (hasWorkspaces) {
      addFramework('monorepo');
    }

    if (hasDep('turbo')) addFramework('turbo-repo');
    if (hasDep('nx')) addFramework('nx-workspace');
  };

  if (context.packageJson) {
    await detectFrameworksFromPackageJson(path.join(repoPath, 'package.json'));
  }
  for (const pkgPath of packageJsonPaths) {
    if (pkgPath === path.join(repoPath, 'package.json')) continue;
    await detectFrameworksFromPackageJson(pkgPath);
  }

  const detectPythonFrameworks = (content: string | undefined) => {
    if (!content) return;
    const lower = content.toLowerCase();
    if (lower.includes('django')) addFramework('django');
    if (lower.includes('flask')) addFramework('flask');
    if (lower.includes('fastapi')) addFramework('fastapi');
  };

  if (context.requirementsTxt) {
    detectPythonFrameworks(context.requirementsTxt);
  }
  for (const reqPath of requirementsPaths) {
    if (reqPath === path.join(repoPath, 'requirements.txt')) continue;
    const text = await readTextIfExists(reqPath);
    if (text) detectPythonFrameworks(text);
  }

  context.frameworks = Array.from(new Set(frameworks));

  const languageByExt: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.java': 'java',
    '.kt': 'kotlin',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.php': 'php',
    '.cs': 'csharp',
    '.cpp': 'cpp',
    '.c': 'c',
    '.swift': 'swift',
  };
  const languages = new Set<string>();
  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    const lang = languageByExt[ext];
    if (lang) {
      languages.add(lang);
    }
  }
  context.languages = Array.from(languages);

  const pkg = context.packageJson;
  context.detectedPackages = detectPackages(pkg, context.requirementsTxt);

  return context;
}

function detectPackages(
  pkg: PackageJsonLike | undefined,
  requirementsTxt?: string,
): DetectedPackage[] {
  const detected: DetectedPackage[] = [];

  const add = (name: string, version?: string) => {
    const niche = NICHE_PACKAGES[name];
    if (!niche) return;
    if (detected.some((p) => p.name === name)) return;
    const entry: DetectedPackage = {
      name,
      category: niche.category,
      riskLevel: niche.riskLevel,
    };
    if (typeof version === 'string') {
      entry.version = version;
    }
    detected.push(entry);
  };

  if (pkg) {
    for (const [name, version] of Object.entries<
      string | number | undefined
    >(pkg.dependencies ?? {})) {
      add(name, version != null ? String(version) : undefined);
    }
    for (const [name, version] of Object.entries<
      string | number | undefined
    >(pkg.devDependencies ?? {})) {
      add(name, version != null ? String(version) : undefined);
    }
  }

  if (requirementsTxt) {
    const lines = requirementsTxt.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [namePart, versionPart] = trimmed.split(/==|>=|<=|>|</, 2);
      if (!namePart) continue;
      const pkgName = namePart.trim();
      if (!pkgName) continue;
      const version =
        typeof versionPart === 'string' ? versionPart.trim() : undefined;
      add(pkgName, version);
    }
  }

  return detected;
}
