import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { analyzeRepo } from './scanner/detector';
import { runAllChecks } from './scanner/runner';
import { ScanReport } from './scanner/types';

function sanitizeGitOutput(output: string): string {
  return output.replace(
    /x-access-token:[^@]+@github\.com/gi,
    'x-access-token:[REDACTED]@github.com',
  );
}

function execGit(args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd }, (error, stdout, stderr) => {
      if (error) {
        const output =
          (stderr && stderr.toString()) ||
          (stdout && stdout.toString()) ||
          error.message;
        const sanitizedOutput = sanitizeGitOutput(output);
        reject(new Error(`git command failed: ${sanitizedOutput}`));
        return;
      }
      resolve();
    });
  });
}

export async function scanGithubRepo(options: {
  owner: string;
  repo: string;
  ref?: string | undefined;
  token: string;
}): Promise<ScanReport> {
  const { owner, repo, ref, token } = options;

  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'devhub-scan-'));
  const targetDir = path.join(tmpRoot, `${owner.replace('/', '_')}-${repo}`);

  const remote = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
  const args: string[] = ['clone', '--depth=1'];
  if (ref && ref.trim()) {
    args.push('--branch', ref.trim());
  }
  args.push(remote, targetDir);

  try {
    await execGit(args);
    const context = await analyzeRepo(targetDir);
    const report = await runAllChecks(context);
    return {
      ...report,
      repoPath: `${owner}/${repo}`,
    };
  } finally {
    try {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    } catch {
    }
  }
}
