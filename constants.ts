
import { Project, ProjectStatus, Deployment, Task, DependencyIssue, AppIdea, ViewState } from './types';
import { 
  LayoutDashboard, 
  Lightbulb,
  Database,
  Triangle,
  Container,
  CreditCard,
  Brain,
  Network
} from 'lucide-react';

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Dev Hub Core',
    description: 'The main platform monorepo including frontend and API services.',
    status: ProjectStatus.ACTIVE,
    techStack: ['React', 'Node.js', 'Supabase'],
    repoUrl: 'github.com/org/dev-hub',
    lastDeployed: '2h ago',
    healthScore: 92
  },
  {
    id: 'p2',
    name: 'Analytics Engine',
    description: 'Serverless functions for processing user telemetry data.',
    status: ProjectStatus.MAINTENANCE,
    techStack: ['Python', 'AWS Lambda', 'Redis'],
    repoUrl: 'github.com/org/analytics',
    lastDeployed: '1d ago',
    healthScore: 78
  },
  {
    id: 'p3',
    name: 'Marketing Landing',
    description: 'Static site generated marketing pages.',
    status: ProjectStatus.ACTIVE,
    techStack: ['Next.js', 'Tailwind'],
    repoUrl: 'github.com/org/landing',
    lastDeployed: '5m ago',
    healthScore: 100
  },
  {
    id: 'p4',
    name: 'Legacy Auth Service',
    description: 'Old authentication service to be deprecated.',
    status: ProjectStatus.CRITICAL,
    techStack: ['Express', 'MongoDB'],
    repoUrl: 'github.com/org/auth-v1',
    lastDeployed: '3w ago',
    healthScore: 45
  },
  {
    id: 'p5',
    name: 'Payments Worker',
    description: 'Stripe webhook processor and invoice generator queue.',
    status: ProjectStatus.ACTIVE,
    techStack: ['TypeScript', 'Worker', 'Stripe'],
    repoUrl: 'github.com/org/payments',
    lastDeployed: '4h ago',
    healthScore: 98
  },
  {
    id: 'p6',
    name: 'Mobile App (iOS)',
    description: 'Native iOS application for the customer facing platform.',
    status: ProjectStatus.ACTIVE,
    techStack: ['Swift', 'SwiftUI'],
    repoUrl: 'github.com/org/ios-app',
    lastDeployed: '12h ago',
    healthScore: 85
  },
  {
    id: 'p7',
    name: 'Documentation Site',
    description: 'Public facing documentation built with Docusaurus.',
    status: ProjectStatus.MAINTENANCE,
    techStack: ['React', 'MDX'],
    repoUrl: 'github.com/org/docs',
    lastDeployed: '2d ago',
    healthScore: 91
  },
  {
    id: 'p8',
    name: 'Internal Dashboard',
    description: 'Admin tools for customer support and operations.',
    status: ProjectStatus.ACTIVE,
    techStack: ['Vue', 'Laravel'],
    repoUrl: 'github.com/org/admin',
    lastDeployed: '5h ago',
    healthScore: 88
  }
];

export const RECENT_DEPLOYMENTS: Deployment[] = [
  { id: 'd1', projectId: 'p3', projectName: 'Marketing Landing', status: 'success', timestamp: '5m ago', commitHash: 'a1b2c3', branch: 'main' },
  { id: 'd2', projectId: 'p1', projectName: 'Dev Hub Core', status: 'building', timestamp: '12m ago', commitHash: 'd4e5f6', branch: 'feat/ai-chat' },
  { id: 'd3', projectId: 'p2', projectName: 'Analytics Engine', status: 'failed', timestamp: '1d ago', commitHash: 'g7h8i9', branch: 'fix/data-loss' },
  { id: 'd4', projectId: 'p1', projectName: 'Dev Hub Core', status: 'success', timestamp: '2h ago', commitHash: 'j0k1l2', branch: 'main' },
];

export const NAV_ITEMS: { id: ViewState; label: string; icon: any; theme: 'sky' | 'amber' | 'indigo' | 'emerald' | 'zinc' | 'blue' | 'violet' | 'orange'; }[] = [
  { id: ViewState.DASHBOARD, label: 'Command Center', icon: LayoutDashboard, theme: 'sky' },
  { id: ViewState.APP_IDEAS, label: 'Vibe Coder', icon: Lightbulb, theme: 'amber' },
  { id: ViewState.API_EXPLORER, label: 'API Explorer', icon: Network, theme: 'indigo' },
  { id: ViewState.SUPABASE, label: 'Supabase', icon: Database, theme: 'emerald' },
  { id: ViewState.VERCEL, label: 'Vercel', icon: Triangle, theme: 'zinc' },
  { id: ViewState.DOCKER, label: 'Docker', icon: Container, theme: 'blue' },
  { id: ViewState.STRIPE, label: 'Stripe', icon: CreditCard, theme: 'violet' },
  { id: ViewState.HUGGING_FACE, label: 'Hugging Face', icon: Brain, theme: 'orange' },
];

