import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Cap the app's pool so it never exhausts the database's session-mode
// connection limit (Neon defaults to 15). This prevents "max clients
// reached" errors when a page fires several queries in parallel (e.g. the
// student profile) while the session callback is also querying.
function buildUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  if (url.includes("connection_limit")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=5`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ datasources: { db: { url: buildUrl() } } });

// Cache the client on globalThis in EVERY environment. Without this, each
// serverless request instantiates a new PrismaClient, leaking connections
// until the pool is exhausted.
globalForPrisma.prisma = prisma;
