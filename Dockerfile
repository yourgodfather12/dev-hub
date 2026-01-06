# syntax=docker/dockerfile:1

## Install dependencies once for both frontend and backend
FROM node:20-bookworm AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

## Build the React frontend
FROM node:20-bookworm AS build-frontend
ARG FRONTEND_API_BASE=http://localhost:4000
ARG FRONTEND_ADMIN_TOKEN=devhub-local-admin-token
ENV VITE_API_BASE_URL=$FRONTEND_API_BASE
ENV VITE_ADMIN_TOKEN=$FRONTEND_ADMIN_TOKEN
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

## Build the Fastify backend and bundle static assets
FROM node:20-bookworm AS build-server
WORKDIR /app/server
ARG DATABASE_URL=file:./dev.db
ENV DATABASE_URL=$DATABASE_URL

COPY --from=deps /app/server/node_modules ./node_modules
COPY server/. .

RUN npm run build
RUN DATABASE_URL=$DATABASE_URL npx prisma generate --schema prisma/schema.prisma

# Place the built frontend into the backend's public folder (served by Fastify)
COPY --from=build-frontend /app/dist ./public

## Production image
FROM node:20-slim AS runner
WORKDIR /app/server
ENV NODE_ENV=production

# Copy runtime deps and built artifacts
COPY --from=build-server /app/server/node_modules ./node_modules
COPY --from=build-server /app/server/dist ./dist
COPY --from=build-server /app/server/public ./public

COPY --from=build-server /app/server/package.json ./package.json
COPY --from=build-server /app/server/dev.db ./dev.db

EXPOSE 4000

CMD ["node", "dist/server.js"]