export const INTEGRATIONS: Partial<Record<ViewState, { title: string; icon: any; description: string; color: string; gradient: string }>> = {
  [ViewState.SUPABASE]: {
    title: 'Supabase',
    icon: Database,
    description: 'Manage your database, authentication, and edge functions directly from Dev Hub.',
    color: 'bg-emerald-500',
    gradient: 'bg-emerald-500',
  },
  [ViewState.VERCEL]: {
    title: 'Vercel',
    icon: Triangle,
    description: 'Monitor deployments, manage domains, and view build logs in real-time.',
    color: 'bg-white',
    gradient: 'bg-zinc-500',
  },
  [ViewState.DOCKER]: {
    title: 'Docker',
    icon: Container,
    description: 'Orchestrate containers, view images, and manage local development environments.',
    color: 'bg-blue-500',
    gradient: 'bg-blue-600',
  },
  [ViewState.STRIPE]: {
    title: 'Stripe',
    icon: CreditCard,
    description: 'View payments, manage subscriptions, and handle webhooks for your SaaS products.',
    color: 'bg-violet-500',
    gradient: 'bg-violet-600',
  },
  [ViewState.HUGGING_FACE]: {
    title: 'Hugging Face',
    icon: Brain,
    description: 'Browse models, manage datasets, and deploy inference endpoints effortlessly.',
    color: 'bg-orange-500',
    gradient: 'bg-orange-500',
  },
};

export const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Fix memory leak in analytics worker', status: 'in-progress', priority: 'high' },
  { id: 't2', title: 'Update dependency: react-router', status: 'todo', priority: 'medium' },
  { id: 't3', title: 'Write documentation for API v2', status: 'todo', priority: 'low' },
];

export const MOCK_DEPENDENCY_ISSUES: DependencyIssue[] = [
  { 
    id: 'dep1', 
    projectId: 'p1', 
    packageName: 'react-router-dom', 
    currentVersion: '5.3.4', 
    latestVersion: '6.22.0', 
    severity: 'high', 
    status: 'open',
    riskScore: 8
  },
  { 
    id: 'dep2', 
    projectId: 'p1', 
    packageName: 'axios', 
    currentVersion: '0.21.1', 
    latestVersion: '1.6.7', 
    severity: 'critical', 
    status: 'open',
    riskScore: 10 
  },
  { 
    id: 'dep3', 
    projectId: 'p2', 
    packageName: 'boto3', 
    currentVersion: '1.26.0', 
    latestVersion: '1.34.0', 
    severity: 'low', 
    status: 'open',
    riskScore: 2
  },
  { 
    id: 'dep4', 
    projectId: 'p4', 
    packageName: 'mongoose', 
    currentVersion: '5.13.17', 
    latestVersion: '8.1.1', 
    severity: 'medium', 
    status: 'open',
    riskScore: 6
  },
];

export const MOCK_APP_IDEAS: AppIdea[] = [
  {
    id: 'idea-1',
    title: 'AI Real Estate Stager',
    description: 'A mobile app that lets real estate agents take photos of empty rooms and automatically stages them with virtual furniture using generative AI.',
    problemStatement: 'Physical staging costs thousands of dollars and takes days. Agents need a way to show potential immediately without moving heavy furniture.',
    tags: ['SaaS', 'AI', 'Mobile'],
    createdAt: '2024-03-10',
    updatedAt: '2024-03-12',
    status: 'planned',
    features: [
      'Camera integration with AR preview',
      'Room dimension scanner',
      'Style selection (Modern, Rustic, Industrial)',
      'Export high-res images for listings',
      'Furniture catalogue integration'
    ],
    targetAudience: 'Real estate agents, interior designers, and home sellers.',
    revenueModel: 'Freemium with monthly subscription for unlimited exports.',
    marketingStrategy: 'Partner with real estate brokerages for bulk licensing. Viral TikTok content showing "Boring Room vs AI Room" transformations.',
    techStackSuggestion: 'React Native for mobile, Python/FastAPI for backend, Stable Diffusion/ControlNet for the AI generation, Firebase for auth.',
    mermaidDiagram: `graph TD
    A[User Takes Photo] --> B{Check Subscription}
    B -- Premium --> C[High Res Upload]
    B -- Free --> D[Standard Upload]
    C --> E[AI Processing Pipeline]
    D --> E
    E --> F[Identify Floor Plane]
    F --> G[Place 3D Furniture Models]
    G --> H[Render Final Image]
    H --> I[User Gallery]`,
    notes: 'Check competitive landscape for "Virtual Staging AI".'
  },
  {
    id: 'idea-2',
    title: 'Freelance Tax Vault',
    description: 'Automated tax savings tool for freelancers that connects to bank accounts and automatically moves a percentage of every deposit into a high-yield savings account.',
    problemStatement: 'Freelancers constantly forget to save for taxes, leading to massive panic in April. They need "set it and forget it" automation.',
    tags: ['Fintech', 'Web', 'Automation'],
    createdAt: '2024-02-28',
    updatedAt: '2024-03-01',
    status: 'draft',
    features: [
      'Plaid integration for bank connection',
      'Customizable withholding rules',
      'Quarterly tax payment reminders',
      'Expense categorization',
      'Year-end tax report generation'
    ],
    targetAudience: 'Freelancers, gig workers, and solopreneurs in the US.',
    revenueModel: '0.5% fee on transfers or flat $10/mo subscription.',
    marketingStrategy: 'Content marketing on "freelance finance" blogs. Influencer partnerships with gig-economy YouTubers.',
    techStackSuggestion: 'Next.js for frontend, Node.js/Express for API, Plaid API for banking, PostgreSQL for ledger.',
    mermaidDiagram: `sequenceDiagram
    participant User
    participant App
    participant Plaid
    participant Bank
    User->>App: Connect Bank Account
    App->>Plaid: Auth Request
    Plaid->>Bank: Verify Creds
    Bank-->>App: Connected
    loop Every Day
        App->>Bank: Check for new Deposits
        Bank-->>App: New Deposit Found ($1000)
        App->>App: Calculate Tax (30% = $300)
        App->>Bank: Initiate Transfer to Vault
    end`,
  }
];
