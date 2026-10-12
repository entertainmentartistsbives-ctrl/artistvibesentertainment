import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bookyourartist?schema=public';
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url,
      },
    },
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Wraps a Prisma query with retry logic for Neon free-tier cold starts.
 * Neon auto-suspends after inactivity; first request can take 5–10s and
 * may throw P1001 (unreachable) or P1017 (connection closed).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const isRetryable =
        code === 'P1001' || // Can't reach DB server
        code === 'P1017' || // Server closed connection
        (err as { errorCode?: string })?.errorCode === undefined; // PrismaClientInitializationError

      if (isRetryable && attempt < retries) {
        console.warn(`[Prisma] DB unreachable (attempt ${attempt}/${retries}), retrying in ${delayMs}ms…`);
        await new Promise((res) => setTimeout(res, delayMs * attempt));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Unreachable');
}
