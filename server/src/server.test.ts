// Basic tests for /api/repo-scan endpoints using Fastify's inject API.
// Uses ts-node via the npm test script.

// Configure environment before loading the server module so top-level
// constants (like ENABLE_LOCAL_REPO_SCAN) pick up these values.
process.env.API_ADMIN_TOKEN = process.env.API_ADMIN_TOKEN ?? 'test-admin-token';
process.env.ENABLE_LOCAL_REPO_SCAN = process.env.ENABLE_LOCAL_REPO_SCAN ?? 'false';

const assert = require('assert');
const { buildServer } = require('./server');

async function run() {
  const app = await buildServer();

  // 1) Unauthorized local scan should be rejected (no admin header)
  {
    const res = await app.inject({
      method: 'POST',
      url: '/api/repo-scan/local',
      payload: {},
    });
    assert.strictEqual(res.statusCode, 401, 'Expected 401 for missing admin token');
  }

  // 2) Local scan with admin token but feature disabled should return 403
  {
    const res = await app.inject({
      method: 'POST',
      url: '/api/repo-scan/local',
      headers: {
        'x-admin-token': process.env.API_ADMIN_TOKEN,
      },
      payload: {},
    });
    assert.strictEqual(res.statusCode, 403, 'Expected 403 when ENABLE_LOCAL_REPO_SCAN is false');
  }

  // 3) GitHub scan with admin token but no GITHUB_TOKEN should return 500
  {
    const res = await app.inject({
      method: 'POST',
      url: '/api/repo-scan/github',
      headers: {
        'x-admin-token': process.env.API_ADMIN_TOKEN,
      },
      payload: {
        repo: 'example-repo',
      },
    });
    assert.strictEqual(res.statusCode, 500, 'Expected 500 when GITHUB_TOKEN is not configured');
  }

  await app.close();
}

run().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
