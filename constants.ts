import { ViewState } from './types';
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
