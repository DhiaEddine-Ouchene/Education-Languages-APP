import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Configure database connection parameters for serverless environments (e.g. Vercel + Supabase / Neon).
 * Ensures pgbouncer mode is active on pooler ports to avoid prepared statement errors,
 * and sets conservative connection and pool timeouts.
 */
function buildUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);

    // If connecting via Supabase Pooler (Port 6543) or known pooler domain, enforce pgbouncer=true
    if (url.port === "6543" || url.hostname.includes("pooler.supabase.com")) {
      if (!url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
      }
    }

    // Set connection limit per serverless function instance (default: 10)
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "10");
    }

    // Set pool timeout in seconds to prevent serverless function hangs
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "10");
    }

    // Set connect timeout in seconds
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "15");
    }

    return url.toString();
  } catch {
    // Fallback if URL parsing fails
    if (rawUrl.includes("connection_limit")) return rawUrl;
    const separator = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${separator}connection_limit=10&connect_timeout=15&pool_timeout=10`;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: buildUrl(),
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

// Cache the client on globalThis in all environments so warm serverless lambdas reuse the instance
globalForPrisma.prisma = prisma;
