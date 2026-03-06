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

export const NAV_ITEMS = [
  {
    id: ViewState.DASHBOARD,
    label: 'Dashboard',
    icon: LayoutDashboard,
    theme: 'sky',
  },
  {
    id: ViewState.PROJECT_STUDIO,
    label: 'SaaS Factory',
    icon: Factory,
    theme: 'pink',
  },
  {
    id: ViewState.ARCHI,
    label: 'Archi',
    icon: Brain,
    theme: 'cyan',
  },
  {
    id: ViewState.APP_IDEAS,
    label: 'App Ideas',
    icon: Lightbulb,
    theme: 'amber',
  },
  {
    id: ViewState.SUPABASE,
    label: 'Supabase',
    icon: Database,
    theme: 'emerald',
  },
  {
    id: ViewState.VERCEL,
    label: 'Vercel',
    icon: Triangle,
    theme: 'zinc',
  },
  {
    id: ViewState.DOCKER,
    label: 'Docker',
    icon: Container,
    theme: 'blue',
  },
  {
    id: ViewState.STRIPE,
    label: 'Stripe',
    icon: CreditCard,
    theme: 'violet',
  },
  {
    id: ViewState.HUGGING_FACE,
    label: 'Hugging Face',
    icon: Bot,
    theme: 'orange',
  },
  {
    id: ViewState.PROJECT_WORKSHOP,
    label: 'Workshop',
    icon: Wrench,
    theme: 'indigo',
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