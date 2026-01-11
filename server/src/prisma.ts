// REBUILD TRIGGER: 1
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';



import fs from 'fs';
import path from 'path';

const rawUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
const databaseUrl = rawUrl.replace(/^file:/, '');
const absolutePath = path.isAbsolute(databaseUrl)
  ? databaseUrl
  : path.resolve(process.cwd(), databaseUrl);

console.log(`[Prisma] Connection:
  - Raw URL: ${rawUrl}
  - File Path: ${databaseUrl}
  - Absolute Path: ${absolutePath}
  - Exists: ${fs.existsSync(absolutePath)}
  - Size: ${fs.existsSync(absolutePath) ? fs.statSync(absolutePath).size : 'N/A'}
`);

const adapter = new PrismaBetterSqlite3({
  url: databaseUrl,
});

export const prisma = new PrismaClient({ adapter });
