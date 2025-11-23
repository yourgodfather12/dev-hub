import { CategoryId, PackageCategory, RiskLevel, Severity } from './types';

export const NICHE_PACKAGES: Record<
  string,
  { category: PackageCategory; riskLevel: RiskLevel }
> = {
  // ===== ML/AI =====
  transformers: { category: 'ml', riskLevel: 'high' },
  '@huggingface/transformers': { category: 'ml', riskLevel: 'high' },
  langchain: { category: 'ml', riskLevel: 'high' },
  llamaindex: { category: 'ml', riskLevel: 'high' },
  torch: { category: 'ml', riskLevel: 'critical' },
  pytorch: { category: 'ml', riskLevel: 'critical' },
  tensorflow: { category: 'ml', riskLevel: 'critical' },
  keras: { category: 'ml', riskLevel: 'high' },
  'scikit-learn': { category: 'ml', riskLevel: 'medium' },
  openai: { category: 'ml', riskLevel: 'critical' },
  anthropic: { category: 'ml', riskLevel: 'critical' },
  cohere: { category: 'ml', riskLevel: 'high' },
  replicate: { category: 'ml', riskLevel: 'high' },
  chromadb: { category: 'ml', riskLevel: 'medium' },
  'pinecone-client': { category: 'ml', riskLevel: 'medium' },
  'weaviate-client': { category: 'ml', riskLevel: 'medium' },

  // ===== Automation =====
  playwright: { category: 'automation', riskLevel: 'medium' },
  puppeteer: { category: 'automation', riskLevel: 'medium' },
  'selenium-webdriver': { category: 'automation', riskLevel: 'medium' },
  scrapy: { category: 'automation', riskLevel: 'medium' },

  // ===== Blockchain =====
  ethers: { category: 'blockchain', riskLevel: 'critical' },
  web3: { category: 'blockchain', riskLevel: 'critical' },
  '@solana/web3.js': { category: 'blockchain', riskLevel: 'critical' },
  hardhat: { category: 'blockchain', riskLevel: 'high' },

  // ===== Infrastructure =====
  'aws-sdk': { category: 'infra', riskLevel: 'critical' },
  '@aws-sdk/client-s3': { category: 'infra', riskLevel: 'high' },
  '@aws-sdk/client-dynamodb': { category: 'infra', riskLevel: 'high' },
  '@aws-sdk/client-lambda': { category: 'infra', riskLevel: 'high' },
  'aws-cognito': { category: 'infra', riskLevel: 'high' },
  stripe: { category: 'infra', riskLevel: 'critical' },
  '@stripe/stripe-js': { category: 'infra', riskLevel: 'high' },
  'twilio': { category: 'infra', riskLevel: 'high' },
  'sendgrid': { category: 'infra', riskLevel: 'medium' },
  'nodemailer': { category: 'infra', riskLevel: 'medium' },
  'redis': { category: 'infra', riskLevel: 'medium' },
  'ioredis': { category: 'infra', riskLevel: 'medium' },
  'mongodb': { category: 'infra', riskLevel: 'medium' },
  'mongoose': { category: 'infra', riskLevel: 'medium' },
  'prisma': { category: 'infra', riskLevel: 'medium' },
  '@prisma/client': { category: 'infra', riskLevel: 'medium' },
  'typeorm': { category: 'infra', riskLevel: 'medium' },
  'sequelize': { category: 'infra', riskLevel: 'medium' },

  // ===== Data =====
  'd3': { category: 'data', riskLevel: 'medium' },
  'chart.js': { category: 'data', riskLevel: 'medium' },
  'recharts': { category: 'data', riskLevel: 'medium' },
  'apexcharts': { category: 'data', riskLevel: 'medium' },
  'plotly': { category: 'data', riskLevel: 'medium' },
  'highcharts': { category: 'data', riskLevel: 'medium' },
  'pandas': { category: 'data', riskLevel: 'medium' },
  'numpy': { category: 'data', riskLevel: 'medium' },
  'matplotlib': { category: 'data', riskLevel: 'medium' },
  'seaborn': { category: 'data', riskLevel: 'medium' },

  // ===== UI =====
  '@mui/material': { category: 'ui', riskLevel: 'low' },
  '@mui/icons-material': { category: 'ui', riskLevel: 'low' },
  'antd': { category: 'ui', riskLevel: 'low' },
  '@chakra-ui/react': { category: 'ui', riskLevel: 'low' },
  'tailwindcss': { category: 'ui', riskLevel: 'low' },
  'styled-components': { category: 'ui', riskLevel: 'low' },
  'emotion': { category: 'ui', riskLevel: 'low' },
  'framer-motion': { category: 'ui', riskLevel: 'low' },
  'three': { category: 'ui', riskLevel: 'medium' },
  '@react-three/fiber': { category: 'ui', riskLevel: 'medium' },
  'react-spring': { category: 'ui', riskLevel: 'low' },

  // ===== Realtime =====
  'socket.io': { category: 'realtime', riskLevel: 'medium' },
  'socket.io-client': { category: 'realtime', riskLevel: 'medium' },
  '@socket.io/redis-adapter': { category: 'realtime', riskLevel: 'medium' },
  'ws': { category: 'realtime', riskLevel: 'medium' },
  'websocket': { category: 'realtime', riskLevel: 'medium' },
  'pusher-js': { category: 'realtime', riskLevel: 'medium' },
  '@pusher/pusher-websocket-react': { category: 'realtime', riskLevel: 'medium' },
  'ably': { category: 'realtime', riskLevel: 'medium' },
  'centrifuge': { category: 'realtime', riskLevel: 'medium' },

  // ===== Testing (Enhanced) =====
  'jest': { category: 'testing', riskLevel: 'low' },
  'vitest': { category: 'testing', riskLevel: 'low' },
  '@playwright/test': { category: 'testing', riskLevel: 'medium' },
  'cypress': { category: 'testing', riskLevel: 'medium' },
  '@testing-library/react': { category: 'testing', riskLevel: 'low' },
  '@testing-library/vue': { category: 'testing', riskLevel: 'low' },
  '@testing-library/angular': { category: 'testing', riskLevel: 'low' },
  'mocha': { category: 'testing', riskLevel: 'low' },
  'chai': { category: 'testing', riskLevel: 'low' },
  'supertest': { category: 'testing', riskLevel: 'low' },
  'msw': { category: 'testing', riskLevel: 'low' },
  'nock': { category: 'testing', riskLevel: 'low' },
  'sinon': { category: 'testing', riskLevel: 'low' },
  'jest-mock-extended': { category: 'testing', riskLevel: 'low' },
};

export const CATEGORY_WEIGHTS: Record<CategoryId, number> = {
  codeQuality: 18,
  security: 22,
  dependencies: 8,
  devops: 8,
  architecture: 8,
  frameworkSpecific: 4,
  testing: 8,
  documentation: 4,
  performance: 8,
  aiSpecific: 3,
  accessibility: 2,
  observability: 6,
  dataQuality: 3,
  repoHealth: 6,
};

export const SEVERITY_IMPACT: Record<Severity, number> = {
  blocker: 0.0,
  high: 0.5,
  medium: 0.75,
  low: 0.9,
};
