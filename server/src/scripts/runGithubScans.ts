import 'dotenv/config';

type GithubRepo = {
  name: string;
  owner: { login: string };
  private: boolean;
};

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';
const ADMIN_TOKEN = process.env.API_ADMIN_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER_ALLOWLIST = (process.env.GITHUB_OWNER_ALLOWLIST ?? '')
  .split(',')
  .map((owner) => owner.trim().toLowerCase())
  .filter(Boolean);

if (!ADMIN_TOKEN) {
  throw new Error('API_ADMIN_TOKEN is required to run GitHub scans.');
}

if (!GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN is required to fetch repositories and run scans.');
}

async function fetchAllRepos(): Promise<GithubRepo[]> {
  const repos: GithubRepo[] = [];
  let nextUrl: string | null =
    'https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator,organization_member&sort=updated';

  while (nextUrl) {
    const response: Awaited<ReturnType<typeof fetch>> = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub API ${response.status}: ${body}`);
    }

    const pageData = (await response.json()) as GithubRepo[];
    repos.push(...pageData);

    const link: string | null = response.headers.get('link');
    if (link && link.includes('rel="next"')) {
      const match: RegExpMatchArray | null = link.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = match?.[1] ?? null;
    } else {
      nextUrl = null;
    }
  }

  if (OWNER_ALLOWLIST.length > 0) {
    return repos.filter((repo) => OWNER_ALLOWLIST.includes(repo.owner.login.toLowerCase()));
  }

  return repos;
}

async function runScan(owner: string, repo: string) {
  const url = `${BACKEND_URL}/api/repo-scan/github`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN!,
    },
    body: JSON.stringify({ owner, repo }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message ?? response.statusText;
    throw new Error(`Scan failed for ${owner}/${repo}: ${message}`);
  }

  return payload;
}

async function main() {
  console.log(`Fetching repositories with token owner allowlist: ${OWNER_ALLOWLIST.join(', ') || '(none)'}`);
  const repos = await fetchAllRepos();
  console.log(`Found ${repos.length} repositories to scan.`);

  let success = 0;
  let failed = 0;

  for (const repo of repos) {
    const repoPath = `${repo.owner.login}/${repo.name}`;
    process.stdout.write(`Scanning ${repoPath} ... `);
    try {
      await runScan(repo.owner.login, repo.name);
      success += 1;
      console.log('done');
    } catch (error) {
      failed += 1;
      console.log('failed');
      console.error((error as Error).message);
    }

    // Gentle delay to avoid hammering the backend/GitHub
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log(`\nScan complete. Success: ${success}, Failed: ${failed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
