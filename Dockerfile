# syntax=docker/dockerfile:1

## Stage 1: Install dependencies
FROM node:20-bookworm AS deps
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# Copy server package files
COPY server/package.json server/package-lock.json ./server/
WORKDIR /app/server
RUN npm ci && npm cache clean --force

## Stage 2: Build Frontend
FROM node:20-bookworm AS build-frontend
WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:4000
ARG VITE_ADMIN_TOKEN=devhub-local-admin-token
ARG VITE_HF_API_KEY
ARG VITE_GITHUB_TOKEN
ARG VITE_GITHUB_OWNER

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ADMIN_TOKEN=$VITE_ADMIN_TOKEN
ENV VITE_HF_API_KEY=$VITE_HF_API_KEY
ENV VITE_GITHUB_TOKEN=$VITE_GITHUB_TOKEN
ENV VITE_GITHUB_OWNER=$VITE_GITHUB_OWNER

# Copy root dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy frontend source - Removed tsconfig.node.json and public/ as they don't exist
COPY package.json package-lock.json vite.config.ts tsconfig.json ./
COPY index.html ./
COPY index.tsx ./
COPY index.css ./
COPY components ./components
COPY services ./services
COPY types.ts constants.ts App.tsx ./

# Build frontend
RUN npm run build

## Stage 3: Build Backend
FROM node:20-bookworm AS build-backend
WORKDIR /app/server

ARG DATABASE_URL=file:./dev.db
ENV DATABASE_URL=$DATABASE_URL

# Copy server dependencies
COPY --from=deps /app/server/node_modules ./node_modules

# Copy server source
COPY server/package.json server/tsconfig.json server/tsconfig.scripts.json ./
COPY server/prisma.config.ts ./
COPY server/prisma ./prisma
COPY server/src ./src
COPY server/scripts ./scripts

# CACHE BUST
RUN echo "Building backend with latest prisma.ts..."

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Copy the built frontend into server's public folder
COPY --from=build-frontend /app/dist ./public

## Stage 4: Production Runtime
FROM node:20-slim AS runner
WORKDIR /app/server

# Install SQLite3 for runtime
RUN apt-get update && apt-get install -y \
  sqlite3 openssl \
  && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV=production
ENV PORT=4000
ENV SERVE_STATIC_ASSETS=true

# Copy production dependencies
COPY --from=build-backend /app/server/node_modules ./node_modules
COPY --from=build-backend /app/server/package.json ./package.json
COPY --from=build-backend /app/server/tsconfig.json ./tsconfig.json

# Copy built artifacts
COPY --from=build-backend /app/server/dist ./dist
COPY --from=build-backend /app/server/public ./public

# Copy Prisma schema and migrations (needed for runtime)
COPY --from=build-backend /app/server/prisma ./prisma
COPY --from=build-backend /app/server/prisma.config.ts ./

# Create data directory for SQLite and set permissions
RUN mkdir -p /app/server/data /app/server/logs && chown -R node:node /app/server

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 4000

# Use non-root user for security
USER node

CMD ["node", "dist/server.js"]
