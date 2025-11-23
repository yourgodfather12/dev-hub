import { prisma } from './prisma';

async function main() {
  // Clear existing data
  await prisma.deployment.deleteMany();
  await prisma.dependencyIssue.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.appIdea.deleteMany();

  // Seed projects (mirroring constants.ts)
  await prisma.project.createMany({
    data: [
      {
        id: 'p1',
        name: 'Dev Hub Core',
        description: 'The main platform monorepo including frontend and API services.',
        status: 'ACTIVE',
        techStackJson: JSON.stringify(['React', 'Node.js', 'Supabase']),
        repoUrl: 'https://github.com/org/dev-hub',
        lastDeployedAt: new Date(),
        healthScore: 92,
      },
      {
        id: 'p2',
        name: 'Analytics Engine',
        description: 'Serverless functions for processing user telemetry data.',
        status: 'MAINTENANCE',
        techStackJson: JSON.stringify(['Python', 'AWS Lambda', 'Redis']),
        repoUrl: 'https://github.com/org/analytics',
        lastDeployedAt: new Date(),
        healthScore: 78,
      },
      {
        id: 'p3',
        name: 'Marketing Landing',
        description: 'Static site generated marketing pages.',
        status: 'ACTIVE',
        techStackJson: JSON.stringify(['Next.js', 'Tailwind']),
        repoUrl: 'https://github.com/org/landing',
        lastDeployedAt: new Date(),
        healthScore: 100,
      },
      {
        id: 'p4',
        name: 'Legacy Auth Service',
        description: 'Old authentication service to be deprecated.',
        status: 'CRITICAL',
        techStackJson: JSON.stringify(['Express', 'MongoDB']),
        repoUrl: 'https://github.com/org/auth-v1',
        lastDeployedAt: new Date(),
        healthScore: 45,
      },
    ],
  });

  await prisma.deployment.createMany({
    data: [
      {
        id: 'd1',
        projectId: 'p3',
        status: 'SUCCESS',
        timestamp: new Date(),
        commitHash: 'a1b2c3',
        branch: 'main',
      },
      {
        id: 'd2',
        projectId: 'p1',
        status: 'BUILDING',
        timestamp: new Date(),
        commitHash: 'd4e5f6',
        branch: 'feat/ai-chat',
      },
      {
        id: 'd3',
        projectId: 'p2',
        status: 'FAILED',
        timestamp: new Date(),
        commitHash: 'g7h8i9',
        branch: 'fix/data-loss',
      },
    ],
  });

  await prisma.dependencyIssue.createMany({
    data: [
      {
        id: 'dep1',
        projectId: 'p1',
        packageName: 'react-router-dom',
        currentVersion: '5.3.4',
        latestVersion: '6.22.0',
        severity: 'HIGH',
        status: 'OPEN',
        riskScore: 8,
      },
      {
        id: 'dep2',
        projectId: 'p1',
        packageName: 'axios',
        currentVersion: '0.21.1',
        latestVersion: '1.6.7',
        severity: 'CRITICAL',
        status: 'OPEN',
        riskScore: 10,
      },
      {
        id: 'dep3',
        projectId: 'p2',
        packageName: 'boto3',
        currentVersion: '1.26.0',
        latestVersion: '1.34.0',
        severity: 'LOW',
        status: 'OPEN',
        riskScore: 2,
      },
      {
        id: 'dep4',
        projectId: 'p4',
        packageName: 'mongoose',
        currentVersion: '5.13.17',
        latestVersion: '8.1.1',
        severity: 'MEDIUM',
        status: 'OPEN',
        riskScore: 6,
      },
    ],
  });

  await prisma.appIdea.createMany({
    data: [
      {
        id: 'idea-1',
        title: 'AI Real Estate Stager',
        description: 'A mobile app that lets real estate agents take photos of empty rooms and automatically stages them with virtual furniture using generative AI.',
        problemStatement: 'Physical staging costs thousands of dollars and takes days. Agents need a way to show potential immediately without moving heavy furniture.',
        featuresJson: JSON.stringify([
          'Camera integration with AR preview',
          'Room dimension scanner',
          'Style selection (Modern, Rustic, Industrial)',
          'Export high-res images for listings',
          'Furniture catalogue integration',
        ]),
        targetAudience: 'Real estate agents, interior designers, and home sellers.',
        revenueModel: 'Freemium with monthly subscription for unlimited exports.',
        marketingStrategy: 'Partner with real estate brokerages for bulk licensing. Viral TikTok content showing "Boring Room vs AI Room" transformations.',
        techStackSuggestion: 'React Native for mobile, Python/FastAPI for backend, Stable Diffusion/ControlNet for the AI generation, Firebase for auth.',
        mermaidDiagram:
          'graph TD\n    A[User Takes Photo] --> B{Check Subscription}\n    B -- Premium --> C[High Res Upload]\n    B -- Free --> D[Standard Upload]\n    C --> E[AI Processing Pipeline]\n    D --> E\n    E --> F[Identify Floor Plane]\n    F --> G[Place 3D Furniture Models]\n    G --> H[Render Final Image]\n    H --> I[User Gallery]',
        tagsJson: JSON.stringify(['SaaS', 'AI', 'Mobile']),
        status: 'PLANNED',
        notes: 'Check competitive landscape for "Virtual Staging AI".',
      },
      {
        id: 'idea-2',
        title: 'Freelance Tax Vault',
        description: 'Automated tax savings tool for freelancers that connects to bank accounts and automatically moves a percentage of every deposit into a high-yield savings account.',
        problemStatement: 'Freelancers constantly forget to save for taxes, leading to massive panic in April. They need "set it and forget it" automation.',
        featuresJson: JSON.stringify([
          'Plaid integration for bank connection',
          'Customizable withholding rules',
          'Quarterly tax payment reminders',
          'Expense categorization',
          'Year-end tax report generation',
        ]),
        targetAudience: 'Freelancers, gig workers, and solopreneurs in the US.',
        revenueModel: '0.5% fee on transfers or flat $10/mo subscription.',
        marketingStrategy: 'Content marketing on "freelance finance" blogs. Influencer partnerships with gig-economy YouTubers.',
        techStackSuggestion: 'Next.js for frontend, Node.js/Express for API, Plaid API for banking, PostgreSQL for ledger.',
        mermaidDiagram:
          'sequenceDiagram\n    participant User\n    participant App\n    participant Plaid\n    participant Bank\n    User->>App: Connect Bank Account\n    App->>Plaid: Auth Request\n    Plaid->>Bank: Verify Creds\n    Bank-->>App: Connected\n    loop Every Day\n        App->>Bank: Check for new Deposits\n        Bank-->>App: New Deposit Found ($1000)\n        App->>App: Calculate Tax (30% = $300)\n        App->>Bank: Initiate Transfer to Vault\n    end',
        tagsJson: JSON.stringify(['Fintech', 'Web', 'Automation']),
        status: 'DRAFT',
        notes: null,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
