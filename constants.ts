import { ViewState } from './types';
import {
  LayoutDashboard,
  Database,
  Triangle,
  Container,
  CreditCard,
  Bot,
  Brain,
  Wrench,
  Factory,
  Lightbulb,
  Cpu,
} from 'lucide-react';

export type NavSection = 'Overview' | 'Build' | 'Integrations' | 'Operations';

export interface NavItem {
  id: ViewState;
  label: string;
  shortLabel?: string;
  hint: string;
  icon: any;
  theme: 'sky' | 'amber' | 'emerald' | 'zinc' | 'blue' | 'violet' | 'orange' | 'pink' | 'indigo' | 'cyan';
  section: NavSection;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: ViewState.DASHBOARD,
    label: 'Dashboard',
    hint: 'System overview and activity',
    icon: LayoutDashboard,
    theme: 'sky',
    section: 'Overview',
  },
  {
    id: ViewState.PROJECT_STUDIO,
    label: 'SaaS Factory',
    shortLabel: 'Project Studio',
    hint: 'Plan and run multi-product workflows',
    icon: Factory,
    theme: 'pink',
    section: 'Build',
  },
  {
    id: ViewState.ARCHI,
    label: 'Architecture',
    shortLabel: 'Archi',
    hint: 'Agent architecture and orchestration',
    icon: Brain,
    theme: 'cyan',
    section: 'Build',
  },
  {
    id: ViewState.APP_IDEAS,
    label: 'App Ideas',
    hint: 'Generate and score product concepts',
    icon: Lightbulb,
    theme: 'amber',
    section: 'Build',
  },
  {
    id: ViewState.SUPABASE,
    label: 'Supabase',
    hint: 'Database, auth, and edge functions',
    icon: Database,
    theme: 'emerald',
    section: 'Integrations',
  },
  {
    id: ViewState.VERCEL,
    label: 'Vercel',
    hint: 'Deployments, domains, and logs',
    icon: Triangle,
    theme: 'zinc',
    section: 'Integrations',
  },
  {
    id: ViewState.DOCKER,
    label: 'Docker',
    hint: 'Containers and environments',
    icon: Container,
    theme: 'blue',
    section: 'Integrations',
  },
  {
    id: ViewState.STRIPE,
    label: 'Stripe',
    hint: 'Payments and subscriptions',
    icon: CreditCard,
    theme: 'violet',
    section: 'Integrations',
  },
  {
    id: ViewState.HUGGING_FACE,
    label: 'Hugging Face',
    hint: 'Models and inference endpoints',
    icon: Bot,
    theme: 'orange',
    section: 'Integrations',
  },
  {
    id: ViewState.PROJECT_WORKSHOP,
    label: 'Workshop',
    shortLabel: 'Operations Workshop',
    hint: 'Operational tasks and utilities',
    icon: Wrench,
    theme: 'indigo',
    section: 'Operations',
  },
] as const;

export const INTEGRATIONS: Partial<
  Record<
    ViewState,
    {
      title: string;
      icon: any;
      description: string;
      color: string;
      gradient: string;
    }
  >
> = {
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
  [ViewState.ARCHI]: {
    title: 'Archi',
    icon: Cpu,
    description: 'OpenClaw operator center for orchestrating agents, audits, and execution workflows.',
    color: 'bg-cyan-500',
    gradient: 'bg-cyan-500',
  },
  [ViewState.PROJECT_STUDIO]: {
    title: 'SaaS Factory',
    icon: Factory,
    description: 'Plan, organize, and operate multiple SaaS products from one execution layer.',
    color: 'bg-pink-500',
    gradient: 'bg-pink-500',
  },
  [ViewState.APP_IDEAS]: {
    title: 'App Ideas',
    icon: Lightbulb,
    description: 'Generate, rank, and refine product ideas based on leverage, demand, and buildability.',
    color: 'bg-amber-500',
    gradient: 'bg-amber-500',
  },
};
