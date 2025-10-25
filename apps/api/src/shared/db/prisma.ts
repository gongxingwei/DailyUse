import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

// Performance monitoring configuration with connection retry
const prismaConfig = {
  log: [
    { emit: 'event' as const, level: 'query' as const },
    { emit: 'stdout' as const, level: 'info' as const },
    { emit: 'stdout' as const, level: 'warn' as const },
    { emit: 'stdout' as const, level: 'error' as const },
  ],
  // Connection pool configuration for unstable connections
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection retry configuration
  __internal: {
    engine: {
      // Increase connection timeout for slow/unstable networks
      connection_timeout: 30, // 30 seconds (default is 10)
      // Increase query timeout
      query_timeout: 60, // 60 seconds
      // Connection pool size
      connection_limit: 10,
    },
  },
};

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaConfig);
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaConfig);
  }
  prisma = global.prisma;
}

// Log slow queries (>100ms) in development
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query' as never, (e: any) => {
    if (e.duration > 100) {
      console.warn(`[SLOW QUERY] ${e.duration}ms - ${e.query}`);
    }
  });
}

/**
 * Execute a database operation with retry logic
 * Useful for handling unstable network connections
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  operationName: string = 'Database operation'
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DB] ${operationName} - Attempt ${attempt}/${maxRetries}`);
      const result = await operation();
      if (attempt > 1) {
        console.log(`[DB] ${operationName} - Succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[DB] ${operationName} - Attempt ${attempt}/${maxRetries} failed:`,
        error instanceof Error ? error.message : error
      );
      
      if (attempt < maxRetries) {
        const waitTime = delayMs * attempt; // Exponential backoff
        console.log(`[DB] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error(`[DB] ${operationName} - All ${maxRetries} attempts failed`);
  throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
}

/**
 * Test database connection with retry
 */
export async function testConnection(): Promise<boolean> {
  try {
    await withRetry(
      async () => {
        await prisma.$queryRaw`SELECT 1`;
      },
      5, // 5 retries
      2000, // 2 second initial delay
      'Connection test'
    );
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export default prisma;
